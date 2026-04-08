import { useState } from "react";
import { Maximize2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import roomBig from "@/assets/room-big.png";
import roomSmall from "@/assets/room-small-livingroom.jpg";
import { getFrameTexture } from "@/lib/frame-textures";

interface WallMockupProps {
  imageUrl: string;
  widthCm: number;
  heightCm: number;
  productName?: string;
  productSlug?: string;
  borders?: { top: number; bottom: number; left: number; right: number };
  frameWidthCm?: number;
  frameColorHex?: string;
  frameColorId?: string;
  finishName?: string;
}

const BIG_ROOM = {
  src: roomBig,
  aspectRatio: 1500 / 1000,
  centerX: 0.49,
  centerY: 0.34,
  wallRealCm: 400,
  wallWidthFraction: 0.75,
};

const SMALL_ROOM = {
  src: roomSmall,
  aspectRatio: 1920 / 1080,
  centerX: 0.50,
  centerY: 0.28,
  wallRealCm: 450,
  wallWidthFraction: 1.0,
  sofaWidthCm: 240,
};

const getGlareStyle = (_finishName?: string): React.CSSProperties | null => {
  return null;
};

const CANVAS_TEXTURE_STYLE: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  backgroundImage: `repeating-linear-gradient(0deg, rgba(0,0,0,0.04) 0px, transparent 0.5px, transparent 0.5px, rgba(0,0,0,0.04) 1px),
    repeating-linear-gradient(90deg, rgba(0,0,0,0.04) 0px, transparent 0.5px, transparent 0.5px, rgba(0,0,0,0.04) 1px)`,
  backgroundSize: "1px 1px",
  mixBlendMode: "multiply" as const,
};

