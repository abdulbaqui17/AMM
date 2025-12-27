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
    <main className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 py-16">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
          Remove Liquidity
        </h1>

        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {!poolSelected ? (
            <>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Select Pool
              </h2>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Token Mint A
                </label>
                <input
                  type="text"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Enter Token Mint A Address"
                  value={tokenMintA}
                  onChange={(e) => setTokenMintA(e.target.value)}
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Token Mint B
                </label>
                <input
                  type="text"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Enter Token Mint B Address"
                  value={tokenMintB}
                  onChange={(e) => setTokenMintB(e.target.value)}
                />
              </div>
              <button
                onClick={handleContinue}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
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
          <div className="mt-12 text-gray-600 text-sm">
            <h3 className="font-semibold text-gray-800 mb-2">
              💡 How it works
            </h3>
            <ol className="list-decimal list-inside space-y-1">
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
            <h3 className="font-semibold text-gray-800 mt-6 mb-2">
              ⚠️ Before you start
            </h3>
            <p>
              Make sure you have LP tokens from adding liquidity to this
              pool. The amount you receive is proportional to your share of
              the total LP supply.
            </p>
            <p className="mt-2">
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

