import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Maximize2, X } from "lucide-react";
import { getFrameTexture } from "@/lib/frame-textures";

interface ProductPreviewProps {
  imageUrl: string;
  widthCm: number;
  heightCm: number;
  productName?: string;
  productSlug?: string;
  borders?: { top: number; bottom: number; left: number; right: number };
  frameWidthCm?: number;
  frameColorHex?: string;
  frameColorId?: string;
  extraHeaderContent?: React.ReactNode;
}

const CANVAS_TEXTURE_STYLE: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  backgroundImage: `repeating-linear-gradient(0deg, rgba(0,0,0,0.04) 0px, transparent 0.5px, transparent 0.5px, rgba(0,0,0,0.04) 1px),
    repeating-linear-gradient(90deg, rgba(0,0,0,0.04) 0px, transparent 0.5px, transparent 0.5px, rgba(0,0,0,0.04) 1px)`,
  backgroundSize: "1px 1px",
  mixBlendMode: "multiply" as const,
};

/** Darken a hex color slightly for miter line visibility */
function miterLineColor(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const d = (c: number) => Math.max(0, Math.round(c * 0.85));
  return `#${d(r).toString(16).padStart(2, "0")}${d(g).toString(16).padStart(2, "0")}${d(b).toString(16).padStart(2, "0")}`;
}

