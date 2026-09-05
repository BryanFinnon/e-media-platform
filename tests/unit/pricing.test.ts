import { describe, expect, it } from "vitest";
import { calculatePricing } from "@/lib/domain/pricing";

describe("calculatePricing", () => {
  it("snapshots package, add-ons, discount, tax and percentage deposit in minor units", () => {
    expect(calculatePricing({ packageAmountMinor: 100_00, addonAmountsMinor: [25_00, 5_00], discountMinor: 10_00, taxRateBasisPoints: 2000, depositRule: { type: "PERCENTAGE", percentage: 30 } })).toEqual({ subtotalMinor: 130_00, discountMinor: 10_00, taxMinor: 24_00, totalMinor: 144_00, depositMinor: 43_20, balanceMinor: 100_80, currency: "GBP" });
  });
  it("caps a fixed deposit at the total", () => { expect(calculatePricing({ packageAmountMinor: 50_00, addonAmountsMinor: [], depositRule: { type: "FIXED", amountMinor: 75_00 } }).depositMinor).toBe(50_00); });
  it("rejects an invalid percentage", () => { expect(() => calculatePricing({ packageAmountMinor: 10_00, addonAmountsMinor: [], depositRule: { type: "PERCENTAGE", percentage: 120 } })).toThrow(); });
});
