
-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_he TEXT NOT NULL DEFAULT '',
  slug TEXT UNIQUE NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  max_width_cm INTEGER NOT NULL DEFAULT 300,
  max_height_cm INTEGER NOT NULL DEFAULT 150,
  sort_order INTEGER NOT NULL DEFAULT 0,
  description_en TEXT DEFAULT '',
  description_he TEXT DEFAULT '',
  thumbnail_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are publicly readable" ON public.products FOR SELECT USING (true);

-- Product subtypes
CREATE TABLE public.product_subtypes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_he TEXT NOT NULL DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT true,
  thickness_mm NUMERIC(5,2),
  description_en TEXT DEFAULT '',
  description_he TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.product_subtypes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Subtypes are publicly readable" ON public.product_subtypes FOR SELECT USING (true);

-- Finishes
CREATE TABLE public.finishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subtype_id UUID NOT NULL REFERENCES public.product_subtypes(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_he TEXT NOT NULL DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT true,
  surcharge_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  thumbnail_url TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.finishes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Finishes are publicly readable" ON public.finishes FOR SELECT USING (true);

-- Size presets
CREATE TABLE public.size_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  aspect_ratio TEXT NOT NULL,
  width_cm INTEGER NOT NULL,
  height_cm INTEGER NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  pack_width_cm NUMERIC(6,1),
  pack_height_cm NUMERIC(6,1),
  pack_depth_cm NUMERIC(6,1),
  pack_weight_kg NUMERIC(6,2),
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.size_presets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Size presets are publicly readable" ON public.size_presets FOR SELECT USING (true);

-- Price tiers
CREATE TABLE public.price_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  subtype_id UUID REFERENCES public.product_subtypes(id) ON DELETE CASCADE,
  tier1_price_sqm NUMERIC(10,2) NOT NULL DEFAULT 0,
  tier2_price_sqm NUMERIC(10,2) NOT NULL DEFAULT 0,
  tier_threshold_sqm NUMERIC(6,4) NOT NULL DEFAULT 0.25
);

ALTER TABLE public.price_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Price tiers are publicly readable" ON public.price_tiers FOR SELECT USING (true);

-- Subframe options
CREATE TABLE public.subframe_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_he TEXT NOT NULL DEFAULT '',
  material TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '',
  width_cm NUMERIC(5,2) NOT NULL DEFAULT 4,
  height_cm NUMERIC(5,2) NOT NULL DEFAULT 1.5,
  inset_cm NUMERIC(5,2) NOT NULL DEFAULT 6,
  surcharge_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.subframe_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Subframe options are publicly readable" ON public.subframe_options FOR SELECT USING (true);

-- Frame styles
CREATE TABLE public.frame_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_he TEXT NOT NULL DEFAULT '',
  material TEXT NOT NULL,
  price_per_cm NUMERIC(8,2) NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.frame_styles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Frame styles are publicly readable" ON public.frame_styles FOR SELECT USING (true);

-- Frame colors
CREATE TABLE public.frame_colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  frame_style_id UUID NOT NULL REFERENCES public.frame_styles(id) ON DELETE CASCADE,
  color_name_en TEXT NOT NULL,
  color_name_he TEXT NOT NULL DEFAULT '',
  hex_code TEXT NOT NULL DEFAULT '#000000'
);

ALTER TABLE public.frame_colors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Frame colors are publicly readable" ON public.frame_colors FOR SELECT USING (true);

-- Glazing options
CREATE TABLE public.glazing_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_he TEXT NOT NULL DEFAULT '',
  price_sqm NUMERIC(10,2) NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.glazing_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Glazing options are publicly readable" ON public.glazing_options FOR SELECT USING (true);

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  shopify_order_id TEXT,
  product_selections JSONB NOT NULL DEFAULT '{}',
  image_url TEXT,
  total_price_ils NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  customer_email TEXT,
  customer_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin role setup
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Admin policies for all config tables
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage subtypes" ON public.product_subtypes FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage finishes" ON public.finishes FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage size_presets" ON public.size_presets FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage price_tiers" ON public.price_tiers FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage subframe_options" ON public.subframe_options FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage frame_styles" ON public.frame_styles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage frame_colors" ON public.frame_colors FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage glazing_options" ON public.glazing_options FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage orders" ON public.orders FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage user_roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
