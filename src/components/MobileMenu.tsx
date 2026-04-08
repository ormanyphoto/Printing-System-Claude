interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  lang: 'en' | 'he';
  setLang: (l: 'en' | 'he') => void;
  t: (en: string, he: string) => string;
}

export default function MobileMenu({ open, onClose, lang, setLang, t }: MobileMenuProps) {
  const scrollTo = (id: string) => {
    onClose();
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className={`mobile-menu${open ? ' open' : ''}`}>
      <span className="mobile-close" onClick={onClose}>✕</span>
      <a onClick={() => scrollTo('products')}>{t('Products', 'מוצרים')}</a>
      <a onClick={() => scrollTo('process')}>{t('Process', 'תהליך')}</a>
      <a onClick={() => scrollTo('gallery')}>{t('Gallery', 'גלריה')}</a>
      <a onClick={() => scrollTo('about')}>{t('About', 'אודות')}</a>
      <a onClick={() => scrollTo('contact')}>{t('Contact', 'צור קשר')}</a>
      <a onClick={() => scrollTo('order')} className="btn btn-gold" style={{ fontSize: 14, padding: '14px 32px' }}>
        {t('Order Now', 'הזמן עכשיו')}
      </a>
      <div className="mobile-lang">
        <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
        <button className={lang === 'he' ? 'active' : ''} onClick={() => setLang('he')}>עברית</button>
      </div>
    </div>
  );
}
