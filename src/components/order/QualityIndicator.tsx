import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface QualityIndicatorProps {
  dpi: number;
}

export default function QualityIndicator({ dpi }: QualityIndicatorProps) {
  const { t } = useTranslation();

  if (dpi >= 150) {
    return (
      <Badge variant="default" className="bg-green-600">
        <CheckCircle className="mr-1 h-3 w-3" /> {t('order.qualityExcellent')} ({dpi} DPI)
      </Badge>
    );
  }
  if (dpi >= 100) {
    return (
      <Badge variant="secondary" className="bg-yellow-500 text-white">
        <AlertTriangle className="mr-1 h-3 w-3" /> {t('order.qualityGood')} ({dpi} DPI)
      </Badge>
    );
  }
  return (
    <Badge variant="destructive">
      <XCircle className="mr-1 h-3 w-3" /> {t('order.qualityLow')} ({dpi} DPI)
    </Badge>
  );
}
