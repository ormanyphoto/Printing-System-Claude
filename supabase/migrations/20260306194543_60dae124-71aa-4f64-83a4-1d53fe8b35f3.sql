
CREATE TABLE public.material_tooltips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug text NOT NULL UNIQUE,
  title_en text NOT NULL DEFAULT '',
  title_he text NOT NULL DEFAULT '',
  finish_en text NOT NULL DEFAULT '',
  finish_he text NOT NULL DEFAULT '',
  best_for_en text NOT NULL DEFAULT '',
  best_for_he text NOT NULL DEFAULT '',
  durability_en text NOT NULL DEFAULT '',
  durability_he text NOT NULL DEFAULT ''
);

ALTER TABLE public.material_tooltips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Material tooltips are publicly readable"
  ON public.material_tooltips FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage material_tooltips"
  ON public.material_tooltips FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed with existing hardcoded data
INSERT INTO public.material_tooltips (product_slug, title_en, finish_en, best_for_en, durability_en) VALUES
  ('hd-metal', 'HD Metal Print', 'High-gloss metallic finish', 'Modern interiors, vibrant photos', 'Waterproof, scratch-resistant, 50+ years'),
  ('canvas', 'Canvas Print', 'Museum-quality matte texture', 'Classic art, portraits, warm tones', 'UV-resistant, gallery-grade cotton'),
  ('plexiglass', 'Acrylic / Plexiglass Print', 'Ultra-vibrant glossy finish', 'Modern interiors, fine art photography', 'Shatterproof, UV-stable, premium depth'),
  ('dibond', 'Dibond Print', 'Smooth matte or satin finish', 'Large-format displays, commercial spaces', 'Rigid aluminium composite, weatherproof'),
  ('photo-paper', 'Photo Paper Print', 'Professional photo-lab quality', 'Traditional photography, framing', 'Archival paper, 75+ year color stability');
