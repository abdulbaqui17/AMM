import { describe, test, expect } from "bun:test";

// Math helpers from math.rs
function integerSqrt(value: bigint): bigint {
  if (value === 0n) return 0n;
  let x = value;
  let y = (value + 1n) / 2n;
  while (y < x) {
    x = y;
    y = (value / y + y) / 2n;
  }
  return x;
}

function getAmountOut(
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint,
  feeBps: number
): bigint {
  if (reserveIn === 0n || reserveOut === 0n) {
    throw new Error("InsufficientLiquidity");
  }
  if (amountIn === 0n) {
    throw new Error("ZeroLiquidity");
  }

  const amountInWithFee = amountIn * BigInt(10_000 - feeBps);
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn * 10_000n + amountInWithFee;

  return numerator / denominator;
}

function swap(
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint,
  feeBps: number,
  minAmountOut: bigint
): { amountOut: bigint; newReserveIn: bigint; newReserveOut: bigint } {
  const amountOut = getAmountOut(amountIn, reserveIn, reserveOut, feeBps);

  if (amountOut < minAmountOut) {
    throw new Error("SlippageExceeded");
  }

  const newReserveIn = reserveIn + amountIn;
  const newReserveOut = reserveOut - amountOut;

  return { amountOut, newReserveIn, newReserveOut };
}

describe("AMM Invariant Tests - Constant Product", () => {
  test("invariant preserved: simple swap increases K", () => {
    const reserveA = 1_000n;
    const reserveB = 4_000n;
    const amountIn = 100n;
    const feeBps = 30;

    const kBefore = reserveA * reserveB;
    console.log(`\nK before: ${kBefore} (${reserveA} * ${reserveB})`);

    const { newReserveIn, newReserveOut } = swap(
      amountIn,
      reserveA,
      reserveB,
      feeBps,
      1n
    );

    const kAfter = newReserveIn * newReserveOut;
    console.log(`K after: ${kAfter} (${newReserveIn} * ${newReserveOut})`);

    expect(kAfter).toBeGreaterThanOrEqual(kBefore);
    expect(kAfter).toBeGreaterThan(kBefore); // Should increase due to fees

    console.log(`✓ K increased by ${Number(kAfter - kBefore)} due to fees`);
  });

  test("invariant preserved: large swap", () => {
    const reserveA = 1_000_000n;
    const reserveB = 2_000_000n;
    const amountIn = 500_000n; // 50% of reserve
    const feeBps = 30;

    const kBefore = reserveA * reserveB;
    const { newReserveIn, newReserveOut } = swap(
      amountIn,
      reserveA,
      reserveB,
      feeBps,
      1n
    );
    const kAfter = newReserveIn * newReserveOut;

    console.log(`\nLarge swap: K before=${kBefore}, K after=${kAfter}`);
    expect(kAfter).toBeGreaterThanOrEqual(kBefore);

    console.log(`✓ K preserved with large swap`);
  });

  test("invariant preserved: multiple sequential swaps", () => {
    let reserveA = 1_000n;
    let reserveB = 2_000n;
    const feeBps = 30;

    const kInitial = reserveA * reserveB;
    console.log(`\nInitial K: ${kInitial}`);

    // Swap 1: A → B
    const swap1 = swap(100n, reserveA, reserveB, feeBps, 1n);
    reserveA = swap1.newReserveIn;
    reserveB = swap1.newReserveOut;
    const k1 = reserveA * reserveB;

    // Swap 2: A → B
    const swap2 = swap(50n, reserveA, reserveB, feeBps, 1n);
    reserveA = swap2.newReserveIn;
    reserveB = swap2.newReserveOut;
    const k2 = reserveA * reserveB;

    // Swap 3: A → B
    const swap3 = swap(25n, reserveA, reserveB, feeBps, 1n);
    reserveA = swap3.newReserveIn;
    reserveB = swap3.newReserveOut;
    const k3 = reserveA * reserveB;

    console.log(`K after swap 1: ${k1}`);
    console.log(`K after swap 2: ${k2}`);
    console.log(`K after swap 3: ${k3}`);

    expect(k1).toBeGreaterThanOrEqual(kInitial);
    expect(k2).toBeGreaterThanOrEqual(k1);
    expect(k3).toBeGreaterThanOrEqual(k2);

    console.log(`✓ K monotonically increases with each swap`);
  });

  test("invariant preserved: equal reserves", () => {
    const reserveA = 1_000n;
    const reserveB = 1_000n;
    const amountIn = 100n;
    const feeBps = 30;

    const kBefore = reserveA * reserveB;
    const { newReserveIn, newReserveOut } = swap(
      amountIn,
      reserveA,
      reserveB,
      feeBps,
      1n
    );
    const kAfter = newReserveIn * newReserveOut;

    expect(kAfter).toBeGreaterThanOrEqual(kBefore);

    console.log(`\n✓ K preserved with equal reserves`);
  });

  test("invariant preserved: different fee rates", () => {
    const reserveA = 1_000n;
    const reserveB = 4_000n;
    const amountIn = 100n;

    // Test with 0%, 0.3%, and 1% fees
    const fees = [0, 30, 100];
    let previousK = reserveA * reserveB;

    for (const feeBps of fees) {
      const { newReserveIn, newReserveOut } = swap(
        amountIn,
        reserveA,
        reserveB,
        feeBps,
        1n
      );
      const kAfter = newReserveIn * newReserveOut;

      console.log(`\nFee ${feeBps} bps: K = ${kAfter}`);
      expect(kAfter).toBeGreaterThanOrEqual(previousK);
    }

    console.log(`✓ K preserved across different fee rates`);
  });
});

