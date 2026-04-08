import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/error-messages";
import { useState, useCallback } from "react";
import { Upload, Trash2, Copy, Loader2, Search, Image, X } from "lucide-react";

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  file_size: number;
  mime_type: string;
  alt_text: string | null;
  folder: string;
  width: number | null;
  height: number | null;
  created_at: string;
}

const FOLDERS = ["all", "general", "products", "blog", "pages", "gallery"];

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const AdminMedia = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [folderFilter, setFolderFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editAlt, setEditAlt] = useState("");

  const { data: media = [] } = useQuery({
    queryKey: ["admin-media"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("media_library")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MediaItem[];
    },
  });

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const storagePath = `media/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("admin-thumbnails")
        .upload(storagePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("admin-thumbnails").getPublicUrl(storagePath);

      const { error: dbError } = await (supabase as any).from("media_library").insert({
        filename: file.name,
        url: urlData.publicUrl,
        file_size: file.size,
        mime_type: file.type,
        folder: "general",
      });
      if (dbError) throw dbError;

      qc.invalidateQueries({ queryKey: ["admin-media"] });
      toast({ title: "Uploaded" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: getSafeErrorMessage(err), variant: "destructive" });
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = "";
    }
  }, [qc, toast]);

  const updateAlt = useMutation({
    mutationFn: async ({ id, alt_text }: { id: string; alt_text: string }) => {
      const { error } = await (supabase as any).from("media_library").update({ alt_text }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-media"] });
      toast({ title: "Updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const deleteMedia = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("media_library").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-media"] });
      setDetailOpen(false);
      setSelected(null);
      toast({ title: "Deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "URL copied to clipboard" });
  };

  const filtered = media.filter((m) => {
    if (folderFilter !== "all" && m.folder !== folderFilter) return false;
    if (search) {
      return m.filename.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  const openDetail = (item: MediaItem) => {
    setSelected(item);
    setEditAlt(item.alt_text || "");
    setDetailOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-gold">Media Library</h1>
        <Button variant="outline" className="relative" disabled={uploading}>
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
          ) : (
            <Upload className="h-4 w-4 mr-1.5" />
          )}
          {uploading ? "Uploading..." : "Upload File"}
          <input
            type="file"
            accept="image/*,video/*,application/pdf"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handleUpload}
            disabled={uploading}
          />
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-40">
          <Select value={folderFilter} onValueChange={setFolderFilter}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All folders" />
            </SelectTrigger>
            <SelectContent>
              {FOLDERS.map((f) => (
                <SelectItem key={f} value={f}>{f === "all" ? "All Folders" : f.charAt(0).toUpperCase() + f.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by filename..."
            className="pl-8 h-9"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((item) => (
          <button
            key={item.id}
            onClick={() => openDetail(item)}
            className="border border-border rounded-md overflow-hidden bg-card hover:ring-2 hover:ring-gold/50 transition-all text-left group"
          >
            <div className="aspect-square bg-muted/30 flex items-center justify-center overflow-hidden">
              {item.mime_type?.startsWith("image/") ? (
                <img src={item.url} alt={item.alt_text || item.filename} className="w-full h-full object-cover" />
              ) : (
                <Image className="h-10 w-10 text-muted-foreground/30" />
              )}
            </div>
            <div className="p-2.5">
              <p className="font-body text-xs text-foreground truncate">{item.filename}</p>
              <p className="font-body text-[10px] text-muted-foreground">{formatBytes(item.file_size)}</p>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full border border-dashed border-border rounded-md p-12 text-center">
            <Image className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-body text-muted-foreground">
              {media.length === 0 ? "No media uploaded yet." : "No files match your search."}
            </p>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Media Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              {/* Preview */}
              {selected.mime_type?.startsWith("image/") ? (
                <img
                  src={selected.url}
                  alt={selected.alt_text || selected.filename}
                  className="w-full max-h-64 object-contain rounded-md border border-border bg-muted/20"
                />
              ) : (
                <div className="w-full h-32 bg-muted/20 rounded-md flex items-center justify-center border border-border">
                  <Image className="h-12 w-12 text-muted-foreground/30" />
                </div>
              )}

              {/* Info */}
              <div className="space-y-1 font-body text-sm">
                <p><span className="text-muted-foreground">Filename:</span> {selected.filename}</p>
                <p><span className="text-muted-foreground">Size:</span> {formatBytes(selected.file_size)}</p>
                {selected.width && selected.height && (
                  <p><span className="text-muted-foreground">Dimensions:</span> {selected.width} x {selected.height}</p>
                )}
                <p><span className="text-muted-foreground">Folder:</span> {selected.folder}</p>
                <p><span className="text-muted-foreground">Type:</span> {selected.mime_type}</p>
              </div>

              {/* URL */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">URL</Label>
                <div className="flex gap-2">
                  <Input value={selected.url} readOnly className="text-xs flex-1" />
                  <Button variant="outline" size="sm" onClick={() => copyUrl(selected.url)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Alt text */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Alt Text</Label>
                <div className="flex gap-2">
                  <Input
                    value={editAlt}
                    onChange={(e) => setEditAlt(e.target.value)}
                    placeholder="Describe this image..."
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateAlt.mutate({ id: selected.id, alt_text: editAlt })}
                    disabled={updateAlt.isPending}
                  >
                    Save
                  </Button>
                </div>
              </div>

              {/* Delete */}
              <Button
                variant="destructive"
                className="w-full font-body"
                onClick={() => { if (confirm("Delete this file?")) deleteMedia.mutate(selected.id); }}
              >
                <Trash2 className="h-4 w-4 mr-1.5" /> Delete File
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMedia;
