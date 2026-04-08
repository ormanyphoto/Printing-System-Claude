
-- Drop overly broad storage policies on admin-thumbnails
DROP POLICY IF EXISTS "Authenticated users can upload admin thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update admin thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete admin thumbnails" ON storage.objects;

-- Create admin-only policies
CREATE POLICY "Admins can upload admin thumbnails"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'admin-thumbnails'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update admin thumbnails"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'admin-thumbnails'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete admin thumbnails"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'admin-thumbnails'
  AND public.has_role(auth.uid(), 'admin')
);
