import { useState, useRef } from 'react';

interface OrderSectionProps {
  lang: 'en' | 'he';
  t: (en: string, he: string) => string;
  showToast: (msg: string) => void;
}

export default function OrderSection({ lang, t, showToast }: OrderSectionProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    const allowed = /\.(jpe?g|png|tiff?|pdf|raw|dng|cr2|nef|arw|psd)$/i;
    if (!allowed.test(file.name) && !file.type.startsWith('image/') && file.type !== 'application/pdf') {
      showToast(lang === 'he' ? '❌ סוג קובץ לא נתמך' : '❌ Unsupported file type');
      return;
    }
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
    showToast(lang === 'he' ? '✓ קובץ נבחר: ' + file.name : '✓ File selected: ' + file.name);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      setSelectedFile(null);
      setPreviewUrl(null);
      setSelectedSize('');
      showToast(lang === 'he' ? '✓ ההזמנה נשלחה!' : '✓ Order request sent!');
      setTimeout(() => setSuccess(false), 4000);
    }, 1600);
  };

  const resetUpload = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const sizes = ['20×30', '30×40', '40×60', '50×70', '60×90', '70×100', '100×150'];

  return (
    <section id="order" className="section">
      <div className="container">
        <div className="order-grid">
          {/* Left: Info */}
          <div className="reveal">
            <div className="eyebrow">{t('Start Your Order', 'התחל להזמין')}</div>
            <h2 className="section-title" dangerouslySetInnerHTML={{ __html: t('Ready to Print<br><em>Your Vision?</em>', 'מוכן להדפיס<br><em>את החזון שלך?</em>') }} />
            <div className="divider"></div>
            <p className="section-sub">{t('Upload your file, choose your specs, and our team will review and quote within 24 hours.', 'העלה את הקובץ שלך, בחר מפרטים והצוות שלנו יבדוק ויצטט תוך 24 שעות.')}</p>

            <div className="order-steps">
              {[
                [t('Upload your high-res file', 'העלה קובץ ברזולוציה גבוהה'), t('TIFF, PNG, JPEG, RAW — 300 DPI minimum at print size', 'TIFF, PNG, JPEG, RAW — מינימום 300 DPI בגודל ההדפסה')],
                [t('Select product & size', 'בחר מוצר וגודל'), t('HD Metal, Acrylic, Canvas, Fine Art Paper or Framed', 'מתכת HD, אקרילית, קנבס, נייר אמנות או ממוסגר')],
                [t('Add contact details', 'הוסף פרטי קשר'), t('Name, email, phone and any special instructions', 'שם, אימייל, טלפון ופרטים מיוחדים')],
                [t('We review and quote', 'אנחנו בודקים ומצטטים'), t('Confirmation with price and timeline within 24 hours', 'אישור עם מחיר ולוח זמנים תוך 24 שעות')],
              ].map(([title, desc], i) => (
                <div className="o-step" key={i}>
                  <div className="o-num">{i + 1}</div>
                  <div className="o-text">
                    <strong>{title}</strong>
                    <span>{desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 40, padding: '28px 32px', background: 'var(--dark)', borderRadius: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'var(--gold)', marginBottom: 14 }}>
                {t('Need Help?', 'צריך עזרה?')}
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75 }}>
                {t('Call us at ', 'התקשר אלינו בטלפון ')}
                <a href="tel:+972503404444" style={{ color: 'var(--gold-light)' }}>+972 50 340 4444</a>
                {t(' or WhatsApp for instant assistance.', ' או WhatsApp לסיוע מיידי.')}
              </div>
            </div>
          </div>

          {/* Right: Upload Form */}
          <div className="reveal reveal-d1">
            <div className="upload-box">
              <div className="upload-box-head">
                <h3>{t('Upload & Order', 'העלה והזמן')}</h3>
                <p>{t("We'll review and quote within 24 hours. No payment required now.", 'נבדוק ונצטט תוך 24 שעות. אין צורך בתשלום כעת.')}</p>
              </div>
              <div className="upload-box-body">
                <form onSubmit={handleSubmit}>
                  {/* Upload Zone */}
                  <div
                    className={`upload-zone${dragOver ? ' drag-over' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                  >
                    {!selectedFile ? (
                      <div>
                        <div className="upload-icon-circle">
                          <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        </div>
                        <h4>{t('Drop your image here', 'שחרר את התמונה כאן')}</h4>
                        <p>{t('or click to browse files', 'או לחץ לעיון בקבצים')}</p>
                        <p className="hint">{t('JPEG · PNG · TIFF · PDF · RAW — up to 500 MB', 'JPEG · PNG · TIFF · PDF · RAW — עד 500 MB')}</p>
                      </div>
                    ) : (
                      <div className="upload-preview active" style={{ display: 'block' }}>
                        {previewUrl && <img src={previewUrl} alt="Preview" />}
                        <div className="upload-fname">{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)</div>
                        <div className="upload-change" onClick={resetUpload}>{t('Change file ×', 'החלף קובץ ×')}</div>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.tif,.tiff,.raw,.dng,.cr2,.nef,.arw"
                    style={{ display: 'none' }}
                    onChange={(e) => { if (e.target.files?.[0]) processFile(e.target.files[0]); }}
                  />

                  {/* Product + Finish */}
                  <div className="f-row">
                    <div className="f-group">
                      <label className="f-label">{t('Product Type', 'סוג מוצר')}</label>
                      <select className="f-select" id="productSel" required>
                        <option value="">{t('Select...', 'בחר...')}</option>
                        <option value="hd-metal">{t('HD Metal (ChromaLuxe)', 'מתכת HD (ChromaLuxe)')}</option>
                        <option value="acrylic">{t('Acrylic Face Mount', 'פייסמאונט אקרילי')}</option>
                        <option value="fine-art">{t('Fine Art Paper Print', 'הדפסת נייר אמנות')}</option>
                        <option value="canvas">{t('Canvas Print', 'הדפסת קנבס')}</option>
                        <option value="framed">{t('Framed Print', 'הדפסה ממוסגרת')}</option>
                        <option value="large-format">{t('Large Format / Signage', 'פורמט גדול / שילוט')}</option>
                      </select>
                    </div>
                    <div className="f-group">
                      <label className="f-label">{t('Finish', 'גימור')}</label>
                      <select className="f-select">
                        <option value="gloss">{t('Gloss', 'גלוס')}</option>
                        <option value="matte">{t('Matte', 'מט')}</option>
                        <option value="semi-gloss">{t('Semi-Gloss', 'סמי-גלוס')}</option>
                        <option value="metallic">{t('Metallic', 'מטאלי')}</option>
                      </select>
                    </div>
                  </div>

                  {/* Size chips */}
                  <div className="f-group">
                    <label className="f-label">{t('Standard Sizes (cm)', 'גדלים סטנדרטים (ס"מ)')}</label>
                    <div className="size-chips">
                      {sizes.map(s => (
                        <span key={s} className={`size-chip${selectedSize === s ? ' active' : ''}`} onClick={() => setSelectedSize(s)}>{s}</span>
                      ))}
                    </div>
                    <input className="f-input" placeholder={t('Or enter custom size, e.g. 85×120 cm', 'או הכנס גודל מותאם, למשל 85×120 ס"מ')} value={selectedSize ? selectedSize + ' cm' : ''} onChange={(e) => setSelectedSize(e.target.value)} />
                  </div>

                  {/* Orientation */}
                  <div className="f-group">
                    <label className="f-label">{t('Orientation', 'אוריינטציה')}</label>
                    <select className="f-select">
                      <option value="landscape">{t('Landscape (horizontal)', 'לרוחב (אופקי)')}</option>
                      <option value="portrait">{t('Portrait (vertical)', 'לאורך (אנכי)')}</option>
                      <option value="square">{t('Square', 'ריבועי')}</option>
                      <option value="panoramic">{t('Panoramic', 'פנורמי')}</option>
                    </select>
                  </div>

                  {/* Contact info */}
                  <div className="f-row">
                    <div className="f-group">
                      <label className="f-label">{t('Full Name', 'שם מלא')}</label>
                      <input className="f-input" type="text" required placeholder={t('Your name', 'השם שלך')} />
                    </div>
                    <div className="f-group">
                      <label className="f-label">{t('Phone', 'טלפון')}</label>
                      <input className="f-input" type="tel" required placeholder="+972 50 000 0000" />
                    </div>
                  </div>
                  <div className="f-group">
                    <label className="f-label">{t('Email Address', 'כתובת דוא"ל')}</label>
                    <input className="f-input" type="email" required placeholder="your@email.com" />
                  </div>
                  <div className="f-group">
                    <label className="f-label">{t('Special Instructions', 'הוראות מיוחדות')}</label>
                    <textarea className="f-textarea" placeholder={t('Color profile, mounting, rush order, delivery address...', 'פרופיל צבע, הרכבה, הזמנה דחופה, כתובת משלוח...')}></textarea>
                  </div>

                  <button type="submit" className="f-submit" disabled={submitting} style={submitting ? { background: 'var(--mid-gray)' } : success ? { background: '#4CAF50' } : {}}>
                    {submitting ? (lang === 'he' ? 'שולח...' : 'Sending...') : success ? (lang === 'he' ? '✓ נשלח בהצלחה!' : '✓ Sent successfully!') : t('Send Order Request →', 'שלח בקשת הזמנה →')}
                  </button>
                  <p className="f-note">{t('No payment required at this stage. We\'ll review your file and send a quote within 24 hours.', 'אין צורך בתשלום בשלב זה. נבדוק את הקובץ שלך ונשלח הצעת מחיר תוך 24 שעות.')}</p>
                  {success && (
                    <div className="f-success" style={{ display: 'block' }}>
                      {t('✓ Order request sent! We\'ll be in touch within 24 hours.', '✓ בקשת ההזמנה נשלחה! ניצור איתך קשר תוך 24 שעות.')}
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
