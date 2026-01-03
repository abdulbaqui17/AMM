"use client";

import { useState } from "react";
import { PoolInfo } from "../components/PoolInfo";

export default function PoolPage() {
  // Token mints for devnet pool lookup
  const [tokenMintA, setTokenMintA] = useState("");
  const [tokenMintB, setTokenMintB] = useState("");
  const [showPool, setShowPool] = useState(false);

  const handleLookupPool = () => {
    if (tokenMintA && tokenMintB) {
      setShowPool(true);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Pool Information
            </h1>
            <p className="text-gray-600">
              View details about an existing AMM pool
            </p>
          </div>

          {/* Input Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-6">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
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
                onClick={handleLookupPool}
                disabled={!tokenMintA || !tokenMintB}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Lookup Pool
              </button>
            </div>
          </div>

          {/* Pool Info Display */}
          {showPool && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <PoolInfo tokenMintA={tokenMintA} tokenMintB={tokenMintB} />
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">
              📖 How to use
            </h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">1.</span>
                <span>
                  Enter the public keys of two token mints (in canonical order: mintA &lt; mintB)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">2.</span>
                <span>Click "Lookup Pool" to fetch pool data from the blockchain</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">3.</span>
                <span>
                  View pool details including vaults, LP mint, and fee structure
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}

