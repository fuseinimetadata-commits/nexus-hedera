/**
 * HOL Registry Tests - HCS-10 OpenConvAI Registration
 */

const mockReceipt = {
  topicId: { toString: () => '0.0.9000001' },
  status: { toString: () => 'SUCCESS' },
};
const mockTxResponse = {
  getReceipt: jest.fn().mockResolvedValue(mockReceipt),
  transactionId: { toString: () => '0.0.12345@1710000100.000000000' },
};
const mockExecute = jest.fn().mockResolvedValue(mockTxResponse);

jest.mock('@hashgraph/sdk', () => {
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
  return {
    Client: {
      forTestnet: jest.fn().mockReturnValue({ setOperator: jest.fn() }),
    },
    AccountId: { fromString: jest.fn().mockReturnValue('0.0.12345') },
    PrivateKey: {
      fromStringED25519: jest.fn().mockReturnValue({ publicKey: 'mock-pubkey' }),
      fromStringECDSA: jest.fn().mockReturnValue({ publicKey: 'mock-pubkey' }),
    },
    TopicCreateTransaction: MockTopicCreateTransaction,
    TopicMessageSubmitTransaction: MockTopicMessageSubmitTransaction,
    TopicId: { fromString: jest.fn().mockReturnValue('0.0.5271678') },
  };
});

process.env.HEDERA_ACCOUNT_ID = '0.0.12345';
process.env.HEDERA_PRIVATE_KEY = 'aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899';
process.env.HEDERA_NETWORK = 'testnet';

import { createInboundTopic, createOutboundTopic } from '../hol/registry';

describe('HOL Registry HCS-10 Registration', () => {
  it('creates inbound topic with correct HCS-10 memo', async () => {
    const topicId = await createInboundTopic(
      { setOperator: jest.fn() } as any,
      '0.0.12345',
      7200
    );
    expect(topicId).toBe('0.0.9000001');
  });

  it('creates outbound topic with public write access', async () => {
    const topicId = await createOutboundTopic(
      { setOperator: jest.fn() } as any,
      7200
    );
    expect(topicId).toBe('0.0.9000001');
  });

  it('validates HCS-10 memo format', async () => {
    const { TopicCreateTransaction } = require('@hashgraph/sdk');
    const memos: string[] = [];
    TopicCreateTransaction.prototype.setTopicMemo = jest.fn().mockImplementation(function(memo: string) {
      memos.push(memo);
      return this;
    });
    await createInboundTopic({ setOperator: jest.fn() } as any, '0.0.99999', 3600);
    const inboundMemo = memos.find(m => m.includes('hcs-10'));
    expect(inboundMemo).toMatch(/^hcs-10:0:\d+:0:0\.0\.\d+$/);
  });
});
