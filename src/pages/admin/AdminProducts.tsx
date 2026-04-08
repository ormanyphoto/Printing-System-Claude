import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/error-messages";
import { Link } from "react-router-dom";
import ThumbnailUpload from "@/components/admin/ThumbnailUpload";

const AdminProducts = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name_en: "", name_he: "", slug: "", description_en: "", description_he: "", max_width_cm: 200, max_height_cm: 200, sort_order: 0, thumbnail_url: "" });

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (editId) {
        const { error } = await supabase.from("products").update(form).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      setOpen(false);
      toast({ title: "Saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const toggleEnabled = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("products").update({ enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-gold">Products & Pricing</h1>
        <Button
          variant="outline"
          onClick={() => {
            setEditId(null);
            setForm({ name_en: "", name_he: "", slug: "", description_en: "", description_he: "", max_width_cm: 200, max_height_cm: 200, sort_order: 0, thumbnail_url: "" });
            setOpen(true);
          }}
        >
          + Add Product
        </Button>
      </div>

      <div className="space-y-3">
        {products.map((p) => (
          <div key={p.id} className="border border-border rounded-md p-4 bg-card flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Switch
                checked={p.enabled}
                onCheckedChange={(v) => toggleEnabled.mutate({ id: p.id, enabled: v })}
              />
              <Link
                to={`/admin/product/${p.slug}`}
                className="font-display text-lg text-foreground hover:text-gold transition-colors"
              >
                {p.name_en}
              </Link>
              <span className="font-body text-xs text-muted-foreground">{p.max_width_cm}×{p.max_height_cm} cm</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="font-body text-xs"
                onClick={() => {
                  setEditId(p.id);
                  setForm({ name_en: p.name_en, name_he: p.name_he, slug: p.slug, description_en: p.description_en ?? "", description_he: p.description_he ?? "", max_width_cm: p.max_width_cm, max_height_cm: p.max_height_cm, sort_order: p.sort_order, thumbnail_url: p.thumbnail_url ?? "" });
                  setOpen(true);
                }}
              >
                Edit
              </Button>
              <Link to={`/admin/product/${p.slug}`}>
                <Button variant="outline" size="sm" className="font-body text-xs">
                  Manage →
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">{editId ? "Edit Product" : "New Product"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
            <div><Label className="text-xs text-muted-foreground mb-1.5 block">Name (English)</Label><Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} required /></div>
            <div><Label className="text-xs text-muted-foreground mb-1.5 block">Name (Hebrew)</Label><Input value={form.name_he} onChange={(e) => setForm({ ...form, name_he: e.target.value })} /></div>
            <div><Label className="text-xs text-muted-foreground mb-1.5 block">URL Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required /></div>
            <div><Label className="text-xs text-muted-foreground mb-1.5 block">Description (English)</Label><Input value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-2">
              <div><Label className="text-xs text-muted-foreground mb-1.5 block">Max Width</Label><Input type="number" value={form.max_width_cm} onChange={(e) => setForm({ ...form, max_width_cm: +e.target.value })} /></div>
              <div><Label className="text-xs text-muted-foreground mb-1.5 block">Max Height</Label><Input type="number" value={form.max_height_cm} onChange={(e) => setForm({ ...form, max_height_cm: +e.target.value })} /></div>
              <div><Label className="text-xs text-muted-foreground mb-1.5 block">Sort Order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: +e.target.value })} /></div>
            </div>
            <ThumbnailUpload
              value={form.thumbnail_url}
              onChange={(url) => setForm({ ...form, thumbnail_url: url })}
              folder="products"
              label="Thumbnail"
            />
            <Button type="submit" className="w-full" disabled={save.isPending}>Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;
