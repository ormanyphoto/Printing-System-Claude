import UTIF from "utif2";

/**
 * Convert a TIFF file to a PNG data URL for browser preview.
 * Returns null if conversion fails.
 */
export async function tiffToPreviewUrl(file: File): Promise<string | null> {
  try {
    const buffer = await file.arrayBuffer();
    const ifds = UTIF.decode(buffer);
    if (ifds.length === 0) return null;

    // Decode the first page
    UTIF.decodeImage(buffer, ifds[0]);
    const firstPage = ifds[0];
    const rgba = UTIF.toRGBA8(firstPage);

    const width = firstPage.width;
    const height = firstPage.height;

    // Draw to canvas and export as PNG
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const imageData = new ImageData(new Uint8ClampedArray(rgba.buffer as ArrayBuffer), width, height);
    ctx.putImageData(imageData, 0, 0);

    return canvas.toDataURL("image/png");
  } catch (err) {
    console.warn("TIFF preview conversion failed:", err);
    return null;
  }
}

/** Check if a file is a TIFF based on extension */
export function isTiffFile(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  return ext === "tif" || ext === "tiff";
}
