import { useTranslation } from "react-i18next";
import { formatILS } from "@/lib/pricing";

interface PriceLineItem {
  label: string;
  value: string;
}

interface PriceSummaryProps {
  productName: string;
  subtypeName?: string;
  finishName?: string;
  widthCm: number;
  heightCm: number;
  totalWidthCm?: number;
  totalHeightCm?: number;
  lineItems: PriceLineItem[];
  totalPrice: number;
  frameStyleName?: string;
  frameColorName?: string;
  frameWidthCm?: number;
  glazingName?: string;
  subframeName?: string;
  canvasEdgeWrapName?: string;
  whiteBorders?: string;
  actions?: React.ReactNode;
}

const PriceSummary = ({
  productName,
  subtypeName,
  finishName,
  widthCm,
  heightCm,
  totalWidthCm,
  totalHeightCm,
  lineItems,
  totalPrice,
  frameStyleName,
  frameColorName,
  frameWidthCm,
  glazingName,
  subframeName,
  canvasEdgeWrapName,
  whiteBorders,
  actions,
}: PriceSummaryProps) => {
  const { t, i18n } = useTranslation();
  const cmLabel = i18n.language === "he" ? "ס״מ" : "cm";
  const displayW = totalWidthCm ?? widthCm;
  const displayH = totalHeightCm ?? heightCm;
  const areaSqm = (displayW * displayH) / 10000;

  return (
    <div className="border border-border rounded-sm p-6 bg-card">
      <p className="font-body text-xs uppercase tracking-[0.2em] text-accent mb-4 font-semibold">
        {t("price.summary")}
      </p>
      <div className="space-y-2 font-body text-sm text-muted-foreground">
        <div className="flex justify-between">
          <span>{t("price.product")}</span>
          <span className="text-foreground">{productName}</span>
        </div>
        {subtypeName && (
          <div className="flex justify-between">
            <span>{t("price.type")}</span>
            <span className="text-foreground">{subtypeName}</span>
          </div>
        )}
        {finishName && (
          <div className="flex justify-between">
            <span>{t("price.finish")}</span>
            <span className="text-foreground">{finishName}</span>
          </div>
        )}
        {frameStyleName && (
          <div className="flex justify-between">
            <span>{t("price.frame")}</span>
            <span className="text-foreground">{frameStyleName}{frameWidthCm ? ` (${frameWidthCm} ${cmLabel})` : ""}</span>
          </div>
        )}
        {frameColorName && (
          <div className="flex justify-between">
            <span>{t("price.frameColor")}</span>
            <span className="text-foreground">{frameColorName}</span>
          </div>
        )}
        {glazingName && (
          <div className="flex justify-between">
            <span>{t("price.glazing")}</span>
            <span className="text-foreground">{glazingName}</span>
          </div>
        )}
        {subframeName && (
          <div className="flex justify-between">
            <span>{t("price.subframe", "Subframe")}</span>
            <span className="text-foreground">{subframeName}</span>
          </div>
        )}
        {canvasEdgeWrapName && (
          <div className="flex justify-between">
            <span>{t("price.edgeWrap", "Edge Wrap")}</span>
            <span className="text-foreground">{canvasEdgeWrapName}</span>
          </div>
        )}
        {whiteBorders && (
          <div className="flex justify-between">
            <span>{t("price.whiteBorder", "White Border")}</span>
            <span className="text-foreground">{whiteBorders}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>{t("price.size")}</span>
          <span dir="ltr" className="text-foreground inline-block">{widthCm}×{heightCm} {cmLabel}</span>
        </div>
        {totalWidthCm && totalHeightCm && (totalWidthCm !== widthCm || totalHeightCm !== heightCm) && (
          <div className="flex justify-between">
            <span>{t("price.totalSize")}</span>
            <span dir="ltr" className="text-foreground inline-block">{totalWidthCm.toFixed(1)}×{totalHeightCm.toFixed(1)} {cmLabel}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>{t("price.area")}</span>
          <span className="text-foreground">{areaSqm.toFixed(2)} m²</span>
        </div>
        {lineItems.map((item, i) => (
          <div key={i} className="flex justify-between">
            <span>{item.label}</span>
            <span className="text-foreground">{item.value}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-border mt-4 pt-4 flex justify-between items-baseline">
        <span className="font-body text-sm text-muted-foreground">{t("price.total")}</span>
        <span className="font-display text-2xl text-foreground">{formatILS(totalPrice)}</span>
      </div>
      {actions && <div className="mt-4">{actions}</div>}
    </div>
  );
};

export default PriceSummary;
