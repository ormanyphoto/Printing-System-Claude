
-- Make the order-images bucket private
UPDATE storage.buckets SET public = false WHERE id = 'order-images';

-- Drop any existing public read policy
DROP POLICY IF EXISTS "Order images are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for order-images" ON storage.objects;

-- Authenticated users can view order images
CREATE POLICY "Authenticated users can view order images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'order-images'
  AND auth.role() = 'authenticated'
);
