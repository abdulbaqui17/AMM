"use client";

import dynamic from "next/dynamic";

// Dynamically import wallet button with SSR disabled to prevent hydration errors
const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export function WalletButton() {
  return <WalletMultiButtonDynamic />;
}

