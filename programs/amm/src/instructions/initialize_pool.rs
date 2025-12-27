use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use anchor_lang::solana_program::program_option::COption;
use crate::state::Pool;
use crate::error::AmmError;

pub fn initialize_pool(ctx: Context<InitializePool>) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    
    require!(
        ctx.accounts.token_mint_a.key() != ctx.accounts.token_mint_b.key(),
        AmmError::IdenticalMints
    );
    
    require!(
        ctx.accounts.token_mint_a.key() < ctx.accounts.token_mint_b.key(),
        AmmError::InvalidMintOrder
    );
    
    pool.token_mint_a = ctx.accounts.token_mint_a.key();
    pool.token_mint_b = ctx.accounts.token_mint_b.key();
    pool.vault_a = ctx.accounts.vault_a.key();
    pool.vault_b = ctx.accounts.vault_b.key();
    pool.lp_mint = ctx.accounts.lp_mint.key();
    pool.fee_bps = 30;
    pool.bump = ctx.bumps.pool;
    
    Ok(())
}

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    
    #[account(
        init,
        payer = payer,
        space = 8 + Pool::LEN,
        seeds = [b"pool", token_mint_a.key().as_ref(), token_mint_b.key().as_ref()],
        bump
    )]
    pub pool: Account<'info, Pool>,
    
    /// CHECK: We validate the mint manually
    pub token_mint_a: UncheckedAccount<'info>,
    /// CHECK: We validate the mint manually
    pub token_mint_b: UncheckedAccount<'info>,
    
    #[account(
        constraint = vault_a.mint == token_mint_a.key() @ AmmError::InvalidVault,
        constraint = vault_a.owner == pool.key() @ AmmError::InvalidVault
    )]
    pub vault_a: Account<'info, TokenAccount>,
    
    #[account(
        constraint = vault_b.mint == token_mint_b.key() @ AmmError::InvalidVault,
        constraint = vault_b.owner == pool.key() @ AmmError::InvalidVault
    )]
    pub vault_b: Account<'info, TokenAccount>,
    
    #[account(
        constraint = lp_mint.mint_authority == COption::Some(pool.key()) @ AmmError::InvalidLpMint
    )]
    pub lp_mint: Account<'info, Mint>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

