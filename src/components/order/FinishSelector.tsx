import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useLocalizedField } from '@/hooks/useLocalizedField';

interface Finish {
  id: string;
  name_en: string;
  name_he: string;
  surcharge_pct: number;
  thumbnail_url?: string;
  enabled: boolean;
}

interface FinishSelectorProps {
  finishes: Finish[];
  selectedId: string | null;
  onSelect: (finish: Finish) => void;
}

export default function FinishSelector({ finishes, selectedId, onSelect }: FinishSelectorProps) {
  const { t } = useTranslation();
  const { getField } = useLocalizedField();

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">{t('order.selectFinish')}</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {finishes.filter(f => f.enabled).map((finish) => (
          <Card
            key={finish.id}
            className={cn(
              'cursor-pointer transition-all hover:shadow-md',
              selectedId === finish.id && 'ring-2 ring-primary'
            )}
            onClick={() => onSelect(finish)}
          >
            <CardContent className="p-4 text-center">
              {finish.thumbnail_url && (
                <img src={finish.thumbnail_url} alt={getField(finish, 'name')} className="w-full h-20 object-cover rounded mb-2" />
              )}
              <p className="font-medium">{getField(finish, 'name')}</p>
              {finish.surcharge_pct > 0 && (
                <p className="text-xs text-muted-foreground mt-1">+{finish.surcharge_pct}%</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
