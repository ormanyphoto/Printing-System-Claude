interface CertBandProps { t: (en: string, he: string) => string; }

export default function CertBand({ t }: CertBandProps) {
  return (
    <div className="cert-band">
      <div className="container">
        <div className="cert-band-inner">
          <span className="cert-band-item">{t("🏆 Israel's Only ChromaLuxe Plus Certified Lab", '🏆 המעבדה היחידה עם אישור ChromaLuxe Plus בישראל')}</span>
          <span className="cert-band-sep">·</span>
          <span className="cert-band-item">{t('📍 Ha-Sadna 8, Holon, Israel', '📍 המלאכה 8, חולון, ישראל')}</span>
          <span className="cert-band-sep">·</span>
          <span className="cert-band-item">📞 +972 50 340 4444</span>
          <span className="cert-band-sep">·</span>
          <span className="cert-band-item">{t('⏰ Sun–Thu 10:00–17:00', "⏰ א'–ה' 10:00–17:00")}</span>
        </div>
      </div>
    </div>
  );
}
