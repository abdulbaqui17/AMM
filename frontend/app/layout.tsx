import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletContextProvider } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Solana AMM - Decentralized Exchange",
  description: "Constant product AMM built on Solana with 0.3% fees. Swap tokens and provide liquidity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <WalletContextProvider>{children}</WalletContextProvider>
      </body>
    </html>
  );
}
