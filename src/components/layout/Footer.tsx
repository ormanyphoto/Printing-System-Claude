import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t bg-muted/50 py-8">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Or Many Fine Art. All rights reserved.</p>
      </div>
    </footer>
  );
}
