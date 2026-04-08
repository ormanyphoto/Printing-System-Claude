import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';

interface OrderSummaryProps {
  imagePreview: string | null;
  productName: string;
  sizeName: string;
  finishName: string;
  total: number;
  onSubmit: () => void;
}

export default function OrderSummary({ imagePreview, productName, sizeName, finishName, total, onSubmit }: OrderSummaryProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('order.summary')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {imagePreview && (
          <img src={imagePreview} alt="Order preview" className="w-full h-48 object-contain rounded bg-muted" />
        )}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Product</span><span>{productName}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Size</span><span>{sizeName}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Finish</span><span>{finishName}</span></div>
          <div className="flex justify-between font-semibold text-base pt-2 border-t">
            <span>{t('order.total')}</span>
            <span>{total.toFixed(2)} ILS</span>
          </div>
        </div>
        <Button className="w-full" size="lg" onClick={onSubmit}>
          <ShoppingCart className="mr-2 h-4 w-4" /> {t('order.addToCart')}
        </Button>
      </CardContent>
    </Card>
  );
}
