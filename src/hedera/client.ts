/**
 * client.ts
 * Hedera SDK client initialization and health check.
 * Supports testnet (default) and mainnet via HEDERA_NETWORK env var.
 * Key type: ECDSA_SECP256K1 (portal.hedera.com default)
 */
import { Client, AccountId, PrivateKey, AccountBalanceQuery } from '@hashgraph/sdk';

let hederaClient: Client;

export async function initHedera(): Promise<Client> {
  const accountIdStr = process.env.HEDERA_ACCOUNT_ID;
  const privateKeyStr = process.env.HEDERA_PRIVATE_KEY;

  if (!accountIdStr || accountIdStr === '0.0.XXXXX') {
    throw new Error(
      'HEDERA_ACCOUNT_ID not set. Set it as a GitHub Actions secret or in .env'
    );
  }
  if (!privateKeyStr) {
    throw new Error(
      'HEDERA_PRIVATE_KEY not set. Set it as a GitHub Actions secret or in .env'
    );
  }

  const accountId = AccountId.fromString(accountIdStr);
  // Support both ECDSA (0x-prefixed hex, portal default) and ED25519 (DER/hex)
  const privateKey = privateKeyStr.startsWith('0x') || privateKeyStr.length === 64 || privateKeyStr.length === 66
    ? PrivateKey.fromStringECDSA(privateKeyStr)
    : PrivateKey.fromStringED25519(privateKeyStr);

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
