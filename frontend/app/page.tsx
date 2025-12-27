"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function Home() {
  const { publicKey, connected } = useWallet();

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header with Wallet Button */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg"></div>
            <span className="text-xl font-bold text-gray-900">Solana AMM</span>
          </div>
          <WalletMultiButton />
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        {/* Connection Status Banner */}
        {connected && (
          <div className="mb-8 max-w-4xl mx-auto">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="text-sm font-medium text-green-900">
                    Connected to Localnet
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
              {connected ? (
                <>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Wallet Connected!
                  </h2>
                  <p className="text-gray-600 max-w-md mx-auto mb-8">
                    Your wallet is connected to the Solana localnet. Ready to interact with the AMM.
                  </p>
                  <div className="flex justify-center gap-4">
                    <div className="px-6 py-3 bg-gray-100 rounded-lg">
                      <span className="text-sm text-gray-500">Status</span>
                      <p className="text-lg font-semibold text-green-600">
                        Connected
                      </p>
                    </div>
                    <div className="px-6 py-3 bg-gray-100 rounded-lg">
                      <span className="text-sm text-gray-500">Network</span>
                      <p className="text-lg font-semibold text-gray-900">
                        Localnet
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
                        Localnet
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
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
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
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
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
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Provide Liquidity
              </h3>
              <p className="text-gray-600 text-sm">
                Earn fees by providing liquidity to pools
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Secure & Audited
              </h3>
              <p className="text-gray-600 text-sm">
                Built with security best practices on Solana
              </p>
            </div>
          </div>
        </div>
        </div>
      </main>
  );
}
