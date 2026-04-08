-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- ============================================
-- TABLES
-- ============================================

CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en text NOT NULL,
  name_he text NOT NULL DEFAULT '',
  slug text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT true,
  max_width_cm integer NOT NULL DEFAULT 300,
  max_height_cm integer NOT NULL DEFAULT 150,
  sort_order integer NOT NULL DEFAULT 0,
  description_en text DEFAULT '',
  description_he text DEFAULT '',
  thumbnail_url text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.product_subtypes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name_en text NOT NULL,
  name_he text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  thickness_mm numeric,
  description_en text DEFAULT '',
  description_he text DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  pack_width_cm numeric,
  pack_height_cm numeric,
  pack_depth_cm numeric,
  pack_weight_kg numeric,
  thumbnail_url text
);

CREATE TABLE public.size_presets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  width_cm integer NOT NULL,
  height_cm integer NOT NULL,
  aspect_ratio text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  pack_width_cm numeric,
  pack_height_cm numeric,
  pack_depth_cm numeric,
  pack_weight_kg numeric
);

CREATE TABLE public.price_tiers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  subtype_id uuid REFERENCES product_subtypes(id) ON DELETE CASCADE,
  tier1_price_sqm numeric NOT NULL DEFAULT 0,
  tier2_price_sqm numeric NOT NULL DEFAULT 0,
  tier_threshold_sqm numeric NOT NULL DEFAULT 0.25
);

CREATE TABLE public.finishes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subtype_id uuid NOT NULL REFERENCES product_subtypes(id) ON DELETE CASCADE,
  name_en text NOT NULL,
  name_he text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  surcharge_pct numeric NOT NULL DEFAULT 0,
  thumbnail_url text DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE public.frame_styles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en text NOT NULL,
  name_he text NOT NULL DEFAULT '',
  material text NOT NULL,
  price_per_cm numeric NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE public.frame_colors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  frame_style_id uuid NOT NULL REFERENCES frame_styles(id) ON DELETE CASCADE,
  color_name_en text NOT NULL,
  color_name_he text NOT NULL DEFAULT '',
  hex_code text NOT NULL DEFAULT '#000000'
);

CREATE TABLE public.frame_widths (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  width_cm numeric NOT NULL,
  surcharge_pct numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true
);

