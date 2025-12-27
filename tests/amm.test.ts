import { describe, test, expect, beforeAll } from "bun:test";
import { LiteSVM, TransactionMetadata, FailedTransactionMetadata } from "litesvm";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createInitializeAccountInstruction,
  createMintToInstruction,
  createTransferInstruction,
  createBurnInstruction,
  MINT_SIZE,
  ACCOUNT_SIZE,
} from "@solana/spl-token";
import * as anchor from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper to parse token account data
function parseTokenAccount(data: Uint8Array): { mint: PublicKey; owner: PublicKey; amount: bigint } {
  return {
    mint: new PublicKey(data.slice(0, 32)),
    owner: new PublicKey(data.slice(32, 64)),
    amount: BigInt(new DataView(data.buffer, data.byteOffset + 64, 8).getBigUint64(0, true)),
  };
}

// Helper to parse mint data
function parseMint(data: Uint8Array): { supply: bigint; decimals: number; mintAuthority: PublicKey | null } {
  const mintAuthorityOption = data[0];
  const mintAuthority = mintAuthorityOption === 1 ? new PublicKey(data.slice(4, 36)) : null;
  const supply = BigInt(new DataView(data.buffer, data.byteOffset + 36, 8).getBigUint64(0, true));
  const decimals = data[44];
  return { supply, decimals, mintAuthority };
}

