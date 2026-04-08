
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can upload order images" ON storage.objects;
DROP POLICY IF EXISTS "Order images are publicly accessible" ON storage.objects;

-- Restrict uploads: only allow image MIME types and limit file size to 50MB
CREATE POLICY "Upload order images with restrictions"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'order-images'
  AND (storage.extension(name) IN ('jpg', 'jpeg', 'png', 'tiff', 'tif', 'heic', 'webp'))
  AND (octet_length(name) < 500)
);

-- Allow public read access (images need to be viewable in previews/mockups)
CREATE POLICY "Order images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'order-images');

-- Prevent deletion/update by anonymous users
CREATE POLICY "Only authenticated users can delete order images"
ON storage.objects FOR DELETE
USING (bucket_id = 'order-images' AND auth.role() = 'authenticated');

-- Set file size limit on the bucket (50MB)
UPDATE storage.buckets 
SET file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/tiff', 'image/heic', 'image/webp']
WHERE id = 'order-images';
