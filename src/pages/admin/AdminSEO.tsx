import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/error-messages";
import { Trash2 } from "lucide-react";

/* ─── Tab 1: Page SEO ──────────────────────────────────────────────────────── */

interface PageSEORecord {
  id: string;
  page_slug: string;
  title_en: string;
  title_he: string;
  description_en: string;
  description_he: string;
  keywords: string;
  og_image_url: string;
  canonical_url: string;
  no_index: boolean;
  no_follow: boolean;
}

const emptySEO: Omit<PageSEORecord, "id"> = {
  page_slug: "",
  title_en: "",
  title_he: "",
  description_en: "",
  description_he: "",
  keywords: "",
  og_image_url: "",
  canonical_url: "",
  no_index: false,
  no_follow: false,
};

const PageSEOTab = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptySEO);

  const { data: records = [] } = useQuery({
    queryKey: ["admin-page-seo"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("page_seo").select("*").order("page_slug");
      return (data ?? []) as PageSEORecord[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (editId) {
        const { error } = await (supabase as any).from("page_seo").update(form).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("page_seo").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-page-seo"] });
      setOpen(false);
      toast({ title: "Saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const deleteSEO = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("page_seo").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-page-seo"] });
      toast({ title: "Deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const toggleNoIndex = useMutation({
    mutationFn: async ({ id, no_index }: { id: string; no_index: boolean }) => {
      const { error } = await (supabase as any).from("page_seo").update({ no_index }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-page-seo"] }),
  });

  const openEdit = (r: PageSEORecord) => {
    setEditId(r.id);
    setForm({
      page_slug: r.page_slug,
      title_en: r.title_en ?? "",
      title_he: r.title_he ?? "",
      description_en: r.description_en ?? "",
      description_he: r.description_he ?? "",
      keywords: r.keywords ?? "",
      og_image_url: r.og_image_url ?? "",
      canonical_url: r.canonical_url ?? "",
      no_index: r.no_index ?? false,
      no_follow: r.no_follow ?? false,
    });
    setOpen(true);
  };

  const openNew = () => {
    setEditId(null);
    setForm({ ...emptySEO });
    setOpen(true);
  };

  // SERP preview helpers
  const serpTitle = form.title_en || form.page_slug || "Page Title";
  const serpUrl = form.canonical_url || `https://example.com/${form.page_slug}`;
  const serpDesc = form.description_en || "No description set.";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg text-foreground">Page SEO</h2>
        <Button variant="outline" onClick={openNew}>+ Add Page SEO</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-body">Page Slug</TableHead>
            <TableHead className="font-body">Title (EN)</TableHead>
            <TableHead className="font-body">Description (EN)</TableHead>
            <TableHead className="font-body">noindex</TableHead>
            <TableHead className="font-body">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground font-body py-8">No SEO entries yet</TableCell>
            </TableRow>
          )}
          {records.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-body font-mono text-sm">{r.page_slug}</TableCell>
              <TableCell className="font-body text-sm">{r.title_en || "-"}</TableCell>
              <TableCell className="font-body text-sm text-muted-foreground max-w-[200px] truncate">{r.description_en || "-"}</TableCell>
              <TableCell>
                <Switch
                  checked={r.no_index}
                  onCheckedChange={(v) => toggleNoIndex.mutate({ id: r.id, no_index: v })}
                />
              </TableCell>
              <TableCell className="flex gap-2">
                <Button variant="ghost" size="sm" className="font-body text-xs" onClick={() => openEdit(r)}>Edit</Button>
                <Button variant="ghost" size="sm" className="font-body text-xs text-destructive" onClick={() => deleteSEO.mutate(r.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">{editId ? "Edit Page SEO" : "New Page SEO"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Page Slug</Label>
              <Input value={form.page_slug} onChange={(e) => setForm({ ...form, page_slug: e.target.value })} required placeholder="e.g. about, contact, products" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Title (English)</Label>
                <Input value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Title (Hebrew)</Label>
                <Input value={form.title_he} onChange={(e) => setForm({ ...form, title_he: e.target.value })} dir="rtl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Description (English)</Label>
                <Textarea value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} rows={3} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Description (Hebrew)</Label>
                <Textarea value={form.description_he} onChange={(e) => setForm({ ...form, description_he: e.target.value })} rows={3} dir="rtl" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Keywords (comma-separated)</Label>
              <Input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="art prints, canvas, metal prints" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">OG Image URL</Label>
                <Input value={form.og_image_url} onChange={(e) => setForm({ ...form, og_image_url: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Canonical URL</Label>
                <Input value={form.canonical_url} onChange={(e) => setForm({ ...form, canonical_url: e.target.value })} placeholder="https://..." />
              </div>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 font-body text-sm">
                <Checkbox
                  checked={form.no_index}
                  onCheckedChange={(v) => setForm({ ...form, no_index: v === true })}
                />
                noindex
              </label>
              <label className="flex items-center gap-2 font-body text-sm">
                <Checkbox
                  checked={form.no_follow}
                  onCheckedChange={(v) => setForm({ ...form, no_follow: v === true })}
                />
                nofollow
              </label>
            </div>

            {/* SERP Preview */}
            <div className="border border-border rounded-md p-4 bg-white">
              <p className="font-body text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Google SERP Preview</p>
              <div>
                <p className="text-[#1a0dab] text-lg font-body leading-snug cursor-pointer hover:underline truncate">{serpTitle}</p>
                <p className="text-[#006621] text-sm font-body truncate">{serpUrl}</p>
                <p className="text-[#545454] text-sm font-body line-clamp-2">{serpDesc}</p>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={save.isPending}>Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ─── Tab 2: Sitemap ───────────────────────────────────────────────────────── */

interface SitemapRecord {
  id: string;
  url_path: string;
  priority: number;
  changefreq: string;
  enabled: boolean;
}

const emptySitemap = { url_path: "", priority: 0.5, changefreq: "weekly", enabled: true };

const SitemapTab = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptySitemap);

  const { data: records = [] } = useQuery({
    queryKey: ["admin-sitemap"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("sitemap_config").select("*").order("url_path");
      return (data ?? []) as SitemapRecord[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (editId) {
        const { error } = await (supabase as any).from("sitemap_config").update(form).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("sitemap_config").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-sitemap"] });
      setOpen(false);
      toast({ title: "Saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("sitemap_config").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-sitemap"] });
      toast({ title: "Deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const toggleEnabled = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await (supabase as any).from("sitemap_config").update({ enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-sitemap"] }),
  });

  const openEdit = (r: SitemapRecord) => {
    setEditId(r.id);
    setForm({ url_path: r.url_path, priority: r.priority, changefreq: r.changefreq, enabled: r.enabled });
    setOpen(true);
  };

  const openNew = () => {
    setEditId(null);
    setForm({ ...emptySitemap });
    setOpen(true);
  };

  const priorities = ["0.1", "0.2", "0.3", "0.4", "0.5", "0.6", "0.7", "0.8", "0.9", "1.0"];
  const freqs = ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg text-foreground">Sitemap Configuration</h2>
        <Button variant="outline" onClick={openNew}>+ Add Entry</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-body">URL Path</TableHead>
            <TableHead className="font-body">Priority</TableHead>
            <TableHead className="font-body">Change Freq</TableHead>
            <TableHead className="font-body">Enabled</TableHead>
            <TableHead className="font-body">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground font-body py-8">No sitemap entries</TableCell>
            </TableRow>
          )}
          {records.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-body font-mono text-sm">{r.url_path}</TableCell>
              <TableCell className="font-body"><Badge variant="outline">{r.priority}</Badge></TableCell>
              <TableCell className="font-body text-sm text-muted-foreground">{r.changefreq}</TableCell>
              <TableCell>
                <Switch
                  checked={r.enabled}
                  onCheckedChange={(v) => toggleEnabled.mutate({ id: r.id, enabled: v })}
                />
              </TableCell>
              <TableCell className="flex gap-2">
                <Button variant="ghost" size="sm" className="font-body text-xs" onClick={() => openEdit(r)}>Edit</Button>
                <Button variant="ghost" size="sm" className="font-body text-xs text-destructive" onClick={() => deleteEntry.mutate(r.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">{editId ? "Edit Sitemap Entry" : "New Sitemap Entry"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">URL Path</Label>
              <Input value={form.url_path} onChange={(e) => setForm({ ...form, url_path: e.target.value })} required placeholder="/about" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Priority</Label>
                <Select value={String(form.priority)} onValueChange={(v) => setForm({ ...form, priority: parseFloat(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {priorities.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Change Frequency</Label>
                <Select value={form.changefreq} onValueChange={(v) => setForm({ ...form, changefreq: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {freqs.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <label className="flex items-center gap-2 font-body text-sm">
              <Checkbox checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v === true })} />
              Enabled
            </label>
            <Button type="submit" className="w-full" disabled={save.isPending}>Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ─── Tab 3: Redirects ─────────────────────────────────────────────────────── */

interface RedirectRecord {
  id: string;
  from_path: string;
  to_path: string;
  status_code: number;
  enabled: boolean;
}

const emptyRedirect = { from_path: "", to_path: "", status_code: 301, enabled: true };

const RedirectsTab = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyRedirect);

  const { data: records = [] } = useQuery({
    queryKey: ["admin-redirects"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("redirects").select("*").order("from_path");
      return (data ?? []) as RedirectRecord[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (editId) {
        const { error } = await (supabase as any).from("redirects").update(form).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("redirects").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-redirects"] });
      setOpen(false);
      toast({ title: "Saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("redirects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-redirects"] });
      toast({ title: "Deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const toggleEnabled = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await (supabase as any).from("redirects").update({ enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-redirects"] }),
  });

  const openEdit = (r: RedirectRecord) => {
    setEditId(r.id);
    setForm({ from_path: r.from_path, to_path: r.to_path, status_code: r.status_code, enabled: r.enabled });
    setOpen(true);
  };

  const openNew = () => {
    setEditId(null);
    setForm({ ...emptyRedirect });
    setOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg text-foreground">Redirects</h2>
        <Button variant="outline" onClick={openNew}>+ Add Redirect</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-body">From Path</TableHead>
            <TableHead className="font-body">To Path</TableHead>
            <TableHead className="font-body">Status</TableHead>
            <TableHead className="font-body">Enabled</TableHead>
            <TableHead className="font-body">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground font-body py-8">No redirects</TableCell>
            </TableRow>
          )}
          {records.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-body font-mono text-sm">{r.from_path}</TableCell>
              <TableCell className="font-body font-mono text-sm">{r.to_path}</TableCell>
              <TableCell><Badge variant="outline">{r.status_code}</Badge></TableCell>
              <TableCell>
                <Switch
                  checked={r.enabled}
                  onCheckedChange={(v) => toggleEnabled.mutate({ id: r.id, enabled: v })}
                />
              </TableCell>
              <TableCell className="flex gap-2">
                <Button variant="ghost" size="sm" className="font-body text-xs" onClick={() => openEdit(r)}>Edit</Button>
                <Button variant="ghost" size="sm" className="font-body text-xs text-destructive" onClick={() => deleteEntry.mutate(r.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">{editId ? "Edit Redirect" : "New Redirect"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">From Path</Label>
              <Input value={form.from_path} onChange={(e) => setForm({ ...form, from_path: e.target.value })} required placeholder="/old-page" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">To Path</Label>
              <Input value={form.to_path} onChange={(e) => setForm({ ...form, to_path: e.target.value })} required placeholder="/new-page" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Status Code</Label>
              <Select value={String(form.status_code)} onValueChange={(v) => setForm({ ...form, status_code: parseInt(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="301">301 — Permanent</SelectItem>
                  <SelectItem value="302">302 — Temporary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 font-body text-sm">
              <Checkbox checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v === true })} />
              Enabled
            </label>
            <Button type="submit" className="w-full" disabled={save.isPending}>Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ─── Main SEO Page ────────────────────────────────────────────────────────── */

const AdminSEO = () => {
  return (
    <div>
      <h1 className="font-display text-2xl text-gold mb-6">SEO Manager</h1>
      <Tabs defaultValue="page-seo">
        <TabsList>
          <TabsTrigger value="page-seo" className="font-body">Page SEO</TabsTrigger>
          <TabsTrigger value="sitemap" className="font-body">Sitemap</TabsTrigger>
          <TabsTrigger value="redirects" className="font-body">Redirects</TabsTrigger>
        </TabsList>
        <TabsContent value="page-seo" className="mt-6">
          <PageSEOTab />
        </TabsContent>
        <TabsContent value="sitemap" className="mt-6">
          <SitemapTab />
        </TabsContent>
        <TabsContent value="redirects" className="mt-6">
          <RedirectsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSEO;
