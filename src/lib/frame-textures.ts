export const frameTextures: Record<string, string> = {
  wood_natural: 'linear-gradient(135deg, #deb887 0%, #d2b48c 50%, #c8a882 100%)',
  wood_walnut: 'linear-gradient(135deg, #5c4033 0%, #6b4226 50%, #553d2c 100%)',
  wood_oak: 'linear-gradient(135deg, #c4a35a 0%, #b8956a 50%, #ad8a5e 100%)',
  wood_black: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
  wood_white: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 50%, #f0f0f0 100%)',
  metal_silver: 'linear-gradient(135deg, #c0c0c0 0%, #d8d8d8 50%, #a8a8a8 100%)',
  metal_gold: 'linear-gradient(135deg, #daa520 0%, #ffd700 50%, #b8860b 100%)',
  metal_black: 'linear-gradient(135deg, #2c2c2c 0%, #3d3d3d 50%, #1e1e1e 100%)',
};

export function getFrameTexture(material: string, color: string): string {
  const key = `${material}_${color}`.toLowerCase();
  return frameTextures[key] || frameTextures.wood_natural;
}
