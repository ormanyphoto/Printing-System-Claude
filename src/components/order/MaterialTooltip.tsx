import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { useLocalizedField } from '@/hooks/useLocalizedField';

interface MaterialTooltipData {
  title_en: string;
  title_he: string;
  finish_en: string;
  finish_he: string;
  best_for_en: string;
  best_for_he: string;
  durability_en: string;
  durability_he: string;
}

interface MaterialTooltipProps {
  data: MaterialTooltipData;
}

export default function MaterialTooltip({ data }: MaterialTooltipProps) {
  const { getField } = useLocalizedField();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-4 w-4 text-muted-foreground cursor-help inline-block ml-1" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1 text-xs">
            <p><strong>{getField(data, 'title')}</strong></p>
            <p>Finish: {getField(data, 'finish')}</p>
            <p>Best for: {getField(data, 'best_for')}</p>
            <p>Durability: {getField(data, 'durability')}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
