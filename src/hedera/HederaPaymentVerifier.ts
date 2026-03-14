/**
 * HederaPaymentVerifier
 * Verifies an HBAR payment transaction via Hedera Mirror Node REST API.
 * Used by OpenClaw UCP handler to confirm payment before executing work.
 */

export interface PaymentVerificationResult {
  verified: boolean;
  txId: string;
  amountHbar: number;
  sender: string;
  receiver: string;
  consensusTimestamp: string;
  error?: string;
}

const MIRROR_NODE_BASE =
  process.env.HEDERA_NETWORK === 'mainnet'
    ? 'https://mainnet-public.mirrornode.hedera.com'
    : 'https://testnet.mirrornode.hedera.com';

/**
 * Verify that a given transaction ID transferred at least `minAmountHbar`
 * HBAR to `expectedReceiver` (NEXUS's account).
 *
 * @param txId       Hedera transaction ID (e.g. "0.0.12345-1700000000-000000000")
 * @param expectedReceiver  Account ID that should receive payment (e.g. "0.0.12345")
 * @param minAmountHbar     Minimum HBAR amount expected (e.g. 5 for 5 HBAR)
 */
export async function verifyHbarPayment(
  txId: string,
  expectedReceiver: string,
  minAmountHbar: number
): Promise<PaymentVerificationResult> {
  // Normalise tx id: mirror node uses format 0.0.XXXXX-SECS-NANOS
  const normalisedTxId = txId.replace(/[@]/g, '-').replace(/\./g, (m, offset, str) => {
    // only replace dots that are NOT part of the shard.realm.num prefix
    // mirror node format: 0.0.12345-1700000000-000000000
    return m;
  });

  const url = `${MIRROR_NODE_BASE}/api/v1/transactions/${encodeURIComponent(normalisedTxId)}`;

  let data: any;
  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) {
      return {
        verified: false,
        txId,
        amountHbar: 0,
        sender: '',
        receiver: '',
        consensusTimestamp: '',
        error: `Mirror node returned HTTP ${response.status} for tx ${txId}`,
      };
    }
    data = await response.json();
  } catch (err: any) {
    return {
      verified: false,
      txId,
      amountHbar: 0,
      sender: '',
      receiver: '',
      consensusTimestamp: '',
      error: `Network error fetching mirror node: ${err.message}`,
    };
  }

  // Mirror node returns { transactions: [ { transfers: [{account, amount}...], ... } ] }
  const transactions: any[] = data.transactions || [];
  if (transactions.length === 0) {
    return {
      verified: false,
      txId,
      amountHbar: 0,
      sender: '',
      receiver: '',
      consensusTimestamp: '',
      error: 'Transaction not found on mirror node',
    };
  }

  const tx = transactions[0];
  const consensusTimestamp: string = tx.consensus_timestamp || '';
  const transfers: Array<{ account: string; amount: number }> = tx.transfers || [];

  // Find the credit to expectedReceiver (amount is in tinybars, positive = received)
  const receiverTransfer = transfers.find(
    (t) => t.account === expectedReceiver && t.amount > 0
  );

  if (!receiverTransfer) {
    return {
      verified: false,
      txId,
      amountHbar: 0,
      sender: '',
      receiver: expectedReceiver,
      consensusTimestamp,
      error: `No positive HBAR transfer found to account ${expectedReceiver}`,
    };
  }

  // Find the sender (largest negative transfer)
  const senderTransfer = transfers.reduce(
    (min, t) => (t.amount < (min?.amount ?? 0) ? t : min),
    null as { account: string; amount: number } | null
  );

  const amountHbar = receiverTransfer.amount / 100_000_000; // tinybars → HBAR

  if (amountHbar < minAmountHbar) {
    return {
      verified: false,
      txId,
      amountHbar,
      sender: senderTransfer?.account || 'unknown',
      receiver: expectedReceiver,
      consensusTimestamp,
      error: `Payment insufficient: received ${amountHbar} HBAR, required ${minAmountHbar} HBAR`,
    };
  }

  console.log(
    `[PaymentVerifier] ✅ Verified ${amountHbar} HBAR from ${senderTransfer?.account} to ${expectedReceiver} | tx: ${txId}`
  );

  return {
    verified: true,
    txId,
    amountHbar,
    sender: senderTransfer?.account || 'unknown',
    receiver: expectedReceiver,
    consensusTimestamp,
  };
}
