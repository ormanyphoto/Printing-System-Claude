-- ============================================================
-- Back Office CMS & Management System Schema
-- ============================================================

-- ── MODULE 1: SEO & Indexing ──

CREATE TABLE IF NOT EXISTS page_seo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug TEXT UNIQUE NOT NULL,
  title_en TEXT, title_he TEXT,
  description_en TEXT, description_he TEXT,
  keywords TEXT,
  og_image_url TEXT,
  canonical_url TEXT,
  no_index BOOLEAN DEFAULT false,
  no_follow BOOLEAN DEFAULT false,
  structured_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sitemap_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url_path TEXT UNIQUE NOT NULL,
  priority NUMERIC(2,1) DEFAULT 0.5,
  changefreq TEXT DEFAULT 'weekly',
  enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_path TEXT UNIQUE NOT NULL,
  to_path TEXT NOT NULL,
  status_code INT DEFAULT 301,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── MODULE 2: Translation Overrides ──

CREATE TABLE IF NOT EXISTS translation_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  lang TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(key, lang)
);

-- ── MODULE 3: CMS Pages & Blocks ──

CREATE TABLE IF NOT EXISTS cms_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title_en TEXT NOT NULL,
  title_he TEXT,
  status TEXT DEFAULT 'draft',
  template TEXT DEFAULT 'default',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cms_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES cms_pages(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  sort_order INT DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── MODULE 4: Blog & Media ──

CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title_en TEXT NOT NULL,
  title_he TEXT,
  excerpt_en TEXT,
  excerpt_he TEXT,
  body_en TEXT,
  body_he TEXT,
  cover_image_url TEXT,
  author_name TEXT,
  tags TEXT[],
  status TEXT DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  alt_text TEXT,
  folder TEXT DEFAULT 'general',
  width INT,
  height INT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── MODULE 5: Customers & Subscriptions ──

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  company TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country_code TEXT DEFAULT 'IL',
  notes TEXT,
  tags TEXT[],
  total_orders INT DEFAULT 0,
  total_spent NUMERIC(12,2) DEFAULT 0,
  subscribed_newsletter BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  source TEXT DEFAULT 'website',
  status TEXT DEFAULT 'active',
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ
);

-- ── MODULE 6: Shipping, Tax & HS Codes ──

CREATE TABLE IF NOT EXISTS shipping_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  countries TEXT[] NOT NULL,
  is_domestic BOOLEAN DEFAULT false,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shipping_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES shipping_zones(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  service_name TEXT,
  rate_type TEXT DEFAULT 'flat',
  flat_rate NUMERIC(10,2),
  per_kg_rate NUMERIC(10,2),
  min_weight_kg NUMERIC(6,2),
  max_weight_kg NUMERIC(6,2),
  estimated_days_min INT,
  estimated_days_max INT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS package_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  width_cm NUMERIC(6,1) NOT NULL,
  height_cm NUMERIC(6,1) NOT NULL,
  depth_cm NUMERIC(6,1) NOT NULL,
  max_weight_kg NUMERIC(6,2),
  material TEXT,
  cost NUMERIC(8,2) DEFAULT 0,
  enabled BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL,
  region TEXT,
  tax_name TEXT NOT NULL,
  rate_pct NUMERIC(5,2) NOT NULL,
  applies_to TEXT DEFAULT 'all',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hs_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  code TEXT NOT NULL,
  description TEXT,
  country_of_origin TEXT DEFAULT 'IL',
  material_composition TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── MODULE 7: Order Management Extensions ──

ALTER TABLE orders ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_carrier TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS production_status TEXT DEFAULT 'pending';

-- ── MODULE 8: Checkout Settings ──

CREATE TABLE IF NOT EXISTS checkout_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_methods JSONB DEFAULT '["credit_card","bank_transfer"]',
  currency TEXT DEFAULT 'ILS',
  min_order_amount NUMERIC(10,2) DEFAULT 0,
  require_phone BOOLEAN DEFAULT true,
  require_company BOOLEAN DEFAULT false,
  require_notes BOOLEAN DEFAULT false,
  terms_url TEXT,
  privacy_url TEXT,
  refund_policy_en TEXT,
  refund_policy_he TEXT,
  order_confirmation_email BOOLEAN DEFAULT true,
  admin_notification_email TEXT,
  guest_checkout_enabled BOOLEAN DEFAULT true,
  auto_save_draft BOOLEAN DEFAULT true,
  show_order_notes BOOLEAN DEFAULT true,
  discount_codes_enabled BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  type TEXT DEFAULT 'percentage',
  value NUMERIC(10,2) NOT NULL,
  min_order_amount NUMERIC(10,2),
  max_uses INT,
  uses_count INT DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── RLS Policies ──

ALTER TABLE page_seo ENABLE ROW LEVEL SECURITY;
ALTER TABLE sitemap_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE hs_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- Public read for published content
CREATE POLICY "Public read published blog posts" ON blog_posts FOR SELECT USING (status = 'published');
CREATE POLICY "Public read published cms pages" ON cms_pages FOR SELECT USING (status = 'published');
CREATE POLICY "Public read cms blocks" ON cms_blocks FOR SELECT USING (EXISTS (SELECT 1 FROM cms_pages WHERE id = cms_blocks.page_id AND status = 'published'));
CREATE POLICY "Public read shipping zones" ON shipping_zones FOR SELECT USING (enabled = true);
CREATE POLICY "Public read shipping rates" ON shipping_rates FOR SELECT USING (enabled = true);
CREATE POLICY "Public read tax rates" ON tax_rates FOR SELECT USING (enabled = true);
CREATE POLICY "Public read package templates" ON package_templates FOR SELECT USING (enabled = true);
CREATE POLICY "Public read hs codes" ON hs_codes FOR SELECT USING (true);
CREATE POLICY "Public read checkout settings" ON checkout_settings FOR SELECT USING (true);

-- Admin full access on all tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'page_seo','sitemap_config','redirects','translation_overrides',
    'cms_pages','cms_blocks','blog_posts','media_library',
    'customers','newsletter_subscribers',
    'shipping_zones','shipping_rates','package_templates','tax_rates','hs_codes',
    'checkout_settings','discount_codes'
  ]) LOOP
    EXECUTE format('CREATE POLICY "Admin full access on %s" ON %s FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = ''admin''))', tbl, tbl);
  END LOOP;
