interface ProcessProps { t: (en: string, he: string) => string; }

const steps = [
  { num: '01', title: ['Upload Your File', 'העלה את הקובץ'], desc: ['Upload your high-resolution file through our secure form. We accept TIFF, PNG, JPEG, RAW, PDF — up to 500 MB.', 'העלה את הקובץ ברזולוציה גבוהה דרך הטופס המאובטח שלנו. אנו מקבלים TIFF, PNG, JPEG, RAW, PDF — עד 500 MB.'] },
  { num: '02', title: ['Choose Your Specs', 'בחר מפרטים'], desc: ['Select product type, size, finish and framing. Our team reviews your file and advises on the best option.', 'בחר סוג מוצר, גודל, גימור ומסגור. הצוות שלנו בודק את הקובץ ומייעץ על האפשרות הטובה ביותר.'] },
  { num: '03', title: ['We Produce', 'אנחנו מייצרים'], desc: ['Crafted in our studio using Epson pro printers, Sefa heat press and CNC cutting. Personal QC before finish.', 'מיוצר בסטודיו שלנו עם מדפסת Epson מקצועית, מכבש Sefa וחיתוך CNC מדויק. בדיקת איכות אישית.'] },
  { num: '04', title: ['Delivered or Pickup', 'משלוח או איסוף'], desc: ['Carefully packaged and shipped anywhere in Israel, or pickup from our Holon studio. Hanging hardware included.', 'אורז בקפידה ומשלוח לכל מקום בישראל, או לאיסוף בסטודיו שלנו בחולון — כולל חומרי תלייה.'] },
];

export default function Process({ t }: ProcessProps) {
  const delays = ['', 'reveal-d1', 'reveal-d2', 'reveal-d3'];
  return (
    <section id="process" className="section">
      <div className="container">
        <div className="reveal">
          <div className="eyebrow">{t('How It Works', 'איך זה עובד')}</div>
          <h2 className="section-title" dangerouslySetInnerHTML={{ __html: t('From Upload<br>to <em>Your Wall</em>', 'מהעלאה<br>ל<em>קיר שלך</em>') }} />
          <div className="divider"></div>
          <p className="section-sub">{t('A seamless, professional workflow designed to deliver exceptional results with zero hassle.', 'תהליך עבודה חלק ומקצועי שנועד לספק תוצאות יוצאות דופן ללא כל טרחה.')}</p>
        </div>
        <div className="process-steps">
          {steps.map((s, i) => (
            <div key={i} className={`process-step reveal ${delays[i]}`}>
              <div className="process-num">{s.num}</div>
              <div className="process-step-title">{t(s.title[0], s.title[1])}</div>
              <div className="process-step-desc">{t(s.desc[0], s.desc[1])}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