describe("AMM Tests", () => {
  let svm: LiteSVM;
  let payer: Keypair;
  let user1: Keypair;
  let user2: Keypair;
  let tokenMintA: PublicKey;
  let tokenMintB: PublicKey;
  let user1TokenA: PublicKey;
  let user1TokenB: PublicKey;
  let user1LP: PublicKey;
  let user2TokenA: PublicKey;
  let user2TokenB: PublicKey;
  let user2LP: PublicKey;
  let poolPda: PublicKey;
  let poolBump: number;
  let vaultA: Keypair;
  let vaultB: Keypair;
  let lpMint: Keypair;
  let programId: PublicKey;

  // Helper to send and confirm transaction
  function sendTx(tx: Transaction, signers: Keypair[]): TransactionMetadata {
    tx.recentBlockhash = svm.latestBlockhash();
    tx.feePayer = payer.publicKey;
    tx.sign(...signers);
    const result = svm.sendTransaction(tx);
    
    // Check if result is FailedTransactionMetadata by checking for err() method
    if (result instanceof FailedTransactionMetadata) {
      const err = result.err();
      const meta = result.meta();
      const logs = meta?.logs() || [];
      throw new Error(`Transaction failed: ${result.toString()}\nLogs:\n${logs.join('\n')}`);
    }
    return result as TransactionMetadata;
  }

  // Helper to get token account balance
  function getTokenBalance(account: PublicKey): bigint {
    const info = svm.getAccount(account);
    if (!info) return 0n;
    return parseTokenAccount(info.data).amount;
  }

  // Helper to get mint supply
  function getMintSupply(mint: PublicKey): bigint {
    const info = svm.getAccount(mint);
    if (!info) return 0n;
    return parseMint(info.data).supply;
  }

  beforeAll(async () => {
    // Initialize LiteSVM with builtins
    svm = new LiteSVM()
      .withSysvars()
      .withBuiltins()
      .withSplPrograms();

    // Create test keypairs
    payer = Keypair.generate();
    user1 = Keypair.generate();
    user2 = Keypair.generate();

    // Airdrop SOL
    svm.airdrop(payer.publicKey, BigInt(100 * LAMPORTS_PER_SOL));
    svm.airdrop(user1.publicKey, BigInt(50 * LAMPORTS_PER_SOL));
    svm.airdrop(user2.publicKey, BigInt(50 * LAMPORTS_PER_SOL));

    // Load program with its actual keypair
    const programPath = join(__dirname, "../target/deploy/amm.so");
    const programKeypairPath = join(__dirname, "../target/deploy/amm-keypair.json");
    const programKeypairData = JSON.parse(readFileSync(programKeypairPath, "utf-8"));
    const programKeypair = Keypair.fromSecretKey(Uint8Array.from(programKeypairData));
    programId = programKeypair.publicKey;
    svm.addProgramFromFile(programId, programPath);

    // Create token mints (A < B for canonical ordering)
    const mintAKeypair = Keypair.generate();
    const mintBKeypair = Keypair.generate();

    const [mintA, mintB] =
      Buffer.compare(mintAKeypair.publicKey.toBuffer(), mintBKeypair.publicKey.toBuffer()) < 0
        ? [mintAKeypair, mintBKeypair]
        : [mintBKeypair, mintAKeypair];

    // Create Mint A
    const mintLamports = svm.minimumBalanceForRentExemption(BigInt(MINT_SIZE));
    let tx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mintA.publicKey,
        lamports: Number(mintLamports),
        space: MINT_SIZE,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(mintA.publicKey, 6, payer.publicKey, null)
    );
    sendTx(tx, [payer, mintA]);
    tokenMintA = mintA.publicKey;

    // Create Mint B
    tx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mintB.publicKey,
        lamports: Number(mintLamports),
        space: MINT_SIZE,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(mintB.publicKey, 6, payer.publicKey, null)
    );
    sendTx(tx, [payer, mintB]);
    tokenMintB = mintB.publicKey;

    // Create user token accounts
    const tokenAccountLamports = svm.minimumBalanceForRentExemption(BigInt(ACCOUNT_SIZE));
    
    const user1TokenAKp = Keypair.generate();
    const user1TokenBKp = Keypair.generate();
    const user2TokenAKp = Keypair.generate();
    const user2TokenBKp = Keypair.generate();
    
    // User1 Token A
    tx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: user1TokenAKp.publicKey,
        lamports: Number(tokenAccountLamports),
        space: ACCOUNT_SIZE,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeAccountInstruction(user1TokenAKp.publicKey, tokenMintA, user1.publicKey)
    );
    sendTx(tx, [payer, user1TokenAKp]);
    user1TokenA = user1TokenAKp.publicKey;

    // User1 Token B
    tx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: user1TokenBKp.publicKey,
        lamports: Number(tokenAccountLamports),
        space: ACCOUNT_SIZE,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeAccountInstruction(user1TokenBKp.publicKey, tokenMintB, user1.publicKey)
    );
    sendTx(tx, [payer, user1TokenBKp]);
    user1TokenB = user1TokenBKp.publicKey;

    // User2 Token A
    tx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: user2TokenAKp.publicKey,
        lamports: Number(tokenAccountLamports),
        space: ACCOUNT_SIZE,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeAccountInstruction(user2TokenAKp.publicKey, tokenMintA, user2.publicKey)
    );
    sendTx(tx, [payer, user2TokenAKp]);
    user2TokenA = user2TokenAKp.publicKey;

    // User2 Token B
    tx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: user2TokenBKp.publicKey,
        lamports: Number(tokenAccountLamports),
        space: ACCOUNT_SIZE,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeAccountInstruction(user2TokenBKp.publicKey, tokenMintB, user2.publicKey)
    );
    sendTx(tx, [payer, user2TokenBKp]);
    user2TokenB = user2TokenBKp.publicKey;

    // Mint tokens to users
    tx = new Transaction().add(
      createMintToInstruction(tokenMintA, user1TokenA, payer.publicKey, 10_000_000_000n)
    );
    sendTx(tx, [payer]);

    tx = new Transaction().add(
      createMintToInstruction(tokenMintB, user1TokenB, payer.publicKey, 10_000_000_000n)
    );
    sendTx(tx, [payer]);

    tx = new Transaction().add(
      createMintToInstruction(tokenMintA, user2TokenA, payer.publicKey, 5_000_000_000n)
    );
    sendTx(tx, [payer]);

    tx = new Transaction().add(
      createMintToInstruction(tokenMintB, user2TokenB, payer.publicKey, 5_000_000_000n)
    );
    sendTx(tx, [payer]);

    // Derive Pool PDA
    const [pda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), tokenMintA.toBuffer(), tokenMintB.toBuffer()],
      programId
    );
    poolPda = pda;
    poolBump = bump;

    // Create vault and lp mint keypairs for later use
    vaultA = Keypair.generate();
    vaultB = Keypair.generate();
    lpMint = Keypair.generate();
  });

  test("1. initialize_pool", async () => {
    // Load IDL
    const idlPath = join(__dirname, "../target/idl/amm.json");
    const idl = JSON.parse(readFileSync(idlPath, "utf-8"));

    // Create pool account space
    const poolSpace = 8 + 32 + 32 + 32 + 32 + 32 + 2 + 1; // Pool::LEN
    const poolLamports = svm.minimumBalanceForRentExemption(BigInt(poolSpace));
    const mintLamports = svm.minimumBalanceForRentExemption(BigInt(MINT_SIZE));
    const tokenAccountLamports = svm.minimumBalanceForRentExemption(BigInt(ACCOUNT_SIZE));

    // Build initialize_pool instruction manually
    const discriminator = Buffer.from([95, 180, 10, 172, 84, 174, 232, 40]); // initialize_pool discriminator from IDL
    
    const accounts = [
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      { pubkey: poolPda, isSigner: false, isWritable: true },
      { pubkey: tokenMintA, isSigner: false, isWritable: false },
      { pubkey: tokenMintB, isSigner: false, isWritable: false },
      { pubkey: vaultA.publicKey, isSigner: true, isWritable: true },
      { pubkey: vaultB.publicKey, isSigner: true, isWritable: true },
      { pubkey: lpMint.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: anchor.web3.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ];

    const initializePoolIx = new TransactionInstruction({
      keys: accounts,
      programId,
      data: discriminator,
    });

    const tx = new Transaction().add(initializePoolIx);
    sendTx(tx, [payer, vaultA, vaultB, lpMint]);

    // Verify pool was created
    const poolInfo = svm.getAccount(poolPda);
    expect(poolInfo).not.toBeNull();

    // Parse pool data (skip 8-byte discriminator)
    const poolData = poolInfo!.data.slice(8);
    const tokenMintAFromPool = new PublicKey(poolData.slice(0, 32));
    const tokenMintBFromPool = new PublicKey(poolData.slice(32, 64));
    const vaultAFromPool = new PublicKey(poolData.slice(64, 96));
    const vaultBFromPool = new PublicKey(poolData.slice(96, 128));
    const lpMintFromPool = new PublicKey(poolData.slice(128, 160));
    const feeBps = poolData[160] | (poolData[161] << 8);
    const bump = poolData[162];

    expect(tokenMintAFromPool.toString()).toBe(tokenMintA.toString());
    expect(tokenMintBFromPool.toString()).toBe(tokenMintB.toString());
    expect(vaultAFromPool.toString()).toBe(vaultA.publicKey.toString());
    expect(vaultBFromPool.toString()).toBe(vaultB.publicKey.toString());
    expect(lpMintFromPool.toString()).toBe(lpMint.publicKey.toString());
    expect(feeBps).toBe(30);
    expect(bump).toBe(poolBump);

    // Verify vaults exist and are owned by pool
    const vaultAInfo = svm.getAccount(vaultA.publicKey);
    const vaultBInfo = svm.getAccount(vaultB.publicKey);
    expect(vaultAInfo).not.toBeNull();
    expect(vaultBInfo).not.toBeNull();

    const vaultAData = parseTokenAccount(vaultAInfo!.data);
    const vaultBData = parseTokenAccount(vaultBInfo!.data);
    expect(vaultAData.owner.toString()).toBe(poolPda.toString());
    expect(vaultBData.owner.toString()).toBe(poolPda.toString());

    // Verify LP mint
    const lpMintInfo = svm.getAccount(lpMint.publicKey);
    expect(lpMintInfo).not.toBeNull();
    const lpMintData = parseMint(lpMintInfo!.data);
    expect(lpMintData.mintAuthority?.toString()).toBe(poolPda.toString());
    expect(lpMintData.supply).toBe(0n);

    console.log("✓ Pool initialized successfully");
    console.log(`  Pool PDA: ${poolPda.toString()}`);
    console.log(`  Fee: ${feeBps} bps (0.${feeBps}%)`);
  });

  test("2. add_liquidity (first LP)", async () => {
    // Create user1 LP token account
    const tokenAccountLamports = svm.minimumBalanceForRentExemption(BigInt(ACCOUNT_SIZE));
    const user1LPKp = Keypair.generate();
    
    let tx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: user1LPKp.publicKey,
        lamports: Number(tokenAccountLamports),
        space: ACCOUNT_SIZE,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeAccountInstruction(user1LPKp.publicKey, lpMint.publicKey, user1.publicKey)
    );
    sendTx(tx, [payer, user1LPKp]);
    user1LP = user1LPKp.publicKey;

    const amountA = 1_000_000_000n;
    const amountB = 2_000_000_000n;
    const minLpTokens = 0n;

    // Build add_liquidity instruction
    const discriminator = Buffer.from([181, 157, 89, 67, 143, 182, 52, 72]); // add_liquidity discriminator
    const data = Buffer.alloc(8 + 8 + 8 + 8);
    discriminator.copy(data, 0);
    data.writeBigUInt64LE(amountA, 8);
    data.writeBigUInt64LE(amountB, 16);
    data.writeBigUInt64LE(minLpTokens, 24);

    const accounts = [
      { pubkey: user1.publicKey, isSigner: true, isWritable: true },
      { pubkey: poolPda, isSigner: false, isWritable: false },
      { pubkey: tokenMintA, isSigner: false, isWritable: false },
      { pubkey: tokenMintB, isSigner: false, isWritable: false },
      { pubkey: vaultA.publicKey, isSigner: false, isWritable: true },
      { pubkey: vaultB.publicKey, isSigner: false, isWritable: true },
      { pubkey: lpMint.publicKey, isSigner: false, isWritable: true },
      { pubkey: user1TokenA, isSigner: false, isWritable: true },
      { pubkey: user1TokenB, isSigner: false, isWritable: true },
      { pubkey: user1LP, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ];

    const addLiquidityIx = new TransactionInstruction({
      keys: accounts,
      programId,
      data,
    });

    tx = new Transaction().add(addLiquidityIx);
    sendTx(tx, [payer, user1]);

    // Verify vault balances
    const vaultABalance = getTokenBalance(vaultA.publicKey);
    const vaultBBalance = getTokenBalance(vaultB.publicKey);
    expect(vaultABalance).toBe(amountA);
    expect(vaultBBalance).toBe(amountB);

    // Verify LP tokens minted
    const user1LPBalance = getTokenBalance(user1LP);
    const lpSupply = getMintSupply(lpMint.publicKey);
    expect(user1LPBalance).toBeGreaterThan(0n);
    expect(lpSupply).toBe(user1LPBalance);

    console.log("✓ First liquidity added");
    console.log(`  Deposited: ${amountA} Token A, ${amountB} Token B`);
    console.log(`  LP minted: ${user1LPBalance}`);
  });

  test("3. add_liquidity (second LP)", async () => {
    // Create user2 LP token account
    const tokenAccountLamports = svm.minimumBalanceForRentExemption(BigInt(ACCOUNT_SIZE));
    const user2LPKp = Keypair.generate();
    
    let tx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: user2LPKp.publicKey,
        lamports: Number(tokenAccountLamports),
        space: ACCOUNT_SIZE,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeAccountInstruction(user2LPKp.publicKey, lpMint.publicKey, user2.publicKey)
    );
    sendTx(tx, [payer, user2LPKp]);
    user2LP = user2LPKp.publicKey;

    const vaultABefore = getTokenBalance(vaultA.publicKey);
    const vaultBBefore = getTokenBalance(vaultB.publicKey);
    const lpSupplyBefore = getMintSupply(lpMint.publicKey);

    const amountA = 500_000_000n;
    const amountB = 1_000_000_000n;
    const minLpTokens = 0n;

    // Build add_liquidity instruction
    const discriminator = Buffer.from([181, 157, 89, 67, 143, 182, 52, 72]);
    const data = Buffer.alloc(8 + 8 + 8 + 8);
    discriminator.copy(data, 0);
    data.writeBigUInt64LE(amountA, 8);
    data.writeBigUInt64LE(amountB, 16);
    data.writeBigUInt64LE(minLpTokens, 24);

    const accounts = [
      { pubkey: user2.publicKey, isSigner: true, isWritable: true },
      { pubkey: poolPda, isSigner: false, isWritable: false },
      { pubkey: tokenMintA, isSigner: false, isWritable: false },
      { pubkey: tokenMintB, isSigner: false, isWritable: false },
      { pubkey: vaultA.publicKey, isSigner: false, isWritable: true },
      { pubkey: vaultB.publicKey, isSigner: false, isWritable: true },
      { pubkey: lpMint.publicKey, isSigner: false, isWritable: true },
      { pubkey: user2TokenA, isSigner: false, isWritable: true },
      { pubkey: user2TokenB, isSigner: false, isWritable: true },
      { pubkey: user2LP, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ];

    const addLiquidityIx = new TransactionInstruction({
      keys: accounts,
      programId,
      data,
    });

    tx = new Transaction().add(addLiquidityIx);
    sendTx(tx, [payer, user2]);

    const vaultAAfter = getTokenBalance(vaultA.publicKey);
    const vaultBAfter = getTokenBalance(vaultB.publicKey);
    const user2LPBalance = getTokenBalance(user2LP);
    const lpSupplyAfter = getMintSupply(lpMint.publicKey);

    expect(vaultAAfter).toBe(vaultABefore + amountA);
    expect(vaultBAfter).toBe(vaultBBefore + amountB);
    expect(user2LPBalance).toBeGreaterThan(0n);
    expect(lpSupplyAfter).toBe(lpSupplyBefore + user2LPBalance);

    // Verify proportionality
    const expectedLP = (amountA * lpSupplyBefore) / vaultABefore;
    expect(Number(user2LPBalance)).toBeCloseTo(Number(expectedLP), -3);

    console.log("✓ Second liquidity added");
    console.log(`  Deposited: ${amountA} Token A, ${amountB} Token B`);
    console.log(`  LP minted: ${user2LPBalance}`);
  });

  test("4. swap A → B", async () => {
    const vaultABefore = getTokenBalance(vaultA.publicKey);
    const vaultBBefore = getTokenBalance(vaultB.publicKey);
    const user1TokenBBefore = getTokenBalance(user1TokenB);

    const kBefore = vaultABefore * vaultBBefore;

    const amountIn = 100_000_000n;
    const minimumAmountOut = 1n;

    // Build swap instruction
    const discriminator = Buffer.from([248, 198, 158, 145, 225, 117, 135, 200]); // swap discriminator
    const data = Buffer.alloc(8 + 8 + 8);
    discriminator.copy(data, 0);
    data.writeBigUInt64LE(amountIn, 8);
    data.writeBigUInt64LE(minimumAmountOut, 16);

    const accounts = [
      { pubkey: user1.publicKey, isSigner: true, isWritable: true },
      { pubkey: poolPda, isSigner: false, isWritable: true },
      { pubkey: tokenMintA, isSigner: false, isWritable: false },
      { pubkey: tokenMintB, isSigner: false, isWritable: false },
      { pubkey: user1TokenA, isSigner: false, isWritable: true },
      { pubkey: user1TokenB, isSigner: false, isWritable: true },
      { pubkey: vaultA.publicKey, isSigner: false, isWritable: true },
      { pubkey: vaultB.publicKey, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ];

    const swapIx = new TransactionInstruction({
      keys: accounts,
      programId,
      data,
    });

    const tx = new Transaction().add(swapIx);
    sendTx(tx, [payer, user1]);

    const vaultAAfter = getTokenBalance(vaultA.publicKey);
    const vaultBAfter = getTokenBalance(vaultB.publicKey);
    const user1TokenBAfter = getTokenBalance(user1TokenB);
    const amountOut = user1TokenBAfter - user1TokenBBefore;

    expect(amountOut).toBeGreaterThan(0n);
    expect(vaultAAfter).toBe(vaultABefore + amountIn);
    expect(vaultBAfter).toBe(vaultBBefore - amountOut);

    console.log(`✓ Swapped ${amountIn} Token A for ${amountOut} Token B`);
    console.log(`  Reserve A: ${vaultABefore} → ${vaultAAfter}`);
    console.log(`  Reserve B: ${vaultBBefore} → ${vaultBAfter}`);

    // Verify fee is retained (k should increase)
    const kAfter = vaultAAfter * vaultBAfter;
    expect(kAfter).toBeGreaterThanOrEqual(kBefore);
    console.log(`  k: ${kBefore} → ${kAfter} (increased by fees)`);
  });

  test("5. remove_liquidity", async () => {
    const user1LPBefore = getTokenBalance(user1LP);
    const vaultABefore = getTokenBalance(vaultA.publicKey);
    const vaultBBefore = getTokenBalance(vaultB.publicKey);
    const lpSupplyBefore = getMintSupply(lpMint.publicKey);
    const user1TokenABefore = getTokenBalance(user1TokenA);
    const user1TokenBBefore = getTokenBalance(user1TokenB);

    const lpAmount = user1LPBefore / 2n;

    // Build remove_liquidity instruction
    const discriminator = Buffer.from([80, 85, 209, 72, 24, 206, 177, 108]); // remove_liquidity discriminator
    const data = Buffer.alloc(8 + 8);
    discriminator.copy(data, 0);
    data.writeBigUInt64LE(lpAmount, 8);

    const accounts = [
      { pubkey: user1.publicKey, isSigner: true, isWritable: true },
      { pubkey: poolPda, isSigner: false, isWritable: true },
      { pubkey: tokenMintA, isSigner: false, isWritable: false },
      { pubkey: tokenMintB, isSigner: false, isWritable: false },
      { pubkey: vaultA.publicKey, isSigner: false, isWritable: true },
      { pubkey: vaultB.publicKey, isSigner: false, isWritable: true },
      { pubkey: lpMint.publicKey, isSigner: false, isWritable: true },
      { pubkey: user1LP, isSigner: false, isWritable: true },
      { pubkey: user1TokenA, isSigner: false, isWritable: true },
      { pubkey: user1TokenB, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ];

    const removeLiquidityIx = new TransactionInstruction({
      keys: accounts,
      programId,
      data,
    });

    const tx = new Transaction().add(removeLiquidityIx);
    sendTx(tx, [payer, user1]);

    const user1LPAfter = getTokenBalance(user1LP);
    const vaultAAfter = getTokenBalance(vaultA.publicKey);
    const vaultBAfter = getTokenBalance(vaultB.publicKey);
    const lpSupplyAfter = getMintSupply(lpMint.publicKey);
    const user1TokenAAfter = getTokenBalance(user1TokenA);
    const user1TokenBAfter = getTokenBalance(user1TokenB);

    expect(user1LPAfter).toBe(user1LPBefore - lpAmount);
    expect(lpSupplyAfter).toBe(lpSupplyBefore - lpAmount);

    const withdrawnA = user1TokenAAfter - user1TokenABefore;
    const withdrawnB = user1TokenBAfter - user1TokenBBefore;

    expect(withdrawnA).toBeGreaterThan(0n);
    expect(withdrawnB).toBeGreaterThan(0n);
    expect(vaultAAfter).toBe(vaultABefore - withdrawnA);
    expect(vaultBAfter).toBe(vaultBBefore - withdrawnB);

    console.log(`✓ Removed liquidity: ${lpAmount} LP`);
    console.log(`  Withdrawn: ${withdrawnA} Token A + ${withdrawnB} Token B`);
  });

  test("6a. failure: slippage exceeded", async () => {
    const amountIn = 100_000_000n;
    const minimumAmountOut = 999_999_999_999n; // Unrealistically high

    const discriminator = Buffer.from([248, 198, 158, 145, 225, 117, 135, 200]);
    const data = Buffer.alloc(8 + 8 + 8);
    discriminator.copy(data, 0);
    data.writeBigUInt64LE(amountIn, 8);
    data.writeBigUInt64LE(minimumAmountOut, 16);

    const accounts = [
      { pubkey: user1.publicKey, isSigner: true, isWritable: true },
      { pubkey: poolPda, isSigner: false, isWritable: true },
      { pubkey: tokenMintA, isSigner: false, isWritable: false },
      { pubkey: tokenMintB, isSigner: false, isWritable: false },
      { pubkey: user1TokenA, isSigner: false, isWritable: true },
      { pubkey: user1TokenB, isSigner: false, isWritable: true },
      { pubkey: vaultA.publicKey, isSigner: false, isWritable: true },
      { pubkey: vaultB.publicKey, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ];

    const swapIx = new TransactionInstruction({
      keys: accounts,
      programId,
      data,
    });

    const tx = new Transaction();
    tx.add(swapIx);
    tx.recentBlockhash = svm.latestBlockhash();
    tx.feePayer = payer.publicKey;
    tx.sign(payer, user1);

    const result = svm.sendTransaction(tx);
    expect((result as FailedTransactionMetadata).err).toBeDefined();
    console.log("✓ Slippage exceeded correctly rejected");
  });

  test("6b. failure: zero liquidity", async () => {
    const amountA = 0n;
    const amountB = 0n;
    const minLpTokens = 0n;

    const discriminator = Buffer.from([181, 157, 89, 67, 143, 182, 52, 72]);
    const data = Buffer.alloc(8 + 8 + 8 + 8);
    discriminator.copy(data, 0);
    data.writeBigUInt64LE(amountA, 8);
    data.writeBigUInt64LE(amountB, 16);
    data.writeBigUInt64LE(minLpTokens, 24);

    const accounts = [
      { pubkey: user1.publicKey, isSigner: true, isWritable: true },
      { pubkey: poolPda, isSigner: false, isWritable: false },
      { pubkey: tokenMintA, isSigner: false, isWritable: false },
      { pubkey: tokenMintB, isSigner: false, isWritable: false },
      { pubkey: vaultA.publicKey, isSigner: false, isWritable: true },
      { pubkey: vaultB.publicKey, isSigner: false, isWritable: true },
      { pubkey: lpMint.publicKey, isSigner: false, isWritable: true },
      { pubkey: user1TokenA, isSigner: false, isWritable: true },
      { pubkey: user1TokenB, isSigner: false, isWritable: true },
      { pubkey: user1LP, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ];

    const addLiquidityIx = new TransactionInstruction({
      keys: accounts,
      programId,
      data,
    });

    const tx = new Transaction();
    tx.add(addLiquidityIx);
    tx.recentBlockhash = svm.latestBlockhash();
    tx.feePayer = payer.publicKey;
    tx.sign(payer, user1);

    const result = svm.sendTransaction(tx);
    expect((result as FailedTransactionMetadata).err).toBeDefined();
    console.log("✓ Zero liquidity correctly rejected");
  });

  test("6c. failure: insufficient LP tokens", async () => {
    const user1LPBalance = getTokenBalance(user1LP);
    const excessiveAmount = user1LPBalance + 1_000_000n;

    const discriminator = Buffer.from([80, 85, 209, 72, 24, 206, 177, 108]);
    const data = Buffer.alloc(8 + 8);
    discriminator.copy(data, 0);
    data.writeBigUInt64LE(excessiveAmount, 8);

    const accounts = [
      { pubkey: user1.publicKey, isSigner: true, isWritable: true },
      { pubkey: poolPda, isSigner: false, isWritable: true },
      { pubkey: tokenMintA, isSigner: false, isWritable: false },
      { pubkey: tokenMintB, isSigner: false, isWritable: false },
      { pubkey: vaultA.publicKey, isSigner: false, isWritable: true },
      { pubkey: vaultB.publicKey, isSigner: false, isWritable: true },
      { pubkey: lpMint.publicKey, isSigner: false, isWritable: true },
      { pubkey: user1LP, isSigner: false, isWritable: true },
      { pubkey: user1TokenA, isSigner: false, isWritable: true },
      { pubkey: user1TokenB, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ];

    const removeLiquidityIx = new TransactionInstruction({
      keys: accounts,
      programId,
      data,
    });

    const tx = new Transaction();
    tx.add(removeLiquidityIx);
    tx.recentBlockhash = svm.latestBlockhash();
    tx.feePayer = payer.publicKey;
    tx.sign(payer, user1);

    const result = svm.sendTransaction(tx);
    expect((result as FailedTransactionMetadata).err).toBeDefined();
    console.log("✓ Insufficient LP tokens correctly rejected");
  });
});
