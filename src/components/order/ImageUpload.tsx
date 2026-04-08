import { useCallback } from "react";
import { Upload, X, Loader2, ImageUp, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Progress } from "@/components/ui/progress";
import type { UploadedImage } from "@/hooks/useOrderFlow";

interface ImageUploadProps {
  uploadedImage: UploadedImage | null;
  isUploading: boolean;
  uploadProgress: number;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  onEdit?: () => void;
}

const ImageUpload = ({ uploadedImage, isUploading, uploadProgress, onFileSelect, onClear, onEdit }: ImageUploadProps) => {
  const { t } = useTranslation();

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect]
  );

  if (uploadedImage) {
    return (
      <div className="space-y-3">
        <div className="block lg:hidden">
          <img
            src={uploadedImage.storageUrl || uploadedImage.thumbnailUrl}
            alt="Uploaded preview"
            className="w-full max-h-48 object-contain rounded-sm border border-border"
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src !== uploadedImage.previewUrl) {
                target.src = uploadedImage.previewUrl;
              } else if (uploadedImage.storageUrl && target.src !== uploadedImage.storageUrl) {
                target.src = uploadedImage.storageUrl;
              }
            }}
          />
        </div>
          <div className="flex items-center justify-between">
            <div className="font-body text-sm text-muted-foreground">
              <span className="text-foreground font-medium">{uploadedImage.aspectRatio}</span>
              {" · "}
              {uploadedImage.width}×{uploadedImage.height}px
            </div>
            <div className="flex items-center gap-3">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="flex items-center gap-1.5 font-body text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  {t("order.editPhoto", "Edit Photo")}
                </button>
              )}
              <button
                onClick={onClear}
                className="flex items-center gap-1.5 font-body text-xs uppercase tracking-wider text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                {t("upload.remove")}
              </button>
            </div>
          </div>
      </div>
    );
  }

  if (isUploading) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-border bg-card p-14">
        <div className="relative flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-2 border-foreground/10 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-foreground animate-spin" strokeWidth={1.5} />
              </div>
            </div>
          </div>
          
          <div className="text-center space-y-1.5">
            <h3 className="font-display text-2xl text-foreground tracking-tight">
              {uploadProgress >= 95
                ? t("upload.scanning", "Scanning for viruses…")
                : t("upload.uploading", { progress: uploadProgress })}
            </h3>
            <p className="font-body text-sm text-muted-foreground">
              {uploadProgress >= 95
                ? t("upload.scanningHint", "This may take a few more seconds")
                : t("upload.pleaseWait", "Processing your high-resolution image…")}
            </p>
          </div>
          
          <div className="w-full max-w-xs space-y-3">
            <Progress value={uploadProgress} className="h-1 bg-border/40" />
            <div className="flex justify-between font-body text-xs text-muted-foreground">
              <span>{uploadProgress}% {t("upload.complete", "complete")}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <label
      className="group cursor-pointer block"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* Dashed border container — WhiteWall style */}
      <div className="border-2 border-dashed border-border rounded-sm py-14 sm:py-20 px-6 transition-colors duration-300 group-hover:border-foreground/30 bg-background">
        <div className="flex flex-col items-center gap-6">
          
          {/* Upload icon */}
          <ImageUp 
            className="w-12 h-12 text-muted-foreground/50 transition-colors duration-300 group-hover:text-foreground/70" 
            strokeWidth={1.2} 
          />

          {/* Title + subtitle grouped tightly */}
          <div className="text-center space-y-2">
            <h3 className="font-body text-xl sm:text-2xl text-foreground tracking-tight font-medium">
              {t("upload.drag")}
              <br />
              <span className="text-sm sm:text-base font-normal text-muted-foreground">{t("upload.formats.line")}</span>
            </h3>
            <p className="font-body text-xs text-muted-foreground/50 tracking-wide">
              {t("upload.supported")}
              <br />
              {t("upload.maxSize")}
            </p>
          </div>

          {/* Upload button */}
          <div className="px-12 py-3.5 bg-accent text-accent-foreground font-body text-sm font-bold tracking-[0.2em] uppercase transition-all duration-200 group-hover:brightness-110">
            {t("upload.browse", "Upload Photos")}
          </div>
        </div>
      </div>
      <input type="file" accept="image/jpeg,image/jpg,image/png,image/tiff,image/heic,.jpeg,.jpg,.png,.tiff,.tif,.heic" className="hidden" onChange={handleChange} disabled={isUploading} />
    </label>
  );
};

export default ImageUpload;
