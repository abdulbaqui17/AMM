"use client";

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useAmmProgram, getPoolAddress } from "@/lib";
import { BN } from "@coral-xyz/anchor";

interface SwapProps {
  tokenMintA: string;
  tokenMintB: string;
}

type SwapDirection = "AtoB" | "BtoA";

export function Swap({ tokenMintA, tokenMintB }: SwapProps) {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const program = useAmmProgram();

  const [direction, setDirection] = useState<SwapDirection>("AtoB");
  const [amountIn, setAmountIn] = useState("");
  const [minAmountOut, setMinAmountOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [txSignature, setTxSignature] = useState("");

  const toggleDirection = () => {
    setDirection(direction === "AtoB" ? "BtoA" : "AtoB");
    setAmountIn("");
    setMinAmountOut("");
  };

  const handleSwap = async () => {
    if (!program || !publicKey) {
      setError("Please connect your wallet");
      return;
    }

    if (!amountIn) {
      setError("Please enter amount");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess(false);
      setTxSignature("");

      // Parse amounts (assuming token decimals = 9)
      const amountInBN = new BN(parseFloat(amountIn) * 1e9);
      const minAmountOutBN = new BN(
        minAmountOut ? parseFloat(minAmountOut) * 1e9 : 0
      );

      // Derive pool PDA
      const mintAPubkey = new PublicKey(tokenMintA);
      const mintBPubkey = new PublicKey(tokenMintB);
      const [poolPda] = getPoolAddress(mintAPubkey, mintBPubkey);

      // Fetch pool account
      const poolAccount = await program.account.pool.fetch(poolPda);

      // Determine input/output mints based on direction
      const isAtoB = direction === "AtoB";
      const inputMint = isAtoB ? mintAPubkey : mintBPubkey;
      const outputMint = isAtoB ? mintBPubkey : mintAPubkey;

      // Get user's token accounts
      const userInput = await getAssociatedTokenAddress(inputMint, publicKey);
      const userOutput = await getAssociatedTokenAddress(outputMint, publicKey);

      // Get vault addresses
      const vaultInput = isAtoB ? poolAccount.vaultA : poolAccount.vaultB;
      const vaultOutput = isAtoB ? poolAccount.vaultB : poolAccount.vaultA;

      // Call swap instruction
      const tx = await program.methods
        .swap(amountInBN, minAmountOutBN)
        .accounts({
          user: publicKey,
          pool: poolPda,
          tokenMintA: mintAPubkey,
          tokenMintB: mintBPubkey,
          userInput: userInput,
          userOutput: userOutput,
          vaultInput: vaultInput,
          vaultOutput: vaultOutput,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      setTxSignature(tx);
      setSuccess(true);
      setAmountIn("");
      setMinAmountOut("");
    } catch (err: any) {
      console.error("Error swapping:", err);
      setError(err.message || "Failed to swap");
    } finally {
      setLoading(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <p className="text-sm text-yellow-800">
          Connect your wallet to swap tokens
        </p>
      </div>
    );
  }

  const inputToken = direction === "AtoB" ? "Token A" : "Token B";
  const outputToken = direction === "AtoB" ? "Token B" : "Token A";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Swap Tokens</h3>

      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-green-600 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-900 mb-1">
                Swap Successful!
              </p>
              <p className="text-xs text-green-700 font-mono break-all">
                {txSignature}
              </p>
              <a
                href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-green-600 hover:text-green-800 underline mt-2 inline-block"
              >
                View on Explorer →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-600 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm font-semibold text-red-900 mb-1">
                Swap Failed
              </p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Swap Interface */}
      <div className="space-y-4">
        {/* From */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            From ({inputToken})
          </label>
          <input
            type="number"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            placeholder="0.0"
            disabled={loading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">Amount to swap</p>
        </div>

        {/* Swap Direction Button */}
        <div className="flex justify-center">
          <button
            onClick={toggleDirection}
            disabled={loading}
            className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
          </button>
        </div>

        {/* To */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            To ({outputToken})
          </label>
          <input
            type="number"
            value={minAmountOut}
            onChange={(e) => setMinAmountOut(e.target.value)}
            placeholder="0.0 (minimum)"
            disabled={loading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">
            Minimum amount to receive (slippage protection)
          </p>
        </div>

        {/* Swap Direction Display */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-blue-900">
            <span>{inputToken}</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
            <span>{outputToken}</span>
          </div>
        </div>

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={loading || !amountIn}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Swapping...</span>
            </>
          ) : (
            <span>Swap</span>
          )}
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-xs text-purple-800">
          <strong>Note:</strong> The swap will execute at the current pool
          ratio with a 0.3% fee. Set a minimum output amount to protect against
          slippage.
        </p>
      </div>
    </div>
  );
}

