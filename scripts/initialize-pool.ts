import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createInitializeAccountInstruction,
  getMinimumBalanceForRentExemptMint,
  getMinimumBalanceForRentExemptAccount,
  MINT_SIZE,
  TOKEN_2022_PROGRAM_ID,
  AccountLayout,
} from "@solana/spl-token";
import * as fs from "fs";
const idl = JSON.parse(fs.readFileSync("./target/idl/amm.json", "utf-8"));

async function main() {
  // Configure the client to use devnet
  const connection = new anchor.web3.Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );

  const wallet = anchor.web3.Keypair.fromSecretKey(
    Buffer.from(
      JSON.parse(
        fs.readFileSync(
          process.env.HOME + "/.config/solana/id.json",
          "utf-8"
        )
      )
    )
  );

  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(wallet),
    { commitment: "confirmed" }
  );
  anchor.setProvider(provider);

  const program = new anchor.Program(
    idl as anchor.Idl,
    provider
  );

  console.log("Program ID:", program.programId.toString());
  console.log("Payer:", wallet.publicKey.toString());

  // Your token mint addresses
  const tokenMintA = new PublicKey(
    "Ed5P1ePbJHrvyNZNTfxqjewVrEzABrpDvu3v8S7nCJG7"
  );
  const tokenMintB = new PublicKey(
    "EwLaoMbavuwEVYdCTStacYSxZhkeh4EePVM2rfhHEJb3"
  );

  console.log("\nToken Mint A:", tokenMintA.toString());
  console.log("Token Mint B:", tokenMintB.toString());

  // Derive pool PDA
  const [poolPda, poolBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool"), tokenMintA.toBuffer(), tokenMintB.toBuffer()],
    program.programId
  );

  console.log("\nPool PDA:", poolPda.toString());
  console.log("Pool Bump:", poolBump);

  // Create vaults manually
  const vaultAKeypair = anchor.web3.Keypair.generate();
  const vaultBKeypair = anchor.web3.Keypair.generate();
  const lpMintKeypair = anchor.web3.Keypair.generate();

  console.log("\nVault A:", vaultAKeypair.publicKey.toString());
  console.log("Vault B:", vaultBKeypair.publicKey.toString());
  console.log("LP Mint:", lpMintKeypair.publicKey.toString());

  const rentExemptAccount = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span
  );
  const rentExemptMint = await connection.getMinimumBalanceForRentExemption(
    MINT_SIZE
  );

  const transaction = new Transaction();

  // Create vault A
  transaction.add(
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: vaultAKeypair.publicKey,
      lamports: rentExemptAccount,
      space: AccountLayout.span,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeAccountInstruction(
      vaultAKeypair.publicKey,
      tokenMintA,
      poolPda,
      TOKEN_PROGRAM_ID
    )
  );

  // Create vault B
  transaction.add(
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: vaultBKeypair.publicKey,
      lamports: rentExemptAccount,
      space: AccountLayout.span,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeAccountInstruction(
      vaultBKeypair.publicKey,
      tokenMintB,
      poolPda,
      TOKEN_PROGRAM_ID
    )
  );

  // Create LP mint
  transaction.add(
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: lpMintKeypair.publicKey,
      lamports: rentExemptMint,
      space: MINT_SIZE,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(
      lpMintKeypair.publicKey,
      9,
      poolPda,
      null,
      TOKEN_PROGRAM_ID
    )
  );

  console.log("\nCreating vaults and LP mint...");
  await sendAndConfirmTransaction(
    connection,
    transaction,
    [wallet, vaultAKeypair, vaultBKeypair, lpMintKeypair]
  );
  console.log("✅ Vaults and LP mint created");

  // Initialize pool
  console.log("\nInitializing pool...");
  const tx = await program.methods
    .initializePool()
    .accounts({
      payer: wallet.publicKey,
      pool: poolPda,
      tokenMintA: tokenMintA,
      tokenMintB: tokenMintB,
      vaultA: vaultAKeypair.publicKey,
      vaultB: vaultBKeypair.publicKey,
      lpMint: lpMintKeypair.publicKey,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    })
    .rpc();

  console.log("Initialize pool tx:", tx);
  console.log("\n✅ Pool initialized successfully!");
  console.log("\n📋 Summary:");
  console.log("Pool Address:", poolPda.toString());
  console.log("Vault A:", vaultAKeypair.publicKey.toString());
  console.log("Vault B:", vaultBKeypair.publicKey.toString());
  console.log("LP Mint:", lpMintKeypair.publicKey.toString());
  console.log("Fee: 30 bps (0.3%)");
  console.log("\n🌐 View on Explorer:");
  console.log(
    `https://explorer.solana.com/address/${poolPda.toString()}?cluster=devnet`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
