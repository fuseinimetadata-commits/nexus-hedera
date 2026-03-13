/**
 * Hedera E2E Integration Tests — HTS NFT Minting + HCS Attestation
 * Tests the full compliance certificate lifecycle with mocked Hedera SDK.
 * Run: npx jest hedera-e2e
 */

// Mock @hashgraph/sdk before any imports
const mockReceipt = {
  tokenId: { toString: () => '0.0.8182680' },
  topicId: { toString: () => '0.0.8182682' },
  serials: [{ toNumber: () => 1 }],
  status: { toString: () => 'SUCCESS' },
};

const mockTxResponse = {
  getReceipt: jest.fn().mockResolvedValue(mockReceipt),
  transactionId: { toString: () => '0.0.12345@1710000000.000000000' },
};

const mockExecute = jest.fn().mockResolvedValue(mockTxResponse);

jest.mock('@hashgraph/sdk', () => {
  class MockTokenCreateTransaction {
    setTokenName() { return this; }
    setTokenSymbol() { return this; }
    setTokenType() { return this; }
    setSupplyType() { return this; }
    setTreasuryAccountId() { return this; }
    setSupplyKey() { return this; }
    setTokenMemo() { return this; }
    execute = mockExecute;
  }
  class MockTokenMintTransaction {
    setTokenId() { return this; }
    addMetadata() { return this; }
    execute = mockExecute;
  }
  class MockTopicCreateTransaction {
    setTopicMemo() { return this; }
    setSubmitKey() { return this; }
    execute = mockExecute;
  }
  class MockTopicMessageSubmitTransaction {
    setTopicId() { return this; }
    setMessage() { return this; }
    execute = mockExecute;
  }
  class MockAccountBalanceQuery {
    setAccountId() { return this; }
    execute = jest.fn().mockResolvedValue({ hbars: { toBigNumber: () => ({ toNumber: () => 100 }) } });
  }
  return {
    Client: {
      forTestnet: jest.fn().mockReturnValue({ setOperator: jest.fn(), close: jest.fn() }),
      forMainnet: jest.fn().mockReturnValue({ setOperator: jest.fn(), close: jest.fn() }),
    },
    AccountId: { fromString: jest.fn().mockReturnValue('0.0.12345') },
    PrivateKey: {
      fromStringED25519: jest.fn().mockReturnValue({ publicKey: 'mock-pubkey' }),
      fromStringECDSA: jest.fn().mockReturnValue({ publicKey: 'mock-pubkey' }),
    },
    TokenCreateTransaction: MockTokenCreateTransaction,
    TokenMintTransaction: MockTokenMintTransaction,
    TokenType: { NonFungibleUnique: 'NonFungibleUnique' },
    TokenSupplyType: { Infinite: 'Infinite' },
    TopicCreateTransaction: MockTopicCreateTransaction,
    TopicMessageSubmitTransaction: MockTopicMessageSubmitTransaction,
    TopicId: { fromString: jest.fn().mockReturnValue('0.0.8182682') },
    AccountBalanceQuery: MockAccountBalanceQuery,
  };
});

process.env.HEDERA_ACCOUNT_ID = '0.0.12345';
process.env.HEDERA_PRIVATE_KEY = 'aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899';
process.env.HEDERA_NETWORK = 'testnet';
process.env.HTS_COMPLIANCE_TOKEN_ID = '0.0.8182680';
process.env.HCS_ATTESTATION_TOPIC_ID = '0.0.8182682';

import { createComplianceTokenCollection, mintComplianceCertificate } from '../hedera/hts';
import { createAttestationTopic, submitAttestation } from '../hedera/hcs';

describe('HTS NFT Compliance Certificate', () => {
  it('creates a compliance token collection', async () => {
    const tokenId = await createComplianceTokenCollection();
    expect(tokenId).toBe('0.0.8182680');
    expect(mockExecute).toHaveBeenCalled();
  });

  it('mints a compliance certificate NFT', async () => {
    const result = await mintComplianceCertificate({
      contractAddress: '0x_test_contract',
      standard: 'ERC-8004',
      score: 95,
      findings: [],
    });
    expect(result.tokenId).toBe('0.0.8182680');
    expect(result.serialNumber).toBe(1);
    expect(result.transactionId).toBeTruthy();
    expect(result.metadataHash).toBeTruthy();
  });

  it('encodes NFT metadata correctly', async () => {
    const result = await mintComplianceCertificate({
      contractAddress: '0xabc123',
      standard: 'ERC-3643',
      score: 88,
      findings: ['Missing claim expiry'],
      requesterAccount: '0.0.99999',
    });
    expect(result.metadataHash).toMatch(/^[A-Za-z0-9+/=]+$/);
  });
});

describe('HCS Attestation', () => {
  it('creates an attestation topic', async () => {
    const topicId = await createAttestationTopic();
    expect(topicId).toBe('0.0.8182682');
  });

  it('submits compliance attestation to HCS', async () => {
    const result = await submitAttestation({
      contractAddress: '0x_test_contract',
      standard: 'ERC-8004',
      score: 95,
      nftTokenId: '0.0.8182680',
      nftSerialNumber: 1,
    });
    expect(result.topicId).toBe('0.0.8182682');
    expect(result.transactionId).toBeTruthy();
  });

  it('attestation message contains correct fields', async () => {
    const { TopicMessageSubmitTransaction } = require('@hashgraph/sdk');
    const mockSetMessage = jest.fn().mockReturnThis();
    TopicMessageSubmitTransaction.prototype.setMessage = mockSetMessage;

    await submitAttestation({
      contractAddress: '0xtest',
      standard: 'ERC-3643',
      score: 72,
      nftTokenId: '0.0.8182680',
      nftSerialNumber: 3,
    });

    expect(mockSetMessage).toHaveBeenCalledWith(
      expect.stringContaining('ERC-3643')
    );
  });
});

describe('HTS + HCS Full Lifecycle', () => {
  it('runs complete compliance certification flow', async () => {
    const cert = await mintComplianceCertificate({
      contractAddress: '0x_e2e_lifecycle_test',
      standard: 'ERC-8004',
      score: 91,
      findings: [],
    });
    expect(cert.serialNumber).toBeGreaterThan(0);

    const attestation = await submitAttestation({
      contractAddress: '0x_e2e_lifecycle_test',
      standard: 'ERC-8004',
      score: 91,
      nftTokenId: cert.tokenId,
      nftSerialNumber: cert.serialNumber,
    });
    expect(attestation.topicId).toBeTruthy();
    expect(cert.tokenId).toBeTruthy();
    expect(attestation.transactionId).toBeTruthy();
    console.log(`E2E lifecycle: NFT ${cert.tokenId}#${cert.serialNumber} - HCS tx ${attestation.transactionId}`);
  });
});
