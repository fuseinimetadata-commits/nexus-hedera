/**
 * client.ts
 * Hedera SDK client initialization and health check.
 * Supports testnet (default) and mainnet via HEDERA_NETWORK env var.
 */
import { Client, AccountId, PrivateKey, AccountBalanceQuery } from '@hashgraph/sdk';

let hederaClient: Client;

export async function initHedera(): Promise<Client> {
  const accountIdStr = process.env.HEDERA_ACCOUNT_ID;
  const privateKeyStr = process.env.HEDERA_PRIVATE_KEY;

  if (!accountIdStr || accountIdStr === '0.0.XXXXX') {
    throw new Error(
      'HEDERA_ACCOUNT_ID not set. Run: npx ts-node src/scripts/create-testnet-account.ts'
    );
  }
  if (!privateKeyStr || privateKeyStr.startsWith('302e...')) {
    throw new Error(
      'HEDERA_PRIVATE_KEY not set. Run: npx ts-node src/scripts/create-testnet-account.ts'
    );
  }

  const accountId = AccountId.fromString(accountIdStr);
  const privateKey = PrivateKey.fromStringED25519(privateKeyStr);

  if (process.env.HEDERA_NETWORK === 'mainnet') {
    hederaClient = Client.forMainnet();
    console.log('[Hedera] Network: mainnet');
  } else {
    hederaClient = Client.forTestnet();
    console.log('[Hedera] Network: testnet');
  }

  hederaClient.setOperator(accountId, privateKey);
  console.log(`[Hedera] Operator: ${accountId.toString()}`);
  return hederaClient;
}

export function getHederaClient(): Client {
  if (!hederaClient) {
    throw new Error(
      'Hedera client not initialized. Call initHedera() first.'
    );
  }
  return hederaClient;
}

/**
 * healthCheck — verifies connectivity by querying account balance.
 * Returns true if account is reachable and has HBAR balance.
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const client = getHederaClient();
    const accountId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
    const balance = await new AccountBalanceQuery()
      .setAccountId(accountId)
      .execute(client);
    console.log(`[Hedera] Balance: ${balance.hbars.toString()}`);
    return balance.hbars.toBigNumber().toNumber() > 0;
  } catch (err: any) {
    console.error(`[Hedera] Health check failed: ${err.message}`);
    return false;
  }
}

export function closeHederaClient(): void {
  if (hederaClient) {
    hederaClient.close();
    console.log('[Hedera] Client closed.');
  }
}
