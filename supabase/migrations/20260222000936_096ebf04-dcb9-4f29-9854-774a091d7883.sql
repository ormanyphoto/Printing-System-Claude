
CREATE TABLE public.frame_widths (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  width_cm numeric NOT NULL,
  surcharge_pct numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true
);

ALTER TABLE public.frame_widths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage frame_widths" ON public.frame_widths FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Frame widths are publicly readable" ON public.frame_widths FOR SELECT USING (true);

INSERT INTO public.frame_widths (width_cm, surcharge_pct, sort_order) VALUES
(1.5, 10, 1),
(2, 20, 2),
(3, 30, 3),
(4, 40, 4);
