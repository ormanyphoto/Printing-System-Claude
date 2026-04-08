interface FeaturesProps { t: (en: string, he: string) => string; }

const features = [
  { icon: <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, title: ['ChromaLuxe Plus Certified', 'מוסמך ChromaLuxe Plus'], desc: ["Israel's only ChromaLuxe Plus certified laboratory. Internationally recognized quality and process standards.", 'המעבדה היחידה עם אישור ChromaLuxe Plus בישראל. סטנדרטים בינלאומיים מוכרים של איכות ותהליך.'] },
  { icon: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>, title: ['Professional Color Management', 'ניהול צבעים מקצועי'], desc: ['Calibrated Epson professional printers with custom ICC profiles. What you see on screen is exactly what you get.', 'מדפסות Epson מקצועיות מכוילות עם פרופילי ICC מותאמים. מה שרואים על המסך הוא בדיוק מה שמקבלים.'] },
  { icon: <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, title: ['Same-Day Rush Available', 'הזמנה דחופה ביום אחד'], desc: ['Rush orders accepted for urgent deadlines. Standard 2-4 business day production. Pickup in Holon.', 'הזמנות דחופות מתקבלות לדדליינים קריטיים. ייצור סטנדרטי: 2-4 ימי עסקים. איסוף עצמי בחולון.'] },
  { icon: <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>, title: ['Handcrafted, Every Time', 'עשוי ביד, כל פעם'], desc: ['Every print personally inspected and finished before dispatch. We treat each order like a gallery commission.', 'כל הדפסה נבדקת ומוגמרת אישית לפני המשלוח. אנו מתייחסים לכל הזמנה כמו לעמלת גלריה.'] },
];

export default function Features({ t }: FeaturesProps) {
  const delays = ['', 'reveal-d1', 'reveal-d2', 'reveal-d3'];
  return (
    <section id="features" className="section-sm">
      <div className="container" style={{ paddingBottom: 0 }}>
        <div className="reveal" style={{ marginBottom: 56 }}>
          <div className="eyebrow" style={{ color: 'rgba(200,168,75,0.9)' }}>{t('Why ChromaLuxe', 'למה ChromaLuxe')}</div>
          <h2 className="section-title" style={{ color: 'white' }} dangerouslySetInnerHTML={{ __html: t('Uncompromising<br><em>Quality</em>', 'איכות<br><em>ללא פשרות</em>') }} />
        </div>
      </div>
      <div className="features-grid">
        {features.map((f, i) => (
          <div key={i} className={`feature-card reveal ${delays[i]}`}>
            <div className="feature-icon-wrap">{f.icon}</div>
            <div className="feature-title">{t(f.title[0], f.title[1])}</div>
            <div className="feature-desc">{t(f.desc[0], f.desc[1])}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
