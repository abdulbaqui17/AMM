use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, Transfer, MintTo};
use anchor_lang::solana_program::program_option::COption;
use crate::state::Pool;
use crate::error::AmmError;
use crate::math::integer_sqrt;

pub fn add_liquidity(
    ctx: Context<AddLiquidity>,
    amount_a: u64,
    amount_b: u64,
    min_lp_tokens: u64,
) -> Result<()> {
    require!(amount_a > 0 && amount_b > 0, AmmError::ZeroLiquidity);
    
    let pool = &ctx.accounts.pool;
    let reserve_a = ctx.accounts.vault_a.amount;
    let reserve_b = ctx.accounts.vault_b.amount;
    let lp_supply = ctx.accounts.lp_mint.supply;
    
    let lp_tokens = if lp_supply == 0 {
        // First liquidity provision
        let liquidity = integer_sqrt((amount_a as u128).checked_mul(amount_b as u128).ok_or(AmmError::MathOverflow)?);
        let lp = u64::try_from(liquidity).map_err(|_| AmmError::MathOverflow)?;
        require!(lp > 0, AmmError::ZeroLiquidity);
        lp
    } else {
        // Subsequent liquidity provision - proportional to existing reserves
        let lp_a = (amount_a as u128)
            .checked_mul(lp_supply as u128)
            .ok_or(AmmError::MathOverflow)?
            .checked_div(reserve_a as u128)
            .ok_or(AmmError::MathOverflow)?;
        
        let lp_b = (amount_b as u128)
            .checked_mul(lp_supply as u128)
            .ok_or(AmmError::MathOverflow)?
            .checked_div(reserve_b as u128)
            .ok_or(AmmError::MathOverflow)?;
        
        let lp = lp_a.min(lp_b);
        u64::try_from(lp).map_err(|_| AmmError::MathOverflow)?
    };
    
    require!(lp_tokens >= min_lp_tokens, AmmError::SlippageExceeded);
    
    // Transfer token A from user to vault
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token_a.to_account_info(),
                to: ctx.accounts.vault_a.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        amount_a,
    )?;
    
    // Transfer token B from user to vault
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token_b.to_account_info(),
                to: ctx.accounts.vault_b.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        amount_b,
    )?;
    
    // Mint LP tokens to user
    let seeds = &[
        b"pool",
        pool.token_mint_a.as_ref(),
        pool.token_mint_b.as_ref(),
        &[pool.bump],
    ];
    let signer = &[&seeds[..]];
    
    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.lp_mint.to_account_info(),
                to: ctx.accounts.user_lp.to_account_info(),
                authority: ctx.accounts.pool.to_account_info(),
            },
            signer,
        ),
        lp_tokens,
    )?;
    
    Ok(())
}

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
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
    
    #[account(
        mut,
        constraint = user_lp.mint == pool.lp_mint,
        constraint = user_lp.owner == user.key()
    )]
    pub user_lp: Box<Account<'info, anchor_spl::token::TokenAccount>>,
    
    pub token_program: Program<'info, Token>,
}

