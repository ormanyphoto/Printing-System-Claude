
-- Create storage bucket for admin thumbnails
INSERT INTO storage.buckets (id, name, public) VALUES ('admin-thumbnails', 'admin-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload admin thumbnails"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'admin-thumbnails');

-- Allow public read access
CREATE POLICY "Public read access for admin thumbnails"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'admin-thumbnails');

-- Allow authenticated users to update/delete their uploads
CREATE POLICY "Authenticated users can update admin thumbnails"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'admin-thumbnails');

CREATE POLICY "Authenticated users can delete admin thumbnails"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'admin-thumbnails');
