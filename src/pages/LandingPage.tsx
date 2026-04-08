import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Marquee from '../components/Marquee';
import Products from '../components/Products';
import Features from '../components/Features';
import Process from '../components/Process';
import Gallery from '../components/Gallery';
import About from '../components/About';
import CertBand from '../components/CertBand';
import Testimonials from '../components/Testimonials';
import Contact from '../components/Contact';
import Footer from '../components/Footer';
import Toast from '../components/Toast';
import MobileMenu from '../components/MobileMenu';

export type Lang = 'en' | 'he';

export interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (en: string, he: string) => string;
}

function LandingPage() {
  const [lang, setLangState] = useState<Lang>('en');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const setLang = (l: Lang) => {
    setLangState(l);
    document.documentElement.lang = l;
    document.documentElement.dir = l === 'he' ? 'rtl' : 'ltr';
    document.body.classList.toggle('rtl', l === 'he');
    document.body.style.fontFamily = l === 'he'
      ? "'Heebo', 'Arial Hebrew', sans-serif"
      : "'DM Sans', 'Helvetica Neue', sans-serif";
    showToast(l === 'he' ? 'שפה: עברית ✓' : 'Language: English ✓');
  };

  const t = (en: string, he: string) => lang === 'he' ? he : en;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3200);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('revealed');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -64px 0px' });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    document.querySelectorAll('.reveal').forEach(el => {
      if (el.getBoundingClientRect().top < window.innerHeight) {
        el.classList.add('revealed');
      }
    });

    return () => observer.disconnect();
  }, []);

  const ctx = { lang, setLang, t };

  return (
    <>
      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        {...ctx}
      />
      <Navbar
        onMenuOpen={() => setMobileMenuOpen(true)}
        {...ctx}
      />
      <Hero {...ctx} />
      <Marquee {...ctx} />
      <Products {...ctx} showToast={showToast} />
      <Features {...ctx} />
      <Process {...ctx} />
      <Gallery {...ctx} />

      {/* Order CTA Section */}
      <section id="order" className="section" style={{ background: 'var(--off-white)', textAlign: 'center' }}>
        <div className="container">
          <span className="eyebrow">{t('Start Creating', 'התחילו ליצור')}</span>
          <h2 className="section-title" style={{ marginBottom: '24px' }}>
            {t('Ready to Print Your ', 'מוכנים להדפיס את ')}
            <em>{t('Masterpiece', 'היצירה שלכם')}</em>
            {t('?', '?')}
          </h2>
          <p className="section-sub" style={{ maxWidth: '600px', margin: '0 auto 40px' }}>
            {t(
              'Upload your image, customize every detail — material, size, framing — and preview in 3D before you order.',
              'העלו את התמונה שלכם, התאימו כל פרט — חומר, גודל, מסגרת — וצפו בתצוגה תלת-ממדית לפני ההזמנה.'
            )}
          </p>
          <Link
            to="/order"
            className="btn btn-primary"
            style={{ fontSize: '14px', padding: '18px 48px' }}
          >
            {t('Start Your Order →', 'התחילו הזמנה →')}
          </Link>
        </div>
      </section>

      <About {...ctx} />
      <CertBand {...ctx} />
      <Testimonials {...ctx} />
      <Contact {...ctx} showToast={showToast} />
      <Footer {...ctx} />
      <Link to="/order" className="sticky-cta">{t('Order Now →', 'הזמן עכשיו →')}</Link>
      <Toast message={toastMsg} visible={toastVisible} />
    </>
  );
}

export default LandingPage;
