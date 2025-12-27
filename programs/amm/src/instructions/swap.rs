use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, Transfer};
use crate::state::Pool;
use crate::error::AmmError;
use crate::math::get_amount_out;

pub fn swap(
    ctx: Context<Swap>,
    amount_in: u64,
    minimum_amount_out: u64,
) -> Result<()> {
    require!(amount_in > 0, AmmError::ZeroLiquidity);
    
    let pool = &ctx.accounts.pool;
    
    // Determine swap direction and get reserves
    let (reserve_in, reserve_out) = if ctx.accounts.vault_input.key() == pool.vault_a {
        require!(ctx.accounts.vault_output.key() == pool.vault_b, AmmError::InvalidVault);
        require!(ctx.accounts.user_input.mint == pool.token_mint_a, AmmError::InvalidVault);
        require!(ctx.accounts.user_output.mint == pool.token_mint_b, AmmError::InvalidVault);
        (ctx.accounts.vault_input.amount, ctx.accounts.vault_output.amount)
    } else if ctx.accounts.vault_input.key() == pool.vault_b {
        require!(ctx.accounts.vault_output.key() == pool.vault_a, AmmError::InvalidVault);
        require!(ctx.accounts.user_input.mint == pool.token_mint_b, AmmError::InvalidVault);
        require!(ctx.accounts.user_output.mint == pool.token_mint_a, AmmError::InvalidVault);
        (ctx.accounts.vault_input.amount, ctx.accounts.vault_output.amount)
    } else {
        return Err(AmmError::InvalidVault.into());
    };
    
    require!(reserve_in > 0 && reserve_out > 0, AmmError::InsufficientLiquidity);
    
    // Calculate output amount with fee
    let amount_out = get_amount_out(
        amount_in,
        reserve_in,
        reserve_out,
        pool.fee_bps,
    )?;
    
    require!(amount_out >= minimum_amount_out, AmmError::SlippageExceeded);
    require!(amount_out < reserve_out, AmmError::InsufficientLiquidity);
    
    // Transfer input tokens from user to vault
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_input.to_account_info(),
                to: ctx.accounts.vault_input.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        amount_in,
    )?;
    
    // PDA signer seeds
    let seeds = &[
        b"pool",
        pool.token_mint_a.as_ref(),
        pool.token_mint_b.as_ref(),
        &[pool.bump],
    ];
    let signer = &[&seeds[..]];
    
    // Transfer output tokens from vault to user
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault_output.to_account_info(),
                to: ctx.accounts.user_output.to_account_info(),
                authority: ctx.accounts.pool.to_account_info(),
            },
            signer,
        ),
        amount_out,
    )?;
    
    Ok(())
}

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"pool", pool.token_mint_a.as_ref(), pool.token_mint_b.as_ref()],
        bump = pool.bump
    )]
    pub pool: Box<Account<'info, Pool>>,
    
    #[account(address = pool.token_mint_a)]
    pub token_mint_a: Box<Account<'info, Mint>>,
    
    #[account(address = pool.token_mint_b)]
    pub token_mint_b: Box<Account<'info, Mint>>,
    
    #[account(
        mut,
        constraint = user_input.owner == user.key()
    )]
    pub user_input: Box<Account<'info, anchor_spl::token::TokenAccount>>,
    
    #[account(
        mut,
        constraint = user_output.owner == user.key()
    )]
    pub user_output: Box<Account<'info, anchor_spl::token::TokenAccount>>,
    
    #[account(
        mut,
        constraint = vault_input.owner == pool.key() @ AmmError::InvalidVault,
        constraint = vault_input.key() == pool.vault_a || vault_input.key() == pool.vault_b @ AmmError::InvalidVault
    )]
    pub vault_input: Box<Account<'info, anchor_spl::token::TokenAccount>>,
    
    #[account(
        mut,
        constraint = vault_output.owner == pool.key() @ AmmError::InvalidVault,
        constraint = vault_output.key() == pool.vault_a || vault_output.key() == pool.vault_b @ AmmError::InvalidVault,
        constraint = vault_output.key() != vault_input.key() @ AmmError::InvalidVault
    )]
    pub vault_output: Box<Account<'info, anchor_spl::token::TokenAccount>>,
    
    pub token_program: Program<'info, Token>,
}

