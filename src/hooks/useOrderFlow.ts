import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { detectAspectRatio, getImageDimensions } from "@/lib/aspect-ratio";
import { isTiffFile, tiffToPreviewUrl } from "@/lib/tiff-preview";
import { useToast } from "@/hooks/use-toast";

export interface UploadedImage {
  file: File;
  previewUrl: string;
  originalPreviewUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  aspectRatio: string;
  originalAspectRatio: string;
  storageUrl?: string;
}

/** Downscale an image to maxDim for fast preview rendering */
function createThumbnail(src: string, maxDim = 1200): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;
      if (w <= maxDim && h <= maxDim) { resolve(src); return; }
      const scale = maxDim / Math.max(w, h);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

export function useOrderFlow() {
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const handleFileSelect = useCallback(
    async (file: File) => {
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'tiff', 'tif', 'heic', 'webp'];
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const isImageType = file.type.startsWith("image/");
      if (!isImageType && !allowedExtensions.includes(ext)) {
        toast({ title: "Invalid file", description: "Please upload an image file (JPEG, PNG, TIFF, HEIC, or WebP).", variant: "destructive" });
        return;
      }
      if (file.size > 400 * 1024 * 1024) {
        toast({ title: "File too large", description: "Maximum file size is 400MB.", variant: "destructive" });
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);
      try {
        const dims = await getImageDimensions(file);
        const aspectRatio = detectAspectRatio(dims.width, dims.height);

        // Upload to storage with progress tracking
        const ext = file.name.split(".").pop() || "jpg";
        const fileName = `${crypto.randomUUID()}.${ext}`;

        // Use XMLHttpRequest for progress tracking
        const { data: { session } } = await supabase.auth.getSession();
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const uploadUrl = `${supabaseUrl}/storage/v1/object/order-images/${fileName}`;

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", uploadUrl);
          xhr.setRequestHeader("Authorization", `Bearer ${session?.access_token || supabaseKey}`);
          xhr.setRequestHeader("apikey", supabaseKey);
          xhr.setRequestHeader("x-upsert", "false");

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setUploadProgress(Math.round((e.loaded / e.total) * 100));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed: ${xhr.statusText}`));
            }
          };
          xhr.onerror = () => reject(new Error("Upload failed"));
          xhr.send(file);
        });

        // Run virus scan in background (non-blocking) — don't make user wait
        supabase.functions.invoke("virus-scan", { body: { fileName } }).then(({ data: scanData, error: scanError }) => {
          if (scanError) {
            console.warn("Virus scan failed:", scanError.message);
          } else if (scanData && !scanData.safe) {
            toast({
              title: "File rejected",
              description: scanData.message || "The uploaded file was flagged as potentially harmful and has been removed.",
              variant: "destructive",
            });
            // Clear the uploaded image since it was malicious
            setUploadedImage(null);
          }
        }).catch((scanErr) => {
          console.warn("Virus scan error:", scanErr);
        });

        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from("order-images")
          .createSignedUrl(fileName, 60 * 60 * 24); // 24-hour signed URL

        if (signedUrlError) {
          console.warn("Failed to create signed URL:", signedUrlError.message);
        }

        // Generate preview URL — convert TIFF to PNG for browser display
        let previewUrl: string;
        if (isTiffFile(file)) {
          const converted = await tiffToPreviewUrl(file);
          previewUrl = converted || URL.createObjectURL(file);
        } else {
          previewUrl = URL.createObjectURL(file);
        }

        // Create a downscaled thumbnail for fast preview rendering
        const thumbnailUrl = await createThumbnail(previewUrl);

        setUploadedImage({
          file,
          previewUrl,
          originalPreviewUrl: previewUrl,
          thumbnailUrl,
          width: dims.width,
          height: dims.height,
          aspectRatio,
          originalAspectRatio: aspectRatio,
          storageUrl: signedUrlData?.signedUrl || previewUrl,
        });

        toast({
          title: "Image uploaded",
          description: `Detected ratio: ${aspectRatio} (${dims.width}×${dims.height}px)`,
        });
      } catch (err: any) {
        toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [toast]
  );

  const clearImage = useCallback(() => {
    if (uploadedImage?.previewUrl) URL.revokeObjectURL(uploadedImage.previewUrl);
    setUploadedImage(null);
  }, [uploadedImage]);

  const setEditedUrl = useCallback(async (dataUrl: string) => {
    const thumb = await createThumbnail(dataUrl);
    setUploadedImage((prev) => prev ? { ...prev, previewUrl: dataUrl, thumbnailUrl: thumb } : prev);
  }, []);

  const updateAspectRatio = useCallback((aspectRatio: string) => {
    setUploadedImage((prev) => prev ? { ...prev, aspectRatio } : prev);
  }, []);

  const resetToOriginal = useCallback(async () => {
    setUploadedImage((prev) => {
      if (!prev) return prev;
      createThumbnail(prev.originalPreviewUrl).then((thumb) => {
        setUploadedImage((p) => p ? { ...p, thumbnailUrl: thumb } : p);
      });
      return { ...prev, previewUrl: prev.originalPreviewUrl, aspectRatio: prev.originalAspectRatio };
    });
  }, []);

  return { uploadedImage, isUploading, uploadProgress, handleFileSelect, clearImage, setEditedUrl, updateAspectRatio, resetToOriginal, setUploadedImage };
}
