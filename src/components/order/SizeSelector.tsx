import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SizePreset {
  id: string;
  width_cm: number;
  height_cm: number;
  aspect_ratio: string;
  enabled: boolean;
}

interface SizeSelectorProps {
  sizes: SizePreset[];
  selectedId: string | null;
  onSelect: (size: SizePreset) => void;
}

export default function SizeSelector({ sizes, selectedId, onSelect }: SizeSelectorProps) {
  const { t } = useTranslation();

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">{t('order.selectSize')}</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sizes.filter(s => s.enabled).map((size) => (
          <Card
            key={size.id}
            className={cn(
              'cursor-pointer transition-all hover:shadow-md',
              selectedId === size.id && 'ring-2 ring-primary'
            )}
            onClick={() => onSelect(size)}
          >
            <CardContent className="p-4 text-center">
              <p className="font-medium">{size.width_cm} x {size.height_cm} cm</p>
              <p className="text-xs text-muted-foreground mt-1">({size.aspect_ratio})</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
