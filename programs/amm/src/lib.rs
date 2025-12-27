use anchor_lang::prelude::*;

declare_id!("GusCwDKH6aEkejKcGKDoVpRaeYPBRHwxn1k5kGFK4Guu");

pub mod state;
pub mod error;
pub mod math;
pub mod instructions;

use instructions::*;

#[program]
pub mod amm {
    use super::*;

    pub fn initialize_pool(ctx: Context<InitializePool>) -> Result<()> {
        instructions::initialize_pool::initialize_pool(ctx)
    }

    pub fn add_liquidity(
        ctx: Context<AddLiquidity>,
        amount_a: u64,
        amount_b: u64,
        min_lp_tokens: u64,
    ) -> Result<()> {
        instructions::add_liquidity::add_liquidity(ctx, amount_a, amount_b, min_lp_tokens)
    }

    pub fn remove_liquidity(
        ctx: Context<RemoveLiquidity>,
        lp_amount: u64,
    ) -> Result<()> {
        instructions::remove_liquidity::remove_liquidity(ctx, lp_amount)
    }

    pub fn swap(
        ctx: Context<Swap>,
        amount_in: u64,
        minimum_amount_out: u64,
    ) -> Result<()> {
        instructions::swap::swap(ctx, amount_in, minimum_amount_out)
    }
}

