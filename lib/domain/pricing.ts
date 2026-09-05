export type DepositRule =
  | { type: "NONE" }
  | { type: "FIXED"; amountMinor: number }
  | { type: "PERCENTAGE"; percentage: number };

export type PriceInput = {
  packageAmountMinor: number;
  addonAmountsMinor: number[];
  discountMinor?: number;
  taxRateBasisPoints?: number;
  depositRule: DepositRule;
};

export type PricingSnapshot = {
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
  depositMinor: number;
  balanceMinor: number;
  currency: "GBP";
};

const nonNegativeInteger = (value: number, label: string) => {
  if (!Number.isInteger(value) || value < 0) throw new Error(`${label} must be a non-negative integer`);
  return value;
};

export function calculatePricing(input: PriceInput): PricingSnapshot {
  const packageAmount = nonNegativeInteger(input.packageAmountMinor, "Package amount");
  const addons = input.addonAmountsMinor.reduce(
    (sum, amount) => sum + nonNegativeInteger(amount, "Add-on amount"),
    0,
  );
  const subtotalMinor = packageAmount + addons;
  const discountMinor = Math.min(nonNegativeInteger(input.discountMinor ?? 0, "Discount"), subtotalMinor);
  const taxableMinor = subtotalMinor - discountMinor;
  const rate = nonNegativeInteger(input.taxRateBasisPoints ?? 0, "Tax rate");
  const taxMinor = Math.round((taxableMinor * rate) / 10_000);
  const totalMinor = taxableMinor + taxMinor;

  let depositMinor = 0;
  if (input.depositRule.type === "FIXED") {
    depositMinor = Math.min(nonNegativeInteger(input.depositRule.amountMinor, "Deposit"), totalMinor);
  }
  if (input.depositRule.type === "PERCENTAGE") {
    if (input.depositRule.percentage < 0 || input.depositRule.percentage > 100) {
      throw new Error("Deposit percentage must be between 0 and 100");
    }
    depositMinor = Math.round(totalMinor * (input.depositRule.percentage / 100));
  }

  return {
    subtotalMinor,
    discountMinor,
    taxMinor,
    totalMinor,
    depositMinor,
    balanceMinor: totalMinor - depositMinor,
    currency: "GBP",
  };
}

export function formatMoney(amountMinor: number, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(amountMinor / 100);
}
