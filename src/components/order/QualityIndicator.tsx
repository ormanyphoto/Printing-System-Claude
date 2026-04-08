import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { CircleCheck, CircleAlert, TriangleAlert } from "lucide-react";

interface QualityIndicatorProps {
  imageWidthPx: number;
  imageHeightPx: number;
  printWidthCm: number;
  printHeightCm: number;
}

export type Quality = "excellent" | "good" | "low";

export function getQuality(imgW: number, imgH: number, printW: number, printH: number): { quality: Quality; dpi: number; maxCmLong: number } {
  const dpiW = (imgW / printW) * 2.54;
  const dpiH = (imgH / printH) * 2.54;
  const dpi = Math.min(dpiW, dpiH);
  const longEdgePx = Math.max(imgW, imgH);
  const maxCmLong = Math.round((longEdgePx / 150) * 2.54);
  const quality: Quality = dpi >= 200 ? "excellent" : dpi >= 100 ? "good" : "low";
  return { quality, dpi: Math.round(dpi), maxCmLong };
}

const QualityIndicator = ({ imageWidthPx, imageHeightPx, printWidthCm, printHeightCm }: QualityIndicatorProps) => {
  const { t } = useTranslation();
  const { quality, dpi, maxCmLong } = getQuality(imageWidthPx, imageHeightPx, printWidthCm, printHeightCm);

  const config = {
    excellent: {
      icon: CircleCheck,
      color: "text-green-600",
      bg: "bg-green-50 border-green-200",
      label: t("quality.excellent", "Excellent quality"),
    },
    good: {
      icon: CircleAlert,
      color: "text-yellow-600",
      bg: "bg-yellow-50 border-yellow-200",
      label: t("quality.good", "Good quality"),
    },
    low: {
      icon: TriangleAlert,
      color: "text-red-600",
      bg: "bg-red-50 border-red-200",
      label: t("quality.low", "Low resolution for this size"),
    },
  }[quality];

  const Icon = config.icon;

  return (
    <div className={cn("flex items-start gap-2.5 p-3 rounded-md border text-sm", config.bg)}>
      <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", config.color)} strokeWidth={2} />
      <div>
        <p className={cn("font-body font-semibold text-sm", config.color)}>{config.label}</p>
        <p className="font-body text-xs text-muted-foreground mt-0.5">
          {dpi} DPI
          {quality === "low" && ` · ${t("quality.recommend", { cm: maxCmLong, defaultValue: `For best results we recommend printing up to ${maxCmLong} cm` })}`}
        </p>
      </div>
    </div>
  );
};

export default QualityIndicator;
