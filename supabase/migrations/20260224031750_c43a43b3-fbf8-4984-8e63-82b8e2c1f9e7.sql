
-- Store Shopify integration config (singleton row, admin-only)
CREATE TABLE public.shopify_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_domain text NOT NULL DEFAULT '',
  api_version text NOT NULL DEFAULT '2024-01',
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.shopify_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage shopify_config"
  ON public.shopify_config FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Shopify config is readable by admins"
  ON public.shopify_config FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add shopify_order_id tracking: already exists on orders table

-- Insert default row
INSERT INTO public.shopify_config (store_domain) VALUES ('');
