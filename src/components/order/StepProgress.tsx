import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
}

export default function StepProgress({ currentStep, totalSteps }: StepProgressProps) {
  const { t } = useTranslation();
  const steps = [
    t('order.step1'), t('order.step2'), t('order.step3'),
    t('order.step4'), t('order.step5'),
  ];

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {steps.slice(0, totalSteps).map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div key={index} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                    isCompleted && 'bg-primary text-primary-foreground',
                    isCurrent && 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2',
                    !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : stepNumber}
                </div>
                <span className="mt-1 text-xs text-muted-foreground hidden sm:block">{label}</span>
              </div>
              {index < totalSteps - 1 && (
                <div className={cn('h-0.5 flex-1 mx-2', isCompleted ? 'bg-primary' : 'bg-muted')} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
