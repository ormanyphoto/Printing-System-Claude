import { cn } from "@/lib/utils";
import { useLocalizedField } from "@/hooks/useLocalizedField";
import type { Tables } from "@/integrations/supabase/types";

interface SubtypeSelectorProps {
  subtypes: Tables<"product_subtypes">[];
  selectedId: string | null;
  onSelect: (subtype: Tables<"product_subtypes">) => void;
}

const SubtypeSelector = ({ subtypes, selectedId, onSelect }: SubtypeSelectorProps) => {
  const { lf } = useLocalizedField();

  if (subtypes.length <= 1) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {subtypes.map((st) => {
        const isSelected = selectedId === st.id;
        return (
          <button
            key={st.id}
            onClick={() => onSelect(st)}
            className={cn(
              "group relative flex flex-col overflow-hidden rounded-lg border-2 transition-all duration-200",
              isSelected
                ? "border-accent shadow-md ring-1 ring-accent/30"
                : "border-border/40 hover:border-accent/50 hover:shadow-sm"
            )}
          >
            <div className="aspect-[4/3] overflow-hidden bg-muted flex items-center justify-center">
              {(st as any).thumbnail_url ? (
                <img
                  src={(st as any).thumbnail_url}
                  alt={lf(st.name_en, st.name_he)}
                  className={cn(
                    "w-full h-full object-cover transition-transform duration-300",
                    "group-hover:scale-105"
                  )}
                />
              ) : (
                <span className="font-display text-2xl text-muted-foreground/50">📄</span>
              )}
            </div>
            <div className="px-2.5 py-2 text-left">
              <p className={cn(
                "font-body text-xs font-semibold leading-tight",
                isSelected ? "text-accent" : "text-foreground"
              )}>
                {lf(st.name_en, st.name_he)}
              </p>
              {(st.description_en || st.description_he) && (
                <p className="font-body text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                  {lf(st.description_en, st.description_he)}
                </p>
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

export default SubtypeSelector;
