import { describe, test, expect } from "bun:test";

// Re-implement math functions from programs/amm/src/math.rs

function integerSqrt(value: bigint): bigint {
  if (value === 0n) {
    return 0n;
  }

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

  const amountInWithFee = amountIn * BigInt(10_000 - feeBps);
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn * 10_000n + amountInWithFee;

  return numerator / denominator;
}

function quote(
  amountA: bigint,
  reserveA: bigint,
  reserveB: bigint
): bigint {
  if (reserveA === 0n) {
    throw new Error("InsufficientLiquidity");
  }

  return (amountA * reserveB) / reserveA;
}

describe("AMM Math - integer_sqrt", () => {
  test("sqrt(0) = 0", () => {
    const result = integerSqrt(0n);
    expect(result).toBe(0n);
    console.log("✓ sqrt(0) = 0");
  });

  test("sqrt(1) = 1", () => {
    const result = integerSqrt(1n);
    expect(result).toBe(1n);
    console.log("✓ sqrt(1) = 1");
  });

  test("sqrt(4) = 2", () => {
    const result = integerSqrt(4n);
    expect(result).toBe(2n);
    console.log("✓ sqrt(4) = 2");
  });

  test("sqrt(2) = 1 (integer)", () => {
    const result = integerSqrt(2n);
    expect(result).toBe(1n);
    console.log("✓ sqrt(2) = 1 (integer division)");
  });

  test("sqrt(10_000_000_000) = 100_000", () => {
    const result = integerSqrt(10_000_000_000n);
    expect(result).toBe(100_000n);
    console.log(`✓ sqrt(10,000,000,000) = ${result.toLocaleString()}`);
  });

  test("sqrt(1_000_000 * 2_000_000) = 1_414_213", () => {
    const input = 1_000_000n * 2_000_000n;
    const result = integerSqrt(input);
    expect(result).toBe(1_414_213n);
    console.log(`✓ sqrt(1M * 2M) = ${result.toLocaleString()}`);
  });
});

describe("AMM Math - get_amount_out", () => {
  const FEE_BPS = 30; // 0.3%

  test("basic swap: 100 in → amount out", () => {
    const amountIn = 100_000_000n; // 100 tokens
    const reserveIn = 1_000_000_000n; // 1000 tokens
    const reserveOut = 2_000_000_000n; // 2000 tokens

    const amountOut = getAmountOut(amountIn, reserveIn, reserveOut, FEE_BPS);

    expect(amountOut).toBeGreaterThan(0n);
    console.log(`✓ Swap 100 in → ${Number(amountOut) / 1_000_000} out`);
  });

  test("amount out increases with larger input", () => {
    const reserveIn = 1_000_000_000n;
    const reserveOut = 2_000_000_000n;

    const small = getAmountOut(50_000_000n, reserveIn, reserveOut, FEE_BPS);
    const large = getAmountOut(100_000_000n, reserveIn, reserveOut, FEE_BPS);

    expect(large).toBeGreaterThan(small);
    console.log(`✓ 50 in → ${small}, 100 in → ${large} (larger input = larger output)`);
  });

  test("fee reduces output amount", () => {
    const amountIn = 100_000_000n;
    const reserveIn = 1_000_000_000n;
    const reserveOut = 1_000_000_000n;

    const withFee = getAmountOut(amountIn, reserveIn, reserveOut, FEE_BPS);
    const noFee = getAmountOut(amountIn, reserveIn, reserveOut, 0);

    expect(withFee).toBeLessThan(noFee);
    console.log(`✓ With fee: ${withFee}, No fee: ${noFee}`);
  });

  test("throws error if reserve_in is zero", () => {
    expect(() => {
      getAmountOut(100_000_000n, 0n, 1_000_000_000n, FEE_BPS);
    }).toThrow("InsufficientLiquidity");
    console.log("✓ Throws error for zero reserve_in");
  });

  test("throws error if reserve_out is zero", () => {
    expect(() => {
      getAmountOut(100_000_000n, 1_000_000_000n, 0n, FEE_BPS);
    }).toThrow("InsufficientLiquidity");
    console.log("✓ Throws error for zero reserve_out");
  });

  test("large swap preserves constant product", () => {
    const amountIn = 500_000_000n; // 500 tokens
    const reserveIn = 1_000_000_000n; // 1000 tokens
    const reserveOut = 2_000_000_000n; // 2000 tokens

    const amountOut = getAmountOut(amountIn, reserveIn, reserveOut, FEE_BPS);

    const newReserveIn = reserveIn + amountIn;
    const newReserveOut = reserveOut - amountOut;

    const kBefore = reserveIn * reserveOut;
    const kAfter = newReserveIn * newReserveOut;

    expect(kAfter).toBeGreaterThan(kBefore); // K increases due to fees
    console.log(`✓ K before: ${kBefore}, K after: ${kAfter} (increases with fees)`);
  });
});

