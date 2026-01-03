"use client";

import { useState, useEffect } from "react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useAmmProgram, getPoolAddress } from "@/lib";
import { BN } from "@coral-xyz/anchor";

interface SwapProps {
  tokenMintA: string;
  tokenMintB: string;
}

type SwapDirection = "AtoB" | "BtoA";

// Helper function to validate PublicKey
function isValidPublicKey(address: string): boolean {
  if (!address || address.trim() === "") return false;
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

export function Swap({ tokenMintA, tokenMintB }: SwapProps) {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const program = useAmmProgram();

  const [direction, setDirection] = useState<SwapDirection>("AtoB");
  const [amountIn, setAmountIn] = useState("");
  const [minAmountOut, setMinAmountOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingPool, setCheckingPool] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [txSignature, setTxSignature] = useState("");
  const [poolExists, setPoolExists] = useState<boolean | null>(null);
  const [poolHasLiquidity, setPoolHasLiquidity] = useState<boolean | null>(null);

  // Validate mint addresses and check pool status
  useEffect(() => {
    async function checkPoolStatus() {
      if (!program) return;

      setPoolExists(null);
      setPoolHasLiquidity(null);
      setError("");

      const mintAValid = isValidPublicKey(tokenMintA);
      const mintBValid = isValidPublicKey(tokenMintB);

      if (!mintAValid || !mintBValid) {
        setError("Invalid token address");
        return;
      }

      if (tokenMintA === tokenMintB) {
        setError("Cannot swap identical tokens");
        return;
      }

      try {
        setCheckingPool(true);
        const mintAPubkey = new PublicKey(tokenMintA);
        const mintBPubkey = new PublicKey(tokenMintB);
        const [poolPda] = getPoolAddress(mintAPubkey, mintBPubkey);

        const poolAccount = await program.account.pool.fetchNullable(poolPda);
        
        if (!poolAccount) {
          setPoolExists(false);
          setError("This pool does not exist yet");
          return;
        }

        setPoolExists(true);

        const vaultA = await connection.getTokenAccountBalance(poolAccount.vaultA);
        const vaultB = await connection.getTokenAccountBalance(poolAccount.vaultB);
        
        const hasLiquidity = 
          BigInt(vaultA.value.amount) > 0n && 
          BigInt(vaultB.value.amount) > 0n;

        setPoolHasLiquidity(hasLiquidity);
        
        if (!hasLiquidity) {
          setError("This pool has no liquidity");
        }
      } catch (err) {
        console.error("Error checking pool:", err);
        setError("Unable to check pool status");
      } finally {
        setCheckingPool(false);
      }
    }

    checkPoolStatus();
  }, [program, connection, tokenMintA, tokenMintB]);

  const toggleDirection = () => {
    setDirection(direction === "AtoB" ? "BtoA" : "AtoB");
  };

  // Get button state and text
  const getButtonState = () => {
    if (!publicKey) return { disabled: true, text: "Connect Wallet" };
    if (checkingPool) return { disabled: true, text: "Checking Pool..." };
    if (!isValidPublicKey(tokenMintA) || !isValidPublicKey(tokenMintB)) {
      return { disabled: true, text: "Invalid Token Address" };
    }
    if (tokenMintA === tokenMintB) {
      return { disabled: true, text: "Cannot Swap Same Token" };
    }
    if (poolExists === false) return { disabled: true, text: "Pool Does Not Exist" };
    if (poolHasLiquidity === false) return { disabled: true, text: "No Liquidity Available" };
    if (!amountIn || parseFloat(amountIn) <= 0) {
      return { disabled: true, text: "Enter Amount" };
    }
    if (loading) return { disabled: true, text: "Swapping..." };
    return { disabled: false, text: "Swap" };
  };

  const handleSwap = async () => {
    if (!program || !publicKey) return;

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

      // Validate token mint addresses before creating PublicKey instances
      let mintAPubkey: PublicKey;
      let mintBPubkey: PublicKey;
      
      try {
        mintAPubkey = new PublicKey(tokenMintA);
      } catch (err) {
        setError("Invalid token address for Token A");
        return;
      }
      
      try {
        mintBPubkey = new PublicKey(tokenMintB);
      } catch (err) {
        setError("Invalid token address for Token B");
        return;
      }

      // Derive pool PDA
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

      // Check if output token account exists, if not create it
      const outputAccountInfo = await connection.getAccountInfo(userOutput);
      if (!outputAccountInfo) {
        console.log("Creating output token account...");
        if (!signTransaction) {
          throw new Error("Wallet does not support signing");
        }
        
        const createAtaIx = createAssociatedTokenAccountInstruction(
          publicKey,
          userOutput,
          publicKey,
          outputMint,
          TOKEN_PROGRAM_ID
        );
        
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
        console.log("Output token account created:", createAtaSig);
      }

      // Get vault addresses
      const vaultInput = isAtoB ? poolAccount.vaultA : poolAccount.vaultB;
      const vaultOutput = isAtoB ? poolAccount.vaultB : poolAccount.vaultA;

      // Call swap instruction
      const tx = await program.methods
        .swap(amountInBN, minAmountOutBN)
        .accountsPartial({
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
      
      // User-friendly error messages
      let friendlyError = "Swap failed. Please try again.";
      
      if (err.message?.includes("SlippageExceeded") || err.message?.includes("6004")) {
        friendlyError = "Price moved unfavorably. Try increasing slippage tolerance or reducing amount.";
      } else if (err.message?.includes("InsufficientLiquidity") || err.message?.includes("6003")) {
        friendlyError = "Not enough liquidity in pool for this swap size.";
      } else if (err.message?.includes("PoolNotReady") || err.message?.includes("6010")) {
        friendlyError = "Pool has no liquidity available.";
      } else if (err.message?.includes("insufficient funds")) {
        friendlyError = "Insufficient token balance in your wallet.";
      } else if (err.message?.includes("User rejected")) {
        friendlyError = "Transaction was cancelled.";
      }
      
      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-gray-900 mb-2">Wallet Required</p>
        <p className="text-sm text-gray-600">Connect your wallet to start swapping tokens</p>
      </div>
    );
  }

  const inputToken = direction === "AtoB" ? "Token A" : "Token B";
  const outputToken = direction === "AtoB" ? "Token B" : "Token A";
  const buttonState = getButtonState();

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-900">Swap</h3>
      </div>

      <div className="p-6">
        {/* Success Message */}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-green-900">Swap Successful!</p>
                <a
                  href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-700 hover:text-green-800 underline break-all"
                >
                  View transaction
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && !checkingPool && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Swap Interface */}
        <div className="space-y-2">
          {/* From */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-500 uppercase">You Pay</label>
              <span className="text-xs text-gray-500">{inputToken}</span>
            </div>
            <input
              type="number"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              placeholder="0.0"
              disabled={loading || !poolExists || !poolHasLiquidity}
              className="w-full text-3xl font-semibold bg-transparent border-none outline-none placeholder-gray-300 disabled:opacity-50"
            />
          </div>

          {/* Swap Direction Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              onClick={toggleDirection}
              disabled={loading || !poolExists}
              className="p-2 bg-white border-4 border-gray-100 rounded-xl hover:border-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              title="Switch tokens"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          {/* To */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-500 uppercase">You Receive (min)</label>
              <span className="text-xs text-gray-500">{outputToken}</span>
            </div>
            <input
              type="number"
              value={minAmountOut}
              onChange={(e) => setMinAmountOut(e.target.value)}
              placeholder="0.0"
              disabled={loading || !poolExists || !poolHasLiquidity}
              className="w-full text-3xl font-semibold bg-transparent border-none outline-none placeholder-gray-300 disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 mt-2">
              Optional: Set minimum to receive
            </p>
          </div>
        </div>

        {/* Pool Status Info */}
        {checkingPool && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            <span>Checking pool status...</span>
          </div>
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={buttonState.disabled}
          className="w-full mt-4 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-lg"
        >
          {buttonState.text}
        </button>

        {/* Helper Info */}
        {poolExists && poolHasLiquidity && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              <span className="font-semibold">💡 Tip:</span> Leave minimum output empty to accept any amount. 
              Setting a minimum protects against price changes but may cause the swap to fail.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
