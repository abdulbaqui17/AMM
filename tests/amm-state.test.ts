import { describe, test, expect } from "bun:test";

// Re-implement integer_sqrt from math.rs
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

// Simulated AMM state
class AmmState {
  reserveA: bigint = 0n;
  reserveB: bigint = 0n;
  totalLpSupply: bigint = 0n;
  userLpBalances: Map<string, bigint> = new Map();

  constructor() {}

  addLiquidity(user: string, amountA: bigint, amountB: bigint): bigint {
    if (this.totalLpSupply === 0n) {
      // First liquidity provider
      const lpMinted = integerSqrt(amountA * amountB);
      
      this.reserveA = amountA;
      this.reserveB = amountB;
      this.totalLpSupply = lpMinted;
      this.userLpBalances.set(user, lpMinted);
      
      return lpMinted;
    } else {
      // Subsequent liquidity providers
      const lpFromA = (amountA * this.totalLpSupply) / this.reserveA;
      const lpFromB = (amountB * this.totalLpSupply) / this.reserveB;
      const lpMinted = lpFromA < lpFromB ? lpFromA : lpFromB;

      // Calculate actual amounts deposited
      const actualAmountA = (lpMinted * this.reserveA) / this.totalLpSupply;
      const actualAmountB = (lpMinted * this.reserveB) / this.totalLpSupply;

      this.reserveA += actualAmountA;
      this.reserveB += actualAmountB;
      this.totalLpSupply += lpMinted;
      
      const currentBalance = this.userLpBalances.get(user) || 0n;
      this.userLpBalances.set(user, currentBalance + lpMinted);
      
      return lpMinted;
    }
  }

  removeLiquidity(user: string, lpAmount: bigint): { amountA: bigint; amountB: bigint } {
    const userBalance = this.userLpBalances.get(user) || 0n;
    if (lpAmount > userBalance) {
      throw new Error("InsufficientLpBalance");
    }
    if (this.totalLpSupply === 0n) {
      throw new Error("InsufficientLiquidity");
    }

    const amountA = (lpAmount * this.reserveA) / this.totalLpSupply;
    const amountB = (lpAmount * this.reserveB) / this.totalLpSupply;

    this.reserveA -= amountA;
    this.reserveB -= amountB;
    this.totalLpSupply -= lpAmount;
    this.userLpBalances.set(user, userBalance - lpAmount);

    return { amountA, amountB };
  }

  getState() {
    return {
      reserveA: this.reserveA,
      reserveB: this.reserveB,
      totalLpSupply: this.totalLpSupply,
    };
  }

  getUserLpBalance(user: string): bigint {
    return this.userLpBalances.get(user) || 0n;
  }
}

describe("AMM State Transitions - First Liquidity Provider", () => {
  test("initial state is empty", () => {
    const amm = new AmmState();
    const state = amm.getState();

    expect(state.reserveA).toBe(0n);
    expect(state.reserveB).toBe(0n);
    expect(state.totalLpSupply).toBe(0n);

    console.log("✓ Initial state: reserves=0, lp_supply=0");
  });

  test("add first liquidity: 1000 A, 4000 B", () => {
    const amm = new AmmState();
    const amountA = 1_000n;
    const amountB = 4_000n;

    console.log(`\nBefore: reserve_a=${amm.reserveA}, reserve_b=${amm.reserveB}, lp_supply=${amm.totalLpSupply}`);

    const lpMinted = amm.addLiquidity("alice", amountA, amountB);
    const expectedLp = integerSqrt(amountA * amountB);

    console.log(`After: reserve_a=${amm.reserveA}, reserve_b=${amm.reserveB}, lp_supply=${amm.totalLpSupply}`);
    console.log(`LP minted: ${lpMinted} (expected: ${expectedLp})`);

    expect(lpMinted).toBe(expectedLp);
    expect(lpMinted).toBe(2_000n); // sqrt(1000 * 4000) = 2000
    expect(amm.reserveA).toBe(amountA);
    expect(amm.reserveB).toBe(amountB);
    expect(amm.totalLpSupply).toBe(lpMinted);
    expect(amm.getUserLpBalance("alice")).toBe(lpMinted);

    console.log("✓ First LP: sqrt(1000 * 4000) = 2000 LP tokens");
  });

  test("add first liquidity: 1_000_000 A, 2_000_000 B", () => {
    const amm = new AmmState();
    const amountA = 1_000_000n;
    const amountB = 2_000_000n;

    console.log(`\nBefore: reserve_a=${amm.reserveA}, reserve_b=${amm.reserveB}, lp_supply=${amm.totalLpSupply}`);

    const lpMinted = amm.addLiquidity("alice", amountA, amountB);
    const expectedLp = integerSqrt(amountA * amountB);

    console.log(`After: reserve_a=${amm.reserveA}, reserve_b=${amm.reserveB}, lp_supply=${amm.totalLpSupply}`);
    console.log(`LP minted: ${lpMinted} (expected: ${expectedLp})`);

    expect(lpMinted).toBe(expectedLp);
    expect(lpMinted).toBe(1_414_213n); // sqrt(1M * 2M)
    expect(amm.reserveA).toBe(amountA);
    expect(amm.reserveB).toBe(amountB);
    expect(amm.totalLpSupply).toBe(lpMinted);

    console.log("✓ First LP: sqrt(1M * 2M) = 1,414,213 LP tokens");
  });
});