describe("AMM Math - quote", () => {
  test("quote(100, 1000, 2000) = 200", () => {
    const result = quote(100n, 1_000n, 2_000n);
    expect(result).toBe(200n);
    console.log("✓ quote(100, 1000, 2000) = 200");
  });

  test("quote maintains proportion", () => {
    const amountA = 250_000_000n; // 250 tokens
    const reserveA = 1_000_000_000n; // 1000 tokens
    const reserveB = 2_000_000_000n; // 2000 tokens

    const result = quote(amountA, reserveA, reserveB);
    const expected = (amountA * reserveB) / reserveA;

    expect(result).toBe(expected);
    console.log(`✓ quote(${amountA}, ${reserveA}, ${reserveB}) = ${result}`);
  });

  test("quote(1, 2, 4) = 2", () => {
    const result = quote(1n, 2n, 4n);
    expect(result).toBe(2n);
    console.log("✓ quote(1, 2, 4) = 2");
  });

  test("quote with equal reserves returns same amount", () => {
    const result = quote(100n, 1_000n, 1_000n);
    expect(result).toBe(100n);
    console.log("✓ quote(100, 1000, 1000) = 100 (equal reserves)");
  });

  test("throws error if reserve_a is zero", () => {
    expect(() => {
      quote(100n, 0n, 1_000n);
    }).toThrow("InsufficientLiquidity");
    console.log("✓ Throws error for zero reserve_a");
  });

  test("quote scales linearly", () => {
    const reserveA = 1_000_000_000n;
    const reserveB = 2_000_000_000n;

    const quote1 = quote(100_000_000n, reserveA, reserveB);
    const quote2 = quote(200_000_000n, reserveA, reserveB);

    expect(quote2).toBe(quote1 * 2n);
    console.log(`✓ Linear scaling: ${quote1} * 2 = ${quote2}`);
  });
});

describe("AMM Math - Integration", () => {
  test("first LP: sqrt(amount_a * amount_b)", () => {
    const amountA = 1_000_000_000n; // 1000 tokens
    const amountB = 2_000_000_000n; // 2000 tokens

    const lpTokens = integerSqrt(amountA * amountB);

    expect(lpTokens).toBe(1_414_213_562n);
    console.log(`✓ First LP receives ${lpTokens.toLocaleString()} LP tokens`);
  });

  test("swap and verify output is reasonable", () => {
    const amountIn = 100_000_000n; // 100 tokens
    const reserveIn = 1_000_000_000n; // 1000 tokens
    const reserveOut = 2_000_000_000n; // 2000 tokens

    const amountOut = getAmountOut(amountIn, reserveIn, reserveOut, 30);

    // Output should be less than proportional due to slippage + fees
    const proportional = quote(amountIn, reserveIn, reserveOut);

    expect(amountOut).toBeLessThan(proportional);
    expect(amountOut).toBeGreaterThan(0n);

    console.log(`✓ Swap output: ${Number(amountOut) / 1_000_000} (less than proportional ${Number(proportional) / 1_000_000})`);
  });

  test("round trip swap loses value due to fees", () => {
    const initial = 100_000_000n;
    let reserveA = 1_000_000_000n;
    let reserveB = 1_000_000_000n;

    // Swap A → B
    const amountB = getAmountOut(initial, reserveA, reserveB, 30);
    reserveA += initial;
    reserveB -= amountB;

    // Swap B → A
    const amountA = getAmountOut(amountB, reserveB, reserveA, 30);

    expect(amountA).toBeLessThan(initial);

    const loss = Number(initial - amountA) / Number(initial) * 100;
    console.log(`✓ Round trip: ${initial} → ${amountB} → ${amountA} (${loss.toFixed(2)}% loss due to fees)`);
  });
});

