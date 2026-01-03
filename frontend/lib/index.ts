// Anchor client setup
export { 
  getProvider, 
  getAmmProgram, 
  getPoolAddress, 
  verifyProgramDeployment,
  PROGRAM_ID,
  DEPLOYED_PROGRAM_ID 
} from "./anchor";
export type { AmmProgram } from "./anchor";

// React hooks
export { useAmmProgram } from "./useAmmProgram";
export { useIsAdmin } from "./useIsAdmin";

// IDL
export { default as ammIdl } from "./amm.json";

