import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function HeroSection() {
  const { t } = useTranslation();
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-neutral-50 to-neutral-100 py-24 md:py-32">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
          {t('home.title')}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto">
          {t('home.description')}
        </p>
        <div className="mt-8">
          <Button asChild size="lg" className="text-base">
            <Link to="/order">
              {t('home.cta')} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
