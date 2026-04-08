import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, Image } from "lucide-react";

interface ThumbnailUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
}

const ThumbnailUpload = ({ value, onChange, folder = "general", label = "Thumbnail" }: ThumbnailUploadProps) => {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${folder}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("admin-thumbnails").upload(path, file, { upsert: true });
      if (error) throw error;

      const { data: urlData } = supabase.storage.from("admin-thumbnails").getPublicUrl(path);
      onChange(urlData.publicUrl);
    } catch (err: any) {
      console.error("Upload failed:", err.message);
    } finally {
      setUploading(false);
    }
  }, [folder, onChange]);

  return (
    <div>
      <Label className="text-xs text-muted-foreground mb-1.5 block">{label}</Label>
      
      {/* Preview */}
      {value ? (
        <div className="mb-2 relative inline-block group">
          <img
            src={value}
            alt="Thumbnail preview"
            className="h-20 w-20 object-cover rounded-md border border-border"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="mb-2 h-20 w-20 rounded-md border border-dashed border-border flex items-center justify-center bg-muted/30">
          <Image className="w-6 h-6 text-muted-foreground/40" />
        </div>
      )}

      {/* Upload button */}
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" className="relative" disabled={uploading}>
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
          ) : (
            <Upload className="w-4 h-4 mr-1.5" />
          )}
          {uploading ? "Uploading…" : "Upload"}
          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </Button>
        <span className="text-muted-foreground/50 text-[10px]">or</span>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste URL…"
          className="h-8 text-xs flex-1"
        />
      </div>
    </div>
  );
};

export default ThumbnailUpload;