END $$;

-- Insert default checkout settings
INSERT INTO checkout_settings (id) VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING;

-- Insert default SEO entries
INSERT INTO page_seo (page_slug, title_en, title_he, description_en, description_he) VALUES
  ('home', 'ChromaLuxe | Fine Art Printing Studio — Israel', 'כרומהלוקס | סטודיו להדפסות אמנות — ישראל', 'Israel''s only ChromaLuxe Plus certified lab. Premium fine art prints on HD metal, acrylic, canvas and more.', 'המעבדה המוסמכת היחידה בישראל. הדפסות אמנות פרימיום על מתכת HD, אקריליק, קנבס ועוד.'),
  ('order', 'Order — ChromaLuxe', 'הזמנה — כרומהלוקס', 'Upload your image and customize your print — material, size, framing — with live 3D preview.', 'העלו תמונה והתאימו את ההדפס — חומר, גודל, מסגרת — עם תצוגה תלת-ממדית חיה.'),
  ('blog', 'Blog — ChromaLuxe', 'בלוג — כרומהלוקס', 'Tips, inspiration and behind-the-scenes from our fine art printing studio.', 'טיפים, השראה ומאחורי הקלעים מסטודיו ההדפסות שלנו.')
ON CONFLICT (page_slug) DO NOTHING;

-- Insert default sitemap entries
INSERT INTO sitemap_config (url_path, priority, changefreq) VALUES
  ('/', 1.0, 'weekly'),
  ('/order', 0.9, 'weekly'),
  ('/blog', 0.8, 'daily'),
  ('/login', 0.3, 'monthly')
ON CONFLICT (url_path) DO NOTHING;

-- Insert default shipping zone (Israel domestic)
INSERT INTO shipping_zones (name, countries, is_domestic) VALUES
  ('Israel Domestic', ARRAY['IL'], true),
  ('Europe', ARRAY['DE','FR','IT','ES','NL','BE','AT','CH','GB','SE','DK','NO','FI','PL','CZ','PT','IE','GR'], false),
  ('North America', ARRAY['US','CA'], false),
  ('Rest of World', ARRAY['AU','JP','KR','SG','HK','TW','BR','MX','ZA','AE','SA'], false);

-- Insert default Israel VAT
INSERT INTO tax_rates (country_code, tax_name, rate_pct) VALUES ('IL', 'VAT', 17.00);