describe("AMM Invariant Tests - Slippage Protection", () => {
  test("swap succeeds when output >= minimum", () => {
    const reserveA = 1_000n;
    const reserveB = 4_000n;
    const amountIn = 100n;
    const feeBps = 30;

    const expectedOut = getAmountOut(amountIn, reserveA, reserveB, feeBps);
    const minAmountOut = expectedOut - 10n; // Allow 10 token slippage

    console.log(`\nExpected output: ${expectedOut}`);
    console.log(`Minimum accepted: ${minAmountOut}`);

    const result = swap(amountIn, reserveA, reserveB, feeBps, minAmountOut);

    expect(result.amountOut).toBeGreaterThanOrEqual(minAmountOut);
    console.log(`✓ Swap succeeded with output ${result.amountOut}`);
  });

  test("swap fails when output < minimum", () => {
    const reserveA = 1_000n;
    const reserveB = 4_000n;
    const amountIn = 100n;
    const feeBps = 30;

    const expectedOut = getAmountOut(amountIn, reserveA, reserveB, feeBps);
    const minAmountOut = expectedOut + 100n; // Require 100 more than possible

    console.log(`\nExpected output: ${expectedOut}`);
    console.log(`Unrealistic minimum: ${minAmountOut}`);

    expect(() => {
      swap(amountIn, reserveA, reserveB, feeBps, minAmountOut);
    }).toThrow("SlippageExceeded");

    console.log(`✓ Swap rejected due to slippage`);
  });

  test("slippage protection with exact amount", () => {
    const reserveA = 1_000n;
    const reserveB = 4_000n;
    const amountIn = 100n;
    const feeBps = 30;

    const expectedOut = getAmountOut(amountIn, reserveA, reserveB, feeBps);
    const minAmountOut = expectedOut; // Exact match

    console.log(`\nRequiring exact output: ${expectedOut}`);

    const result = swap(amountIn, reserveA, reserveB, feeBps, minAmountOut);

    expect(result.amountOut).toBe(expectedOut);
    console.log(`✓ Swap succeeded with exact output`);
  });

  test("slippage protection with zero tolerance", () => {
    const reserveA = 1_000n;
    const reserveB = 4_000n;
    const amountIn = 100n;
    const feeBps = 30;

    const expectedOut = getAmountOut(amountIn, reserveA, reserveB, feeBps);

    // Require even 1 token more than possible
    expect(() => {
      swap(amountIn, reserveA, reserveB, feeBps, expectedOut + 1n);
    }).toThrow("SlippageExceeded");

    console.log(`\n✓ Zero slippage tolerance enforced`);
  });
});

