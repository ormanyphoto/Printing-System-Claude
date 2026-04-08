
CREATE TABLE public.shopify_sync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  total_combinations integer NOT NULL DEFAULT 0,
  synced_count integer NOT NULL DEFAULT 0,
  last_batch_index integer NOT NULL DEFAULT 0,
  combinations jsonb NOT NULL DEFAULT '[]'::jsonb,
  error_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  collection_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.shopify_sync_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sync jobs"
  ON public.shopify_sync_jobs FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
