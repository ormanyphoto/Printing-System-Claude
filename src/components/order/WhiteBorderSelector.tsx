import { useTranslation } from 'react-i18next';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface WhiteBorderSelectorProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export default function WhiteBorderSelector({ enabled, onToggle }: WhiteBorderSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center space-x-3 p-4 rounded-lg border">
      <Switch id="white-border" checked={enabled} onCheckedChange={onToggle} />
      <Label htmlFor="white-border" className="cursor-pointer">{t('order.whiteBorder')}</Label>
    </div>
  );
}
