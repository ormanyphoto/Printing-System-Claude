interface ProductsProps {
  t: (en: string, he: string) => string;
  showToast: (msg: string) => void;
}

const products = [
  { slug: 'hd-metal', tag: ['Signature', 'סיגנצ\'ר'], title: ['ChromaLuxe<br>HD Metal Prints', 'הדפסת<br>מתכת HD ChromaLuxe'], desc: ['Dye infused directly into premium aluminum panels. Vivid colors, extraordinary luminosity, fade-resistant. Up to 240×110 cm.', 'דיו מוחדר ישירות לפנלי אלומיניום פרמיום. צבעים חיים, בהירות יוצאת דופן, עמיד לדהייה. עד 240×110 ס"מ.'], img: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=900&q=80' },
  { slug: 'acrylic', tag: ['Premium', 'פרמיום'], title: ['Acrylic<br>Face Mount', 'פייסמאונט<br>אקרילי'], desc: ['Mounted behind 2mm or 4mm optical-grade acrylic with Dibond backing. A stunning three-dimensional depth effect.', 'מאחורי אקרילית אופטית 2 מ"מ או 4 מ"מ עם גיבוי דיבונד. אפקט עומק תלת-ממדי מרהיב.'], img: 'https://images.unsplash.com/photo-1609921212029-bb5a28e60960?w=900&q=80' },
  { slug: 'fine-art', tag: ['Gallery', 'גלריה'], title: ['Fine Art<br>Paper Prints', 'הדפסות<br>נייר אמנות'], desc: ['Archival pigment inks on museum-grade papers. Exceptional tonal range for gallery exhibitions.', 'דיו פיגמנט ארכיוני על נייר ברמת מוזיאון. טווח טונים יוצא דופן לתערוכות גלריה.'], img: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=900&q=80' },
  { slug: 'canvas', tag: ['Classic', 'קלאסי'], title: ['Canvas<br>Prints', 'הדפסות<br>קנבס'], desc: ['Gallery-wrapped on artist-grade canvas with solid wooden stretcher bars. Timeless warm texture.', 'גלריה עטופה על קנבס ברמת אמן עם מוטות מתיחה מעץ מוצק. הצגה נצחית עם מרקם חמים.'], img: 'https://images.unsplash.com/photo-1580136579312-94651dfd596d?w=900&q=80' },
  { slug: 'framed', tag: ['Bespoke', 'מותאם אישית'], title: ['Custom<br>Framing', 'מסגור<br>מותאם'], desc: ['Wood, metal or acrylic frames in dozens of profiles and finishes. Perfect for any interior.', 'מסגרות עץ, מתכת או אקרילית בעשרות פרופילים וגימורים. משלים בצורה יפה כל עיצוב פנים.'], img: 'https://images.unsplash.com/photo-1605405748313-a416a1b84491?w=900&q=80' },
  { slug: 'large-format', tag: ['Monumental', 'מונומנטלי'], title: ['Large Format<br>& Signage', 'פורמט גדול<br>ושילוט'], desc: ['Business signage, exhibition installs, event graphics. CNC precision cutting up to 240cm.', 'שילוט עסקי, התקנות תערוכות, גרפיקה לאירועים. חיתוך CNC מדויק עד 240 ס"מ.'], img: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=900&q=80' },
];

export default function Products({ t, showToast }: ProductsProps) {
  const goOrder = (slug: string) => {
    document.getElementById('order')?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
      const sel = document.getElementById('productSel') as HTMLSelectElement | null;
      if (sel) {
        sel.value = slug;
        sel.style.borderColor = 'var(--gold)';
        sel.style.boxShadow = '0 0 0 3px rgba(200,168,75,0.2)';
        setTimeout(() => { sel.style.borderColor = ''; sel.style.boxShadow = ''; }, 2200);
      }
    }, 900);
  };

  const delays = ['', 'reveal-d1', 'reveal-d2', '', 'reveal-d1', 'reveal-d2'];

  return (
    <section id="products">
      <div className="container">
        <div className="reveal">
          <div className="eyebrow">{t('Our Products', 'המוצרים שלנו')}</div>
          <h2 className="section-title" dangerouslySetInnerHTML={{ __html: t('Crafted for<br><em>Every Vision</em>', 'מעוצב לכל<br><em>חזון</em>') }} />
          <div className="divider"></div>
          <p className="section-sub">{t('From the luminous depth of HD metal to the gallery elegance of fine art paper — every print is handcrafted to perfection in our Holon studio.', 'מהעומק הזוהר של מתכת HD ועד לאלגנטיות של נייר אמנות — כל הדפסה מיוצרת בקפידה בסטודיו שלנו בחולון.')}</p>
        </div>
      </div>
      <div className="products-grid" style={{ marginTop: 56 }}>
        {products.map((p, i) => (
          <div key={p.slug} className={`product-card reveal ${delays[i]}`} onClick={() => goOrder(p.slug)}>
            <div className="product-card-bg" style={{ backgroundImage: `url('${p.img}')` }}></div>
            <div className="pc-overlay"></div>
            <div className="pc-content">
              <div className="pc-tag">{t(p.tag[0], p.tag[1])}</div>
              <div className="pc-title" dangerouslySetInnerHTML={{ __html: t(p.title[0], p.title[1]) }} />
              <div className="pc-desc">{t(p.desc[0], p.desc[1])}</div>
              <div className="pc-cta">
                <span>{t('Order This Print', 'הזמן הדפסה זו')}</span>
                <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