describe("AMM State Transitions - Second Liquidity Provider", () => {
  test("add proportional liquidity (exact ratio)", () => {
    const amm = new AmmState();
    
    // First LP
    amm.addLiquidity("alice", 1_000n, 4_000n);
    console.log(`\nAfter first LP: reserve_a=${amm.reserveA}, reserve_b=${amm.reserveB}, lp_supply=${amm.totalLpSupply}`);

    // Second LP adds proportional liquidity
    const stateBefore = amm.getState();
    const lpMinted = amm.addLiquidity("bob", 500n, 2_000n);

    console.log(`After second LP: reserve_a=${amm.reserveA}, reserve_b=${amm.reserveB}, lp_supply=${amm.totalLpSupply}`);
    console.log(`LP minted to bob: ${lpMinted}`);

    // Bob should get 1000 LP (half of what alice got)
    expect(lpMinted).toBe(1_000n);
    expect(amm.reserveA).toBe(1_500n);
    expect(amm.reserveB).toBe(6_000n);
    expect(amm.totalLpSupply).toBe(3_000n);
    expect(amm.getUserLpBalance("alice")).toBe(2_000n);
    expect(amm.getUserLpBalance("bob")).toBe(1_000n);

    console.log("✓ Second LP gets proportional LP tokens");
  });

  test("add non-proportional liquidity uses min() formula", () => {
    const amm = new AmmState();
    
    // First LP: 1000 A, 4000 B (ratio 1:4)
    amm.addLiquidity("alice", 1_000n, 4_000n);
    console.log(`\nAfter first LP: reserve_a=${amm.reserveA}, reserve_b=${amm.reserveB}, lp_supply=${amm.totalLpSupply}`);

    // Second LP provides more A than needed
    const lpMinted = amm.addLiquidity("bob", 600n, 2_000n);

    console.log(`After second LP: reserve_a=${amm.reserveA}, reserve_b=${amm.reserveB}, lp_supply=${amm.totalLpSupply}`);
    console.log(`LP minted to bob: ${lpMinted}`);

    // min(600 * 2000 / 1000, 2000 * 2000 / 4000) = min(1200, 1000) = 1000
    expect(lpMinted).toBe(1_000n);
    expect(amm.totalLpSupply).toBe(3_000n);
    expect(amm.getUserLpBalance("bob")).toBe(1_000n);

    console.log("✓ Non-proportional LP uses min() formula");
  });

  test("multiple LPs accumulate correctly", () => {
    const amm = new AmmState();
    
    const lp1 = amm.addLiquidity("alice", 1_000n, 4_000n);
    const lp2 = amm.addLiquidity("bob", 500n, 2_000n);
    const lp3 = amm.addLiquidity("charlie", 250n, 1_000n);

    console.log(`\nFinal state: reserve_a=${amm.reserveA}, reserve_b=${amm.reserveB}, lp_supply=${amm.totalLpSupply}`);
    console.log(`Alice LP: ${lp1}, Bob LP: ${lp2}, Charlie LP: ${lp3}`);

    expect(amm.totalLpSupply).toBe(lp1 + lp2 + lp3);
    expect(amm.reserveA).toBe(1_750n);
    expect(amm.reserveB).toBe(7_000n);

    console.log("✓ Multiple LPs accumulate correctly");
  });
});

