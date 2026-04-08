import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface EdgeWrapOption {
  id: string;
  labelKey: string;
  descriptionKey: string;
  surchargePercent: number;
}

const EDGE_WRAP_OPTIONS: EdgeWrapOption[] = [
  { id: "white", labelKey: "canvas.whiteEdges", descriptionKey: "canvas.whiteEdges.desc", surchargePercent: 0 },
  { id: "gallery", labelKey: "canvas.galleryWrap", descriptionKey: "canvas.galleryWrap.desc", surchargePercent: 10 },
  { id: "mirrored", labelKey: "canvas.mirroredWrap", descriptionKey: "canvas.mirroredWrap.desc", surchargePercent: 10 },
];

interface CanvasOptionsSelectorProps {
  selectedId: string;
  onSelect: (option: EdgeWrapOption) => void;
}

const CanvasOptionsSelector = ({ selectedId, onSelect }: CanvasOptionsSelectorProps) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {EDGE_WRAP_OPTIONS.map((opt) => {
        const isSelected = selectedId === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onSelect(opt)}
            className={cn(
              "group relative flex flex-col overflow-hidden rounded-lg border-2 transition-all duration-200",
              isSelected
                ? "border-accent shadow-md ring-1 ring-accent/30"
                : "border-border/40 hover:border-accent/50 hover:shadow-sm"
            )}
          >
            <div className="aspect-[4/3] overflow-hidden bg-muted flex items-center justify-center">
              <span className="font-display text-2xl text-muted-foreground/50">
                {opt.id === "white" ? "⬜" : opt.id === "gallery" ? "🖼️" : "🪞"}
              </span>
            </div>
            <div className="px-2.5 py-2 text-left flex items-start gap-1">
              <div className="flex-1">
                <p className={cn(
                  "font-body text-xs font-semibold leading-tight",
                  isSelected ? "text-accent" : "text-foreground"
                )}>
                  {t(opt.labelKey)}
                </p>
                {opt.surchargePercent > 0 && (
                  <p className="font-body text-[10px] text-muted-foreground mt-0.5">+{opt.surchargePercent}%</p>
                )}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="mt-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-help"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Info className="w-3.5 h-3.5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[220px] text-xs leading-relaxed">
                  {t(opt.descriptionKey)}
                </TooltipContent>
              </Tooltip>
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

export { EDGE_WRAP_OPTIONS };
export default CanvasOptionsSelector;
