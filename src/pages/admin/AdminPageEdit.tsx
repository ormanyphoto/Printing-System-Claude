import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/error-messages";
import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, ArrowUp, ArrowDown, Trash2, Plus, GripVertical } from "lucide-react";

interface CmsBlock {
  id: string;
  page_id: string;
  block_type: string;
  content: Record<string, any>;
  settings: Record<string, any>;
  sort_order: number;
}

const BLOCK_TYPES = [
  { value: "hero", label: "Hero Banner" },
  { value: "text", label: "Text Section" },
  { value: "image", label: "Image" },
  { value: "gallery", label: "Gallery" },
  { value: "cta", label: "Call to Action" },
  { value: "video", label: "Video" },
  { value: "html", label: "Raw HTML" },
  { value: "faq", label: "FAQ" },
  { value: "testimonial", label: "Testimonial" },
  { value: "columns", label: "Columns" },
];

const defaultContent = (type: string): Record<string, any> => {
  switch (type) {
    case "text": return { title_en: "", title_he: "", body_en: "", body_he: "" };
    case "image": return { image_url: "", alt_text: "", caption_en: "", caption_he: "" };
    case "hero": return { heading_en: "", heading_he: "", subheading_en: "", subheading_he: "", bg_image_url: "", cta_text: "", cta_link: "" };
    case "cta": return { text_en: "", text_he: "", link: "", button_style: "primary" };
    case "gallery": return { images: [{ url: "", alt: "" }] };
    case "video": return { video_url: "", title: "" };
    case "html": return { raw_html: "" };
    case "faq": return { items: [{ question_en: "", question_he: "", answer_en: "", answer_he: "" }] };
    case "testimonial": return { quote_en: "", quote_he: "", author: "", role: "" };
    case "columns": return { column_count: 2, items: [{ title: "", body: "", icon: "" }, { title: "", body: "", icon: "" }] };
    default: return {};
  }
};

const defaultSettings = (): Record<string, any> => ({
  bg_color: "",
  padding: "md",
  text_align: "left",
});

