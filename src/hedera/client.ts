import { Client, AccountId, PrivateKey } from '@hashgraph/sdk';

let hederaClient: Client;

export async function initHedera(): Promise<Client> {
  const accountId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const privateKey = PrivateKey.fromStringED25519(process.env.HEDERA_PRIVATE_KEY!);

  if (process.env.HEDERA_NETWORK === 'mainnet') {
    hederaClient = Client.forMainnet();
  } else {
    hederaClient = Client.forTestnet();
  }

  hederaClient.setOperator(accountId, privateKey);
  console.log(`Hedera client initialized for account ${accountId.toString()}`);
  return hederaClient;
}

export function getHederaClient(): Client {
  if (!hederaClient) throw new Error('Hedera client not initialized');
  return hederaClient;
}
