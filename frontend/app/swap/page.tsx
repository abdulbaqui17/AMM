"use client";

import { useState } from "react";
import { Swap } from "../components/Swap";
import { PoolInfo } from "../components/PoolInfo";

export default function SwapPage() {
  const [tokenMintA, setTokenMintA] = useState("");
  const [tokenMintB, setTokenMintB] = useState("");
  const [showSwap, setShowSwap] = useState(false);

  const handleSelectPool = () => {
    if (tokenMintA && tokenMintB) {
      setShowSwap(true);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Swap Tokens
            </h1>
            <p className="text-gray-600">
              Exchange tokens instantly with 0.3% fee
            </p>
          </div>

          {/* Pool Selection */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Select Pool
            </h2>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="mintA"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Token Mint A
                </label>
                <input
                  id="mintA"
                  type="text"
                  value={tokenMintA}
                  onChange={(e) => setTokenMintA(e.target.value)}
                  placeholder="Enter Token A mint address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="mintB"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Token Mint B
                </label>
                <input
                  id="mintB"
                  type="text"
                  value={tokenMintB}
                  onChange={(e) => setTokenMintB(e.target.value)}
                  placeholder="Enter Token B mint address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                />
              </div>

              <button
                onClick={handleSelectPool}
                disabled={!tokenMintA || !tokenMintB}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Continue
              </button>
            </div>
          </div>

          {/* Pool Info and Swap Form */}
          {showSwap && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Pool Information */}
              <PoolInfo tokenMintA={tokenMintA} tokenMintB={tokenMintB} />

              {/* Swap Form */}
              <Swap tokenMintA={tokenMintA} tokenMintB={tokenMintB} />
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">
              💱 How it works
            </h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">1.</span>
                <span>
                  Enter the token mint addresses for the pool you want to swap
                  in
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">2.</span>
                <span>Choose swap direction (A → B or B → A)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">3.</span>
                <span>Enter the amount you want to swap</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">4.</span>
                <span>
                  Set minimum output amount for slippage protection (optional)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">5.</span>
                <span>
                  The smart contract calculates the output using the constant
                  product formula (x * y = k)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">6.</span>
                <span>A 0.3% fee is applied and retained in the pool for LPs</span>
              </li>
            </ul>
          </div>

          {/* Warning */}
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-yellow-600 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <p className="text-sm font-semibold text-yellow-900 mb-1">
                  Slippage Protection
                </p>
                <p className="text-sm text-yellow-800">
                  Large swaps may experience significant price impact. Always set
                  a minimum output amount to protect against unfavorable rates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

