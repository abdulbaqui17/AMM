import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import idl from "./amm.json";

// Program ID from IDL
export const PROGRAM_ID = new PublicKey(idl.address);

// AMM Program type
export type AmmProgram = Program<Idl>;

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
  const program = new Program(idl as Idl, provider);
  return program as AmmProgram;
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

