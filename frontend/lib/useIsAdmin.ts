"use client";

import { useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useAmmProgram, PROGRAM_ID } from "@/lib";

/**
 * Hook to check if connected wallet is the protocol admin
 * Returns true if wallet is admin, false otherwise
 */
export function useIsAdmin() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const program = useAmmProgram();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      if (!program || !publicKey) {
        setIsAdmin(false);
        return;
      }

      try {
        setLoading(true);

        // Derive Config PDA
        const [configPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("config")],
          PROGRAM_ID
        );

        // Fetch config account
        // @ts-ignore - Config account added, types will update on next build
        const configAccount = await program.account.config.fetch(configPda);

        // Check if wallet is admin
        const isAdminWallet = configAccount.admin.equals(publicKey);
        setIsAdmin(isAdminWallet);
      } catch (err) {
        // Config might not exist yet or error fetching
        console.log("Unable to fetch config or verify admin status");
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    checkAdmin();
  }, [program, publicKey, connection]);

  return { isAdmin, loading };
}
