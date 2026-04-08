interface AboutProps { t: (en: string, he: string) => string; }

export default function About({ t }: AboutProps) {
  return (
    <section id="about" className="section">
      <div className="container">
        <div className="about-grid">
          <div className="about-img-wrap reveal">
            <img className="about-img" src="https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=900&q=85" alt="ChromaLuxe Studio" loading="lazy" />
            <div className="about-badge">
              <div className="about-badge-num">+</div>
              <div className="about-badge-lbl">ChromaLuxe<br/>Certified Lab</div>
            </div>
          </div>
          <div className="about-text reveal reveal-d1">
            <div className="eyebrow">{t('Our Story', 'הסיפור שלנו')}</div>
            <h2 className="section-title" dangerouslySetInnerHTML={{ __html: t("Israel's Premier<br><em>Fine Art Lab</em>", 'מעבדת האמנות<br>ה<em>מובילה</em> בישראל') }} />
            <div className="divider"></div>
            <p>{t("ChromaLuxe is Israel's only ChromaLuxe Plus certified fine art printing studio, located in Holon. Founded by Or Many, the studio combines cutting-edge technology with artisanal craftsmanship to produce prints of unparalleled quality.", 'ChromaLuxe היא מעבדת הדפסת האמנות היחידה עם אישור ChromaLuxe Plus בישראל, הממוקמת בחולון. הסטודיו שייסד Or Many משלב טכנולוגיה חדשנית עם מלאכת יד אמנותית להפקת הדפסות באיכות ללא תחרות.')}</p>
            <p>{t('Equipped with professional Epson printers, a Sefa heat press, and CNC precision cutting machines, every print is personally inspected. We specialize in sublimation printing on ChromaLuxe HD aluminum up to 240×110 cm.', 'מצויד במדפסות Epson מקצועיות, מכבש Sefa ומכונות חיתוך CNC מדויקות, כל הדפסה נבדקת אישית. אנו מתמחים בהדפסת סובלימציה על אלומיניום ChromaLuxe HD עד 240×110 ס"מ.')}</p>
            <p>{t('We serve professional photographers, digital artists, interior designers, galleries, and businesses throughout Israel — gallery-quality results every time.', 'אנו משרתים צלמים מקצועיים, אמנים דיגיטליים, מעצבי פנים, גלריות ועסקים ברחבי ישראל — ומספקים תוצאות ברמת גלריה בכל פעם.')}</p>
            <div className="about-certs">
              {[
                ['ChromaLuxe Plus Certified', 'מוסמך ChromaLuxe Plus'],
                ['ICC Calibrated Workflow', 'תהליך כיול ICC'],
                ['15+ Years Experience', '15+ שנות ניסיון'],
                ['CNC Precision Cutting', 'חיתוך CNC מדויק'],
              ].map(([en, he], i) => (
                <div className="cert-pill" key={i}>
                  <div className="cert-dot"></div>
                  <span className="cert-pill-text">{t(en, he)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
