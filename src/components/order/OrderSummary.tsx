import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface SummaryLine {
  label: string;
  value: string;
}

interface OrderSummaryProps {
  lines: SummaryLine[];
}

const OrderSummary = ({ lines }: OrderSummaryProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  if (lines.length === 0) return null;

  return (
    <div className="border border-border rounded-md overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 font-body text-sm font-semibold text-foreground hover:bg-muted/30 transition-colors"
      >
        <span>{t("summary.viewOrder", "View Order Summary")}</span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-border pt-3 animate-fade-in">
          {lines.map((line, i) => (
            <div key={i} className="flex justify-between font-body text-sm">
              <span className="text-muted-foreground">{line.label}</span>
              <span className="text-foreground font-medium">{line.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderSummary;
