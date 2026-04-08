interface ProductPreviewProps {
  imageUrl: string | null;
  widthCm: number;
  heightCm: number;
  hasFrame: boolean;
  frameColor?: string;
  frameWidthCm?: number;
}

export default function ProductPreview({ imageUrl, widthCm, heightCm, hasFrame, frameColor = '#000', frameWidthCm = 2 }: ProductPreviewProps) {
  if (!imageUrl) return null;

  const aspectRatio = widthCm / heightCm;
  const frameWidth = hasFrame ? frameWidthCm * 4 : 0;

  return (
    <div className="flex items-center justify-center p-8 bg-muted/30 rounded-lg">
      <div
        className="relative shadow-lg"
        style={{
          padding: frameWidth,
          backgroundColor: hasFrame ? frameColor : 'transparent',
          maxWidth: '100%',
        }}
      >
        <img
          src={imageUrl}
          alt="Print preview"
          className="block max-w-full h-auto"
          style={{ aspectRatio: String(aspectRatio), maxHeight: '400px' }}
        />
      </div>
    </div>
  );
}
