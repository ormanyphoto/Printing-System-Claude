
-- Add OAuth columns to shopify_config
ALTER TABLE public.shopify_config 
  ADD COLUMN IF NOT EXISTS client_id text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS client_secret text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS oauth_scopes text NOT NULL DEFAULT 'read_orders,write_orders,read_draft_orders,write_draft_orders';
