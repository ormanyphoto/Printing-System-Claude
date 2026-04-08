import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import type { Tables } from "@/integrations/supabase/types";

interface SizeSelectorProps {
  sizes: Tables<"size_presets">[];
  selectedSizeId: string | null;
  onSelectSize: (size: Tables<"size_presets">) => void;
}

const SizeSelector = ({ sizes, selectedSizeId, onSelectSize }: SizeSelectorProps) => {
  const { t, i18n } = useTranslation();
  const cmLabel = i18n.language === "he" ? "ס״מ" : "cm";

  if (sizes.length === 0) {
    return (
      <p className="font-body text-sm text-muted-foreground text-center py-8">
        {t("order.noSizes")}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {sizes.map((size) => (
        <button
          key={size.id}
          onClick={() => onSelectSize(size)}
          className={cn(
            "h-11 px-4 border rounded-md text-center transition-colors duration-150",
            "font-body text-sm",
            selectedSizeId === size.id
              ? "border-accent bg-accent/10 text-foreground font-medium"
              : "border-border/60 text-muted-foreground hover:border-accent/40 hover:text-foreground"
          )}
        >
          <span dir="ltr" className="font-medium inline-block">{size.width_cm}×{size.height_cm}</span>
          {" "}
          <span className="text-xs text-muted-foreground">{cmLabel}</span>
        </button>
      ))}
    </div>
  );
};

export default SizeSelector;
