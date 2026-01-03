"use client";

import { useState } from "react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID } from "@solana/spl-token";
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
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
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

      // Validate token mint addresses before creating PublicKey instances
      let mintAPubkey: PublicKey;
      let mintBPubkey: PublicKey;
      
      try {
        mintAPubkey = new PublicKey(tokenMintA);
      } catch (err) {
        setError("Invalid token mint address for Token A");
        return;
      }
      
      try {
        mintBPubkey = new PublicKey(tokenMintB);
      } catch (err) {
        setError("Invalid token mint address for Token B");
        return;
      }

      // Derive pool PDA
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

      // Check if LP token account exists, if not create it
      const lpAccountInfo = await connection.getAccountInfo(userLp);
      if (!lpAccountInfo) {
        console.log("Creating LP token account...");
        if (!signTransaction) {
          throw new Error("Wallet does not support signing");
        }
        
        const createAtaIx = createAssociatedTokenAccountInstruction(
          publicKey,
          userLp,
          publicKey,
          poolAccount.lpMint,
          TOKEN_PROGRAM_ID
        );
        
        // Send transaction to create ATA
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        const createAtaTx = new Transaction({
          feePayer: publicKey,
          blockhash,
          lastValidBlockHeight,
        }).add(createAtaIx);
        
        const signed = await signTransaction(createAtaTx);
        const createAtaSig = await connection.sendRawTransaction(signed.serialize());
        await connection.confirmTransaction({
          signature: createAtaSig,
          blockhash,
          lastValidBlockHeight,
        });
        console.log("LP token account created:", createAtaSig);
      }

      // Call add_liquidity instruction
      const tx = await program.methods
        .addLiquidity(amountABN, amountBBN, new BN(0)) // min_lp_tokens = 0 for now
        .accountsPartial({
          user: publicKey,
          pool: poolPda,
          tokenMintA: mintAPubkey,
          tokenMintB: mintBPubkey,
          vaultA: poolAccount.vaultA,
          vaultB: poolAccount.vaultB,
          lpMint: poolAccount.lpMint,
          userTokenA: userTokenA,
          userTokenB: userTokenB,
          userLp: userLp,
          tokenProgram: new PublicKey(
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
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
        <p className="text-sm text-blue-200">
          Connect your wallet to add liquidity
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-6">
        Add Liquidity
      </h3>

      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-emerald-400 mt-0.5"
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
              <p className="text-sm font-semibold text-emerald-400 mb-1">
                Liquidity Added Successfully!
              </p>
              <p className="text-xs text-emerald-300 font-mono break-all">
                {txSignature}
              </p>
              <a
                href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-400 hover:text-emerald-300 underline mt-2 inline-block"
              >
                View on Explorer →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-400 mt-0.5"
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
              <p className="text-sm font-semibold text-red-400 mb-1">
                Transaction Failed
              </p>
              <p className="text-sm text-red-300">{error}</p>
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
            className="block text-sm font-medium text-gray-300 mb-2"
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
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="text-xs text-gray-400 mt-1">Token A to deposit</p>
        </div>

        {/* Amount B */}
        <div>
          <label
            htmlFor="amountB"
            className="block text-sm font-medium text-gray-300 mb-2"
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
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="text-xs text-gray-400 mt-1">Token B to deposit</p>
        </div>

        {/* Pool Address Display */}
        {poolAddress && (
          <div className="p-3 bg-gray-900/50 border border-gray-600 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Pool Address</p>
            <p className="text-xs font-mono text-gray-300 break-all">
              {poolAddress}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleAddLiquidity}
          disabled={loading || !amountA || !amountB}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
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
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-xs text-blue-300">
          <strong>Note:</strong> The program will automatically calculate the
          optimal deposit amounts based on the current pool ratio. You may
          receive slightly different LP tokens than expected.
        </p>
      </div>
    </div>
  );
}

