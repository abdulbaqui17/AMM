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
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl group-hover:scale-110 transition-transform"></div>
              <span className="text-2xl font-bold text-white">SolSwap</span>
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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-8">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-purple-200">Live on Solana Devnet</span>
          </div>

          {/* Headline */}
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
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
            <Link
              href="/swap"
              className="group relative px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg rounded-2xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all hover:scale-105"
            >
              <span className="relative z-10">Launch App</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </Link>
            
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
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-3xl p-8 hover:bg-gray-800/70 hover:border-purple-500/50 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
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
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-3xl p-8 hover:bg-gray-800/70 hover:border-purple-500/50 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
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
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-3xl p-8 hover:bg-gray-800/70 hover:border-purple-500/50 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
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
          <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-sm border border-purple-500/20 rounded-3xl p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center">
              Why SolSwap?
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg"></div>
              <span className="text-lg font-bold text-white">SolSwap</span>
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header with Wallet Button */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg"></div>
            <span className="text-xl font-bold text-gray-900">Solana AMM</span>
          </div>
          <WalletButton />
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        {/* Connection Status Banner */}
        {mounted && connected && (
          <div className="mb-8 max-w-4xl mx-auto">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="text-sm font-medium text-green-900">
                    Connected to Devnet
                  </p>
                  <p className="text-xs text-green-700 font-mono">
                    {publicKey?.toBase58()}
                  </p>
                </div>
              </div>
              <div className="px-3 py-1 bg-green-100 rounded-full">
                <span className="text-xs font-semibold text-green-700">
                  ACTIVE
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Solana AMM
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Decentralized Automated Market Maker built on Solana
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Constant Product Formula (x * y = k) • 0.3% Fee • Fast & Efficient
          </p>
        </div>

        {/* Main Content Card */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-6">
                <svg
                  className="w-10 h-10 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              {mounted && connected ? (
                <>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Wallet Connected!
                  </h2>
                  <p className="text-gray-600 max-w-md mx-auto mb-4">
                    Your wallet is connected to Solana devnet. Ready to interact with the AMM.
                  </p>
                  {program && (
                    <div className="mb-6 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-xs font-semibold text-purple-900 mb-1">
                        AMM Program Loaded
                      </p>
                      <p className="text-xs text-purple-700 font-mono">
                        {PROGRAM_ID.toBase58()}
                      </p>
                    </div>
                  )}
                  {/* Optional: Display program verification status */}
                  <div className="max-w-md mx-auto">
                    <ProgramStatus />
                  </div>
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link
                      href="/swap"
                      className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-center"
                    >
                      Swap Tokens
                    </Link>
                    <Link
                      href="/liquidity/add"
                      className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors text-center"
                    >
                      Add Liquidity
                    </Link>
                    <Link
                      href="/liquidity/remove"
                      className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors text-center"
                    >
                      Remove Liquidity
                    </Link>
                    <Link
                      href="/pool"
                      className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors text-center"
                    >
                      View Pool Info
                    </Link>
                    {/* Admin-only: Create Pool */}
                    {isAdmin && (
                      <Link
                        href="/pool/create"
                        className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-colors text-center flex items-center gap-2"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        Create Pool (Admin)
                      </Link>
                    )}
                  </div>
                  <div className="flex justify-center gap-4 mt-4">
                    <div className="px-6 py-3 bg-gray-100 rounded-lg">
                      <span className="text-sm text-gray-500">Status</span>
                      <p className="text-lg font-semibold text-green-600">
                        Connected
                      </p>
                    </div>
                    <div className="px-6 py-3 bg-gray-100 rounded-lg">
                      <span className="text-sm text-gray-500">Network</span>
                      <p className="text-lg font-semibold text-gray-900">
                        Devnet
                      </p>
                    </div>
                    <div className="px-6 py-3 bg-gray-100 rounded-lg">
                      <span className="text-sm text-gray-500">Fee</span>
                      <p className="text-lg font-semibold text-gray-900">
                        0.3%
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Connect Your Wallet
                  </h2>
                  <p className="text-gray-600 max-w-md mx-auto mb-8">
                    Connect your Phantom wallet to start swapping tokens and providing liquidity on Solana's fastest AMM.
                  </p>
                  <div className="flex justify-center gap-4">
                    <div className="px-6 py-3 bg-gray-100 rounded-lg">
                      <span className="text-sm text-gray-500">Status</span>
                      <p className="text-lg font-semibold text-gray-900">
                        Ready
                      </p>
                    </div>
                    <div className="px-6 py-3 bg-gray-100 rounded-lg">
                      <span className="text-sm text-gray-500">Network</span>
                      <p className="text-lg font-semibold text-gray-900">
                        Devnet
                      </p>
                    </div>
                    <div className="px-6 py-3 bg-gray-100 rounded-lg">
                      <span className="text-sm text-gray-500">Fee</span>
                      <p className="text-lg font-semibold text-gray-900">
                        0.3%
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-4 gap-6 mt-8">
            <Link href="/swap" className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Swap Tokens
              </h3>
              <p className="text-gray-600 text-sm">
                Exchange tokens instantly with minimal slippage
              </p>
            </Link>

            <Link href="/liquidity/add" className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Add Liquidity
              </h3>
              <p className="text-gray-600 text-sm">
                Earn fees by providing liquidity to pools
              </p>
            </Link>

            <Link href="/liquidity/remove" className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 12H4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Remove Liquidity
              </h3>
              <p className="text-gray-600 text-sm">
                Withdraw your tokens and collected fees
              </p>
            </Link>

            <Link href="/pool" className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                View Pool Info
              </h3>
              <p className="text-gray-600 text-sm">
                Check details of existing AMM pools
              </p>
            </Link>
          </div>
        </div>
        </div>
      </main>
  );
}
