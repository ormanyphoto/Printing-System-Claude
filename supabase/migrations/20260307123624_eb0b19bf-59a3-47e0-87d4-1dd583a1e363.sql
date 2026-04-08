
-- Create table to store OAuth state nonces
CREATE TABLE public.shopify_oauth_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nonce text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes')
);

-- Enable RLS
ALTER TABLE public.shopify_oauth_state ENABLE ROW LEVEL SECURITY;

-- Only admins can manage oauth state
CREATE POLICY "Admins can manage oauth state"
ON public.shopify_oauth_state FOR ALL
USING (public.has_role(auth.uid(), 'admin'));