const WallMockup = ({ imageUrl, widthCm, heightCm, productName, productSlug, borders, frameWidthCm, frameColorHex, frameColorId, finishName }: WallMockupProps) => {
  const { t } = useTranslation();
  const [enlarged, setEnlarged] = useState(false);
  const areaSqm = (widthCm * heightCm) / 10000;
  const room = areaSqm <= 0.55 ? SMALL_ROOM : BIG_ROOM;

  const containerRef = 800;
  const pxPerCm = (room.wallWidthFraction * containerRef) / room.wallRealCm;

  const hasBorders = borders && (borders.top > 0 || borders.bottom > 0 || borders.left > 0 || borders.right > 0);
  const totalW = widthCm + (borders?.left ?? 0) + (borders?.right ?? 0);
  const totalH = heightCm + (borders?.top ?? 0) + (borders?.bottom ?? 0);

  const frameCm = frameWidthCm ?? 0;
  const isHdMetal = productSlug === "hd-metal";
  const isCanvas = productSlug === "canvas";
  const outerW = totalW + frameCm * 2;
  const outerH = totalH + frameCm * 2;

  const printW = outerW * pxPerCm;
  const printH = outerH * pxPerCm;

  const printStyle = {
    width: `${(printW / containerRef) * 100}%`,
    height: `${(printH / containerRef) * 100 * room.aspectRatio}%`,
    left: `${room.centerX * 100}%`,
    top: `${room.centerY * 100}%`,
    transform: "translate(-50%, -50%)",
  };

  const borderTopPct = hasBorders ? ((borders!.top / totalH) * 100) : 0;
  const borderBottomPct = hasBorders ? ((borders!.bottom / totalH) * 100) : 0;
  const borderLeftPct = hasBorders ? ((borders!.left / totalW) * 100) : 0;
  const borderRightPct = hasBorders ? ((borders!.right / totalW) * 100) : 0;

  const frameTopPct = frameCm > 0 ? (frameCm / outerH) * 100 : 0;
  const frameLeftPct = frameCm > 0 ? (frameCm / outerW) * 100 : 0;
  const innerWidthPct = frameCm > 0 ? ((outerW - frameCm * 2) / outerW) * 100 : 100;
  const innerHeightPct = frameCm > 0 ? ((outerH - frameCm * 2) / outerH) * 100 : 100;

  const sofaRatio = 'sofaWidthCm' in room ? Math.round((outerW / (room as typeof SMALL_ROOM).sofaWidthCm) * 100) : null;
  const sizeLabel = `${Math.round(outerW)}×${Math.round(outerH)} cm${frameCm > 0 ? ` ${t("wall.inclFrame", { cm: frameCm })}` : ""}${sofaRatio !== null ? ` — ${t("wall.sofaWidth", { defaultValue: "Sofa Width" })}: ${(room as typeof SMALL_ROOM).sofaWidthCm} cm` : ` — ${t("wall.wallSize")}`} · ${t("wall.simulatedPreview", { defaultValue: "Simulated Preview" })}`;

  const wallFrameTexture = frameColorId ? getFrameTexture(frameColorId) : undefined;

  const mockupContent = (
    <div className="relative w-full" style={{ aspectRatio: `${room.aspectRatio}` }}>
      <img src={room.src} alt={t("wall.roomPreview")} className="w-full h-full object-cover" />
      <div
        className="absolute"
        style={{
          ...printStyle,
          boxShadow: isHdMetal
            ? "5px 3px 12px rgba(0,0,0,0.4), 2px 1px 5px rgba(0,0,0,0.25)"
            : "4px 4px 20px rgba(0,0,0,0.35)",
          borderRadius: isHdMetal ? "3px" : undefined,
          overflow: "hidden",
          backgroundColor: frameCm > 0 && frameColorHex ? frameColorHex : hasBorders ? "#ffffff" : undefined,
        }}
      >
        {/* Texture overlay for frame — horizontal grain on top/bottom, vertical on sides */}
        {frameCm > 0 && wallFrameTexture && (() => {
          const fT = frameTopPct;
          const fL = frameLeftPct;
          const fR = 100 - frameLeftPct;
          const fB = 100 - frameTopPct;
          const pieces = [
            { clipPath: `polygon(0% 0%, 100% 0%, ${fR}% ${fT}%, ${fL}% ${fT}%)`, grain: "h" },
            { clipPath: `polygon(${fL}% ${fB}%, ${fR}% ${fB}%, 100% 100%, 0% 100%)`, grain: "h" },
            { clipPath: `polygon(0% 0%, ${fL}% ${fT}%, ${fL}% ${fB}%, 0% 100%)`, grain: "v" },
            { clipPath: `polygon(${fR}% ${fT}%, 100% 0%, 100% 100%, ${fR}% ${fB}%)`, grain: "v" },
          ];
          return pieces.map((p, i) => (
            <div key={i} className="absolute inset-0" style={{ clipPath: p.clipPath, overflow: "hidden", zIndex: 1 }}>
              <div className="absolute" style={{
                top: "50%",
                left: "50%",
                width: "300%",
                height: "300%",
                backgroundImage: `url(${wallFrameTexture})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                transform: `translate(-50%, -50%)${p.grain === "h" ? " rotate(90deg)" : ""}`,
              }} />
            </div>
          ));
        })()}
        <div
          className="absolute"
          style={{
            top: `${frameTopPct}%`,
            left: `${frameLeftPct}%`,
            width: `${innerWidthPct}%`,
            height: `${innerHeightPct}%`,
            backgroundColor: hasBorders ? "#ffffff" : undefined,
          }}
        >
          <img
            src={imageUrl}
            alt={productName ?? "Your print"}
            className="w-full h-full object-cover"
            style={hasBorders ? {
              position: "absolute",
              top: `${borderTopPct}%`,
              left: `${borderLeftPct}%`,
              width: `${100 - borderLeftPct - borderRightPct}%`,
              height: `${100 - borderTopPct - borderBottomPct}%`,
            } : undefined}
          />
          {getGlareStyle(finishName) && <div style={getGlareStyle(finishName)!} />}
          {isCanvas && <div style={CANVAS_TEXTURE_STYLE} />}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="border border-border rounded-sm overflow-hidden bg-card">
        <div className="flex items-center justify-between p-3 sm:p-4 pb-0">
          <p className="font-body text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
            {t("wall.roomPreview")}
          </p>
          <button
            onClick={() => setEnlarged(true)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label={t("wall.roomPreview")}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
        {mockupContent}
        <p className="font-body text-xs text-muted-foreground p-3 sm:p-4 text-center">
          {sizeLabel}
        </p>
      </div>

      {enlarged && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background p-4"
          onClick={() => setEnlarged(false)}
        >
          <div
            className="relative w-full max-w-5xl bg-card rounded-sm overflow-hidden border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setEnlarged(false)}
              className="absolute top-3 right-3 z-10 bg-background/80 hover:bg-background text-foreground rounded-full p-1.5 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            {mockupContent}
            <p className="font-body text-xs text-muted-foreground p-3 text-center">
              {sizeLabel}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default WallMockup;
