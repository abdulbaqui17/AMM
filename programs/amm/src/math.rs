use anchor_lang::prelude::*;
use crate::error::AmmError;

/// Calculate proportional amount based on reserves
pub fn quote(
    amount_a: u64,
    reserve_a: u64,
    reserve_b: u64,
) -> Result<u64> {
    require!(reserve_a > 0, AmmError::InsufficientLiquidity);
    
    let amount_b = (amount_a as u128)
        .checked_mul(reserve_b as u128)
        .ok_or(AmmError::MathOverflow)?
        .checked_div(reserve_a as u128)
        .ok_or(AmmError::MathOverflow)?;
    
    u64::try_from(amount_b).map_err(|_| AmmError::MathOverflow.into())
}

/// Calculate output amount with fee deduction using constant product formula
pub fn get_amount_out(
    amount_in: u64,
    reserve_in: u64,
    reserve_out: u64,
    fee_bps: u16,
) -> Result<u64> {
    require!(reserve_in > 0 && reserve_out > 0, AmmError::InsufficientLiquidity);
    require!(amount_in > 0, AmmError::ZeroLiquidity);
    
    let fee_complement = 10_000u128
        .checked_sub(fee_bps as u128)
        .ok_or(AmmError::MathOverflow)?;
    
    let amount_in_with_fee = (amount_in as u128)
        .checked_mul(fee_complement)
        .ok_or(AmmError::MathOverflow)?;
    
    let numerator = (reserve_out as u128)
        .checked_mul(amount_in_with_fee)
        .ok_or(AmmError::MathOverflow)?;
    
    let denominator = (reserve_in as u128)
        .checked_mul(10_000u128)
        .ok_or(AmmError::MathOverflow)?
        .checked_add(amount_in_with_fee)
        .ok_or(AmmError::MathOverflow)?;
    
    let amount_out = numerator
        .checked_div(denominator)
        .ok_or(AmmError::MathOverflow)?;
    
    u64::try_from(amount_out).map_err(|_| AmmError::MathOverflow.into())
}

/// Calculate integer square root using Newton's method
pub fn integer_sqrt(value: u128) -> u128 {
    if value == 0 {
        return 0;
    }
    
    let mut x = value;
    let mut y = (x + 1) / 2;
    
    while y < x {
        x = y;
        y = (x + value / x) / 2;
    }
    
    x
}

