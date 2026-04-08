import { useState } from "react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";
import { useLocalizedField } from "@/hooks/useLocalizedField";
import { getFramePhoto, getFrameStylePhoto } from "@/lib/frame-textures";
import type { Tables } from "@/integrations/supabase/types";

export interface BorderValues {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface FrameWidthOption {
  id: string;
  width_cm: number;
  surcharge_pct: number;
}

interface FrameColor {
  id: string;
  color_name_en: string;
  color_name_he: string;
  hex_code: string;
}

interface FramedOptionsSelectorProps {
  borders: BorderValues;
  onBordersChange: (borders: BorderValues) => void;
  frameWidths: FrameWidthOption[];
  selectedFrameWidthId: string | null;
  onFrameWidthChange: (fw: FrameWidthOption) => void;
  frameStyles: Tables<"frame_styles">[];
  frameColors: FrameColor[];
  selectedFrameStyleId: string | null;
  selectedFrameColorId: string | null;
  onSelectFrameStyle: (style: Tables<"frame_styles">) => void;
  onSelectFrameColor: (color: FrameColor) => void;
  glazingOptions: Tables<"glazing_options">[];
  selectedGlazingId: string | null;
  onSelectGlazing: (option: Tables<"glazing_options">) => void;
  printWidthCm: number;
  printHeightCm: number;
  maxNarrowSideCm?: number;
  showOnly?: "whiteBorder" | "frameWidth" | "frameStyle" | "frameColor" | "glazing";
}

const SIDE_KEYS: Record<string, string> = {
  top: "side.top",
  bottom: "side.bottom",
  left: "side.left",
  right: "side.right",
};

const FramedOptionsSelector = ({
  borders, onBordersChange, frameWidths, selectedFrameWidthId, onFrameWidthChange,
  frameStyles, frameColors, selectedFrameStyleId, selectedFrameColorId,
  onSelectFrameStyle, onSelectFrameColor, glazingOptions, selectedGlazingId,
  onSelectGlazing, printWidthCm, printHeightCm, maxNarrowSideCm, showOnly,
}: FramedOptionsSelectorProps) => {
  const { t, i18n } = useTranslation();
  const { lf } = useLocalizedField();
  const [proportional, setProportional] = useState(true);
  const cmLabel = i18n.language === "he" ? "ס״מ" : "cm";

  const totalWidth = printWidthCm + borders.left + borders.right;
  const totalHeight = printHeightCm + borders.top + borders.bottom;
  const narrowSide = Math.min(printWidthCm, printHeightCm);
  const isWidthNarrow = printWidthCm <= printHeightCm;

  const getMaxBorder = (side: keyof BorderValues): number => {
    if (!maxNarrowSideCm) return 15;
    if (proportional) return Math.max(0, Math.floor(((maxNarrowSideCm - narrowSide) / 2) * 2) / 2);
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
    if (proportional) onBordersChange({ top: clamped, bottom: clamped, left: clamped, right: clamped });
    else onBordersChange({ ...borders, [side]: clamped });
  };

  /** Shared card style for option buttons */
  const cardClass = (isSelected: boolean) => cn(
    "group relative flex flex-col overflow-hidden rounded-lg border-2 transition-all duration-200",
    isSelected
      ? "border-accent shadow-md ring-1 ring-accent/30"
      : "border-border/40 hover:border-accent/50 hover:shadow-sm"
  );

  const checkmark = (
    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
      <svg className="w-3 h-3 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* White Border */}
      {(!showOnly || showOnly === "whiteBorder") && (
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
            <Slider min={0} max={getMaxBorder("top")} step={0.5} value={[borders.top]} onValueChange={([v]) => handleBorderChange("top", v)} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {(["top", "bottom", "left", "right"] as const).map((side) => (
              <div key={side}>
                <div className="flex justify-between mb-2">
                  <span className="font-body text-xs text-muted-foreground">{t(SIDE_KEYS[side])}</span>
                  <span className="font-body text-sm text-foreground font-medium">{borders[side]} cm</span>
                </div>
                <Slider min={0} max={getMaxBorder(side)} step={0.5} value={[borders[side]]} onValueChange={([v]) => handleBorderChange(side, v)} />
              </div>
            ))}
          </div>
        )}
        <p className="font-body text-xs text-muted-foreground mt-3">
          {t("options.totalFramedSize", { size: `${totalWidth.toFixed(1)}×${totalHeight.toFixed(1)} cm` })}
        </p>
      </div>
      )}

