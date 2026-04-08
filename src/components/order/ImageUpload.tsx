import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageUploadProps {
  onImageSelect: (file: File, previewUrl: string) => void;
  currentImage?: string | null;
}

export default function ImageUpload({ onImageSelect, currentImage }: ImageUploadProps) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);

  const handleFile = useCallback((file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/tiff'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a JPEG, PNG, or TIFF file.');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      alert('File size must be under 100MB.');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    onImageSelect(file, url);
  }, [onImageSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const clearImage = () => {
    setPreview(null);
  };

  if (preview) {
    return (
      <Card className="relative overflow-hidden">
        <CardContent className="p-0">
          <img src={preview} alt="Upload preview" className="w-full h-auto max-h-96 object-contain" />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={clearImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`border-2 border-dashed transition-colors cursor-pointer ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <CardContent className="flex flex-col items-center justify-center py-16">
        <label className="cursor-pointer text-center">
          <input type="file" className="hidden" accept="image/jpeg,image/png,image/tiff" onChange={handleChange} />
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm font-medium">{t('order.uploadPrompt')}</p>
          <p className="text-xs text-muted-foreground mt-1">{t('order.uploadFormats')}</p>
        </label>
      </CardContent>
    </Card>
  );
}
