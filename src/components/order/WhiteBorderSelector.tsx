import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";
import type { BorderValues } from "@/components/order/FramedOptionsSelector";

interface WhiteBorderSelectorProps {
  borders: BorderValues;
  onBordersChange: (borders: BorderValues) => void;
  printWidthCm: number;
  printHeightCm: number;
  maxNarrowSideCm?: number;
}

const SIDE_KEYS: Record<string, string> = {
  top: "side.top",
  bottom: "side.bottom",
  left: "side.left",
  right: "side.right",
};

const WhiteBorderSelector = ({
  borders,
  onBordersChange,
  printWidthCm,
  printHeightCm,
  maxNarrowSideCm,
}: WhiteBorderSelectorProps) => {
  const { t } = useTranslation();
  const [proportional, setProportional] = useState(true);

  const totalWidth = printWidthCm + borders.left + borders.right;
  const totalHeight = printHeightCm + borders.top + borders.bottom;

  // Calculate max border per side based on narrow side constraint
  const narrowSide = Math.min(printWidthCm, printHeightCm);
  const isWidthNarrow = printWidthCm <= printHeightCm;

  const getMaxBorder = (side: keyof BorderValues): number => {
    if (!maxNarrowSideCm) return 15;
    if (proportional) {
      // In proportional mode, narrow side = narrowSide + 2*border <= maxNarrowSideCm
      return Math.max(0, Math.floor(((maxNarrowSideCm - narrowSide) / 2) * 2) / 2);
    }
    // In independent mode, constrain sides that affect the narrow dimension
    if (isWidthNarrow) {
      if (side === "left" || side === "right") {
        const otherSide = side === "left" ? borders.right : borders.left;
        return Math.max(0, Math.floor((maxNarrowSideCm - printWidthCm - otherSide) * 2) / 2);
      }
    } else {
      if (side === "top" || side === "bottom") {
        const otherSide = side === "top" ? borders.bottom : borders.top;
        return Math.max(0, Math.floor((maxNarrowSideCm - printHeightCm - otherSide) * 2) / 2);
      }
    }
    return 15;
  };

  const handleBorderChange = (side: keyof BorderValues, value: number) => {
    const max = getMaxBorder(side);
    const clamped = Math.min(value, max);
    if (proportional) {
      onBordersChange({ top: clamped, bottom: clamped, left: clamped, right: clamped });
    } else {
      onBordersChange({ ...borders, [side]: clamped });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="font-body text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
          {t("options.whiteBorder")}
        </p>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="font-body text-xs text-muted-foreground">{t("options.equalSides")}</span>
          <Switch checked={proportional} onCheckedChange={setProportional} />
        </label>
      </div>

      {proportional ? (
        <div>
          <div className="flex justify-between mb-2">
            <span className="font-body text-xs text-muted-foreground">{t("options.allSides")}</span>
            <span className="font-body text-sm text-foreground font-medium">{borders.top} cm</span>
          </div>
          <Slider
            min={0} max={getMaxBorder("top")} step={0.5}
            value={[borders.top]}
            onValueChange={([v]) => handleBorderChange("top", v)}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {(["top", "bottom", "left", "right"] as const).map((side) => (
            <div key={side}>
              <div className="flex justify-between mb-2">
                <span className="font-body text-xs text-muted-foreground">{t(SIDE_KEYS[side])}</span>
                <span className="font-body text-sm text-foreground font-medium">{borders[side]} cm</span>
              </div>
              <Slider
                min={0} max={getMaxBorder(side)} step={0.5}
                value={[borders[side]]}
                onValueChange={([v]) => handleBorderChange(side, v)}
              />
            </div>
          ))}
        </div>
      )}

      {(borders.top > 0 || borders.bottom > 0 || borders.left > 0 || borders.right > 0) && (
        <p className="font-body text-xs text-muted-foreground mt-3">
          {t("options.totalBorderSize", { size: `${totalWidth.toFixed(1)}×${totalHeight.toFixed(1)} cm` })}
        </p>
      )}
    </div>
  );
};

export default WhiteBorderSelector;
