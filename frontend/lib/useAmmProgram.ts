"use client";

import { useMemo } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { getAmmProgram, AmmProgram } from "./anchor";

/**
 * Hook to get the AMM program instance
 * Returns null if wallet is not connected
 */
export function useAmmProgram(): AmmProgram | null {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const program = useMemo(() => {
    if (!wallet) return null;
    return getAmmProgram(connection, wallet);
  }, [connection, wallet]);

  return program;
}

