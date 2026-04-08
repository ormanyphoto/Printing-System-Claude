interface WallMockupProps {
  imageUrl: string | null;
  widthCm: number;
  heightCm: number;
}

export default function WallMockup({ imageUrl, widthCm, heightCm }: WallMockupProps) {
  if (!imageUrl) return null;

  const scale = Math.min(200 / widthCm, 150 / heightCm);
  const displayWidth = widthCm * scale;
  const displayHeight = heightCm * scale;

  return (
    <div className="relative bg-gradient-to-b from-stone-200 to-stone-300 rounded-lg overflow-hidden" style={{ height: 300 }}>
      {/* Wall texture */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M0 0h40v40H0V0zm20 20h20v20H20V20z\'/%3E%3C/g%3E%3C/svg%3E")' }} />

      {/* Frame on wall */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-2xl">
        <img
          src={imageUrl}
          alt="Wall mockup"
          style={{ width: displayWidth, height: displayHeight }}
          className="object-cover"
        />
      </div>

      {/* Floor */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-amber-900/30 to-transparent" />
    </div>
  );
}
