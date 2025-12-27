use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, Transfer, Burn};
use anchor_lang::solana_program::program_option::COption;
use crate::state::Pool;
use crate::error::AmmError;

pub fn remove_liquidity(
    ctx: Context<RemoveLiquidity>,
    lp_amount: u64,
) -> Result<()> {
    require!(lp_amount > 0, AmmError::ZeroLiquidity);
    
    let pool = &ctx.accounts.pool;
    let reserve_a = ctx.accounts.vault_a.amount;
    let reserve_b = ctx.accounts.vault_b.amount;
    let lp_supply = ctx.accounts.lp_mint.supply;
    
    require!(lp_supply > 0, AmmError::InsufficientLiquidity);
    require!(lp_amount <= lp_supply, AmmError::InsufficientLiquidity);
    
    // Calculate proportional amounts
    let amount_a = (lp_amount as u128)
        .checked_mul(reserve_a as u128)
        .ok_or(AmmError::MathOverflow)?
        .checked_div(lp_supply as u128)
        .ok_or(AmmError::MathOverflow)?;
    
    let amount_b = (lp_amount as u128)
        .checked_mul(reserve_b as u128)
        .ok_or(AmmError::MathOverflow)?
        .checked_div(lp_supply as u128)
        .ok_or(AmmError::MathOverflow)?;
    
    let amount_a = u64::try_from(amount_a).map_err(|_| AmmError::MathOverflow)?;
    let amount_b = u64::try_from(amount_b).map_err(|_| AmmError::MathOverflow)?;
    
    require!(amount_a > 0 && amount_b > 0, AmmError::InsufficientLiquidity);
    require!(amount_a <= reserve_a && amount_b <= reserve_b, AmmError::InsufficientLiquidity);
    
    // Burn LP tokens from user
    token::burn(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.lp_mint.to_account_info(),
                from: ctx.accounts.user_lp.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        lp_amount,
    )?;
    
    // PDA signer seeds
    let seeds = &[
        b"pool",
        pool.token_mint_a.as_ref(),
        pool.token_mint_b.as_ref(),
        &[pool.bump],
    ];
    let signer = &[&seeds[..]];
    
    // Transfer token A from vault to user
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault_a.to_account_info(),
                to: ctx.accounts.user_token_a.to_account_info(),
                authority: ctx.accounts.pool.to_account_info(),
            },
            signer,
        ),
        amount_a,
    )?;
    
    // Transfer token B from vault to user
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault_b.to_account_info(),
                to: ctx.accounts.user_token_b.to_account_info(),
                authority: ctx.accounts.pool.to_account_info(),
            },
            signer,
        ),
        amount_b,
    )?;
    
    Ok(())
}

#[derive(Accounts)]
pub struct RemoveLiquidity<'info> {
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
        address = pool.vault_a,
        constraint = vault_a.mint == pool.token_mint_a @ AmmError::InvalidVault,
        constraint = vault_a.owner == pool.key() @ AmmError::InvalidVault
    )]
    pub vault_a: Box<Account<'info, anchor_spl::token::TokenAccount>>,
    
    #[account(
        mut,
        address = pool.vault_b,
        constraint = vault_b.mint == pool.token_mint_b @ AmmError::InvalidVault,
        constraint = vault_b.owner == pool.key() @ AmmError::InvalidVault
    )]
    pub vault_b: Box<Account<'info, anchor_spl::token::TokenAccount>>,
    
    #[account(
        mut,
        address = pool.lp_mint,
        constraint = lp_mint.mint_authority == COption::Some(pool.key()) @ AmmError::InvalidLpMint
    )]
    pub lp_mint: Box<Account<'info, Mint>>,
    
    #[account(
        mut,
        constraint = user_lp.mint == pool.lp_mint,
        constraint = user_lp.owner == user.key()
    )]
    pub user_lp: Box<Account<'info, anchor_spl::token::TokenAccount>>,
    
    #[account(
        mut,
        constraint = user_token_a.mint == pool.token_mint_a,
        constraint = user_token_a.owner == user.key()
    )]
    pub user_token_a: Box<Account<'info, anchor_spl::token::TokenAccount>>,
    
    #[account(
        mut,
        constraint = user_token_b.mint == pool.token_mint_b,
        constraint = user_token_b.owner == user.key()
    )]
    pub user_token_b: Box<Account<'info, anchor_spl::token::TokenAccount>>,
    
    pub token_program: Program<'info, Token>,
}

