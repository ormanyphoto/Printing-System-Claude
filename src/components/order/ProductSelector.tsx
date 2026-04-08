import { cn } from "@/lib/utils";
import { useLocalizedField } from "@/hooks/useLocalizedField";
import MaterialTooltip from "@/components/order/MaterialTooltip";
import type { Tables } from "@/integrations/supabase/types";

// Local product images as fallback
import imgHdMetal from "@/assets/product-hd-metal.jpg";
import imgCanvas from "@/assets/product-canvas.jpg";
import imgDibond from "@/assets/product-dibond.jpg";
import imgPlexiglass from "@/assets/product-plexiglass.jpg";
import imgPhotoPaper from "@/assets/product-photo-paper.jpg";
import imgFramed from "@/assets/product-framed.jpg";
import imgWoodPrint from "@/assets/product-wood-print.jpg";

const SLUG_IMAGES: Record<string, string> = {
  "hd-metal": imgHdMetal,
  canvas: imgCanvas,
  dibond: imgDibond,
  plexiglass: imgPlexiglass,
  "photo-paper": imgPhotoPaper,
  framed: imgFramed,
  "wood-print": imgWoodPrint,
};

interface ProductSelectorProps {
  products: Tables<"products">[];
  selectedSlug: string | null;
  onSelect: (product: Tables<"products">) => void;
}

const HIDDEN_SLUGS = ["framed"];

const ProductSelector = ({ products, selectedSlug, onSelect }: ProductSelectorProps) => {
  const { lf } = useLocalizedField();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {products
        .filter((p) => !HIDDEN_SLUGS.includes(p.slug))
        .map((p) => {
          const thumb = p.thumbnail_url || SLUG_IMAGES[p.slug] || "";
          const isSelected = selectedSlug === p.slug;
          return (
            <MaterialTooltip key={p.id} productSlug={p.slug}>
              <button
                onClick={() => onSelect(p)}
                className={cn(
                  "group relative flex flex-col overflow-hidden rounded-lg border-2 transition-all duration-200",
                  isSelected
                    ? "border-accent shadow-md ring-1 ring-accent/30"
                    : "border-border/40 hover:border-accent/50 hover:shadow-sm"
                )}
              >
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  {thumb && (
                    <img
                      src={thumb}
                      alt={lf(p.name_en, p.name_he)}
                      className={cn(
                        "w-full h-full object-cover transition-transform duration-300",
                        "group-hover:scale-105"
                      )}
                    />
                  )}
                </div>
                <div className="px-2.5 py-2 text-left">
                  <p
                    className={cn(
                      "font-body text-xs font-semibold leading-tight",
                      isSelected ? "text-accent" : "text-foreground"
                    )}
                  >
                    {lf(p.name_en, p.name_he)}
                  </p>
                </div>
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            </MaterialTooltip>
          );
        })}
    </div>
  );
};

export default ProductSelector;
