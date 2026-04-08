
-- Table for mapping local product configurations to pre-created Shopify variant IDs
CREATE TABLE public.shopify_variant_mappings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  subtype_id uuid REFERENCES public.product_subtypes(id) ON DELETE SET NULL,
  size_id uuid REFERENCES public.size_presets(id) ON DELETE SET NULL,
  finish_id uuid REFERENCES public.finishes(id) ON DELETE SET NULL,
  frame_style_id uuid REFERENCES public.frame_styles(id) ON DELETE SET NULL,
  frame_color_id uuid REFERENCES public.frame_colors(id) ON DELETE SET NULL,
  frame_width_id uuid REFERENCES public.frame_widths(id) ON DELETE SET NULL,
  glazing_id uuid REFERENCES public.glazing_options(id) ON DELETE SET NULL,
  subframe_id uuid REFERENCES public.subframe_options(id) ON DELETE SET NULL,
  canvas_edge_wrap_id text,
  add_frame boolean DEFAULT false,
  shopify_variant_id text NOT NULL,
  mapping_key text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shopify_variant_mappings ENABLE ROW LEVEL SECURITY;

-- Admin-only read/write
CREATE POLICY "Admins can manage shopify_variant_mappings"
  ON public.shopify_variant_mappings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Public read for the edge function (uses service role, but also allow anon read for cart lookups)
CREATE POLICY "Variant mappings are publicly readable"
  ON public.shopify_variant_mappings
  FOR SELECT
  USING (true);
