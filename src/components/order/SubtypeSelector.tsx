import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useLocalizedField } from '@/hooks/useLocalizedField';

interface ProductSubtype {
  id: string;
  name_en: string;
  name_he: string;
  description_en?: string;
  description_he?: string;
  thickness_mm?: number;
  thumbnail_url?: string;
  enabled: boolean;
}

interface SubtypeSelectorProps {
  subtypes: ProductSubtype[];
  selectedId: string | null;
  onSelect: (subtype: ProductSubtype) => void;
}

export default function SubtypeSelector({ subtypes, selectedId, onSelect }: SubtypeSelectorProps) {
  const { t } = useTranslation();
  const { getField } = useLocalizedField();

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Select Type</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {subtypes.filter(s => s.enabled).map(subtype => (
          <Card
            key={subtype.id}
            className={cn('cursor-pointer transition-all hover:shadow-md', selectedId === subtype.id && 'ring-2 ring-primary')}
            onClick={() => onSelect(subtype)}
          >
            <CardContent className="p-4">
              {subtype.thumbnail_url && (
                <img src={subtype.thumbnail_url} alt={getField(subtype, 'name')} className="w-full h-20 object-cover rounded mb-2" />
              )}
              <p className="font-medium">{getField(subtype, 'name')}</p>
              {subtype.thickness_mm && <p className="text-xs text-muted-foreground">{subtype.thickness_mm}mm</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
