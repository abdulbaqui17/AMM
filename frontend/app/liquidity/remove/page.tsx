"use client";

import { useState } from "react";
import { RemoveLiquidity } from "../../components/RemoveLiquidity";
import { PoolInfo } from "../../components/PoolInfo";

export default function RemoveLiquidityPage() {
  const [tokenMintA, setTokenMintA] = useState("");
  const [tokenMintB, setTokenMintB] = useState("");
  const [poolSelected, setPoolSelected] = useState(false);

  const handleContinue = () => {
    if (tokenMintA && tokenMintB) {
      setPoolSelected(true);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-blue-900 py-16">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
          Remove Liquidity
        </h1>

        <div className="max-w-2xl mx-auto bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8">
          {!poolSelected ? (
            <>
              <h2 className="text-2xl font-semibold text-white mb-6">
                Select Pool
              </h2>
              <div className="mb-6">
                <label className="block text-gray-300 text-sm font-bold mb-2">
                  Token Mint A
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="Enter Token Mint A Address"
                  value={tokenMintA}
                  onChange={(e) => setTokenMintA(e.target.value)}
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-300 text-sm font-bold mb-2">
                  Token Mint B
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm"
                  placeholder="Enter Token Mint B Address"
                  value={tokenMintB}
                  onChange={(e) => setTokenMintB(e.target.value)}
                />
              </div>
              <button
                onClick={handleContinue}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold py-3 px-4 rounded-lg transition-all"
              >
                Continue
              </button>
            </>
          ) : (
            <>
              <PoolInfo tokenMintA={tokenMintA} tokenMintB={tokenMintB} />
              <div className="mt-8">
                <RemoveLiquidity
                  tokenMintA={tokenMintA}
                  tokenMintB={tokenMintB}
                />
              </div>
            </>
          )}

          {/* Instructions */}
          <div className="mt-12 text-gray-300 text-sm">
            <h3 className="font-semibold text-blue-300 mb-2">
              💡 How it works
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-blue-300">
              <li>
                Enter the token mint addresses for the pool you want to
                remove liquidity from
              </li>
              <li>
                The program will verify the pool exists and show you the
                current state
              </li>
              <li>
                Enter the amount of LP tokens you want to burn
              </li>
              <li>
                The smart contract will calculate your proportional share
                of the pool reserves
              </li>
              <li>
                You&apos;ll receive both Token A and Token B back to your
                wallet
              </li>
            </ol>
            <h3 className="font-semibold text-orange-300 mt-6 mb-2">
              ⚠️ Before you start
            </h3>
            <p className="text-orange-300">
              Make sure you have LP tokens from adding liquidity to this
              pool. The amount you receive is proportional to your share of
              the total LP supply.
            </p>
            <p className="mt-2 text-orange-300">
              <strong>Note:</strong> When you remove liquidity, you&apos;ll
              receive your original deposit plus any trading fees earned
              during the time you were providing liquidity.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

