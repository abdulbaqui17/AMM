"use client";

import { useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { useAmmProgram, getPoolAddress } from "@/lib";

interface PoolInfoProps {
  tokenMintA: string;
  tokenMintB: string;
}

interface PoolData {
  tokenMintA: string;
  tokenMintB: string;
  vaultA: string;
  vaultB: string;
  lpMint: string;
  feeBps: number;
  bump: number;
}

export function PoolInfo({ tokenMintA, tokenMintB }: PoolInfoProps) {
  const { connection } = useConnection();
  const program = useAmmProgram();
  const [poolData, setPoolData] = useState<PoolData | null>(null);
  const [poolAddress, setPoolAddress] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function fetchPoolData() {
      if (!program || !tokenMintA || !tokenMintB) {
        setPoolData(null);
        return;
      }

      try {
        setLoading(true);
        setError("");

        // Validate token mint addresses before creating PublicKey instances
        let mintAPubkey: PublicKey;
        let mintBPubkey: PublicKey;
        
        try {
          mintAPubkey = new PublicKey(tokenMintA);
        } catch (err) {
          setError("Invalid token mint address for Token A");
          setPoolData(null);
          return;
        }
        
        try {
          mintBPubkey = new PublicKey(tokenMintB);
        } catch (err) {
          setError("Invalid token mint address for Token B");
          setPoolData(null);
          return;
        }

        // Derive pool PDA
        const [poolPda] = getPoolAddress(mintAPubkey, mintBPubkey);
        setPoolAddress(poolPda.toBase58());

        // Fetch pool account (returns null if account doesn't exist)
        const poolAccount = await program.account.pool.fetchNullable(poolPda);

        // Handle case where pool doesn't exist yet
        if (!poolAccount) {
          setPoolData(null);
          setError("");
          return;
        }

        // Set pool data
        setPoolData({
          tokenMintA: poolAccount.tokenMintA.toBase58(),
          tokenMintB: poolAccount.tokenMintB.toBase58(),
          vaultA: poolAccount.vaultA.toBase58(),
          vaultB: poolAccount.vaultB.toBase58(),
          lpMint: poolAccount.lpMint.toBase58(),
          feeBps: poolAccount.feeBps,
          bump: poolAccount.bump,
        });
        setError("");
      } catch (err: any) {
        console.error("Error fetching pool:", err);
        setError(err.message || "Failed to fetch pool data");
        setPoolData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchPoolData();
  }, [program, tokenMintA, tokenMintB, connection]);

  if (!program) {
    return (
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
        <p className="text-sm text-blue-200">
          Connect your wallet to view pool information
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-300">Loading pool data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
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
              Error Loading Pool
            </p>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!poolData) {
    return (
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-blue-400 mt-0.5"
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
          <div>
            <p className="text-sm font-semibold text-blue-300 mb-1">
              Pool Not Created Yet
            </p>
            <p className="text-sm text-blue-300">
              This liquidity pool has not been created by an administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Pool Information</h3>
        <div className="px-3 py-1 bg-emerald-500/20 rounded-full">
          <span className="text-xs font-semibold text-emerald-400">ACTIVE</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Pool Address */}
        <div>
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Pool Address
          </label>
          <div className="mt-1 p-3 bg-gray-900/50 border border-gray-600 rounded-lg">
            <p className="text-sm font-mono text-gray-200 break-all">
              {poolAddress}
            </p>
          </div>
        </div>

        {/* Token Mints */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Token Mint A
            </label>
            <div className="mt-1 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-xs font-mono text-blue-300 break-all">
                {poolData.tokenMintA}
              </p>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Token Mint B
            </label>
            <div className="mt-1 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <p className="text-xs font-mono text-emerald-300 break-all">
                {poolData.tokenMintB}
              </p>
            </div>
          </div>
        </div>

        {/* Vaults */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Vault A
            </label>
            <div className="mt-1 p-3 bg-gray-900/50 border border-gray-600 rounded-lg">
              <p className="text-xs font-mono text-gray-300 break-all">
                {poolData.vaultA}
              </p>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Vault B
            </label>
            <div className="mt-1 p-3 bg-gray-900/50 border border-gray-600 rounded-lg">
              <p className="text-xs font-mono text-gray-300 break-all">
                {poolData.vaultB}
              </p>
            </div>
          </div>
        </div>

        {/* LP Mint */}
        <div>
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            LP Token Mint
          </label>
          <div className="mt-1 p-3 bg-gray-900/50 border border-gray-600 rounded-lg">
            <p className="text-sm font-mono text-gray-200 break-all">
              {poolData.lpMint}
            </p>
          </div>
        </div>

        {/* Fee and Bump */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Fee (bps)
            </label>
            <div className="mt-1 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-center">
              <p className="text-2xl font-bold text-emerald-400">
                {poolData.feeBps}
              </p>
              <p className="text-xs text-emerald-400 mt-1">
                {(poolData.feeBps / 100).toFixed(2)}%
              </p>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              PDA Bump
            </label>
            <div className="mt-1 p-3 bg-gray-900/50 border border-gray-600 rounded-lg text-center">
              <p className="text-2xl font-bold text-gray-300">{poolData.bump}</p>
              <p className="text-xs text-gray-400 mt-1">Seed bump</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

