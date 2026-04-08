import { useEffect, useState } from 'react';

interface NavbarProps {
  lang: 'en' | 'he';
  setLang: (l: 'en' | 'he') => void;
  t: (en: string, he: string) => string;
  onMenuOpen: () => void;
}

export default function Navbar({ lang, setLang, t, onMenuOpen }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 70);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav id="navbar" className={scrolled ? 'scrolled' : ''}>
      <a href="#home" className="nav-logo">
        <div className="nav-logo-mark">
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="20,3 37,12 37,28 20,37 3,28 3,12" fill="#C8A84B" opacity="0.15"/>
            <polygon points="20,3 37,12 37,28 20,37 3,28 3,12" fill="none" stroke="#C8A84B" strokeWidth="1.5"/>
            <polygon points="20,11 29,16 29,24 20,29 11,24 11,16" fill="#C8A84B"/>
          </svg>
        </div>
        <span className="nav-logo-text">Chroma<span>Luxe</span></span>
      </a>

      <div className="nav-links">
        <a href="#products" className="nav-link">{t('Products', 'מוצרים')}</a>
        <a href="#process" className="nav-link">{t('Process', 'תהליך')}</a>
        <a href="#gallery" className="nav-link">{t('Gallery', 'גלריה')}</a>
        <a href="#about" className="nav-link">{t('About', 'אודות')}</a>
        <a href="#contact" className="nav-link">{t('Contact', 'צור קשר')}</a>
      </div>

      <div className="nav-right">
        <div className="lang-toggle">
          <button className={`lang-btn${lang === 'en' ? ' active' : ''}`} onClick={() => setLang('en')}>EN</button>
          <button className={`lang-btn${lang === 'he' ? ' active' : ''}`} onClick={() => setLang('he')}>עב</button>
        </div>
        <a href="#order" className="btn-nav">{t('Order Now', 'הזמן עכשיו')}</a>
        <div className="hamburger" onClick={onMenuOpen}>
          <span></span><span></span><span></span>
        </div>
      </div>
    </nav>
  );
}
