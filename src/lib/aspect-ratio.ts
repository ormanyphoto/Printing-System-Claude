function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function calculateAspectRatio(width: number, height: number): string {
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
}

export function parseAspectRatio(ratio: string): { w: number; h: number } | null {
  const parts = ratio.split(':');
  if (parts.length !== 2) return null;
  const w = parseInt(parts[0], 10);
  const h = parseInt(parts[1], 10);
  if (isNaN(w) || isNaN(h)) return null;
  return { w, h };
}

export function fitToAspectRatio(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const ratio = width / height;
  let newWidth = maxWidth;
  let newHeight = maxWidth / ratio;
  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = maxHeight * ratio;
  }
  return { width: Math.round(newWidth), height: Math.round(newHeight) };
}
