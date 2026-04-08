interface MarqueeProps { t: (en: string, he: string) => string; }

const items = [
  ['ChromaLuxe HD Metal Prints', 'הדפסות מתכת ChromaLuxe HD'],
  ['Acrylic Face Mount', 'פייסמאונט אקרילי'],
  ['Fine Art Paper Printing', 'הדפסת נייר אמנות'],
  ['Canvas Prints', 'הדפסות קנבס'],
  ['Custom Framing', 'מסגור מותאם אישית'],
  ['CNC Precision Cutting', 'חיתוך CNC מדויק'],
  ['Exhibition Setup', 'הקמת תערוכות'],
  ['B2B Commercial Printing', 'הדפסה מסחרית B2B'],
];

export default function Marquee({ t }: MarqueeProps) {
  const allItems = [...items, ...items]; // duplicate for seamless loop
  return (
    <div className="marquee-bar">
      <div className="marquee-track">
        {allItems.map(([en, he], i) => (
          <div className="marquee-item" key={i}>
            <span>{t(en, he)}</span>
            <div className="marquee-gem"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
