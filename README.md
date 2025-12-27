# Solana Constant Product AMM

A production-grade Automated Market Maker (AMM) built on Solana using the Anchor framework. This AMM implements the constant product formula (x * y = k) similar to Uniswap V2.

## 🚀 Features

- **Constant Product Formula**: Implements x * y = k invariant
- **Liquidity Provision**: Users can add/remove liquidity and receive LP tokens
- **Token Swaps**: Efficient token swapping with configurable fees
- **0.3% Trading Fee**: Standard 30 basis points fee on swaps
- **Slippage Protection**: Built-in minimum output amount validation
- **Safe Math**: All operations use checked arithmetic to prevent overflow
- **PDA-based Architecture**: Secure pool management using Program Derived Addresses

## 📋 Prerequisites

- [Rust](https://rustup.rs/) 1.70.0 or later
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) 1.17.0 or later
- [Anchor](https://www.anchor-lang.com/docs/installation) 0.30.0
- [Node.js](https://nodejs.org/) 18.0.0 or later
- [Yarn](https://yarnpkg.com/getting-started/install)

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/abdulbaqui17/AMM.git
cd AMM
```

2. Install dependencies:
```bash
yarn install
```

3. Build the program:
```bash
anchor build
```

## 🏗️ How to Build

### Build the Solana Program

```bash
# Build the Anchor program
anchor build

# The compiled program will be in target/deploy/amm.so
```

### Generate TypeScript Types

```bash
# IDL and types are automatically generated during build
# Types will be available in target/types/amm.ts
```

### Verify the Build

```bash
# Check program ID
solana address -k target/deploy/amm-keypair.json

# View program info
solana program show <PROGRAM_ID>
```

## 🧪 How to Test Locally

### Option 1: Using Anchor Test (Recommended)

This command starts a local validator, deploys the program, runs tests, and cleans up:

```bash
anchor test
```

### Option 2: Manual Testing with Local Validator

For more control over the testing process:

**Step 1**: Start the local Solana test validator in a separate terminal:
```bash
solana-test-validator
```

**Step 2**: In another terminal, build and deploy the program:
```bash
anchor build
anchor deploy
```

**Step 3**: Run the test suite:
```bash
anchor test --skip-local-validator
```

**Step 4**: Stop the validator when done (Ctrl+C in the validator terminal)

### Test Suite Coverage

The test suite includes:
- ✅ Pool initialization
- ✅ Adding liquidity (first LP and subsequent LPs)
- ✅ Token swaps (A → B)
- ✅ Removing liquidity
- ✅ Slippage protection validation

### Viewing Test Results

```bash
# Run tests with detailed output
anchor test --skip-local-validator

# Expected output:
# ✔ Initializes the pool
# ✔ Adds liquidity (first LP)
# ✔ Swaps A → B
# ✔ Removes liquidity
# ✔ Fails with slippage exceeded
#
# 5 passing (7s)
```

## 📁 Project Structure

```
AMM/
├── programs/
│   └── amm/
│       └── src/
│           ├── lib.rs                    # Program entry point
│           ├── state.rs                  # Pool state definition
│           ├── error.rs                  # Custom error codes
│           ├── math.rs                   # AMM math helpers
│           └── instructions/
│               ├── initialize_pool.rs    # Create new pool
│               ├── add_liquidity.rs      # Deposit tokens
│               ├── remove_liquidity.rs   # Withdraw tokens
│               └── swap.rs               # Token exchange
├── tests/
│   └── amm-anchor.test.ts               # Comprehensive test suite
├── Anchor.toml                           # Anchor configuration
└── package.json                          # Node.js dependencies
```

## 🔧 Program Instructions

### 1. Initialize Pool
Creates a new liquidity pool for two SPL tokens.

```typescript
await program.methods.initializePool()
  .accounts({
    payer: payer.publicKey,
    pool: poolPda,
    tokenMintA: mintA,
    tokenMintB: mintB,
    vaultA: vaultA,
    vaultB: vaultB,
    lpMint: lpMint,
    systemProgram: SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .rpc();
```

### 2. Add Liquidity
Deposit tokens into the pool and receive LP tokens.

```typescript
await program.methods.addLiquidity(amountA, amountB)
  .accounts({
    user: user.publicKey,
    pool: poolPda,
    // ... other accounts
  })
  .rpc();
```

### 3. Remove Liquidity
Burn LP tokens to withdraw proportional share of pool tokens.

```typescript
await program.methods.removeLiquidity(lpAmount)
  .accounts({
    user: user.publicKey,
    pool: poolPda,
    // ... other accounts
  })
  .rpc();
```

### 4. Swap
Exchange one token for another with slippage protection.

```typescript
await program.methods.swap(amountIn, minimumAmountOut)
  .accounts({
    user: user.publicKey,
    pool: poolPda,
    // ... other accounts
  })
  .rpc();
```

## 🔐 Security Features

- **Checked Arithmetic**: All math operations use checked arithmetic to prevent overflow
- **PDA Authority**: Pool controls vaults and LP mint via PDA
- **Input Validation**: Validates mint ordering, zero amounts, and slippage limits
- **Constraint Checks**: Anchor constraints verify all account relationships

## 📊 AMM Math

### Constant Product Formula
```
x * y = k
```
Where `x` and `y` are token reserves, and `k` is the constant.

### Swap Calculation
```
amount_out = (reserve_out * amount_in * (10000 - fee_bps)) / 
             (reserve_in * 10000 + amount_in * (10000 - fee_bps))
```

### LP Token Calculation
For first liquidity provider:
```
lp_tokens = sqrt(amount_a * amount_b)
```

For subsequent providers:
```
lp_tokens = min(
  amount_a * total_lp_supply / reserve_a,
  amount_b * total_lp_supply / reserve_b
)
```

## 🐛 Troubleshooting

### Build Issues

**Error: `anchor-lang` version mismatch**
```bash
# Update Anchor.toml to match installed version
[toolchain]
anchor_version = "0.30.0"
```

**Error: Stack overflow during build**
- This is a warning that has been resolved by optimizing account structures
- The program compiles and runs successfully

### Test Issues

**Error: Validator not running**
```bash
# Start the validator first
solana-test-validator
```

**Error: Program not deployed**
```bash
# Rebuild and deploy
anchor build
anchor deploy
```

## 📝 Development Notes

- Program ID: `GusCwDKH6aEkejKcGKDoVpRaeYPBRHwxn1k5kGFK4Guu`
- Fee: 30 basis points (0.3%)
- LP Token Decimals: 6
- Network: Localnet (for testing), configurable for devnet/mainnet

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🔗 Resources

- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Documentation](https://docs.solana.com/)
- [SPL Token Program](https://spl.solana.com/token)
- [Uniswap V2 Whitepaper](https://uniswap.org/whitepaper.pdf)

## 👤 Author

**Abdul Baqui**
- GitHub: [@abdulbaqui17](https://github.com/abdulbaqui17)

## ⭐ Acknowledgments

- Built with [Anchor Framework](https://www.anchor-lang.com/)
- Inspired by Uniswap V2 and Raydium AMM designs
- Thanks to the Solana developer community

---

**Note**: This is a learning/demonstration project. For production use, conduct thorough security audits and testing.

