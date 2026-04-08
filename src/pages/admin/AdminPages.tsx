import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/error-messages";
import { Link } from "react-router-dom";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";

interface CmsPage {
  id: string;
  slug: string;
  title_en: string;
  title_he: string;
  status: string;
  template: string;
  updated_at: string;
}

const emptyForm = {
  slug: "",
  title_en: "",
  title_he: "",
  template: "default",
  status: "draft",
};

const AdminPages = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const { data: pages = [] } = useQuery({
    queryKey: ["admin-cms-pages"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("cms_pages")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CmsPage[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (editId) {
        const { error } = await (supabase as any).from("cms_pages").update(form).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("cms_pages").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-cms-pages"] });
      setOpen(false);
      toast({ title: "Saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const deletePage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("cms_pages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-cms-pages"] });
      toast({ title: "Deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const newStatus = status === "published" ? "draft" : "published";
      const { error } = await (supabase as any).from("cms_pages").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-cms-pages"] }),
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const statusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">Published</Badge>;
      case "archived":
        return <Badge variant="secondary">Archived</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-gold">CMS Pages</h1>
        <Button
          variant="outline"
          onClick={() => {
            setEditId(null);
            setForm({ ...emptyForm });
            setOpen(true);
          }}
        >
          + Add Page
        </Button>
      </div>

      {/* Table */}
      <div className="border border-border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 border-b border-border">
              <th className="text-left px-4 py-2.5 font-body font-semibold text-muted-foreground">Slug</th>
              <th className="text-left px-4 py-2.5 font-body font-semibold text-muted-foreground">Title</th>
              <th className="text-left px-4 py-2.5 font-body font-semibold text-muted-foreground">Status</th>
              <th className="text-left px-4 py-2.5 font-body font-semibold text-muted-foreground">Template</th>
              <th className="text-left px-4 py-2.5 font-body font-semibold text-muted-foreground">Updated</th>
              <th className="text-right px-4 py-2.5 font-body font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0 bg-card hover:bg-muted/20">
                <td className="px-4 py-3 font-body text-foreground">/{p.slug}</td>
                <td className="px-4 py-3 font-display text-foreground">{p.title_en}</td>
                <td className="px-4 py-3">{statusBadge(p.status)}</td>
                <td className="px-4 py-3 font-body text-muted-foreground">{p.template}</td>
                <td className="px-4 py-3 font-body text-muted-foreground text-xs">
                  {new Date(p.updated_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <a href={`/page/${p.slug}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" className="font-body text-xs h-7 px-2">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="font-body text-xs h-7 px-2"
                      onClick={() => toggleStatus.mutate({ id: p.id, status: p.status })}
                    >
                      {p.status === "published" ? "Unpublish" : "Publish"}
                    </Button>
                    <Link to={`/admin/pages/${p.slug}`}>
                      <Button variant="ghost" size="sm" className="font-body text-xs h-7 px-2">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="font-body text-xs h-7 px-2"
                      onClick={() => {
                        setEditId(p.id);
                        setForm({
                          slug: p.slug,
                          title_en: p.title_en,
                          title_he: p.title_he ?? "",
                          template: p.template,
                          status: p.status,
                        });
                        setOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="font-body text-xs h-7 px-2 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm("Delete this page?")) deletePage.mutate(p.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {pages.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground font-body">
                  No pages yet. Click "+ Add Page" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">{editId ? "Edit Page" : "New Page"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">URL Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="about-us"
                required
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Title (English)</Label>
              <Input
                value={form.title_en}
                onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                required
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Title (Hebrew)</Label>
              <Input
                value={form.title_he}
                onChange={(e) => setForm({ ...form, title_he: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Template</Label>
              <Select value={form.template} onValueChange={(v) => setForm({ ...form, template: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="full-width">Full Width</SelectItem>
                  <SelectItem value="sidebar">Sidebar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={save.isPending}>Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPages;