const AdminPageEdit = () => {
  const { slug } = useParams<{ slug: string }>();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [editBlock, setEditBlock] = useState<CmsBlock | null>(null);
  const [editContent, setEditContent] = useState<Record<string, any>>({});
  const [editSettings, setEditSettings] = useState<Record<string, any>>({});
  const [editOpen, setEditOpen] = useState(false);

  // Load page
  const { data: page } = useQuery({
    queryKey: ["admin-cms-page", slug],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("cms_pages")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Load blocks
  const { data: blocks = [] } = useQuery({
    queryKey: ["admin-cms-blocks", page?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("cms_blocks")
        .select("*")
        .eq("page_id", page!.id)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as CmsBlock[];
    },
    enabled: !!page?.id,
  });

  // Add block
  const addBlock = useMutation({
    mutationFn: async (blockType: string) => {
      const maxOrder = blocks.length > 0 ? Math.max(...blocks.map((b) => b.sort_order)) + 1 : 0;
      const { error } = await (supabase as any).from("cms_blocks").insert({
        page_id: page!.id,
        block_type: blockType,
        content: defaultContent(blockType),
        settings: defaultSettings(),
        sort_order: maxOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-cms-blocks", page?.id] });
      toast({ title: "Block added" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  // Save block
  const saveBlock = useMutation({
    mutationFn: async () => {
      if (!editBlock) return;
      const { error } = await (supabase as any)
        .from("cms_blocks")
        .update({ content: editContent, settings: editSettings })
        .eq("id", editBlock.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-cms-blocks", page?.id] });
      setEditOpen(false);
      toast({ title: "Block saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  // Delete block
  const deleteBlock = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("cms_blocks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-cms-blocks", page?.id] });
      toast({ title: "Block deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  // Move block
  const moveBlock = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: "up" | "down" }) => {
      const idx = blocks.findIndex((b) => b.id === id);
      if (idx < 0) return;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= blocks.length) return;
      const current = blocks[idx];
      const swap = blocks[swapIdx];
      const { error: e1 } = await (supabase as any).from("cms_blocks").update({ sort_order: swap.sort_order }).eq("id", current.id);
      if (e1) throw e1;
      const { error: e2 } = await (supabase as any).from("cms_blocks").update({ sort_order: current.sort_order }).eq("id", swap.id);
      if (e2) throw e2;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-cms-blocks", page?.id] }),
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  // Publish / unpublish page
  const togglePublish = useMutation({
    mutationFn: async () => {
      const newStatus = page?.status === "published" ? "draft" : "published";
      const { error } = await (supabase as any).from("cms_pages").update({ status: newStatus }).eq("id", page!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-cms-page", slug] });
      toast({ title: page?.status === "published" ? "Unpublished" : "Published" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const openEditDialog = (block: CmsBlock) => {
    setEditBlock(block);
    setEditContent({ ...block.content });
    setEditSettings({ ...block.settings });
    setEditOpen(true);
  };

  const blockPreview = (block: CmsBlock) => {
    const c = block.content || {};
    switch (block.block_type) {
      case "text": return c.title_en || c.body_en?.substring(0, 60) || "Empty text block";
      case "image": return c.alt_text || c.image_url?.substring(0, 50) || "No image";
      case "hero": return c.heading_en || "Hero section";
      case "cta": return c.text_en || "Call to action";
      case "gallery": return `${(c.images || []).length} image(s)`;
      case "video": return c.title || c.video_url || "Video";
      case "html": return c.raw_html?.substring(0, 60) || "HTML block";
      case "faq": return `${(c.items || []).length} FAQ item(s)`;
      case "testimonial": return c.author || "Testimonial";
      case "columns": return `${c.column_count || 2} columns, ${(c.items || []).length} items`;
      default: return "Block";
    }
  };

  const updateContentField = (key: string, value: any) => {
    setEditContent((prev) => ({ ...prev, [key]: value }));
  };

  const renderBlockForm = () => {
    if (!editBlock) return null;
    const type = editBlock.block_type;

    switch (type) {
      case "text":
        return (
          <>
            <div><Label className="text-xs text-muted-foreground mb-1.5 block">Title (EN)</Label><Input value={editContent.title_en || ""} onChange={(e) => updateContentField("title_en", e.target.value)} /></div>
            <div><Label className="text-xs text-muted-foreground mb-1.5 block">Title (HE)</Label><Input value={editContent.title_he || ""} onChange={(e) => updateContentField("title_he", e.target.value)} /></div>
            <div><Label className="text-xs text-muted-foreground mb-1.5 block">Body (EN)</Label><Textarea rows={6} value={editContent.body_en || ""} onChange={(e) => updateContentField("body_en", e.target.value)} /></div>
            <div><Label className="text-xs text-muted-foreground mb-1.5 block">Body (HE)</Label><Textarea rows={6} value={editContent.body_he || ""} onChange={(e) => updateContentField("body_he", e.target.value)} /></div>
          </>
        );

      case "image":
        return (
          <>
            <div><Label className="text-xs text-muted-foreground mb-1.5 block">Image URL</Label><Input value={editContent.image_url || ""} onChange={(e) => updateContentField("image_url", e.target.value)} /></div>
            <div><Label className="text-xs text-muted-foreground mb-1.5 block">Alt Text</Label><Input value={editContent.alt_text || ""} onChange={(e) => updateContentField("alt_text", e.target.value)} /></div>
            <div><Label className="text-xs text-muted-foreground mb-1.5 block">Caption (EN)</Label><Input value={editContent.caption_en || ""} onChange={(e) => updateContentField("caption_en", e.target.value)} /></div>
            <div><Label className="text-xs text-muted-foreground mb-1.5 block">Caption (HE)</Label><Input value={editContent.caption_he || ""} onChange={(e) => updateContentField("caption_he", e.target.value)} /></div>
          </>
        );

      case "hero":
        return (
          <>
            <div><Label className="text-xs text-muted-foreground mb-1.5 block">Heading (EN)</Label><Input value={editContent.heading_en || ""} onChange={(e) => updateContentField("heading_en", e.target.value)} /></div>
            <div><Label className="text-xs text-muted-foreground mb-1.5 block">Heading (HE)</Label><Input value={editContent.heading_he || ""} onChange={(e) => updateContentField("heading_he", e.target.value)} /></div>
            <div><Label className="text-xs text-muted-foreground mb-1.5 block">Subheading (EN)</Label><Input value={editContent.subheading_en || ""} onChange={(e) => updateContentField("subheading_en", e.target.value)} /></div>
            <div><Label className="text-xs text-muted-foreground mb-1.5 block">Subheading (HE)</Label><Input value={editContent.subheading_he || ""} onChange={(e) => updateContentField("subheading_he", e.target.value)} /></div>
            <div><Label className="text-xs text-muted-foreground mb-1.5 block">Background Image URL</Label><Input value={editContent.bg_image_url || ""} onChange={(e) => updateContentField("bg_image_url", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs text-muted-foreground mb-1.5 block">CTA Text</Label><Input value={editContent.cta_text || ""} onChange={(e) => updateContentField("cta_text", e.target.value)} /></div>
              <div><Label className="text-xs text-muted-foreground mb-1.5 block">CTA Link</Label><Input value={editContent.cta_link || ""} onChange={(e) => updateContentField("cta_link", e.target.value)} /></div>
            </div>
          </>
        );

      case "cta":
        return (
          <>
            <div><Label className="text-xs text-muted-foreground mb-1.5 block">Text (EN)</Label><Input value={editContent.text_en || ""} onChange={(e) => updateContentField("text_en", e.target.value)} /></div>
            <div><Label className="text-xs text-muted-foreground mb-1.5 block">Text (HE)</Label><Input value={editContent.text_he || ""} onChange={(e) => updateContentField("text_he", e.target.value)} /></div>
            <div><Label className="text-xs text-muted-foreground mb-1.5 block">Link</Label><Input value={editContent.link || ""} onChange={(e) => updateContentField("link", e.target.value)} /></div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Button Style</Label>
              <Select value={editContent.button_style || "primary"} onValueChange={(v) => updateContentField("button_style", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                  <SelectItem value="outline">Outline</SelectItem>
                  <SelectItem value="ghost">Ghost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case "gallery": {
        const images = editContent.images || [];
        return (
          <>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Gallery Images</Label>
            {images.map((img: any, i: number) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                <div><Label className="text-[10px] text-muted-foreground mb-1 block">URL</Label><Input value={img.url || ""} onChange={(e) => { const arr = [...images]; arr[i] = { ...arr[i], url: e.target.value }; updateContentField("images", arr); }} /></div>
                <div><Label className="text-[10px] text-muted-foreground mb-1 block">Alt</Label><Input value={img.alt || ""} onChange={(e) => { const arr = [...images]; arr[i] = { ...arr[i], alt: e.target.value }; updateContentField("images", arr); }} /></div>
                <Button type="button" variant="ghost" size="sm" onClick={() => { const arr = images.filter((_: any, j: number) => j !== i); updateContentField("images", arr); }}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => updateContentField("images", [...images, { url: "", alt: "" }])}>+ Add Image</Button>
          </>
        );
      }

      case "video":
        return (
          <>
            <div><Label className="text-xs text-muted-foreground mb-1.5 block">Video URL</Label><Input value={editContent.video_url || ""} onChange={(e) => updateContentField("video_url", e.target.value)} /></div>
            <div><Label className="text-xs text-muted-foreground mb-1.5 block">Title</Label><Input value={editContent.title || ""} onChange={(e) => updateContentField("title", e.target.value)} /></div>
          </>
        );

      case "html":
        return (
          <div><Label className="text-xs text-muted-foreground mb-1.5 block">Raw HTML</Label><Textarea rows={12} value={editContent.raw_html || ""} onChange={(e) => updateContentField("raw_html", e.target.value)} className="font-mono text-xs" /></div>
        );

      case "faq": {
        const items = editContent.items || [];
        return (
          <>
            <Label className="text-xs text-muted-foreground mb-1.5 block">FAQ Items</Label>
            {items.map((item: any, i: number) => (
              <div key={i} className="border border-border rounded-md p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-body text-xs font-semibold text-muted-foreground">Item {i + 1}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => updateContentField("items", items.filter((_: any, j: number) => j !== i))}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
                <Input placeholder="Question (EN)" value={item.question_en || ""} onChange={(e) => { const arr = [...items]; arr[i] = { ...arr[i], question_en: e.target.value }; updateContentField("items", arr); }} />
                <Input placeholder="Question (HE)" value={item.question_he || ""} onChange={(e) => { const arr = [...items]; arr[i] = { ...arr[i], question_he: e.target.value }; updateContentField("items", arr); }} />
                <Textarea rows={3} placeholder="Answer (EN)" value={item.answer_en || ""} onChange={(e) => { const arr = [...items]; arr[i] = { ...arr[i], answer_en: e.target.value }; updateContentField("items", arr); }} />
                <Textarea rows={3} placeholder="Answer (HE)" value={item.answer_he || ""} onChange={(e) => { const arr = [...items]; arr[i] = { ...arr[i], answer_he: e.target.value }; updateContentField("items", arr); }} />
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => updateContentField("items", [...items, { question_en: "", question_he: "", answer_en: "", answer_he: "" }])}>+ Add FAQ Item</Button>
          </>
        );
      }

      case "testimonial":
        return (
          <>
            <div><Label className="text-xs text-muted-foreground mb-1.5 block">Quote (EN)</Label><Textarea rows={4} value={editContent.quote_en || ""} onChange={(e) => updateContentField("quote_en", e.target.value)} /></div>
            <div><Label className="text-xs text-muted-foreground mb-1.5 block">Quote (HE)</Label><Textarea rows={4} value={editContent.quote_he || ""} onChange={(e) => updateContentField("quote_he", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs text-muted-foreground mb-1.5 block">Author</Label><Input value={editContent.author || ""} onChange={(e) => updateContentField("author", e.target.value)} /></div>
              <div><Label className="text-xs text-muted-foreground mb-1.5 block">Role</Label><Input value={editContent.role || ""} onChange={(e) => updateContentField("role", e.target.value)} /></div>
            </div>
          </>
        );

      case "columns": {
        const items = editContent.items || [];
        return (
          <>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Column Count</Label>
              <Select value={String(editContent.column_count || 2)} onValueChange={(v) => updateContentField("column_count", Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Columns</SelectItem>
                  <SelectItem value="3">3 Columns</SelectItem>
                  <SelectItem value="4">4 Columns</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Column Items</Label>
            {items.map((item: any, i: number) => (
              <div key={i} className="border border-border rounded-md p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-body text-xs font-semibold text-muted-foreground">Column {i + 1}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => updateContentField("items", items.filter((_: any, j: number) => j !== i))}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
                <Input placeholder="Icon (emoji or class)" value={item.icon || ""} onChange={(e) => { const arr = [...items]; arr[i] = { ...arr[i], icon: e.target.value }; updateContentField("items", arr); }} />
                <Input placeholder="Title" value={item.title || ""} onChange={(e) => { const arr = [...items]; arr[i] = { ...arr[i], title: e.target.value }; updateContentField("items", arr); }} />
                <Textarea rows={3} placeholder="Body" value={item.body || ""} onChange={(e) => { const arr = [...items]; arr[i] = { ...arr[i], body: e.target.value }; updateContentField("items", arr); }} />
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => updateContentField("items", [...items, { title: "", body: "", icon: "" }])}>+ Add Column</Button>
          </>
        );
      }

      default:
        return <p className="font-body text-muted-foreground text-sm">No editor available for this block type.</p>;
    }
  };

  if (!page) {
    return <div className="font-body text-muted-foreground">Loading page...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/admin/pages">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="font-display text-2xl text-gold">{page.title_en}</h1>
            <span className="font-body text-xs text-muted-foreground">/{page.slug}</span>
          </div>
          <Badge variant={page.status === "published" ? "default" : "outline"} className={page.status === "published" ? "bg-emerald-600 text-white" : ""}>
            {page.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="font-body" onClick={() => togglePublish.mutate()} disabled={togglePublish.isPending}>
            {page.status === "published" ? "Unpublish" : "Publish"}
          </Button>
          <a href={`/page/${page.slug}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="font-body">View Page</Button>
          </a>
        </div>
      </div>

      {/* Block list */}
      <div className="space-y-2 mb-4">
        {blocks.map((block, idx) => (
          <div key={block.id} className="border border-border rounded-md p-4 bg-card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GripVertical className="h-4 w-4 text-muted-foreground/40" />
              <div>
                <Badge variant="secondary" className="mr-2 text-[10px]">{block.block_type}</Badge>
                <span className="font-body text-sm text-muted-foreground">{blockPreview(block)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={idx === 0} onClick={() => moveBlock.mutate({ id: block.id, direction: "up" })}>
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={idx === blocks.length - 1} onClick={() => moveBlock.mutate({ id: block.id, direction: "down" })}>
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" className="font-body text-xs h-7 px-2" onClick={() => openEditDialog(block)}>
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={() => { if (confirm("Delete this block?")) deleteBlock.mutate(block.id); }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {blocks.length === 0 && (
          <div className="border border-dashed border-border rounded-md p-12 text-center">
            <p className="font-body text-muted-foreground">No blocks yet. Add one below.</p>
          </div>
        )}
      </div>

      {/* Add Block dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="font-body">
            <Plus className="h-4 w-4 mr-1.5" /> Add Block
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {BLOCK_TYPES.map((bt) => (
            <DropdownMenuItem key={bt.value} onClick={() => addBlock.mutate(bt.value)} className="font-body">
              {bt.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit block dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              Edit {BLOCK_TYPES.find((bt) => bt.value === editBlock?.block_type)?.label || "Block"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveBlock.mutate(); }} className="space-y-4">
            {renderBlockForm()}

            {/* Block settings */}
            <div className="border-t border-border pt-4 mt-4">
              <p className="font-body text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Block Settings</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">BG Color</Label>
                  <Input value={editSettings.bg_color || ""} onChange={(e) => setEditSettings({ ...editSettings, bg_color: e.target.value })} placeholder="#ffffff" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Padding</Label>
                  <Select value={editSettings.padding || "md"} onValueChange={(v) => setEditSettings({ ...editSettings, padding: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sm">Small</SelectItem>
                      <SelectItem value="md">Medium</SelectItem>
                      <SelectItem value="lg">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Text Align</Label>
                  <Select value={editSettings.text_align || "left"} onValueChange={(v) => setEditSettings({ ...editSettings, text_align: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={saveBlock.isPending}>Save Block</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPageEdit;
