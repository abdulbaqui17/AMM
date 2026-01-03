import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { Amm } from "./amm";
import idl from "./amm.json";

// Single source of truth: Program ID deployed on Solana Devnet
// This MUST match the deployed program and Anchor.toml
export const DEPLOYED_PROGRAM_ID = "GusCwDKH6aEkejKcGKDoVpRaeYPBRHwxn1k5kGFK4Guu";

// Program ID from IDL - verify it matches deployment
export const PROGRAM_ID = new PublicKey(idl.address);

// Runtime verification: Check IDL matches deployed program
if (idl.address !== DEPLOYED_PROGRAM_ID) {
  console.warn(
    "⚠️ PROGRAM ID MISMATCH DETECTED!\n" +
    `  Expected (deployed): ${DEPLOYED_PROGRAM_ID}\n` +
    `  IDL address:         ${idl.address}\n` +
    "  This may cause transaction failures. Please regenerate IDL or update DEPLOYED_PROGRAM_ID."
  );
}

// Log Program ID on module load for debugging
console.log("✅ AMM Program ID:", PROGRAM_ID.toBase58());

// AMM Program type
export type AmmProgram = Program<Amm>;

/**
 * Get Anchor provider with wallet and connection
 */
export function getProvider(
  connection: Connection,
  wallet: AnchorWallet
): AnchorProvider {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  return provider;
}

/**
 * Get AMM program instance
 */
export function getAmmProgram(
  connection: Connection,
  wallet: AnchorWallet
): AmmProgram {
  const provider = getProvider(connection, wallet);
  const program = new Program(idl as unknown as Amm, provider);
  return program as unknown as AmmProgram;
}

/**
 * Derive Pool PDA address
 */
export function getPoolAddress(
  tokenMintA: PublicKey,
  tokenMintB: PublicKey
): [PublicKey, number] {
  const [poolPda, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool"), tokenMintA.toBuffer(), tokenMintB.toBuffer()],
    PROGRAM_ID
  );
  return [poolPda, bump];
}

/**
 * Verify program deployment on-chain (optional runtime check)
 * Returns true if program exists and is executable
 */
export async function verifyProgramDeployment(
  connection: Connection
): Promise<boolean> {
  try {
    const accountInfo = await connection.getAccountInfo(PROGRAM_ID);
    
    if (!accountInfo) {
      console.error("❌ Program account not found on-chain:", PROGRAM_ID.toBase58());
      return false;
    }
    
    if (!accountInfo.executable) {
      console.error("❌ Program account exists but is not executable:", PROGRAM_ID.toBase58());
      return false;
    }
    
    console.log("✅ Program verified on-chain:", PROGRAM_ID.toBase58());
    return true;
  } catch (error) {
    console.error("❌ Error verifying program deployment:", error);
    return false;
  }
}

