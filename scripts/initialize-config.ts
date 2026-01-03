import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import * as fs from "fs";

const idl = JSON.parse(fs.readFileSync("./target/idl/amm.json", "utf-8"));

async function main() {
  // Connected to Solana Devnet
  // Program ID: GusCwDKH6aEkejKcGKDoVpRaeYPBRHwxn1k5kGFK4Guu
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

  const program = new anchor.Program(idl as anchor.Idl, provider);

  console.log("Program ID:", program.programId.toString());
  console.log("Admin Wallet:", wallet.publicKey.toString());

  // Derive Config PDA
  const [configPda, configBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  console.log("\nConfig PDA:", configPda.toString());
  console.log("Config Bump:", configBump);

  // Check if config already exists
  try {
    const existingConfig = await program.account.config.fetch(configPda);
    console.log("\n⚠️  Config already initialized!");
    console.log("Current Admin:", existingConfig.admin.toString());
    console.log("\nIf you need to change the admin, you'll need to deploy a new program or add an update_admin instruction.");
    return;
  } catch (err) {
    // Config doesn't exist, proceed with initialization
    console.log("\n✅ Config not found, proceeding with initialization...");
  }

  // Initialize Config
  console.log("\nInitializing Config PDA...");
  try {
    const tx = await program.methods
      .initializeConfig()
      .accounts({
        admin: wallet.publicKey,
        config: configPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Initialize config tx:", tx);
    console.log("\n✅ Config initialized successfully!");
    console.log("\n📋 Summary:");
    console.log("Config Address:", configPda.toString());
    console.log("Admin:", wallet.publicKey.toString());
    console.log("Bump:", configBump);
    console.log("\n🔒 Only this admin can now create pools via initialize_pool instruction.");
    console.log("\n🌐 View on Explorer:");
    console.log(
      `https://explorer.solana.com/address/${configPda.toString()}?cluster=devnet`
    );
  } catch (err: any) {
    console.error("\n❌ Error initializing config:");
    console.error(err);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
