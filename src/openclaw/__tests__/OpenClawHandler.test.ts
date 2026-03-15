/**
 * Integration tests for OpenClawHandler — UCP payment verification flow
 * Milestone: Mar 15, 2026
 *
 * Tests:
 *   (1) 402 when no paymentTx provided
 *   (2) 402 when verifyHbarPayment returns verified: false
 *   (3) Happy path: verified payment → assess → mint NFT → transfer → 200
 */
import { Request, Response } from 'express';
import { OpenClawHandler } from '../OpenClawHandler';
import { NexusAgent, AssessmentResult } from '../../agent/NexusAgent';
import * as PaymentVerifier from '../../hedera/HederaPaymentVerifier';
import { PaymentVerificationResult } from '../../hedera/HederaPaymentVerifier';

jest.mock('../../hedera/HederaPaymentVerifier');

const mockVerifyHbarPayment = PaymentVerifier.verifyHbarPayment as jest.MockedFunction<
  typeof PaymentVerifier.verifyHbarPayment
>;

// ── Test helpers ──────────────────────────────────────────────────────────────

function buildRequest(body: Record<string, unknown>): Request {
  return { body } as unknown as Request;
}

interface MockResponseCtx {
  res: Response;
  getStatusCode: () => number | undefined;
  getBody: () => unknown;
}

