export interface PricingInput {
  widthCm: number;
  heightCm: number;
  tier1PriceSqm: number;
  tier2PriceSqm: number;
  tierThresholdSqm: number;
  finishSurchargePct: number;
  framePerimeterCm?: number;
  framePricePerCm?: number;
  frameWidthSurchargePct?: number;
  glazingPriceSqm?: number;
  subframeSurchargePct?: number;
}

export function calculatePrintPrice(input: PricingInput): {
  printPrice: number;
  framePrice: number;
  glazingPrice: number;
  total: number;
} {
  const areaSqm = (input.widthCm * input.heightCm) / 10000;

  // Tiered pricing
  let printPrice: number;
  if (areaSqm <= input.tierThresholdSqm) {
    printPrice = areaSqm * input.tier1PriceSqm;
  } else {
    printPrice = input.tierThresholdSqm * input.tier1PriceSqm +
      (areaSqm - input.tierThresholdSqm) * input.tier2PriceSqm;
  }

  // Finish surcharge
  printPrice *= (1 + input.finishSurchargePct / 100);

  // Frame pricing
  let framePrice = 0;
  if (input.framePerimeterCm && input.framePricePerCm) {
    framePrice = input.framePerimeterCm * input.framePricePerCm;
    if (input.frameWidthSurchargePct) {
      framePrice *= (1 + input.frameWidthSurchargePct / 100);
    }
  }

  // Subframe surcharge
  if (input.subframeSurchargePct) {
    printPrice *= (1 + input.subframeSurchargePct / 100);
  }

  // Glazing pricing
  let glazingPrice = 0;
  if (input.glazingPriceSqm) {
    glazingPrice = areaSqm * input.glazingPriceSqm;
  }

  const total = printPrice + framePrice + glazingPrice;

  return { printPrice, framePrice, glazingPrice, total };
}

export function calculatePerimeter(widthCm: number, heightCm: number): number {
  return 2 * (widthCm + heightCm);
}
