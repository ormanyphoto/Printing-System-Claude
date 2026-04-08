import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useLocalizedField } from '@/hooks/useLocalizedField';

interface Product {
  id: string;
  name_en: string;
  name_he: string;
  slug: string;
  description_en?: string;
  description_he?: string;
  thumbnail_url?: string;
  enabled: boolean;
}

interface ProductSelectorProps {
  products: Product[];
  selectedId: string | null;
  onSelect: (product: Product) => void;
}

export default function ProductSelector({ products, selectedId, onSelect }: ProductSelectorProps) {
  const { t } = useTranslation();
  const { getField } = useLocalizedField();

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">{t('order.selectProduct')}</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.filter(p => p.enabled).map((product) => (
          <Card
            key={product.id}
            className={cn(
              'cursor-pointer transition-all hover:shadow-md',
              selectedId === product.id && 'ring-2 ring-primary'
            )}
            onClick={() => onSelect(product)}
          >
            <CardContent className="p-4">
              {product.thumbnail_url && (
                <img src={product.thumbnail_url} alt={getField(product, 'name')} className="w-full h-32 object-cover rounded mb-3" />
              )}
              <h4 className="font-medium">{getField(product, 'name')}</h4>
              <p className="text-sm text-muted-foreground mt-1">{getField(product, 'description')}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
