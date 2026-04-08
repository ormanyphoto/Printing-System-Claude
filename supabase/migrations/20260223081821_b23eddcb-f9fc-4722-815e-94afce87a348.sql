
ALTER TABLE public.product_subtypes
  ADD COLUMN pack_width_cm numeric NULL,
  ADD COLUMN pack_height_cm numeric NULL,
  ADD COLUMN pack_depth_cm numeric NULL,
  ADD COLUMN pack_weight_kg numeric NULL;
