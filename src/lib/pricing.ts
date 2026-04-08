export interface PriceTier {
  tier1_price_sqm: number;
  tier2_price_sqm: number;
  tier_threshold_sqm: number;
}

export function calculatePrice(
  widthCm: number,
  heightCm: number,
  priceTier: PriceTier,
  surchargePercent: number = 0
): number {
  const areaSqm = (widthCm * heightCm) / 10000;
  const pricePerSqm =
    areaSqm <= priceTier.tier_threshold_sqm
      ? priceTier.tier1_price_sqm
      : priceTier.tier2_price_sqm;
  const basePrice = areaSqm * pricePerSqm;
  const finalPrice = basePrice * (1 + surchargePercent / 100);
  return Math.round(finalPrice);
}

export function formatILS(amount: number): string {
  return `₪${amount.toLocaleString("en-IL")}`;
}
