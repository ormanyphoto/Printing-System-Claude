import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useLocalizedField } from "@/hooks/useLocalizedField";
import type { Tables } from "@/integrations/supabase/types";

interface FinishSelectorProps {
  finishes: Tables<"finishes">[];
  selectedId: string | null;
  onSelect: (finish: Tables<"finishes">) => void;
}

const FinishSelector = ({ finishes, selectedId, onSelect }: FinishSelectorProps) => {
  const { t } = useTranslation();
  const { lf } = useLocalizedField();

  if (finishes.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {finishes.map((f) => {
        const isSelected = selectedId === f.id;
        return (
          <button
            key={f.id}
            onClick={() => onSelect(f)}
            className={cn(
              "group relative flex flex-col overflow-hidden rounded-lg border-2 transition-all duration-200",
              isSelected
                ? "border-accent shadow-md ring-1 ring-accent/30"
                : "border-border/40 hover:border-accent/50 hover:shadow-sm"
            )}
          >
            <div className="aspect-[4/3] overflow-hidden bg-muted flex items-center justify-center">
              {f.thumbnail_url ? (
                <img
                  src={f.thumbnail_url}
                  alt={lf(f.name_en, f.name_he)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <span className="font-display text-2xl text-muted-foreground/50">✨</span>
              )}
            </div>
            <div className="px-2.5 py-2 text-left">
              <p className={cn(
                "font-body text-xs font-semibold leading-tight",
                isSelected ? "text-accent" : "text-foreground"
              )}>
                {lf(f.name_en, f.name_he)}
              </p>
              {Number(f.surcharge_pct) > 0 && (
                <p className="font-body text-[10px] text-muted-foreground mt-0.5">+{f.surcharge_pct}%</p>
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
  );
};

export default FinishSelector;