const ProductPreview = ({ imageUrl, widthCm, heightCm, productName, productSlug, borders, frameWidthCm, frameColorHex, frameColorId, extraHeaderContent }: ProductPreviewProps) => {
  const { t } = useTranslation();
  const [enlarged, setEnlarged] = useState(false);

  const hasBorders = borders && (borders.top > 0 || borders.bottom > 0 || borders.left > 0 || borders.right > 0);
  const totalW = widthCm + (borders?.left ?? 0) + (borders?.right ?? 0);
  const totalH = heightCm + (borders?.top ?? 0) + (borders?.bottom ?? 0);
  const frameCm = frameWidthCm ?? 0;
  const isHdMetal = productSlug === "hd-metal";
  const isCanvas = productSlug === "canvas";
  const hasFrame = frameCm > 0 && !!frameColorHex;
  const outerW = totalW + frameCm * 2;
  const outerH = totalH + frameCm * 2;

  const borderTopPct = hasBorders ? (borders!.top / totalH) * 100 : 0;
  const borderBottomPct = hasBorders ? (borders!.bottom / totalH) * 100 : 0;
  const borderLeftPct = hasBorders ? (borders!.left / totalW) * 100 : 0;
  const borderRightPct = hasBorders ? (borders!.right / totalW) * 100 : 0;

  const frameTopPct = frameCm > 0 ? (frameCm / outerH) * 100 : 0;
  const frameLeftPct = frameCm > 0 ? (frameCm / outerW) * 100 : 0;
  const innerWidthPct = frameCm > 0 ? ((outerW - frameCm * 2) / outerW) * 100 : 100;
  const innerHeightPct = frameCm > 0 ? ((outerH - frameCm * 2) / outerH) * 100 : 100;

  const baseColor = frameColorHex ?? "#333333";
  const miterColor = miterLineColor(baseColor);
  const frameTextureUrl = frameColorId ? getFrameTexture(frameColorId) : undefined;

  // Miter frame pieces as clip-path trapezoids
  const fT = frameTopPct;
  const fL = frameLeftPct;
  const fR = 100 - frameLeftPct;
  const fB = 100 - frameTopPct;

  // orientation: "h" = grain runs horizontally (top/bottom), "v" = grain runs vertically (left/right)
  const framePieces = hasFrame
    ? [
        { color: baseColor, clipPath: `polygon(0% 0%, 100% 0%, ${fR}% ${fT}%, ${fL}% ${fT}%)`, grain: "h" as const },
        { color: baseColor, clipPath: `polygon(${fL}% ${fB}%, ${fR}% ${fB}%, 100% 100%, 0% 100%)`, grain: "h" as const },
        { color: baseColor, clipPath: `polygon(0% 0%, ${fL}% ${fT}%, ${fL}% ${fB}%, 0% 100%)`, grain: "v" as const },
        { color: baseColor, clipPath: `polygon(${fR}% ${fT}%, 100% 0%, 100% 100%, ${fR}% ${fB}%)`, grain: "v" as const },
      ]
    : [];

  // Miter lines: 4 diagonal lines at 45° from each corner to inner corner
  const miterLines = hasFrame
    ? [
        // Top-left corner → inner top-left
        { x1: "0%", y1: "0%", x2: `${fL}%`, y2: `${fT}%` },
        // Top-right corner → inner top-right
        { x1: "100%", y1: "0%", x2: `${fR}%`, y2: `${fT}%` },
        // Bottom-left corner → inner bottom-left
        { x1: "0%", y1: "100%", x2: `${fL}%`, y2: `${fB}%` },
        // Bottom-right corner → inner bottom-right
        { x1: "100%", y1: "100%", x2: `${fR}%`, y2: `${fB}%` },
      ]
    : [];

  const isVertical = outerH > outerW;

  const renderPreviewContent = (maxW: string, maxH?: string) => (
    <div
      className="relative mx-auto"
      style={{
        maxWidth: maxW,
        maxHeight: maxH,
        aspectRatio: `${outerW} / ${outerH}`,
        ...(isVertical
          ? { height: maxH ?? "65vh", width: "auto" }
          : { width: "100%" }),
        boxShadow: isHdMetal
          ? "3px 5px 10px rgba(0,0,0,0.35), 1px 2px 4px rgba(0,0,0,0.2)"
          : "4px 4px 20px rgba(0,0,0,0.25)",
        borderRadius: isHdMetal ? "3px" : undefined,
        overflow: "hidden",
        backgroundColor: hasFrame ? baseColor : hasBorders ? "#ffffff" : undefined,
      }}
    >
      {/* Mitered frame pieces */}
      {framePieces.map((piece, i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{
            backgroundColor: piece.color,
            clipPath: piece.clipPath,
            zIndex: 1,
            overflow: "hidden",
          }}
        >
          {/* Wood grain texture — square container ensures identical color whether rotated or not */}
          {frameTextureUrl && (
            <div
              className="absolute"
              style={{
                top: "50%",
                left: "50%",
                width: "300%",
                height: "300%",
                backgroundImage: `url(${frameTextureUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                transform: `translate(-50%, -50%)${piece.grain === "h" ? " rotate(90deg)" : ""}`,
              }}
            />
          )}
        </div>
      ))}

      {/* Miter corner lines */}
      {miterLines.length > 0 && (
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ zIndex: 2, pointerEvents: "none" }}
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          {miterLines.map((line, i) => (
            <line
              key={i}
              x1={parseFloat(line.x1)}
              y1={parseFloat(line.y1)}
              x2={parseFloat(line.x2)}
              y2={parseFloat(line.y2)}
              stroke={miterColor}
              strokeWidth="0.15"
              opacity={0.4}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      )}

      {/* Inner bevel shadow on frame */}
      {hasFrame && (
        <div
          className="absolute"
          style={{
            top: `${fT}%`,
            left: `${fL}%`,
            width: `${innerWidthPct}%`,
            height: `${innerHeightPct}%`,
            boxShadow: "inset 0 1px 4px rgba(0,0,0,0.3), inset 0 -1px 2px rgba(0,0,0,0.15)",
            zIndex: 4,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Image area */}
      <div
        className="absolute"
        style={{
          top: `${frameTopPct}%`,
          left: `${frameLeftPct}%`,
          width: `${innerWidthPct}%`,
          height: `${innerHeightPct}%`,
          backgroundColor: hasBorders ? "#ffffff" : undefined,
          zIndex: 3,
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
        {isCanvas && <div style={CANVAS_TEXTURE_STYLE} />}
      </div>
    </div>
  );

  return (
    <>
      <div className="flex flex-col items-center justify-center w-full">
        <div className="flex items-center justify-center w-full p-4 sm:p-6" style={{ maxHeight: "70vh" }}>
          {renderPreviewContent("80%", "65vh")}
        </div>
        <p className="font-body text-xs text-muted-foreground text-center pb-2">
          {Math.round(outerW)}×{Math.round(outerH)} cm{frameCm > 0 ? ` ${t("preview.inclFrame", { cm: frameCm })}` : ""}
        </p>
      </div>

      {/* Enlarged overlay */}
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
            <div className="flex items-center justify-center p-6 sm:p-10 max-w-3xl mx-auto">
              {renderPreviewContent("100%", "75vh")}
            </div>
            <p className="font-body text-xs text-muted-foreground p-3 pt-0 text-center">
              {Math.round(outerW)}×{Math.round(outerH)} cm{frameCm > 0 ? ` ${t("preview.inclFrame", { cm: frameCm })}` : ""}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductPreview;
