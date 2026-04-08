import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';

interface ThumbnailUploadProps {
  currentUrl?: string;
  bucket: string;
  path: string;
  onUpload: (url: string) => void;
}

export default function ThumbnailUpload({ currentUrl, bucket, path, onUpload }: ThumbnailUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl || '');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const filePath = `${path}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from(bucket).upload(filePath, file);
      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
      setPreview(publicUrl);
      onUpload(publicUrl);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="relative inline-block">
          <img src={preview} alt="Thumbnail" className="h-24 w-24 object-cover rounded border" />
          <Button
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6"
            onClick={() => { setPreview(''); onUpload(''); }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
          <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
          <Upload className="h-6 w-6 text-muted-foreground" />
        </label>
      )}
      {uploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
    </div>
  );
}