describe("AMM State Transitions - Remove Liquidity", () => {
  test("remove all liquidity returns all reserves", () => {
    const amm = new AmmState();
    
    // Add liquidity
    const lpMinted = amm.addLiquidity("alice", 1_000n, 4_000n);
    console.log(`\nAfter add: reserve_a=${amm.reserveA}, reserve_b=${amm.reserveB}, lp_supply=${amm.totalLpSupply}`);

    // Remove all
    const { amountA, amountB } = amm.removeLiquidity("alice", lpMinted);

    console.log(`After remove: reserve_a=${amm.reserveA}, reserve_b=${amm.reserveB}, lp_supply=${amm.totalLpSupply}`);
    console.log(`Returned: ${amountA} A, ${amountB} B`);

    expect(amountA).toBe(1_000n);
    expect(amountB).toBe(4_000n);
    expect(amm.reserveA).toBe(0n);
    expect(amm.reserveB).toBe(0n);
    expect(amm.totalLpSupply).toBe(0n);
    expect(amm.getUserLpBalance("alice")).toBe(0n);

    console.log("✓ Remove all LP returns all reserves");
  });

  test("remove half liquidity returns proportional reserves", () => {
    const amm = new AmmState();
    
    // Add liquidity
    const lpMinted = amm.addLiquidity("alice", 1_000n, 4_000n);
    console.log(`\nAfter add: reserve_a=${amm.reserveA}, reserve_b=${amm.reserveB}, lp_supply=${amm.totalLpSupply}`);

    // Remove half
    const halfLp = lpMinted / 2n;
    const { amountA, amountB } = amm.removeLiquidity("alice", halfLp);

    console.log(`After remove half: reserve_a=${amm.reserveA}, reserve_b=${amm.reserveB}, lp_supply=${amm.totalLpSupply}`);
    console.log(`Returned: ${amountA} A, ${amountB} B`);

    expect(amountA).toBe(500n);
    expect(amountB).toBe(2_000n);
    expect(amm.reserveA).toBe(500n);
    expect(amm.reserveB).toBe(2_000n);
    expect(amm.totalLpSupply).toBe(lpMinted - halfLp);
    expect(amm.getUserLpBalance("alice")).toBe(halfLp);

    console.log("✓ Remove half LP returns proportional reserves");
  });

  test("multiple users can remove independently", () => {
    const amm = new AmmState();
    
    // Two LPs
    amm.addLiquidity("alice", 1_000n, 4_000n);
    amm.addLiquidity("bob", 500n, 2_000n);

    console.log(`\nBefore removals: reserve_a=${amm.reserveA}, reserve_b=${amm.reserveB}, lp_supply=${amm.totalLpSupply}`);
    const aliceLp = amm.getUserLpBalance("alice");
    const bobLp = amm.getUserLpBalance("bob");
    console.log(`Alice LP: ${aliceLp}, Bob LP: ${bobLp}`);

    // Bob removes all his liquidity
    const { amountA: bobA, amountB: bobB } = amm.removeLiquidity("bob", bobLp);

    console.log(`\nAfter Bob removes: reserve_a=${amm.reserveA}, reserve_b=${amm.reserveB}, lp_supply=${amm.totalLpSupply}`);
    console.log(`Bob received: ${bobA} A, ${bobB} B`);

    expect(bobA).toBe(500n);
    expect(bobB).toBe(2_000n);
    expect(amm.getUserLpBalance("bob")).toBe(0n);
    expect(amm.getUserLpBalance("alice")).toBe(aliceLp); // Alice unaffected
    expect(amm.totalLpSupply).toBe(aliceLp);

    // Alice removes half
    const halfAlice = aliceLp / 2n;
    const { amountA: aliceA, amountB: aliceB } = amm.removeLiquidity("alice", halfAlice);

    console.log(`After Alice removes half: reserve_a=${amm.reserveA}, reserve_b=${amm.reserveB}, lp_supply=${amm.totalLpSupply}`);
    console.log(`Alice received: ${aliceA} A, ${aliceB} B`);

    expect(amm.getUserLpBalance("alice")).toBe(halfAlice);
    expect(amm.totalLpSupply).toBe(halfAlice);

    console.log("✓ Multiple users can remove independently");
  });

  test("cannot remove more LP than owned", () => {
    const amm = new AmmState();
    
    amm.addLiquidity("alice", 1_000n, 4_000n);
    const aliceLp = amm.getUserLpBalance("alice");

    expect(() => {
      amm.removeLiquidity("alice", aliceLp + 1n);
    }).toThrow("InsufficientLpBalance");

    console.log("✓ Cannot remove more LP than owned");
  });

  test("cannot remove from empty pool", () => {
    const amm = new AmmState();

    expect(() => {
      amm.removeLiquidity("alice", 100n);
    }).toThrow("InsufficientLpBalance");

    console.log("✓ Cannot remove from empty pool");
  });
});

