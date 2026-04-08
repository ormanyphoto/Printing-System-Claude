import { useEffect, useRef } from 'react';

interface HeroProps {
  lang: 'en' | 'he';
  t: (en: string, he: string) => string;
}

export default function Hero({ lang, t }: HeroProps) {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (bgRef.current && window.scrollY < window.innerHeight) {
        bgRef.current.style.transform = `translateY(${window.scrollY * 0.28}px)`;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section id="home">
      <div id="hero">
        <div className="hero-bg">
          <div className="hero-bg-img" ref={bgRef}></div>
          <div className="hero-gradient"></div>
        </div>

        <div className="hero-content">
          <div className="hero-eyebrow">
            <div className="hero-eyebrow-line"></div>
            <span>{t('Fine Art Printing Studio · Holon, Israel', 'סטודיו להדפסות אמנות · חולון, ישראל')}</span>
          </div>
          <h1 dangerouslySetInnerHTML={{
            __html: t('Where Art<br>Meets <em>Precision</em>', 'בין אמנות<br>ל<em>דיוק</em>')
          }} />
          <p className="hero-sub">
            {t(
              "Israel's only ChromaLuxe Plus certified lab. We transform your photography and artwork into extraordinary fine art prints — HD metal, acrylic, fine art paper and more.",
              'המעבדה היחידה עם אישור ChromaLuxe Plus בישראל. אנו הופכים את הצילום ויצירות האמנות שלך להדפסות יוצאות דופן — מתכת HD, אקרילית, נייר אמנות ועוד.'
            )}
          </p>
          <div className="hero-actions">
            <a href="#order" className="btn btn-gold">
              {t('Start Your Order', 'התחל להזמין')}
              <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
            </a>
            <a href="#products" className="btn btn-outline-white">{t('Explore Products', 'גלה מוצרים')}</a>
          </div>
        </div>

        <div className="hero-stats">
          <div className="hero-stat">
            <span className="stat-num">15+</span>
            <span className="stat-lbl">{t('Years Active', 'שנות פעילות')}</span>
          </div>
          <div className="hero-stat">
            <span className="stat-num">4K+</span>
            <span className="stat-lbl">{t('Happy Clients', 'לקוחות מרוצים')}</span>
          </div>
          <div className="hero-stat">
            <span className="stat-num">#1</span>
            <span className="stat-lbl">{t('Certified in IL', 'מוסמך בישראל')}</span>
          </div>
        </div>

        <div className="hero-scroll">
          <div className="scroll-bar"></div>
          <span className="scroll-label">{t('Scroll', 'גלול')}</span>
        </div>
      </div>
    </section>
  );
}
