import { useState } from 'react';

interface ContactProps {
  lang: 'en' | 'he';
  t: (en: string, he: string) => string;
  showToast: (msg: string) => void;
}

export default function Contact({ lang, t, showToast }: ContactProps) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
      showToast(lang === 'he' ? '✓ ההודעה נשלחה!' : '✓ Message sent!');
      setTimeout(() => setSent(false), 3500);
    }, 1200);
  };

  return (
    <section id="contact" className="section">
      <div className="container">
        <div className="contact-grid">
          {/* Left: Info + Map */}
          <div className="reveal">
            <div className="eyebrow">{t('Get In Touch', 'צור קשר')}</div>
            <h2 className="section-title" dangerouslySetInnerHTML={{ __html: t('Visit the Studio<br>or <em>Say Hello</em>', 'בקר בסטודיו<br>או <em>הגיד שלום</em>') }} />
            <div className="divider"></div>
            <div className="contact-items">
              <div className="contact-item">
                <div className="c-icon">
                  <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div>
                  <div className="c-lbl">{t('Studio Address', 'כתובת הסטודיו')}</div>
                  <div className="c-val" dangerouslySetInnerHTML={{ __html: t('Ha-Sadna St 8, Unit #1-24<br>Holon 5885633, Israel', 'רחוב המלאכה 8, יחידה 1-24<br>חולון 5885633, ישראל') }} />
                </div>
              </div>
              <div className="contact-item">
                <div className="c-icon">
                  <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.45 2 2 0 0 1 3.59 1.27h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.37a16 16 0 0 0 5.72 5.72l1.67-1.67a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </div>
                <div>
                  <div className="c-lbl">{t('Phone / WhatsApp', 'טלפון / WhatsApp')}</div>
                  <div className="c-val"><a href="tel:+972503404444">+972 50 340 4444</a></div>
                </div>
              </div>
              <div className="contact-item">
                <div className="c-icon">
                  <svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <div>
                  <div className="c-lbl">{t('Email', 'דוא"ל')}</div>
                  <div className="c-val"><a href="mailto:info@chromaluxe.co.il">info@chromaluxe.co.il</a></div>
                </div>
              </div>
              <div className="contact-item">
                <div className="c-icon">
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div>
                  <div className="c-lbl">{t('Working Hours', 'שעות עבודה')}</div>
                  <div className="c-val" dangerouslySetInnerHTML={{ __html: t('Sunday – Thursday: 10:00 – 17:00<br><span style="font-size:13px;color:var(--mid-gray)">Friday & Saturday: Closed</span>', 'ראשון – חמישי: 10:00 – 17:00<br><span style="font-size:13px;color:var(--mid-gray)">שישי ושבת: סגור</span>') }} />
                </div>
              </div>
            </div>
            <div className="map-wrap">
              <iframe
                src="https://maps.google.com/maps?q=Ha-Sadna+Street+8+Holon+Israel&t=&z=15&ie=UTF8&iwloc=&output=embed"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Studio Location"
              ></iframe>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className="reveal reveal-d1">
            <div className="contact-form-box">
              <h3>{t('Send a Message', 'שלח הודעה')}</h3>
              <form onSubmit={handleSubmit}>
                <div className="f-row">
                  <div className="f-group">
                    <label className="f-label">{t('Name', 'שם')}</label>
                    <input className="f-input" type="text" required placeholder={t('Your name', 'השם שלך')} />
                  </div>
                  <div className="f-group">
                    <label className="f-label">{t('Phone', 'טלפון')}</label>
                    <input className="f-input" type="tel" placeholder="+972 50..." />
                  </div>
                </div>
                <div className="f-group">
                  <label className="f-label">{t('Email', 'דוא"ל')}</label>
                  <input className="f-input" type="email" required placeholder="your@email.com" />
                </div>
                <div className="f-group">
                  <label className="f-label">{t('Subject', 'נושא')}</label>
                  <select className="f-select">
                    <option>{t('General inquiry', 'פנייה כללית')}</option>
                    <option>{t('Quote request', 'בקשת הצעת מחיר')}</option>
                    <option>{t('Exhibition project', 'פרויקט תערוכה')}</option>
                    <option>{t('B2B / Interior design', 'B2B / עיצוב פנים')}</option>
                    <option>{t('Technical / File prep', 'טכני / הכנת קבצים')}</option>
                    <option>{t('Other', 'אחר')}</option>
                  </select>
                </div>
                <div className="f-group">
                  <label className="f-label">{t('Message', 'הודעה')}</label>
                  <textarea className="f-textarea" placeholder={t('Tell us about your project...', 'ספר לנו על הפרויקט שלך...')}></textarea>
                </div>
                <button type="submit" className="f-submit" style={{ background: sent ? '#4CAF50' : 'var(--gold)' }} disabled={sending}>
                  {sending ? (lang === 'he' ? 'שולח...' : 'Sending...') : sent ? (lang === 'he' ? '✓ נשלח!' : '✓ Sent!') : t('Send Message →', 'שלח הודעה →')}
                </button>
                {sent && (
                  <div className="f-success" style={{ display: 'block' }}>
                    {t("✓ Message sent! We'll respond within 24 hours.", '✓ ההודעה נשלחה! נגיב תוך 24 שעות.')}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
