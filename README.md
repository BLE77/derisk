![derisk](derisk.png)

# **DERISK**

*real claude skill inspired by [@GeoffreyHuntley](https://twitter.com/GeoffreyHuntley) :)*

---

Sell all SPL tokens in your Solana wallet for SOL via Jupiter aggregator.

## Setup

1. Install dependencies:
```bash
cd ~/.claude/skills/derisk
npm install
```

2. Make sure you have a Solana keypair at `~/.config/solana/id.json` or set `SOLANA_KEYPAIR_PATH`

3. (Recommended) Get a free RPC URL from [Helius](https://helius.dev), [QuickNode](https://quicknode.com), or [Alchemy](https://alchemy.com)

## Usage

### Via Claude Code
Just say one of:
- `derisk`
- `sell all tokens`
- `liquidate wallet`
- `sell everything`

### Manual
```bash
# With default settings
node derisk.mjs

# With custom RPC and keypair
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY \
SOLANA_KEYPAIR_PATH=/path/to/wallet.json \
node derisk.mjs
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SOLANA_RPC_URL` | `https://api.mainnet-beta.solana.com` | Solana RPC endpoint |
| `SOLANA_KEYPAIR_PATH` | `~/.config/solana/id.json` | Path to wallet keypair |

## What It Does

1. Loads your local Solana keypair
2. Fetches all SPL token accounts with non-zero balance
3. Gets quotes from Jupiter for each token -> SOL
4. Executes swaps with 1% slippage tolerance
5. Prints "Congrats you have derisked"

## Notes

- Your private key never leaves your machine
- Skips wrapped SOL (no point swapping SOL for SOL)
- Needs ~0.005 SOL per swap for transaction fees
- Public RPC is rate limited - use a dedicated RPC for reliability
