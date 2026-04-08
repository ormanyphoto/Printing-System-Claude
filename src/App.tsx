import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Marquee from './components/Marquee';
import Products from './components/Products';
import Features from './components/Features';
import Process from './components/Process';
import Gallery from './components/Gallery';
import OrderSection from './components/OrderSection';
import About from './components/About';
import CertBand from './components/CertBand';
import Testimonials from './components/Testimonials';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Toast from './components/Toast';
import MobileMenu from './components/MobileMenu';

export type Lang = 'en' | 'he';

export interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (en: string, he: string) => string;
}

function App() {
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
    // Scroll reveal
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('revealed');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -64px 0px' });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // Initial reveal for above-fold
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
      <OrderSection {...ctx} showToast={showToast} />
      <About {...ctx} />
      <CertBand {...ctx} />
      <Testimonials {...ctx} />
      <Contact {...ctx} showToast={showToast} />
      <Footer {...ctx} />
      <a href="#order" className="sticky-cta">{t('Order Now →', 'הזמן עכשיו →')}</a>
      <Toast message={toastMsg} visible={toastVisible} />
    </>
  );
}

export default App;
