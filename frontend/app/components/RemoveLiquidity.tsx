"use client";

import { useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useAmmProgram, getPoolAddress } from "@/lib";
import { BN } from "@coral-xyz/anchor";

interface RemoveLiquidityProps {
  tokenMintA: string;
  tokenMintB: string;
}

export function RemoveLiquidity({
  tokenMintA,
  tokenMintB,
}: RemoveLiquidityProps) {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const program = useAmmProgram();

  const [lpAmount, setLpAmount] = useState("");
  const [lpBalance, setLpBalance] = useState<string>("0");
  const [loading, setLoading] = useState(false);
  const [fetchingBalance, setFetchingBalance] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [txSignature, setTxSignature] = useState("");
  const [withdrawnAmounts, setWithdrawnAmounts] = useState<{
    amountA: string;
    amountB: string;
  } | null>(null);

  // Fetch user's LP token balance
  useEffect(() => {
    async function fetchLpBalance() {
      if (!program || !publicKey) return;

      try {
        setFetchingBalance(true);
        const mintAPubkey = new PublicKey(tokenMintA);
        const mintBPubkey = new PublicKey(tokenMintB);
        const [poolPda] = getPoolAddress(mintAPubkey, mintBPubkey);
        const poolAccount = await program.account.pool.fetch(poolPda);

        const userLp = await getAssociatedTokenAddress(
          poolAccount.lpMint,
          publicKey
        );

        const lpAccountInfo = await connection.getTokenAccountBalance(userLp);
        setLpBalance(lpAccountInfo.value.uiAmountString || "0");
      } catch (err) {
        console.error("Error fetching LP balance:", err);
        setLpBalance("0");
      } finally {
        setFetchingBalance(false);
      }
    }

    fetchLpBalance();
  }, [program, publicKey, connection, tokenMintA, tokenMintB]);

  const handleRemoveLiquidity = async () => {
    if (!program || !publicKey) {
      setError("Please connect your wallet");
      return;
    }

    if (!lpAmount) {
      setError("Please enter LP amount");
      return;
    }

    const lpAmountNum = parseFloat(lpAmount);
    const lpBalanceNum = parseFloat(lpBalance);

    if (lpAmountNum > lpBalanceNum) {
      setError(`Insufficient LP tokens. You have ${lpBalance} LP tokens`);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess(false);
      setTxSignature("");
      setWithdrawnAmounts(null);

      // Parse LP amount (assuming 9 decimals)
      const lpAmountBN = new BN(lpAmountNum * 1e9);

      // Derive pool PDA
      const mintAPubkey = new PublicKey(tokenMintA);
      const mintBPubkey = new PublicKey(tokenMintB);
      const [poolPda] = getPoolAddress(mintAPubkey, mintBPubkey);

      // Fetch pool account
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

      // Get balances before
      const vaultABefore = await connection.getTokenAccountBalance(
        poolAccount.vaultA
      );
      const vaultBBefore = await connection.getTokenAccountBalance(
        poolAccount.vaultB
      );
      const lpSupplyBefore = await connection.getTokenSupply(poolAccount.lpMint);

      // Calculate expected withdrawal amounts
      const reserveA = BigInt(vaultABefore.value.amount);
      const reserveB = BigInt(vaultBBefore.value.amount);
      const totalSupply = BigInt(lpSupplyBefore.value.amount);
      const lpAmountBI = BigInt(lpAmountNum * 1e9);

      const expectedA = (lpAmountBI * reserveA) / totalSupply;
      const expectedB = (lpAmountBI * reserveB) / totalSupply;

      // Call remove_liquidity instruction
      const tx = await program.methods
        .removeLiquidity(lpAmountBN)
        .accountsPartial({
          user: publicKey,
          pool: poolPda,
          tokenMintA: mintAPubkey,
          tokenMintB: mintBPubkey,
          vaultA: poolAccount.vaultA,
          vaultB: poolAccount.vaultB,
          lpMint: poolAccount.lpMint,
          userLp: userLp,
          userTokenA: userTokenA,
          userTokenB: userTokenB,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      setTxSignature(tx);
      setWithdrawnAmounts({
        amountA: (Number(expectedA) / 1e9).toFixed(9),
        amountB: (Number(expectedB) / 1e9).toFixed(9),
      });
      setSuccess(true);
      setLpAmount("");

      // Refresh LP balance
      const updatedLpBalance = await connection.getTokenAccountBalance(userLp);
      setLpBalance(updatedLpBalance.value.uiAmountString || "0");
    } catch (err: any) {
      console.error("Error removing liquidity:", err);
      setError(err.message || "Failed to remove liquidity");
    } finally {
      setLoading(false);
    }
  };

  const setMaxLpAmount = () => {
    setLpAmount(lpBalance);
  };

  if (!publicKey) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <p className="text-sm text-yellow-800">
          Connect your wallet to remove liquidity
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Remove Liquidity
      </h3>

      {/* Success Message */}
      {success && withdrawnAmounts && (
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
              <p className="text-sm font-semibold text-green-900 mb-2">
                Liquidity Removed Successfully!
              </p>
              <div className="text-xs text-green-700 space-y-1 mb-2">
                <p>
                  <strong>Withdrawn Token A:</strong> {withdrawnAmounts.amountA}
                </p>
                <p>
                  <strong>Withdrawn Token B:</strong> {withdrawnAmounts.amountB}
                </p>
              </div>
              <p className="text-xs text-green-700 font-mono break-all mb-2">
                {txSignature}
              </p>
              <a
                href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-green-600 hover:text-green-800 underline inline-block"
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

      {/* LP Balance Display */}
      <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-purple-900">
            Your LP Token Balance
          </span>
          {fetchingBalance ? (
            <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <span className="text-lg font-bold text-purple-900">{lpBalance}</span>
          )}
        </div>
      </div>

      {/* Input Form */}
      <div className="space-y-4">
        {/* LP Amount */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="lpAmount"
              className="block text-sm font-medium text-gray-700"
            >
              LP Tokens to Burn
            </label>
            <button
              onClick={setMaxLpAmount}
              disabled={loading || fetchingBalance}
              className="text-xs font-medium text-purple-600 hover:text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              MAX
            </button>
          </div>
          <input
            id="lpAmount"
            type="number"
            value={lpAmount}
            onChange={(e) => setLpAmount(e.target.value)}
            placeholder="0.0"
            disabled={loading}
            max={lpBalance}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">
            LP tokens to burn (you have {lpBalance})
          </p>
        </div>

        {/* Remove Button */}
        <button
          onClick={handleRemoveLiquidity}
          disabled={loading || !lpAmount || fetchingBalance}
          className="w-full py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold rounded-lg hover:from-red-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Removing Liquidity...</span>
            </>
          ) : (
            <span>Remove Liquidity</span>
          )}
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800 mb-2">
          <strong>ℹ️ How it works:</strong>
        </p>
        <ul className="text-xs text-blue-700 space-y-1 ml-4">
          <li>• Burn your LP tokens</li>
          <li>• Receive proportional share of Token A and Token B</li>
          <li>• Your share includes any fees earned</li>
          <li>• Withdrawal amount = (LP tokens / Total LP) × Pool reserves</li>
        </ul>
      </div>
    </div>
  );
}

