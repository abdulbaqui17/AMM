"use client";

import { useState, useEffect } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PROGRAM_ID, DEPLOYED_PROGRAM_ID, verifyProgramDeployment } from "@/lib";

/**
 * Optional component to verify program deployment status
 * Displays a non-blocking warning if there are any mismatches
 */
export function ProgramStatus() {
  const { connection } = useConnection();
  const [verified, setVerified] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    async function checkProgram() {
      setChecking(true);
      const isValid = await verifyProgramDeployment(connection);
      setVerified(isValid);
      setChecking(false);
    }

    checkProgram();
  }, [connection]);

  // IDL mismatch detected
  const idlMismatch = PROGRAM_ID.toBase58() !== DEPLOYED_PROGRAM_ID;

  if (checking) {
    return (
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-blue-700">Verifying program deployment...</p>
        </div>
      </div>
    );
  }

  // Show warning if IDL doesn't match or program not verified
  if (idlMismatch || verified === false) {
    return (
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-2">
          <svg
            className="w-4 h-4 text-yellow-600 mt-0.5"
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
          <div className="flex-1">
            <p className="text-xs font-semibold text-yellow-900">
              {idlMismatch ? "Program ID Mismatch" : "Program Verification Failed"}
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              {idlMismatch
                ? `Expected: ${DEPLOYED_PROGRAM_ID}, IDL: ${PROGRAM_ID.toBase58()}`
                : "Unable to verify program on-chain. Check connection."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show success if everything is OK
  if (verified === true) {
    return (
      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-green-600"
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
          <p className="text-xs text-green-700 font-mono">
            Program verified: {PROGRAM_ID.toBase58()}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
