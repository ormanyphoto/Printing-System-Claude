ALTER TABLE product_subtypes ADD COLUMN IF NOT EXISTS thumbnail_url text;

UPDATE product_subtypes SET thumbnail_url = 'https://hqsehralazutmupngdmz.supabase.co/storage/v1/object/public/admin-thumbnails/subtypes/canvas-rolled.jpg' WHERE id = '555a53d8-a615-44bc-b5d7-a03ea13963b9';
UPDATE product_subtypes SET thumbnail_url = 'https://hqsehralazutmupngdmz.supabase.co/storage/v1/object/public/admin-thumbnails/subtypes/canvas-stretched.jpg' WHERE id = '9ba50d30-47ab-4184-81d7-00db457be8ef';