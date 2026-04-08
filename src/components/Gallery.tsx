interface GalleryProps { t: (en: string, he: string) => string; }

const images = [
  { src: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900&q=80', label: ['HD Metal Print', 'הדפסת מתכת HD'] },
  { src: 'https://images.unsplash.com/photo-1454425064867-5ba516caf601?w=700&q=80', label: ['Fine Art Paper', 'נייר אמנות'] },
  { src: 'https://images.unsplash.com/photo-1540206395-68808572332f?w=700&q=80', label: ['Acrylic Print', 'הדפסה אקרילית'] },
  { src: 'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=700&q=80', label: ['Canvas Print', 'הדפסת קנבס'] },
  { src: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=700&q=80', label: ['ChromaLuxe Metal', 'מתכת ChromaLuxe'] },
  { src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=80', label: ['Large Format', 'פורמט גדול'] },
  { src: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=700&q=80', label: ['Framed Print', 'הדפסה ממוסגרת'] },
];

export default function Gallery({ t }: GalleryProps) {
  const delays = ['', 'reveal-d1', 'reveal-d2', '', 'reveal-d1', '', 'reveal-d1'];
  return (
    <section id="gallery" className="section" style={{ paddingTop: 60 }}>
      <div className="container">
        <div className="reveal">
          <div className="eyebrow">{t('Our Work', 'עבודות שלנו')}</div>
          <h2 className="section-title" dangerouslySetInnerHTML={{ __html: t('Prints That<br><em>Command Attention</em>', 'הדפסות שמושכות<br><em>תשומת לב</em>') }} />
          <div className="divider"></div>
        </div>
      </div>
      <div className="gallery-grid">
        {images.map((img, i) => (
          <div key={i} className={`gi reveal ${delays[i]}`}>
            <img src={img.src} alt={img.label[0]} loading="lazy" />
            <div className="gi-label">{t(img.label[0], img.label[1])}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
