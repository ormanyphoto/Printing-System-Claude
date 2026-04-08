import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CanvasOptionsSelectorProps {
  selectedEdgeWrap: string;
  onEdgeWrapChange: (value: string) => void;
}

const edgeWraps = [
  { value: 'mirror', label: 'Mirror Wrap' },
  { value: 'stretch', label: 'Stretch Wrap' },
  { value: 'white', label: 'White Edge' },
  { value: 'black', label: 'Black Edge' },
];

export default function CanvasOptionsSelector({ selectedEdgeWrap, onEdgeWrapChange }: CanvasOptionsSelectorProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('order.canvasOptions')}</CardTitle>
      </CardHeader>
      <CardContent>
        <label className="text-sm font-medium mb-1 block">{t('order.edgeWrap')}</label>
        <Select value={selectedEdgeWrap} onValueChange={onEdgeWrapChange}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {edgeWraps.map(ew => (
              <SelectItem key={ew.value} value={ew.value}>{ew.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