describe("AMM Invariant Tests - Edge Cases", () => {
  test("rejects zero input amount", () => {
    const reserveA = 1_000n;
    const reserveB = 4_000n;
    const feeBps = 30;

    expect(() => {
      getAmountOut(0n, reserveA, reserveB, feeBps);
    }).toThrow("ZeroLiquidity");

    console.log(`\n✓ Zero input rejected`);
  });

  test("rejects zero reserve_in", () => {
    const reserveB = 4_000n;
    const amountIn = 100n;
    const feeBps = 30;

    expect(() => {
      getAmountOut(amountIn, 0n, reserveB, feeBps);
    }).toThrow("InsufficientLiquidity");

    console.log(`✓ Zero reserve_in rejected`);
  });

  test("rejects zero reserve_out", () => {
    const reserveA = 1_000n;
    const amountIn = 100n;
    const feeBps = 30;

    expect(() => {
      getAmountOut(amountIn, reserveA, 0n, feeBps);
    }).toThrow("InsufficientLiquidity");

    console.log(`✓ Zero reserve_out rejected`);
  });

  test("rejects both reserves zero", () => {
    const amountIn = 100n;
    const feeBps = 30;

    expect(() => {
      getAmountOut(amountIn, 0n, 0n, feeBps);
    }).toThrow("InsufficientLiquidity");

    console.log(`✓ Both zero reserves rejected`);
  });

  test("handles very small amounts", () => {
    const reserveA = 1_000_000n;
    const reserveB = 1_000_000n;
    const amountIn = 1n; // Minimum input
    const feeBps = 30;

    const amountOut = getAmountOut(amountIn, reserveA, reserveB, feeBps);

    console.log(`\nMin input (1): output = ${amountOut}`);
    expect(amountOut).toBeGreaterThanOrEqual(0n);

    console.log(`✓ Handles minimum input`);
  });

  test("handles very large amounts without overflow", () => {
    const reserveA = 1_000_000_000_000n; // 1 trillion
    const reserveB = 1_000_000_000_000n;
    const amountIn = 100_000_000_000n; // 100 billion
    const feeBps = 30;

    const kBefore = reserveA * reserveB;
    const { newReserveIn, newReserveOut } = swap(
      amountIn,
      reserveA,
      reserveB,
      feeBps,
      1n
    );
    const kAfter = newReserveIn * newReserveOut;

    console.log(`\nLarge numbers: K before=${kBefore}`);
    console.log(`K after=${kAfter}`);

    expect(kAfter).toBeGreaterThanOrEqual(kBefore);

    console.log(`✓ Large amounts handled safely`);
  });

  test("output cannot exceed reserve", () => {
    const reserveA = 1_000n;
    const reserveB = 100n;
    const amountIn = 10_000n; // Much larger than reserve
    const feeBps = 30;

    const amountOut = getAmountOut(amountIn, reserveA, reserveB, feeBps);

    console.log(`\nLarge input: ${amountIn}, Reserve out: ${reserveB}`);
    console.log(`Output: ${amountOut}`);

    expect(amountOut).toBeLessThan(reserveB);

    console.log(`✓ Output cannot exceed reserve`);
  });

  test("extreme ratio: 1:1000000", () => {
    const reserveA = 1_000n;
    const reserveB = 1_000_000n;
    const amountIn = 100n;
    const feeBps = 30;

    const kBefore = reserveA * reserveB;
    const { newReserveIn, newReserveOut } = swap(
      amountIn,
      reserveA,
      reserveB,
      feeBps,
      1n
    );
    const kAfter = newReserveIn * newReserveOut;

    expect(kAfter).toBeGreaterThanOrEqual(kBefore);

    console.log(`\n✓ Extreme ratio handled correctly`);
  });
});

