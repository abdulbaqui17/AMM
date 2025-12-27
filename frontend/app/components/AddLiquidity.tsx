"use client";

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { useAmmProgram, getPoolAddress } from "@/lib";
import { BN } from "@coral-xyz/anchor";

interface AddLiquidityProps {
  tokenMintA: string;
  tokenMintB: string;
  poolAddress?: string;
}

export function AddLiquidity({
  tokenMintA,
  tokenMintB,
  poolAddress,
}: AddLiquidityProps) {
  const { publicKey } = useWallet();
  const program = useAmmProgram();

  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [txSignature, setTxSignature] = useState("");

  const handleAddLiquidity = async () => {
    if (!program || !publicKey) {
      setError("Please connect your wallet");
      return;
    }

    if (!amountA || !amountB) {
      setError("Please enter both amounts");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess(false);
      setTxSignature("");

      // Parse amounts (assuming token decimals = 9, adjust as needed)
      const amountABN = new BN(parseFloat(amountA) * 1e9);
      const amountBBN = new BN(parseFloat(amountB) * 1e9);

      // Derive pool PDA
      const mintAPubkey = new PublicKey(tokenMintA);
      const mintBPubkey = new PublicKey(tokenMintB);
      const [poolPda] = getPoolAddress(mintAPubkey, mintBPubkey);

      // Fetch pool account to get vault and LP mint addresses
      const poolAccount = await program.account.pool.fetch(poolPda);

      // Get user's token accounts
      const userTokenA = await getAssociatedTokenAddress(
        mintAPubkey,
        publicKey
      );
      const userTokenB = await getAssociatedTokenAddress(
        mintBPubkey,
        publicKey
      );
      const userLp = await getAssociatedTokenAddress(
        poolAccount.lpMint,
        publicKey
      );

      // Call add_liquidity instruction
      const tx = await program.methods
        .addLiquidity(amountABN, amountBBN)
        .accounts({
          user: publicKey,
          pool: poolPda,
          token_mint_a: mintAPubkey,
          token_mint_b: mintBPubkey,
          vault_a: poolAccount.vaultA,
          vault_b: poolAccount.vaultB,
          lp_mint: poolAccount.lpMint,
          user_token_a: userTokenA,
          user_token_b: userTokenB,
          user_lp: userLp,
          token_program: new PublicKey(
            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
          ),
        })
        .rpc();

      setTxSignature(tx);
      setSuccess(true);
      setAmountA("");
      setAmountB("");
    } catch (err: any) {
      console.error("Error adding liquidity:", err);
      setError(err.message || "Failed to add liquidity");
    } finally {
      setLoading(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <p className="text-sm text-yellow-800">
          Connect your wallet to add liquidity
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Add Liquidity
      </h3>

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
                Liquidity Added Successfully!
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
                Transaction Failed
              </p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="space-y-4">
        {/* Amount A */}
        <div>
          <label
            htmlFor="amountA"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Amount A
          </label>
          <input
            id="amountA"
            type="number"
            value={amountA}
            onChange={(e) => setAmountA(e.target.value)}
            placeholder="0.0"
            disabled={loading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">Token A to deposit</p>
        </div>

        {/* Amount B */}
        <div>
          <label
            htmlFor="amountB"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Amount B
          </label>
          <input
            id="amountB"
            type="number"
            value={amountB}
            onChange={(e) => setAmountB(e.target.value)}
            placeholder="0.0"
            disabled={loading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">Token B to deposit</p>
        </div>

        {/* Pool Address Display */}
        {poolAddress && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Pool Address</p>
            <p className="text-xs font-mono text-gray-700 break-all">
              {poolAddress}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleAddLiquidity}
          disabled={loading || !amountA || !amountB}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Adding Liquidity...</span>
            </>
          ) : (
            <span>Add Liquidity</span>
          )}
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Note:</strong> The program will automatically calculate the
          optimal deposit amounts based on the current pool ratio. You may
          receive slightly different LP tokens than expected.
        </p>
      </div>
    </div>
  );
}

