export async function generateTiffPreview(file: File): Promise<string | null> {
  // TIFF files can't be displayed natively in browsers
  // This is a placeholder for a proper TIFF decoder library (e.g., UTIF.js)
  // For now, return a placeholder
  if (file.type === 'image/tiff' || file.name.toLowerCase().endsWith('.tiff') || file.name.toLowerCase().endsWith('.tif')) {
    return '/placeholder.svg';
  }
  return URL.createObjectURL(file);
}

export function isTiffFile(file: File): boolean {
  return file.type === 'image/tiff' ||
    file.name.toLowerCase().endsWith('.tiff') ||
    file.name.toLowerCase().endsWith('.tif');
}
