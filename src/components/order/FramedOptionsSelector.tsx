import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocalizedField } from '@/hooks/useLocalizedField';

interface FrameStyle { id: string; name_en: string; name_he: string; material: string; price_per_cm: number; }
interface FrameColor { id: string; color_name_en: string; color_name_he: string; hex_code: string; }
interface FrameWidth { id: string; width_cm: number; surcharge_pct: number; }
interface GlazingOption { id: string; name_en: string; name_he: string; price_sqm: number; }

interface FramedOptionsSelectorProps {
  frameStyles: FrameStyle[];
  frameColors: FrameColor[];
  frameWidths: FrameWidth[];
  glazingOptions: GlazingOption[];
  selectedFrameStyleId: string | null;
  selectedFrameColorId: string | null;
  selectedFrameWidthId: string | null;
  selectedGlazingId: string | null;
  onFrameStyleChange: (id: string) => void;
  onFrameColorChange: (id: string) => void;
  onFrameWidthChange: (id: string) => void;
  onGlazingChange: (id: string) => void;
}

export default function FramedOptionsSelector({
  frameStyles, frameColors, frameWidths, glazingOptions,
  selectedFrameStyleId, selectedFrameColorId, selectedFrameWidthId, selectedGlazingId,
  onFrameStyleChange, onFrameColorChange, onFrameWidthChange, onGlazingChange,
}: FramedOptionsSelectorProps) {
  const { t } = useTranslation();
  const { getField } = useLocalizedField();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('order.selectFrame')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">{t('order.frameStyle')}</label>
          <Select value={selectedFrameStyleId || ''} onValueChange={onFrameStyleChange}>
            <SelectTrigger><SelectValue placeholder="Select style..." /></SelectTrigger>
            <SelectContent>
              {frameStyles.map(fs => (
                <SelectItem key={fs.id} value={fs.id}>{getField(fs, 'name')} - {fs.material}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">{t('order.frameColor')}</label>
          <Select value={selectedFrameColorId || ''} onValueChange={onFrameColorChange}>
            <SelectTrigger><SelectValue placeholder="Select color..." /></SelectTrigger>
            <SelectContent>
              {frameColors.map(fc => (
                <SelectItem key={fc.id} value={fc.id}>
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full border" style={{ backgroundColor: fc.hex_code }} />
                    {fc.color_name_en}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">{t('order.frameWidth')}</label>
          <Select value={selectedFrameWidthId || ''} onValueChange={onFrameWidthChange}>
            <SelectTrigger><SelectValue placeholder="Select width..." /></SelectTrigger>
            <SelectContent>
              {frameWidths.map(fw => (
                <SelectItem key={fw.id} value={fw.id}>{fw.width_cm} cm {fw.surcharge_pct > 0 ? `(+${fw.surcharge_pct}%)` : ''}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">{t('order.glazing')}</label>
          <Select value={selectedGlazingId || ''} onValueChange={onGlazingChange}>
            <SelectTrigger><SelectValue placeholder="Select glazing..." /></SelectTrigger>
            <SelectContent>
              {glazingOptions.map(g => (
                <SelectItem key={g.id} value={g.id}>{getField(g, 'name')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
