import { describe, it, expect } from 'vitest';
import { calculatePrintPrice } from '../lib/pricing';
import { calculateAspectRatio } from '../lib/aspect-ratio';

describe('Pricing', () => {
  it('calculates print price for small area', () => {
    const result = calculatePrintPrice({
      widthCm: 30,
      heightCm: 20,
      tier1PriceSqm: 500,
      tier2PriceSqm: 400,
      tierThresholdSqm: 0.25,
      finishSurchargePct: 0,
    });
    expect(result.printPrice).toBeGreaterThan(0);
    expect(result.total).toBe(result.printPrice + result.framePrice + result.glazingPrice);
  });
});

describe('Aspect Ratio', () => {
  it('calculates correct ratio', () => {
    expect(calculateAspectRatio(1920, 1080)).toBe('16:9');
    expect(calculateAspectRatio(100, 100)).toBe('1:1');
  });
});
