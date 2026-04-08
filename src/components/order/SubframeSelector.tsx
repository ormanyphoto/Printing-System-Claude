import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useLocalizedField } from "@/hooks/useLocalizedField";
import type { Tables } from "@/integrations/supabase/types";

export type SubframeSizeCategory = "small" | "medium" | "extra-large";

export function getSubframeSizeCategory(widthCm: number, heightCm: number): SubframeSizeCategory {
  const longEdge = Math.max(widthCm, heightCm);
  if (longEdge <= 50) return "small";
  if (longEdge > 120) return "extra-large";
  return "medium";
}

interface SubframeSelectorProps {
  subframeOptions: Tables<"subframe_options">[];
  selectedId: string | null;
  onSelect: (option: Tables<"subframe_options">) => void;
  sizeCategory: SubframeSizeCategory;
}

const SubframeSelector = ({ subframeOptions, selectedId, onSelect, sizeCategory }: SubframeSelectorProps) => {
  const { t } = useTranslation();
  const { lf } = useLocalizedField();

  const availableOptions = useMemo(() => {
    if (sizeCategory === "small") {
      return subframeOptions.filter((o) => o.material === "PVC");
    }
    if (sizeCategory === "extra-large") {
      return subframeOptions.filter((o) => o.material === "Aluminum");
    }
    return subframeOptions.filter((o) => o.material === "Plastic" || o.material === "Aluminum");
  }, [subframeOptions, sizeCategory]);

  if (availableOptions.length === 0) return null;

  const isAutoAssigned = sizeCategory === "small" || sizeCategory === "extra-large";

  return (
    <div>
      {isAutoAssigned && (
        <p className="font-body text-xs text-muted-foreground mb-3">
          {sizeCategory === "small"
            ? t("subframe.pvcAuto")
            : t("subframe.aluRequired")}
        </p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {availableOptions.map((o) => {
          const isSelected = selectedId === o.id;
          return (
            <button
              key={o.id}
              onClick={() => onSelect(o)}
              disabled={isAutoAssigned && availableOptions.length === 1}
              className={cn(
                "group relative flex flex-col overflow-hidden rounded-lg border-2 transition-all duration-200",
                isSelected
                  ? "border-accent shadow-md ring-1 ring-accent/30"
                  : "border-border/40 hover:border-accent/50 hover:shadow-sm",
                isAutoAssigned && availableOptions.length === 1 && "cursor-default"
              )}
            >
              <div className="aspect-[4/3] overflow-hidden bg-muted flex items-center justify-center">
                <span className="font-display text-2xl text-muted-foreground/50">{o.material === "Aluminum" ? "🔩" : o.material === "PVC" ? "📎" : "🔧"}</span>
              </div>
              <div className="px-2.5 py-2 text-left">
                <p className={cn(
                  "font-body text-xs font-semibold leading-tight",
                  isSelected ? "text-accent" : "text-foreground"
                )}>
                  {lf(o.name_en, o.name_he)}
                </p>
                {Number(o.surcharge_pct) > 0 && (
                  <p className="font-body text-[10px] text-muted-foreground mt-0.5">+{o.surcharge_pct}%</p>
                )}
              </div>
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SubframeSelector;
