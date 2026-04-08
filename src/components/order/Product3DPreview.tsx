import { Suspense } from 'react';

interface Product3DPreviewProps {
  imageUrl: string | null;
  widthCm: number;
  heightCm: number;
  depthCm: number;
  hasFrame: boolean;
}

export default function Product3DPreview({ imageUrl, widthCm, heightCm, depthCm, hasFrame }: Product3DPreviewProps) {
  if (!imageUrl) return null;

  // 3D preview placeholder - full Three.js implementation would go here
  return (
    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-8 text-center">
      <div className="relative mx-auto" style={{ maxWidth: 300, perspective: '800px' }}>
        <div
          className="shadow-2xl transition-transform hover:rotate-y-6"
          style={{
            transform: 'rotateY(-15deg) rotateX(5deg)',
            transformStyle: 'preserve-3d',
          }}
        >
          <img
            src={imageUrl}
            alt="3D Preview"
            className="w-full h-auto rounded"
            style={{ aspectRatio: `${widthCm}/${heightCm}` }}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        {widthCm} x {heightCm} x {depthCm} cm
      </p>
    </div>
  );
}