      {/* Frame Width */}
      {(!showOnly || showOnly === "frameWidth") && frameWidths.length > 0 && (
      <div>
        <p className="font-body text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3 font-semibold">
          {t("options.frameWidth")}
        </p>
        <div className="grid grid-cols-3 gap-3">
          {frameWidths.map((fw) => {
            const isSelected = selectedFrameWidthId === fw.id;
            return (
              <button key={fw.id} onClick={() => onFrameWidthChange(fw)} className={cardClass(isSelected)}>
                <div className="aspect-[4/3] overflow-hidden bg-muted flex items-center justify-center">
                  <span className="font-display text-lg text-muted-foreground/60" dir="ltr">{Number(fw.width_cm)} {cmLabel}</span>
                </div>
                <div className="px-2.5 py-2 text-left">
                  <p className={cn("font-body text-xs font-semibold leading-tight", isSelected ? "text-accent" : "text-foreground")}>
                    {Number(fw.width_cm)} {cmLabel}
                  </p>
                </div>
                {isSelected && checkmark}
              </button>
            );
          })}
        </div>
      </div>
      )}

      {/* Frame Style */}
      {(!showOnly || showOnly === "frameStyle") && frameStyles.length > 0 && (
      <div>
        <p className="font-body text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3 font-semibold">
          {t("options.frameStyle")}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {frameStyles.map((fs) => {
            const isSelected = selectedFrameStyleId === fs.id;
            const stylePhoto = getFrameStylePhoto(fs.id);
            return (
              <button key={fs.id} onClick={() => onSelectFrameStyle(fs)} className={cardClass(isSelected)}>
                <div className="aspect-[4/3] overflow-hidden bg-muted flex items-center justify-center">
                  {stylePhoto ? (
                    <img src={stylePhoto} alt={lf(fs.name_en, fs.name_he)} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display text-2xl text-muted-foreground/50">🖼️</span>
                  )}
                </div>
                <div className="px-2.5 py-2 text-left">
                  <p className={cn("font-body text-xs font-semibold leading-tight", isSelected ? "text-accent" : "text-foreground")}>
                    {lf(fs.name_en, fs.name_he)}
                  </p>
                </div>
                {isSelected && checkmark}
              </button>
            );
          })}
        </div>
      </div>
      )}

      {/* Frame Color */}
      {(!showOnly || showOnly === "frameColor") && frameColors.length > 0 && (
        <div>
          <p className="font-body text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3 font-semibold">
            {t("options.frameColor")}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {frameColors.map((fc) => {
              const photo = getFramePhoto(fc.id);
              const isSelected = selectedFrameColorId === fc.id;
              return (
                <button key={fc.id} onClick={() => onSelectFrameColor(fc)} className={cardClass(isSelected)}>
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    {photo ? (
                      <img src={photo} alt={lf(fc.color_name_en, fc.color_name_he)} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full" style={{ backgroundColor: fc.hex_code }} />
                    )}
                  </div>
                  <div className="px-2.5 py-2 text-left">
                    <p className={cn("font-body text-xs font-semibold leading-tight", isSelected ? "text-accent" : "text-foreground")}>
                      {lf(fc.color_name_en, fc.color_name_he)}
                    </p>
                  </div>
                  {isSelected && checkmark}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Glazing */}
      {(!showOnly || showOnly === "glazing") && glazingOptions.length > 0 && (
      <div>
        <p className="font-body text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3 font-semibold">
          {t("options.glazing")}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {glazingOptions.map((g) => {
            const isSelected = selectedGlazingId === g.id;
            return (
              <button key={g.id} onClick={() => onSelectGlazing(g)} className={cardClass(isSelected)}>
                <div className="aspect-[4/3] overflow-hidden bg-muted flex items-center justify-center">
                  <span className="font-display text-2xl text-muted-foreground/50">✨</span>
                </div>
                <div className="px-2.5 py-2 text-left">
                  <p className={cn("font-body text-xs font-semibold leading-tight", isSelected ? "text-accent" : "text-foreground")}>
                    {lf(g.name_en, g.name_he)}
                  </p>
                </div>
                {isSelected && checkmark}
              </button>
            );
          })}
        </div>
      </div>
      )}
    </div>
  );
};

export default FramedOptionsSelector;
