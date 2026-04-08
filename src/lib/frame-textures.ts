// Frame color selector images (product photos showing frame corners)
import frameNaturalOak from "@/assets/frame-natural-oak.avif";
import frameBlackWood from "@/assets/frame-black-wood.jpg";
import frameWhiteWood from "@/assets/frame-white-wood.jpg";
import frameBlackAluminum from "@/assets/frame-black-aluminum.jpg";
import frameSilverAluminum from "@/assets/frame-silver-aluminum.jpg";
import frameGoldAluminum from "@/assets/frame-gold-aluminum.jpg";
import frameWalnut from "@/assets/frame-walnut.jpg";

// Frame style thumbnails
import frameStyleClassicWood from "@/assets/frame-style-classic-wood.jpg";
import frameStyleModernAluminum from "@/assets/frame-style-modern-aluminum.jpg";

// Seamless tileable textures for preview rendering
import textureNaturalOak from "@/assets/texture-natural-oak.jpg";
import textureBlackWood from "@/assets/texture-black-wood.jpg";
import textureWhiteWood from "@/assets/texture-white-wood.jpg";
import textureWalnut from "@/assets/texture-walnut.jpg";

/** Map of frame_color ID → product photo for the selector button */
const FRAME_PHOTOS: Record<string, string> = {
  // Classic Wood
  "7c8ad52c-7b17-41b8-8a57-1e4d30ead017": frameBlackWood,       // Black (Classic Wood)
  "df6cb4c9-d5ee-4a46-a304-caf34e78d9be": frameNaturalOak,      // Natural Oak
  "cf3a710c-cef1-418a-9c10-176436f1caea": frameWhiteWood,       // White (Classic Wood)
  "5806b519-c84b-44ed-8622-9c890de6d2da": frameWalnut,          // American Black Walnut
  // Modern Aluminum
  "692f277d-ea57-46cb-9b89-7e4afcf934ae": frameBlackAluminum,   // Black (Modern Aluminum)
  "111d0466-b219-48b0-8b13-7e91b7aab91d": frameGoldAluminum,    // Gold
  "79d2e57b-79bf-4a19-9895-cb98ece31b23": frameSilverAluminum,  // Silver
};

/** Map of frame_color ID → seamless texture for preview rendering */
const FRAME_TEXTURES: Record<string, string> = {
  "7c8ad52c-7b17-41b8-8a57-1e4d30ead017": textureBlackWood,
  "df6cb4c9-d5ee-4a46-a304-caf34e78d9be": textureNaturalOak,
  "cf3a710c-cef1-418a-9c10-176436f1caea": textureWhiteWood,
  "5806b519-c84b-44ed-8622-9c890de6d2da": textureWalnut,
};

export function getFramePhoto(colorId: string): string | undefined {
  return FRAME_PHOTOS[colorId];
}

/** Map of frame_style ID → thumbnail for the selector button */
const FRAME_STYLE_PHOTOS: Record<string, string> = {
  "f6656213-b32e-452f-bce5-60ac8de49a0a": frameStyleClassicWood,
  "2c57acc3-6562-4d8f-a430-5b18f96e7bd8": frameStyleModernAluminum,
};

export function getFrameStylePhoto(styleId: string): string | undefined {
  return FRAME_STYLE_PHOTOS[styleId];
}

export function getFrameTexture(colorId: string): string | undefined {
  return FRAME_TEXTURES[colorId];
}
