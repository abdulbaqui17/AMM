"use client";

import { FC, ReactNode, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

// Import wallet adapter CSS
import "@solana/wallet-adapter-react-ui/styles.css";

export const WalletContextProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Connected to Solana Devnet (program deployed on devnet)
  // Program ID: GusCwDKH6aEkejKcGKDoVpRaeYPBRHwxn1k5kGFK4Guu
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => {
    // Devnet RPC: https://api.devnet.solana.com
    return clusterApiUrl(network);
  }, [network]);

  // Initialize wallets (Phantom)
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