CREATE TABLE public.glazing_options (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en text NOT NULL,
  name_he text NOT NULL DEFAULT '',
  price_sqm numeric NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE public.subframe_options (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en text NOT NULL,
  name_he text NOT NULL DEFAULT '',
  material text NOT NULL,
  color text NOT NULL DEFAULT '',
  width_cm numeric NOT NULL DEFAULT 4,
  height_cm numeric NOT NULL DEFAULT 1.5,
  inset_cm numeric NOT NULL DEFAULT 6,
  surcharge_pct numeric NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true
);

CREATE TABLE public.material_tooltips (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
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

CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  shopify_order_id text,
  product_selections jsonb NOT NULL DEFAULT '{}',
  image_url text,
  total_price_ils numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  customer_email text,
  customer_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

CREATE TABLE public.shopify_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_domain text NOT NULL DEFAULT '',
  api_version text NOT NULL DEFAULT '2024-01',
  client_id text NOT NULL DEFAULT '',
  client_secret text NOT NULL DEFAULT '',
  admin_api_token text NOT NULL DEFAULT '',
  oauth_scopes text NOT NULL DEFAULT 'read_orders,write_orders,read_draft_orders,write_draft_orders',
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.shopify_oauth_state (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nonce text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes')
);

CREATE TABLE public.shopify_sync_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  collection_id text,
  status text NOT NULL DEFAULT 'pending',
  synced_count integer NOT NULL DEFAULT 0,
  total_combinations integer NOT NULL DEFAULT 0,
  last_batch_index integer NOT NULL DEFAULT 0,
  combinations jsonb NOT NULL DEFAULT '[]',
  error_log jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.shopify_variant_mappings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  subtype_id uuid REFERENCES product_subtypes(id) ON DELETE SET NULL,
  size_id uuid REFERENCES size_presets(id) ON DELETE SET NULL,
  finish_id uuid REFERENCES finishes(id) ON DELETE SET NULL,
  frame_style_id uuid REFERENCES frame_styles(id) ON DELETE SET NULL,
  frame_color_id uuid REFERENCES frame_colors(id) ON DELETE SET NULL,
  frame_width_id uuid REFERENCES frame_widths(id) ON DELETE SET NULL,
  glazing_id uuid REFERENCES glazing_options(id) ON DELETE SET NULL,
  subframe_id uuid REFERENCES subframe_options(id) ON DELETE SET NULL,
  canvas_edge_wrap_id text,
  add_frame boolean DEFAULT false,
  shopify_variant_id text NOT NULL,
  mapping_key text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_subtypes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.size_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frame_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frame_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frame_widths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glazing_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subframe_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_tooltips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_oauth_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_variant_mappings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Products (public read, admin write)
CREATE POLICY "Products are publicly readable" ON products FOR SELECT USING (true);
CREATE POLICY "Admins can manage products" ON products FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Product subtypes
CREATE POLICY "Subtypes are publicly readable" ON product_subtypes FOR SELECT USING (true);
CREATE POLICY "Admins can manage subtypes" ON product_subtypes FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Size presets
CREATE POLICY "Size presets are publicly readable" ON size_presets FOR SELECT USING (true);
CREATE POLICY "Admins can manage size_presets" ON size_presets FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Price tiers
CREATE POLICY "Price tiers are publicly readable" ON price_tiers FOR SELECT USING (true);
CREATE POLICY "Admins can manage price_tiers" ON price_tiers FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Finishes
CREATE POLICY "Finishes are publicly readable" ON finishes FOR SELECT USING (true);
CREATE POLICY "Admins can manage finishes" ON finishes FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Frame styles
CREATE POLICY "Frame styles are publicly readable" ON frame_styles FOR SELECT USING (true);
CREATE POLICY "Admins can manage frame_styles" ON frame_styles FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Frame colors
CREATE POLICY "Frame colors are publicly readable" ON frame_colors FOR SELECT USING (true);
CREATE POLICY "Admins can manage frame_colors" ON frame_colors FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Frame widths
CREATE POLICY "Frame widths are publicly readable" ON frame_widths FOR SELECT USING (true);
CREATE POLICY "Admins can manage frame_widths" ON frame_widths FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Glazing options
CREATE POLICY "Glazing options are publicly readable" ON glazing_options FOR SELECT USING (true);
CREATE POLICY "Admins can manage glazing_options" ON glazing_options FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Subframe options
CREATE POLICY "Subframe options are publicly readable" ON subframe_options FOR SELECT USING (true);
CREATE POLICY "Admins can manage subframe_options" ON subframe_options FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Material tooltips
CREATE POLICY "Material tooltips are publicly readable" ON material_tooltips FOR SELECT USING (true);
CREATE POLICY "Admins can manage material_tooltips" ON material_tooltips FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Orders
CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own orders" ON orders FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own orders" ON orders FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage orders" ON orders FOR ALL USING (has_role(auth.uid(), 'admin'));

-- User roles
CREATE POLICY "Users can read own roles" ON user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage user_roles" ON user_roles FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Shopify config (admin only)
CREATE POLICY "Shopify config is readable by admins" ON shopify_config FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage shopify_config" ON shopify_config FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Shopify OAuth state
CREATE POLICY "Admins can manage oauth state" ON shopify_oauth_state FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Shopify sync jobs
CREATE POLICY "Admins can manage sync jobs" ON shopify_sync_jobs FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Shopify variant mappings
CREATE POLICY "Variant mappings are publicly readable" ON shopify_variant_mappings FOR SELECT USING (true);
CREATE POLICY "Admins can manage shopify_variant_mappings" ON shopify_variant_mappings FOR ALL USING (has_role(auth.uid(), 'admin'));
