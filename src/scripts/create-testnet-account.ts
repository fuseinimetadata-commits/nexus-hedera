/**
 * create-testnet-account.ts
 * Generates a fresh ED25519 keypair and funds it via the Hedera Testnet Faucet.
 * Run: npx ts-node src/scripts/create-testnet-account.ts
 *
 * Outputs HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY ready to paste into .env
 */
import { PrivateKey, AccountCreateTransaction, Hbar, Client, AccountId } from '@hashgraph/sdk';
import * as https from 'https';

async function createTestnetAccount(): Promise<void> {
  console.log('=== NEXUS Hedera Testnet Account Creation ===\n');

  // 1. Generate ED25519 keypair
  const newKey = PrivateKey.generateED25519();
  const publicKey = newKey.publicKey;
  console.log('Generated keypair:');
  console.log(`  Public Key: ${publicKey.toStringRaw()}`);
  console.log(`  Private Key: ${newKey.toStringRaw()}`);

  // 2. Request testnet account via Hedera Faucet REST API
  console.log('\nRequesting testnet account from faucet...');
  const accountId = await requestFaucetAccount(publicKey.toStringRaw());

  if (accountId) {
    console.log('\n✅ Testnet account created successfully!');
    console.log('\nAdd these to your .env file:');
    console.log('─'.repeat(50));
    console.log(`HEDERA_ACCOUNT_ID=${accountId}`);
    console.log(`HEDERA_PRIVATE_KEY=${newKey.toStringRaw()}`);
    console.log(`HEDERA_NETWORK=testnet`);
    console.log('─'.repeat(50));
    console.log('\nVerify at: https://hashscan.io/testnet/account/' + accountId);
  } else {
    // Fallback: create account from env-configured operator
    console.log('\nFaucet unavailable. Creating account via SDK operator...');
    await createViaSDK(newKey);
  }
}

async function requestFaucetAccount(publicKey: string): Promise<string | null> {
  return new Promise((resolve) => {
    const payload = JSON.stringify({ publicKey });
    const options = {
      hostname: 'faucet.testnet.hedera.com',
      port: 443,
      path: '/api/v1/accounts',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
      timeout: 15000,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.id || parsed.accountId || parsed.account) {
            resolve(parsed.id || parsed.accountId || parsed.account);
          } else {
            console.log('  Faucet response:', data.slice(0, 200));
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    });

    req.on('error', (e) => {
      console.log(`  Faucet error: ${e.message}`);
      resolve(null);
    });
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.write(payload);
    req.end();
  });
}

async function createViaSDK(newKey: PrivateKey): Promise<void> {
  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID || '');
  const operatorKey = PrivateKey.fromStringED25519(process.env.HEDERA_PRIVATE_KEY || '');

  if (!process.env.HEDERA_ACCOUNT_ID || !process.env.HEDERA_PRIVATE_KEY) {
    console.log('\n⚠️  No operator credentials found.');
    console.log('Set HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY in .env, then re-run.');
    console.log('Or visit: https://portal.hedera.com to create a testnet account manually.');
    console.log('\nYour generated keypair (save these):');
    console.log(`  HEDERA_PRIVATE_KEY=${newKey.toStringRaw()}`);
    return;
  }

  const client = Client.forTestnet();
  client.setOperator(operatorId, operatorKey);

  const tx = await new AccountCreateTransaction()
    .setKey(newKey.publicKey)
    .setInitialBalance(new Hbar(100)) // 100 HBAR for testing
    .execute(client);

  const receipt = await tx.getReceipt(client);
  const newAccountId = receipt.accountId!.toString();

  console.log('\n✅ Account created via SDK!');
  console.log(`\nAdd to .env:\n  HEDERA_ACCOUNT_ID=${newAccountId}\n  HEDERA_PRIVATE_KEY=${newKey.toStringRaw()}`);
  client.close();
}

createTestnetAccount().catch(console.error);
