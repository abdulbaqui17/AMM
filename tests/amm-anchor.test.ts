import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { BN } from "bn.js";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  createAccount,
  mintTo,
  getAccount,
  getMint,
} from "@solana/spl-token";
import { expect } from "chai";

describe("AMM", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Amm as Program;
  
  let tokenMintA: PublicKey;
  let tokenMintB: PublicKey;
  let user1TokenA: PublicKey;
  let user1TokenB: PublicKey;
  let user1LP: PublicKey;
  let poolPda: PublicKey;
  let poolBump: number;
  let vaultA: Keypair;
  let vaultB: Keypair;
  let lpMint: Keypair;

  const user1 = Keypair.generate();
  const payer = provider.wallet;

  before(async () => {
    // Airdrop SOL to user1
    const signature = await provider.connection.requestAirdrop(
      user1.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);

    // Create token mints (ensure A < B for canonical ordering)
    const mintAKeypair = Keypair.generate();
    const mintBKeypair = Keypair.generate();

    const [mintA, mintB] =
      Buffer.compare(
        mintAKeypair.publicKey.toBuffer(),
        mintBKeypair.publicKey.toBuffer()
      ) < 0
        ? [mintAKeypair, mintBKeypair]
        : [mintBKeypair, mintAKeypair];

    tokenMintA = await createMint(
      provider.connection,
      payer.payer,
      payer.publicKey,
      null,
      6,
      mintA
    );

    tokenMintB = await createMint(
      provider.connection,
      payer.payer,
      payer.publicKey,
      null,
      6,
      mintB
    );

    // Create user token accounts
    user1TokenA = await createAccount(
      provider.connection,
      payer.payer,
      tokenMintA,
      user1.publicKey
    );

    user1TokenB = await createAccount(
      provider.connection,
      payer.payer,
      tokenMintB,
      user1.publicKey
    );

    // Mint tokens to user1
    await mintTo(
      provider.connection,
      payer.payer,
      tokenMintA,
      user1TokenA,
      payer.publicKey,
      10_000_000_000
    );

    await mintTo(
      provider.connection,
      payer.payer,
      tokenMintB,
      user1TokenB,
      payer.publicKey,
      10_000_000_000
    );

    // Derive Pool PDA
    [poolPda, poolBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("pool"),
        tokenMintA.toBuffer(),
        tokenMintB.toBuffer(),
      ],
      program.programId
    );

    // Generate keypairs for vaults and LP mint
    vaultA = Keypair.generate();
    vaultB = Keypair.generate();
    lpMint = Keypair.generate();
  });

  it("Initializes the pool", async () => {
    // Create LP mint first (with pool PDA as authority)
    lpMint = Keypair.generate();
    await program.provider.sendAndConfirm(
      new Transaction().add(
        anchor.web3.SystemProgram.createAccount({
          fromPubkey: payer.publicKey,
          newAccountPubkey: lpMint.publicKey,
          space: 82,  // Mint account size
          lamports: await provider.connection.getMinimumBalanceForRentExemption(82),
          programId: TOKEN_PROGRAM_ID,
        }),
        // Initialize mint with pool as authority
        await (async () => {
          const { createInitializeMintInstruction } = await import("@solana/spl-token");
          return createInitializeMintInstruction(
            lpMint.publicKey,
            6,
            poolPda,
            null,
            TOKEN_PROGRAM_ID
          );
        })()
      ),
      [lpMint]
    );

    // Create vault A (token account owned by pool)
    vaultA = Keypair.generate();
    await program.provider.sendAndConfirm(
      new Transaction().add(
        anchor.web3.SystemProgram.createAccount({
          fromPubkey: payer.publicKey,
          newAccountPubkey: vaultA.publicKey,
          space: 165,  // Token account size
          lamports: await provider.connection.getMinimumBalanceForRentExemption(165),
          programId: TOKEN_PROGRAM_ID,
        }),
        await (async () => {
          const { createInitializeAccountInstruction } = await import("@solana/spl-token");
          return createInitializeAccountInstruction(
            vaultA.publicKey,
            tokenMintA,
            poolPda,
            TOKEN_PROGRAM_ID
          );
        })()
      ),
      [vaultA]
    );

    // Create vault B (token account owned by pool)
    vaultB = Keypair.generate();
    await program.provider.sendAndConfirm(
      new Transaction().add(
        anchor.web3.SystemProgram.createAccount({
          fromPubkey: payer.publicKey,
          newAccountPubkey: vaultB.publicKey,
          space: 165,  // Token account size
          lamports: await provider.connection.getMinimumBalanceForRentExemption(165),
          programId: TOKEN_PROGRAM_ID,
        }),
        await (async () => {
          const { createInitializeAccountInstruction } = await import("@solana/spl-token");
          return createInitializeAccountInstruction(
            vaultB.publicKey,
            tokenMintB,
            poolPda,
            TOKEN_PROGRAM_ID
          );
        })()
      ),
      [vaultB]
    );

    // Now initialize the pool
    await program.methods
      .initializePool()
      .accounts({
        payer: payer.publicKey,
        pool: poolPda,
        tokenMintA,
        tokenMintB,
        vaultA: vaultA.publicKey,
        vaultB: vaultB.publicKey,
        lpMint: lpMint.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    // Verify pool was created
    const poolAccount = await program.account.pool.fetch(poolPda);
    expect(poolAccount.tokenMintA.toString()).to.equal(tokenMintA.toString());
    expect(poolAccount.tokenMintB.toString()).to.equal(tokenMintB.toString());
    expect(poolAccount.vaultA.toString()).to.equal(vaultA.publicKey.toString());
    expect(poolAccount.vaultB.toString()).to.equal(vaultB.publicKey.toString());
    expect(poolAccount.lpMint.toString()).to.equal(lpMint.publicKey.toString());
    expect(poolAccount.feeBps).to.equal(30);

    console.log("✓ Pool initialized successfully");
    console.log(`  Pool PDA: ${poolPda.toString()}`);
    console.log(`  Fee: ${poolAccount.feeBps} bps (0.3%)`);
  });

  it("Adds liquidity (first LP)", async () => {
    // Create user1 LP token account
    user1LP = await createAccount(
      provider.connection,
      payer.payer,
      lpMint.publicKey,
      user1.publicKey
    );

    const amountA = new BN(1_000_000_000);
    const amountB = new BN(2_000_000_000);
    const minLpTokens = new BN(0);

    await program.methods
      .addLiquidity(amountA, amountB, minLpTokens)
      .accounts({
        user: user1.publicKey,
        pool: poolPda,
        tokenMintA,
        tokenMintB,
        vaultA: vaultA.publicKey,
        vaultB: vaultB.publicKey,
        lpMint: lpMint.publicKey,
        userTokenA: user1TokenA,
        userTokenB: user1TokenB,
        userLp: user1LP,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user1])
      .rpc();

    // Verify vault balances
    const vaultAAccount = await getAccount(provider.connection, vaultA.publicKey);
    const vaultBAccount = await getAccount(provider.connection, vaultB.publicKey);
    expect(Number(vaultAAccount.amount)).to.equal(1_000_000_000);
    expect(Number(vaultBAccount.amount)).to.equal(2_000_000_000);

    // Verify LP tokens minted
    const user1LPAccount = await getAccount(provider.connection, user1LP);
    const lpSupply = Number(user1LPAccount.amount);
    expect(lpSupply).to.be.greaterThan(0);

    console.log(`✓ First liquidity added: ${lpSupply} LP tokens minted`);
  });

  it("Swaps A → B", async () => {
    const vaultABefore = await getAccount(provider.connection, vaultA.publicKey);
    const vaultBBefore = await getAccount(provider.connection, vaultB.publicKey);
    const user1TokenBBefore = await getAccount(provider.connection, user1TokenB);

    const amountIn = new BN(100_000_000);
    const minimumAmountOut = new BN(1);

    await program.methods
      .swap(amountIn, minimumAmountOut)
      .accounts({
        user: user1.publicKey,
        pool: poolPda,
        tokenMintA,
        tokenMintB,
        userInput: user1TokenA,
        userOutput: user1TokenB,
        vaultInput: vaultA.publicKey,
        vaultOutput: vaultB.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user1])
      .rpc();

    const vaultAAfter = await getAccount(provider.connection, vaultA.publicKey);
    const vaultBAfter = await getAccount(provider.connection, vaultB.publicKey);
    const user1TokenBAfter = await getAccount(provider.connection, user1TokenB);

    const amountOut = Number(user1TokenBAfter.amount) - Number(user1TokenBBefore.amount);

    expect(amountOut).to.be.greaterThan(0);
    expect(Number(vaultAAfter.amount)).to.equal(Number(vaultABefore.amount) + 100_000_000);
    expect(Number(vaultBAfter.amount)).to.equal(Number(vaultBBefore.amount) - amountOut);

    console.log(`✓ Swapped ${100_000_000} Token A for ${amountOut} Token B`);
  });

  it("Removes liquidity", async () => {
    const user1LPBefore = await getAccount(provider.connection, user1LP);
    const lpAmount = new BN(Number(user1LPBefore.amount) / 2);

    const vaultABefore = await getAccount(provider.connection, vaultA.publicKey);
    const vaultBBefore = await getAccount(provider.connection, vaultB.publicKey);

    await program.methods
      .removeLiquidity(lpAmount)
      .accounts({
        user: user1.publicKey,
        pool: poolPda,
        tokenMintA,
        tokenMintB,
        vaultA: vaultA.publicKey,
        vaultB: vaultB.publicKey,
        lpMint: lpMint.publicKey,
        userLp: user1LP,
        userTokenA: user1TokenA,
        userTokenB: user1TokenB,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user1])
      .rpc();

    const vaultAAfter = await getAccount(provider.connection, vaultA.publicKey);
    const vaultBAfter = await getAccount(provider.connection, vaultB.publicKey);

    expect(Number(vaultAAfter.amount)).to.be.lessThan(Number(vaultABefore.amount));
    expect(Number(vaultBAfter.amount)).to.be.lessThan(Number(vaultBBefore.amount));

    console.log(`✓ Removed ${lpAmount.toString()} LP tokens`);
  });

  it("Fails with slippage exceeded", async () => {
    const amountIn = new BN(100_000_000);
    const minimumAmountOut = new BN(999_999_999_999); // Unrealistically high

    try {
      await program.methods
        .swap(amountIn, minimumAmountOut)
        .accounts({
          user: user1.publicKey,
          pool: poolPda,
          tokenMintA,
          tokenMintB,
          userInput: user1TokenA,
          userOutput: user1TokenB,
          vaultInput: vaultA.publicKey,
          vaultOutput: vaultB.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user1])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.toString()).to.include("SlippageExceeded");
      console.log("✓ Slippage check works correctly");
    }
  });
});