describe("AMM Invariant Tests - Fee Mechanics", () => {
  test("zero fee: output equals proportional amount", () => {
    const reserveA = 1_000n;
    const reserveB = 1_000n;
    const amountIn = 100n;
    const feeBps = 0; // No fee

    const amountOut = getAmountOut(amountIn, reserveA, reserveB, feeBps);

    // With no fee and equal reserves, output should be close to input
    console.log(`\nZero fee: input=${amountIn}, output=${amountOut}`);

    // (1000 * 100 * 1000) / (1000 * 10000 + 100 * 10000) = 90.909...
    expect(amountOut).toBe(90n);

    console.log(`✓ Zero fee calculation correct`);
  });

  test("higher fee reduces output", () => {
    const reserveA = 10_000n;
    const reserveB = 10_000n;
    const amountIn = 1_000n;

    const out0 = getAmountOut(amountIn, reserveA, reserveB, 0);
    const out30 = getAmountOut(amountIn, reserveA, reserveB, 30);
    const out100 = getAmountOut(amountIn, reserveA, reserveB, 100);

    console.log(`\n0 bps fee: ${out0}`);
    console.log(`30 bps fee: ${out30}`);
    console.log(`100 bps fee: ${out100}`);

    expect(out30).toBeLessThan(out0);
    expect(out100).toBeLessThan(out30);

    console.log(`✓ Higher fee reduces output`);
  });

  test("fee accumulates in reserves", () => {
    const reserveA = 1_000n;
    const reserveB = 4_000n;
    const amountIn = 100n;
    const feeBps = 30;

    const kBefore = reserveA * reserveB;
    const { newReserveIn, newReserveOut } = swap(
      amountIn,
      reserveA,
      reserveB,
      feeBps,
      1n
    );
    const kAfter = newReserveIn * newReserveOut;

    const feeAccumulated = kAfter - kBefore;

    console.log(`\nFee accumulated in K: ${feeAccumulated}`);
    console.log(`Percentage increase: ${Number(feeAccumulated * 10000n / kBefore) / 100}%`);

    expect(feeAccumulated).toBeGreaterThan(0n);

    console.log(`✓ Fee accumulates in pool`);
  });
});

describe("AMM Invariant Tests - Price Impact", () => {
  test("larger swaps have larger price impact", () => {
    const reserveA = 10_000n;
    const reserveB = 10_000n;
    const feeBps = 30;

    const small = getAmountOut(100n, reserveA, reserveB, feeBps);
    const medium = getAmountOut(1_000n, reserveA, reserveB, feeBps);
    const large = getAmountOut(5_000n, reserveA, reserveB, feeBps);

    // Calculate price (how much output per unit input)
    const priceSmall = Number(small * 1000n) / 100;
    const priceMedium = Number(medium * 1000n) / 1_000;
    const priceLarge = Number(large * 1000n) / 5_000;

    console.log(`\nSmall swap price: ${priceSmall.toFixed(2)}`);
    console.log(`Medium swap price: ${priceMedium.toFixed(2)}`);
    console.log(`Large swap price: ${priceLarge.toFixed(2)}`);

    expect(priceMedium).toBeLessThan(priceSmall);
    expect(priceLarge).toBeLessThan(priceMedium);

    console.log(`✓ Price impact increases with swap size`);
  });

  test("swap cannot drain entire reserve", () => {
    const reserveA = 1_000n;
    const reserveB = 1_000n;
    const amountIn = 999_999n; // Massive input
    const feeBps = 30;

    const amountOut = getAmountOut(amountIn, reserveA, reserveB, feeBps);

    console.log(`\nMassive input: ${amountIn}`);
    console.log(`Reserve: ${reserveB}`);
    console.log(`Output: ${amountOut}`);

    expect(amountOut).toBeLessThan(reserveB);

    console.log(`✓ Cannot drain entire reserve`);
  });
});

