interface FooterProps { t: (en: string, he: string) => string; }

export default function Footer({ t }: FooterProps) {
  return (
    <footer id="footer">
      <div className="container">
        <div className="footer-main">
          <div>
            <a href="#home" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 32, height: 32 }}>
                <polygon points="20,3 37,12 37,28 20,37 3,28 3,12" fill="#C8A84B" opacity="0.15"/>
                <polygon points="20,3 37,12 37,28 20,37 3,28 3,12" fill="none" stroke="#C8A84B" strokeWidth="1.5"/>
                <polygon points="20,11 29,16 29,24 20,29 11,24 11,16" fill="#C8A84B"/>
              </svg>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 600, color: 'white', letterSpacing: '0.04em' }}>
                Chroma<span style={{ color: 'var(--gold)' }}>Luxe</span>
              </span>
            </a>
            <p className="footer-brand-desc">{t("Israel's premier fine art printing studio. ChromaLuxe Plus certified. Serving photographers, artists, galleries and businesses since 2009.", 'סטודיו הדפסת האמנות המוביל בישראל. מוסמך ChromaLuxe Plus. משרת צלמים, אמנים, גלריות ועסקים מאז 2009.')}</p>
            <div className="footer-socials">
              <a href="#" className="soc" aria-label="Instagram"><svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></a>
              <a href="#" className="soc" aria-label="Facebook"><svg viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>
              <a href="https://wa.me/972503404444" className="soc" aria-label="WhatsApp"><svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></a>
              <a href="#" className="soc" aria-label="LinkedIn"><svg viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg></a>
            </div>
          </div>
          <div>
            <div className="footer-col-title">{t('Products', 'מוצרים')}</div>
            <div className="footer-links">
              {[['HD Metal Prints','הדפסות מתכת HD'],['Acrylic Face Mount','פייסמאונט אקרילי'],['Fine Art Paper','נייר אמנות'],['Canvas Prints','הדפסות קנבס'],['Custom Framing','מסגור מותאם'],['Large Format','פורמט גדול']].map(([en,he],i) => (
                <a key={i} href="#products" className="footer-link">{t(en,he)}</a>
              ))}
            </div>
          </div>
          <div>
            <div className="footer-col-title">{t('Services', 'שירותים')}</div>
            <div className="footer-links">
              {[['For Photographers','לצלמים'],['For Artists','לאמנים'],['Interior Design','עיצוב פנים'],['B2B Commercial','B2B מסחרי'],['Exhibition Setup','הקמת תערוכות'],['Rush Orders','הזמנות דחופות']].map(([en,he],i) => (
                <a key={i} href="#order" className="footer-link">{t(en,he)}</a>
              ))}
            </div>
          </div>
          <div>
            <div className="footer-col-title">{t('Studio', 'סטודיו')}</div>
            <div className="footer-links">
              {[['About Us','אודות','#about'],['Gallery','גלריה','#gallery'],['Our Process','התהליך שלנו','#process'],['Contact','צור קשר','#contact'],['Order Now','הזמן עכשיו','#order'],['File Prep Guide','מדריך הכנת קבצים','#']].map(([en,he,href],i) => (
                <a key={i} href={href} className="footer-link">{t(en,he)}</a>
              ))}
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-copy">{t('© 2024 ChromaLuxe Fine Art Printing · Or Many Studio · Holon, Israel. All rights reserved.', '© 2024 ChromaLuxe הדפסת אמנות · סטודיו Or Many · חולון, ישראל. כל הזכויות שמורות.')}</div>
          <div className="footer-legal">
            <a href="#">{t('Privacy Policy', 'מדיניות פרטיות')}</a>
            <a href="#">{t('Terms of Service', 'תנאי שירות')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
