use anchor_lang::prelude::*;

#[error_code]
pub enum AmmError {
    #[msg("Token mints must be different")]
    IdenticalMints,
    #[msg("Token mints must be in canonical order")]
    InvalidMintOrder,
    #[msg("Liquidity amount cannot be zero")]
    ZeroLiquidity,
    #[msg("Pool has insufficient liquidity")]
    InsufficientLiquidity,
    #[msg("Slippage tolerance exceeded")]
    SlippageExceeded,
    #[msg("Math operation overflow")]
    MathOverflow,
    #[msg("Invalid vault account")]
    InvalidVault,
    #[msg("Invalid LP mint")]
    InvalidLpMint,
    #[msg("Unauthorized: only admin can perform this action")]
    Unauthorized,
    #[msg("Pool already exists for this token pair")]
    PoolAlreadyExists,
    #[msg("Pool not ready: reserves must be greater than zero")]
    PoolNotReady,
}

