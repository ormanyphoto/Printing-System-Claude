import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Package, Upload, Settings, Eye, ShoppingCart } from "lucide-react";

interface StepProgressProps {
  currentStep: number;
}

const STEPS = [
  { labelKey: "steps.product", icon: Package },
  { labelKey: "steps.upload", icon: Upload },
  { labelKey: "steps.customize", icon: Settings },
  { labelKey: "steps.preview", icon: Eye },
  { labelKey: "steps.summary", icon: ShoppingCart },
];

const StepProgress = ({ currentStep }: StepProgressProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center w-full gap-1">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const isActive = i + 1 === currentStep;
        const isDone = i + 1 < currentStep;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="flex items-center w-full">
              <div
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors duration-300",
                  isDone || isActive ? "bg-accent" : "bg-border"
                )}
              />
            </div>
            <div className="flex items-center gap-1">
              <Icon
                className={cn(
                  "w-3.5 h-3.5 transition-colors",
                  isActive ? "text-accent" : isDone ? "text-accent/70" : "text-muted-foreground/50"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={cn(
                  "font-body text-[10px] uppercase tracking-wider hidden sm:inline",
                  isActive ? "text-accent font-bold" : isDone ? "text-accent/70 font-medium" : "text-muted-foreground/50"
                )}
              >
                {t(step.labelKey, step.labelKey.split(".")[1])}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StepProgress;
