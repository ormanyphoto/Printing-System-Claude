// Standard aspect ratios to match against
const STANDARD_RATIOS = [
  { label: "1:1", value: 1 },
  { label: "2:1", value: 2 },
  { label: "1:2", value: 0.5 },
  { label: "3:1", value: 3 },
  { label: "1:3", value: 1 / 3 },
  { label: "4:1", value: 4 },
  { label: "1:4", value: 0.25 },
  { label: "3:2", value: 3 / 2 },
  { label: "2:3", value: 2 / 3 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:4", value: 3 / 4 },
  { label: "16:9", value: 16 / 9 },
  { label: "9:16", value: 9 / 16 },
  { label: "5:4", value: 5 / 4 },
  { label: "4:5", value: 4 / 5 },
];

export function detectAspectRatio(width: number, height: number): string {
  const ratio = width / height;
  let closest = STANDARD_RATIOS[0];
  let minDiff = Math.abs(ratio - closest.value);

  for (const standard of STANDARD_RATIOS) {
    const diff = Math.abs(ratio - standard.value);
    if (diff < minDiff) {
      minDiff = diff;
      closest = standard;
    }
  }

  return closest.label;
}

export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    // Try standard browser image loading first
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(objectUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      // Fallback for formats browsers can't render (e.g. TIFF)
      parseTiffDimensions(file).then(resolve).catch(() => {
        // Last resort: return a default and let the user pick ratio manually
        resolve({ width: 1, height: 1 });
      });
    };

    img.src = objectUrl;
  });
}

/** Read TIFF header to extract width/height without rendering */
async function parseTiffDimensions(file: File): Promise<{ width: number; height: number }> {
  const buffer = await file.slice(0, 65536).arrayBuffer();
  const view = new DataView(buffer);

  // Check byte order: 0x4949 = little-endian, 0x4D4D = big-endian
  const byteOrder = view.getUint16(0);
  const le = byteOrder === 0x4949;

  const magic = view.getUint16(2, le);
  if (magic !== 42) throw new Error("Not a TIFF file");

  const ifdOffset = view.getUint32(4, le);
  const numEntries = view.getUint16(ifdOffset, le);

  let width = 0;
  let height = 0;

  for (let i = 0; i < numEntries; i++) {
    const entryOffset = ifdOffset + 2 + i * 12;
    if (entryOffset + 12 > buffer.byteLength) break;

    const tag = view.getUint16(entryOffset, le);
    const type = view.getUint16(entryOffset + 2, le);
    const valueOffset = entryOffset + 8;

    const getValue = () => {
      if (type === 3) return view.getUint16(valueOffset, le); // SHORT
      if (type === 4) return view.getUint32(valueOffset, le); // LONG
      return view.getUint16(valueOffset, le);
    };

    if (tag === 256) width = getValue();   // ImageWidth
    if (tag === 257) height = getValue();  // ImageLength

    if (width && height) break;
  }

  if (!width || !height) throw new Error("Could not read TIFF dimensions");
  return { width, height };
}
