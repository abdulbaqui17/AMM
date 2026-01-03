"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { WalletButton } from "./components/WalletButton";
import { useIsAdmin } from "@/lib";

export default function Home() {
  const { publicKey, connected } = useWallet();
  const { isAdmin } = useIsAdmin();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-blue-900">
      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <span className="text-2xl font-bold text-white">TokSwap</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                href="/swap"
                className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all"
              >
                Swap
              </Link>
              <Link
                href="/pool"
                className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all"
              >
                Pools
              </Link>
              <Link
                href="/liquidity/add"
                className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all"
              >
                Liquidity
              </Link>
            </div>

            {/* Wallet Button */}
            <WalletButton />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-32 text-center">
        <div className="max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-8">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-blue-200">Live on Solana Devnet</span>
          </div>

          {/* Headline */}
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Trade tokens
            </span>
            <br />
            <span className="text-white">instantly on Solana</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
            A decentralized exchange protocol built for speed, security, and simplicity
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            
            
            {mounted && connected && isAdmin && (
              <Link
                href="/pool/create"
                className="px-8 py-4 bg-gray-800 border border-gray-700 text-white font-bold text-lg rounded-2xl hover:bg-gray-700 transition-all hover:scale-105"
              >
                Create Pool
              </Link>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div>
              <p className="text-3xl md:text-4xl font-bold text-white mb-1">0.3%</p>
              <p className="text-sm text-gray-400">Trading Fee</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-white mb-1">&lt;1s</p>
              <p className="text-sm text-gray-400">Settlement Time</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-white mb-1">24/7</p>
              <p className="text-sm text-gray-400">Always Available</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 pb-32">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Swap Card */}
            <Link href="/swap" className="group">
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-3xl p-8 hover:bg-gray-800/70 hover:border-blue-500/50 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Swap</h3>
                <p className="text-gray-400 leading-relaxed">
                  Trade any token pair instantly with minimal slippage and low fees
                </p>
              </div>
            </Link>

            {/* Add Liquidity Card */}
            <Link href="/liquidity/add" className="group">
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-3xl p-8 hover:bg-gray-800/70 hover:border-emerald-500/50 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/20">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Add Liquidity</h3>
                <p className="text-gray-400 leading-relaxed">
                  Earn fees by providing liquidity to trading pairs
                </p>
              </div>
            </Link>

            {/* Remove Liquidity Card */}
            <Link href="/liquidity/remove" className="group">
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-3xl p-8 hover:bg-gray-800/70 hover:border-orange-500/50 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/20">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Remove Liquidity</h3>
                <p className="text-gray-400 leading-relaxed">
                  Withdraw your tokens plus earned fees anytime
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="container mx-auto px-4 pb-32">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-gray-800/30 to-blue-900/30 backdrop-blur-sm border border-blue-500/20 rounded-3xl p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center">
              Why TokSwap?
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Lightning Fast</h4>
                  <p className="text-gray-400 text-sm">Built on Solana for sub-second transactions</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Non-Custodial</h4>
                  <p className="text-gray-400 text-sm">You always control your tokens</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Audited & Secure</h4>
                  <p className="text-gray-400 text-sm">Smart contracts built with safety first</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Low Fees</h4>
                  <p className="text-gray-400 text-sm">Only 0.3% trading fee per swap</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-white">TokSwap</span>
            </div>
            
            <div className="flex items-center gap-6">
              <Link href="/swap" className="text-gray-400 hover:text-white transition-colors">
                Swap
              </Link>
              <Link href="/pool" className="text-gray-400 hover:text-white transition-colors">
                Pools
              </Link>
              <Link href="/liquidity/add" className="text-gray-400 hover:text-white transition-colors">
                Liquidity
              </Link>
            </div>
            
            <p className="text-gray-500 text-sm">
              Built on Solana • Devnet
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
