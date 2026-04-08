import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';

interface PriceLineItem {
  label: string;
  amount: number;
}

interface PriceSummaryProps {
  items: PriceLineItem[];
  total: number;
}

export default function PriceSummary({ items, total }: PriceSummaryProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('order.summary')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span>{formatCurrency(item.amount)}</span>
            </div>
          ))}
        </div>
        <Separator className="my-3" />
        <div className="flex justify-between font-semibold">
          <span>{t('order.total')}</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
