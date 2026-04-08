interface TestimonialsProps { t: (en: string, he: string) => string; }

const testimonials = [
  { initial: 'D', name: 'David Levi', role: ['Fine Art Photographer, Tel Aviv', 'צלם אמנות, תל אביב'], text: ["The quality of the HD metal prints is absolutely extraordinary. The luminosity, the color accuracy, the finish — it's on another level. This is the only lab I trust for my fine art photography.", 'איכות הדפסות המתכת HD היא יוצאת דופן לחלוטין. הבהירות, דיוק הצבעים, הגימור — ברמה אחרת לגמרי. זו המעבדה היחידה שאני סומך עליה לצילום האמנות שלי.'] },
  { initial: 'M', name: 'Maya Cohen', role: ['Gallery Director, Jerusalem', 'מנהלת גלריה, ירושלים'], text: ['I printed an entire exhibition at ChromaLuxe and every single piece came out perfect. Their attention to detail, the color consistency across 30 prints — simply incredible.', 'הדפסתי תערוכה שלמה ב-ChromaLuxe וכל פריט יצא מושלם. תשומת הלב לפרטים, עקביות הצבעים על פני 30 הדפסות — פשוט מדהים.'] },
  { initial: 'R', name: 'Ron Shapiro', role: ['Interior Designer, Herzliya', 'מעצב פנים, הרצליה'], text: ['The acrylic face-mount prints for my interior design project were breathtaking. My clients could not believe how stunning they looked. Fast turnaround, beautifully packaged.', 'הדפסות האקרילית שהזמנתי לפרויקט עיצוב הפנים שלי היו מרהיבות לחלוטין. הלקוחות שלי לא האמינו כמה יפות הן. אספקה מהירה ואריזה יפה.'] },
];

export default function Testimonials({ t }: TestimonialsProps) {
  const delays = ['', 'reveal-d1', 'reveal-d2'];
  return (
    <section id="testimonials" className="section">
      <div className="container">
        <div className="reveal">
          <div className="eyebrow" style={{ color: 'rgba(200,168,75,0.9)' }}>{t('What Clients Say', 'מה אומרים לקוחות')}</div>
          <h2 className="section-title" style={{ color: 'white' }} dangerouslySetInnerHTML={{ __html: t('Trusted by Artists,<br><em>Loved by All</em>', 'מהימן לאמנים,<br><em>אהוב על הכל</em>') }} />
          <div className="divider"></div>
        </div>
        <div className="testi-grid">
          {testimonials.map((te, i) => (
            <div key={i} className={`testi-card reveal ${delays[i]}`}>
              <div className="testi-stars">★★★★★</div>
              <div className="testi-text">"{t(te.text[0], te.text[1])}"</div>
              <div className="testi-author">
                <div className="testi-avatar">{te.initial}</div>
                <div>
                  <div className="testi-name">{te.name}</div>
                  <div className="testi-role">{t(te.role[0], te.role[1])}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