describe("AMM State Transitions - Complex Scenarios", () => {
  test("add → remove → add preserves correctness", () => {
    const amm = new AmmState();
    
    // Add
    const lp1 = amm.addLiquidity("alice", 1_000n, 4_000n);
    console.log(`\nAfter first add: ${amm.getState().reserveA}, ${amm.getState().reserveB}, LP=${lp1}`);

    // Remove half
    amm.removeLiquidity("alice", lp1 / 2n);
    console.log(`After remove half: ${amm.getState().reserveA}, ${amm.getState().reserveB}`);

    // Add again
    const lp2 = amm.addLiquidity("bob", 500n, 2_000n);
    console.log(`After second add: ${amm.getState().reserveA}, ${amm.getState().reserveB}, LP=${lp2}`);

    expect(amm.reserveA).toBe(1_000n);
    expect(amm.reserveB).toBe(4_000n);
    expect(amm.totalLpSupply).toBe(lp1 / 2n + lp2);

    console.log("✓ Add → Remove → Add preserves correctness");
  });

  test("proportions maintained after multiple operations", () => {
    const amm = new AmmState();
    
    // Initial ratio 1:4
    amm.addLiquidity("alice", 1_000n, 4_000n);
    
    // Add proportional
    amm.addLiquidity("bob", 500n, 2_000n);
    
    // Remove some
    const bobLp = amm.getUserLpBalance("bob");
    amm.removeLiquidity("bob", bobLp / 2n);
    
    // Add more proportional
    amm.addLiquidity("charlie", 250n, 1_000n);

    const state = amm.getState();
    const ratio = Number(state.reserveB) / Number(state.reserveA);

    console.log(`\nFinal state: reserve_a=${state.reserveA}, reserve_b=${state.reserveB}`);
    console.log(`Ratio B/A: ${ratio.toFixed(2)} (should be ~4.0)`);

    expect(ratio).toBeCloseTo(4.0, 0.01);

    console.log("✓ Proportions maintained after multiple operations");
  });

  test("large numbers don't overflow", () => {
    const amm = new AmmState();
    
    const largeAmount = 1_000_000_000n; // 1 billion
    const lpMinted = amm.addLiquidity("whale", largeAmount, largeAmount * 2n);

    console.log(`\nLarge add: reserve_a=${amm.reserveA}, reserve_b=${amm.reserveB}`);
    console.log(`LP minted: ${lpMinted}`);

    expect(lpMinted).toBeGreaterThan(0n);
    expect(amm.reserveA).toBe(largeAmount);
    expect(amm.reserveB).toBe(largeAmount * 2n);

    const { amountA, amountB } = amm.removeLiquidity("whale", lpMinted);
    
    expect(amountA).toBe(largeAmount);
    expect(amountB).toBe(largeAmount * 2n);

    console.log("✓ Large numbers handled correctly");
  });
});

