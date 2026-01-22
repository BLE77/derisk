// derisk.mjs - Sell all tokens for SOL via Jupiter

import 'dotenv/config';
import { Connection, Keypair, VersionedTransaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import fs from 'fs';
import os from 'os';

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const KEYPAIR_PATH = process.env.SOLANA_KEYPAIR_PATH || `${os.homedir()}/.config/solana/id.json`;

// Tokens to skip (native SOL wrapper)
const SKIP_MINTS = [
  'So11111111111111111111111111111111111111112', // Wrapped SOL
];

// SOL mint for output
const SOL_MINT = 'So11111111111111111111111111111111111111112';

async function main() {
  // Check keypair exists
  if (!fs.existsSync(KEYPAIR_PATH)) {
    console.error(`Keypair not found at: ${KEYPAIR_PATH}`);
    console.error('Set SOLANA_KEYPAIR_PATH env var or create keypair at default location');
    process.exit(1);
  }

  // Load keypair
  const secretKey = JSON.parse(fs.readFileSync(KEYPAIR_PATH, 'utf-8'));
  const wallet = Keypair.fromSecretKey(new Uint8Array(secretKey));
  console.log(`Wallet: ${wallet.publicKey.toBase58()}`);

  const connection = new Connection(RPC_URL, 'confirmed');

  // Check SOL balance for fees
  const solBalance = await connection.getBalance(wallet.publicKey);
  console.log(`SOL Balance: ${(solBalance / 1e9).toFixed(4)} SOL\n`);

  if (solBalance < 0.001 * 1e9) {
    console.error('Insufficient SOL for transaction fees');
    process.exit(1);
  }

  // Get all token accounts
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
    wallet.publicKey,
    { programId: TOKEN_PROGRAM_ID }
  );

  const tokensToSell = tokenAccounts.value.filter(account => {
    const info = account.account.data.parsed.info;
    const balance = info.tokenAmount.uiAmount;
    const mint = info.mint;
    return balance > 0 && !SKIP_MINTS.includes(mint);
  });

  if (tokensToSell.length === 0) {
    console.log('No tokens to sell.');
    console.log('\nCongrats you have derisked');
    return;
  }

  console.log(`Found ${tokensToSell.length} token(s) to sell\n`);

  let successCount = 0;
  let failCount = 0;

  for (const tokenAccount of tokensToSell) {
    const info = tokenAccount.account.data.parsed.info;
    const mint = info.mint;
    const amount = info.tokenAmount.amount;
    const uiAmount = info.tokenAmount.uiAmount;

    console.log(`Selling ${uiAmount} of ${mint.slice(0, 8)}...`);

    try {
      // Get quote from Jupiter (using public API with 0.2% platform fee)
      const quoteUrl = `https://public.jupiterapi.com/quote?inputMint=${mint}&outputMint=${SOL_MINT}&amount=${amount}&slippageBps=100`;
      const quoteResponse = await fetch(quoteUrl);
      const quote = await quoteResponse.json();

      if (quote.error) {
        console.log(`  Skipping: ${quote.error}`);
        failCount++;
        continue;
      }

      const outAmount = Number(quote.outAmount) / 1e9;
      console.log(`  Quote: ${outAmount.toFixed(6)} SOL`);

      // Get swap transaction
      const swapResponse = await fetch('https://public.jupiterapi.com/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: wallet.publicKey.toBase58(),
          wrapAndUnwrapSol: true,
        }),
      });

      const swapData = await swapResponse.json();

      if (!swapData.swapTransaction) {
        console.log(`  Skipping: Failed to get swap transaction`);
        failCount++;
        continue;
      }

      // Deserialize and sign
      const txBuffer = Buffer.from(swapData.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(txBuffer);
      transaction.sign([wallet]);

      // Send transaction
      const txid = await connection.sendTransaction(transaction, {
        skipPreflight: true,
        maxRetries: 3,
      });

      console.log(`  TX: ${txid}`);

      // Wait for confirmation
      await connection.confirmTransaction(txid, 'confirmed');
      console.log(`  Confirmed!\n`);
      successCount++;

      // Small delay between swaps
      await new Promise(r => setTimeout(r, 500));

    } catch (err) {
      console.log(`  Error: ${err.message}\n`);
      failCount++;
    }
  }

  console.log(`\nSold ${successCount} token(s), ${failCount} failed/skipped`);
  console.log('\nCongrats you have derisked');
}

main().catch(console.error);
