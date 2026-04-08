import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export default function Header() {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'he' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold tracking-tight">Or Many Fine Art</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link to="/order" className="text-sm font-medium hover:text-primary transition-colors">
            {t('nav.order')}
          </Link>
          <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors">
            {t('nav.login')}
          </Link>
          <Button variant="ghost" size="icon" onClick={toggleLanguage} title="Toggle Language">
            <Globe className="h-4 w-4" />
          </Button>
        </nav>
      </div>
    </header>
  );
}