function buildResponse(): MockResponseCtx {
  let _statusCode: number | undefined;
  let _body: unknown;

  const res = {
    status: jest.fn().mockImplementation((code: number) => {
      _statusCode = code;
      return res;
    }),
    json: jest.fn().mockImplementation((body: unknown) => {
      _body = body;
      return res;
    }),
  } as unknown as Response;

  return {
    res,
    getStatusCode: () => _statusCode,
    getBody: () => _body,
  };
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe('OpenClawHandler.handleUcpMessage', () => {
  let agent: jest.Mocked<Pick<NexusAgent, 'assess' | 'transferCertificateTo'>>;
  let handler: OpenClawHandler;

  const NEXUS_ACCOUNT = '0.0.12345';
  const REQUESTER_ACCOUNT = '0.0.99999';
  const PAYMENT_TX = '0.0.9999-1700000000-000000001';
  const NFT_ID = '0.0.567890/3';
  const TRANSFER_TX = '0.0.12345-1700000001-000000003';

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.HEDERA_ACCOUNT_ID = NEXUS_ACCOUNT;

    agent = {
      assess: jest.fn(),
      transferCertificateTo: jest.fn(),
    } as unknown as jest.Mocked<Pick<NexusAgent, 'assess' | 'transferCertificateTo'>>;

    handler = new OpenClawHandler(agent as unknown as NexusAgent);
  });

  afterEach(() => {
    delete process.env.HEDERA_ACCOUNT_ID;
  });

  // ── (1) 402 when no paymentTx ──────────────────────────────────────────────

  it('returns 402 with payment instructions when paymentTx is absent', async () => {
    const req = buildRequest({
      requestType: 'compliance_assessment',
      standard: 'ERC-3643',
      subject: '0xToken',
      requesterAgent: 'buyer-agent',
      requesterAccountId: REQUESTER_ACCOUNT,
      // paymentTx intentionally omitted
    });
    const mock = buildResponse();

    await handler.handleUcpMessage(req, mock.res);

    expect(mock.getStatusCode()).toBe(402);
    const body = mock.getBody() as Record<string, unknown>;
    expect(body.error).toBe('Payment required');
    expect(body.pricing).toMatchObject({ amount: 5, token: 'HBAR' });
    expect(body.payTo).toBe(NEXUS_ACCOUNT);
    expect(body.instructions).toBeDefined();
    // Must not proceed to verification or assessment
    expect(mockVerifyHbarPayment).not.toHaveBeenCalled();
    expect(agent.assess).not.toHaveBeenCalled();
  });

  // ── (2) 402 on failed verification ────────────────────────────────────────

  it('returns 402 with error details when verifyHbarPayment returns verified: false', async () => {
    const failedResult: PaymentVerificationResult = {
      verified: false,
      txId: PAYMENT_TX,
      amountHbar: 0,
      sender: '',
      receiver: NEXUS_ACCOUNT,
      consensusTimestamp: '',
      error: 'Transaction not found on mirror node',
    };
    mockVerifyHbarPayment.mockResolvedValueOnce(failedResult);

    const req = buildRequest({
      requestType: 'compliance_assessment',
      standard: 'ERC-3643',
      subject: '0xToken',
      paymentTx: PAYMENT_TX,
      requesterAgent: 'buyer-agent',
      requesterAccountId: REQUESTER_ACCOUNT,
    });
    const mock = buildResponse();

    await handler.handleUcpMessage(req, mock.res);

    expect(mock.getStatusCode()).toBe(402);
    const body = mock.getBody() as Record<string, unknown>;
    expect(body.error).toBe('Payment verification failed');
    expect(body.detail).toBe('Transaction not found on mirror node');
    expect(body.txId).toBe(PAYMENT_TX);
    expect(body.required).toMatchObject({
      amount: 5,
      token: 'HBAR',
      receiver: NEXUS_ACCOUNT,
    });
    // Must not proceed to assessment after failed payment
    expect(agent.assess).not.toHaveBeenCalled();
  });

  // ── (3) Happy path ─────────────────────────────────────────────────────────

  it('returns 200 with certificateNftId and transferTx on successful payment and assessment', async () => {
    const verifiedPayment: PaymentVerificationResult = {
      verified: true,
      txId: PAYMENT_TX,
      amountHbar: 5,
      sender: REQUESTER_ACCOUNT,
      receiver: NEXUS_ACCOUNT,
      consensusTimestamp: '1700000000.000000000',
    };
    mockVerifyHbarPayment.mockResolvedValueOnce(verifiedPayment);

    const assessmentResult: AssessmentResult = {
      score: 92,
      grade: 'A',
      violations: [],
      recommendations: ['Ensure freeze key is configured'],
      certificateNftId: NFT_ID,
      hcsAttestation: '0.0.111222@1700000000.000000000',
      reportIpfs: 'ipfs://QmNexusTestReport123',
    };
    (agent.assess as jest.Mock).mockResolvedValueOnce(assessmentResult);
    (agent.transferCertificateTo as jest.Mock).mockResolvedValueOnce(TRANSFER_TX);

    const req = buildRequest({
      requestType: 'compliance_assessment',
      standard: 'ERC-3643',
      subject: '0xDeadBeef',
      paymentTx: PAYMENT_TX,
      requesterAgent: 'buyer-agent-v1',
      requesterAccountId: REQUESTER_ACCOUNT,
    });
    const mock = buildResponse();

    await handler.handleUcpMessage(req, mock.res);

    // Should succeed — no 4xx status set
    expect(mock.getStatusCode()).not.toBe(402);
    expect(mock.getStatusCode()).not.toBe(400);
    const body = mock.getBody() as Record<string, unknown>;
    expect(body.success).toBe(true);
    expect(body.certificateNftId).toBe(NFT_ID);
    expect(body.transferTx).toBe(TRANSFER_TX);
    expect(body.score).toBe(92);
    expect(body.grade).toBe('A');

    const payment = body.payment as Record<string, unknown>;
    expect(payment.verified).toBe(true);
    expect(payment.txId).toBe(PAYMENT_TX);
    expect(payment.amountHbar).toBe(5);
    expect(payment.consensusTimestamp).toBe('1700000000.000000000');

    // Verify full call chain
    expect(mockVerifyHbarPayment).toHaveBeenCalledWith(PAYMENT_TX, NEXUS_ACCOUNT, 5);
    expect(agent.assess).toHaveBeenCalledWith({
      standard: 'ERC-3643',
      subject: '0xDeadBeef',
      requesterAgent: 'buyer-agent-v1',
      paymentTx: PAYMENT_TX,
    });
    expect(agent.transferCertificateTo).toHaveBeenCalledWith(NFT_ID, REQUESTER_ACCOUNT);
  });
});
