use anchor_lang::prelude::*;

/// Pool account holding AMM state and vault references
#[account]
pub struct Pool {
    /// First token mint in the pair
    pub token_mint_a: Pubkey,
    /// Second token mint in the pair
    pub token_mint_b: Pubkey,
    /// Vault holding token A reserves
    pub vault_a: Pubkey,
    /// Vault holding token B reserves
    pub vault_b: Pubkey,
    /// LP token mint for liquidity providers
    pub lp_mint: Pubkey,
    /// Trading fee in basis points (1 bps = 0.01%)
    pub fee_bps: u16,
    /// PDA bump seed
    pub bump: u8,
}

impl Pool {
    /// Space required for the Pool account
    pub const LEN: usize = 8 + 32 + 32 + 32 + 32 + 32 + 2 + 1;
}

