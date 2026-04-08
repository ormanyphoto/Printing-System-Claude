import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useLocalizedField } from '@/hooks/useLocalizedField';

interface SubframeOption {
  id: string;
  name_en: string;
  name_he: string;
  material: string;
  width_cm: number;
  height_cm: number;
  surcharge_pct: number;
  enabled: boolean;
}

interface SubframeSelectorProps {
  options: SubframeOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function SubframeSelector({ options, selectedId, onSelect }: SubframeSelectorProps) {
  const { t } = useTranslation();
  const { getField } = useLocalizedField();

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">{t('order.subframe')}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.filter(o => o.enabled).map(option => (
          <Card
            key={option.id}
            className={cn('cursor-pointer transition-all hover:shadow-md', selectedId === option.id && 'ring-2 ring-primary')}
            onClick={() => onSelect(option.id)}
          >
            <CardContent className="p-4">
              <p className="font-medium">{getField(option, 'name')}</p>
              <p className="text-xs text-muted-foreground">{option.material} - {option.width_cm}x{option.height_cm}cm</p>
              {option.surcharge_pct > 0 && <p className="text-xs text-muted-foreground">+{option.surcharge_pct}%</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
