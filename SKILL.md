---
name: derisk
description: Sell all SPL tokens in your Solana wallet for SOL
disable-model-invocation: true
triggers:
  - derisk
  - sell all tokens
  - liquidate wallet
  - sell everything
---

# Derisk - Solana Token Liquidator

Sell all SPL tokens in your wallet and convert everything to SOL.

## What This Skill Does

When invoked, this skill will:
1. Load your Solana keypair from the default location or a specified path
2. Fetch all SPL token accounts in your wallet
3. Get quotes from Jupiter aggregator for each token
4. Execute swaps to convert all tokens to SOL
5. Display "Congrats you have derisked" when complete

## Requirements

- **Solana CLI keypair** at `~/.config/solana/id.json` (or specify a custom path)
- **SOL balance** for transaction fees (~0.005 SOL per swap)
- **Node.js 18+** or **Bun** runtime
- **RPC URL** - Set `SOLANA_RPC_URL` env var (Helius, QuickNode, or Alchemy recommended)

## Execution Steps

### Step 1: Check Environment

First, verify the user has the required setup:

```bash
# Check for keypair
ls ~/.config/solana/id.json

# Check for Node.js or Bun
node --version || bun --version
```

If the keypair doesn't exist at the default location, ask the user for the path to their keypair file.

### Step 2: Install Dependencies (if needed)

Only install if `node_modules` doesn't exist:

```bash
[ -d ~/.claude/skills/derisk/node_modules ] || (cd ~/.claude/skills/derisk && npm install)
```

### Step 3: Run the Derisk Script

```bash
cd ~/.claude/skills/derisk
node derisk.mjs
```

Or with custom env vars:

```bash
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=xxx SOLANA_KEYPAIR_PATH=/path/to/keypair.json node ~/.claude/skills/derisk/derisk.mjs
```

### Environment Variables

- `SOLANA_RPC_URL` - RPC endpoint (defaults to public mainnet, but rate limited)
- `SOLANA_KEYPAIR_PATH` - Path to keypair file (defaults to `~/.config/solana/id.json`)

## Safety Notes

- This skill uses YOUR local keypair file - it never leaves your machine
- Always verify the wallet address shown matches your expected wallet
- Ensure you have enough SOL for transaction fees
- The script skips wrapped SOL to avoid unnecessary swaps
- Uses 1% slippage tolerance by default

## Output

On successful completion:

```
Wallet: YourWa11etAddressHere...
Found 5 tokens to sell

Selling 1000.5 of 7GCihg...
  Quote: 2.451234 SOL
  TX: 5Kj2n...
  Confirmed!

...

Congrats you have derisked
```
