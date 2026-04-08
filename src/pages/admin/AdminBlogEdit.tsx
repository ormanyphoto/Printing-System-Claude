import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/error-messages";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, X } from "lucide-react";

const emptyForm = {
  title_en: "",
  title_he: "",
  slug: "",
  excerpt_en: "",
  excerpt_he: "",
  body_en: "",
  body_he: "",
  cover_image: "",
  tags: [] as string[],
  author: "",
  seo_title: "",
  seo_description: "",
  status: "draft",
  published_at: "",
};

const AdminBlogEdit = () => {
  const { slug } = useParams<{ slug: string }>();
  const isNew = slug === "new";
  const qc = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ ...emptyForm });
  const [tagsInput, setTagsInput] = useState("");

  // Load existing post
  const { data: existing } = useQuery({
    queryKey: ["admin-blog-post", slug],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !isNew && !!slug,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        title_en: existing.title_en || "",
        title_he: existing.title_he || "",
        slug: existing.slug || "",
        excerpt_en: existing.excerpt_en || "",
        excerpt_he: existing.excerpt_he || "",
        body_en: existing.body_en || "",
        body_he: existing.body_he || "",
        cover_image: existing.cover_image || "",
        tags: existing.tags || [],
        author: existing.author || "",
        seo_title: existing.seo_title || "",
        seo_description: existing.seo_description || "",
        status: existing.status || "draft",
        published_at: existing.published_at
          ? new Date(existing.published_at).toISOString().slice(0, 16)
          : "",
      });
      setTagsInput((existing.tags || []).join(", "));
    }
  }, [existing]);

  // Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    setForm((prev) => ({
      ...prev,
      title_en: val,
      slug: isNew || !existing
        ? val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
        : prev.slug,
    }));
  };

  const handleTagsChange = (val: string) => {
    setTagsInput(val);
    const tags = val.split(",").map((t) => t.trim()).filter(Boolean);
    setForm((prev) => ({ ...prev, tags }));
  };

  const removeTag = (tag: string) => {
    const newTags = form.tags.filter((t) => t !== tag);
    setForm((prev) => ({ ...prev, tags: newTags }));
    setTagsInput(newTags.join(", "));
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        title_en: form.title_en,
        title_he: form.title_he || null,
        slug: form.slug,
        excerpt_en: form.excerpt_en || null,
        excerpt_he: form.excerpt_he || null,
        body_en: form.body_en || null,
        body_he: form.body_he || null,
        cover_image: form.cover_image || null,
        tags: form.tags,
        author: form.author || null,
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
        status: form.status,
        published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
      };

      if (isNew) {
        const { error } = await (supabase as any).from("blog_posts").insert(payload);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("blog_posts").update(payload).eq("slug", slug);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      qc.invalidateQueries({ queryKey: ["admin-blog-post", slug] });
      toast({ title: "Saved" });
      if (isNew) navigate(`/admin/blog/${form.slug}`);
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/admin/blog">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <h1 className="font-display text-2xl text-gold">
            {isNew ? "New Blog Post" : form.title_en || "Edit Post"}
          </h1>
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending} className="font-body">
          {save.isPending ? "Saving..." : "Save Post"}
        </Button>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Left — editor */}
        <div className="space-y-5">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Title (English)</Label>
            <Input
              value={form.title_en}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="font-display text-lg"
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
            <Label className="text-xs text-muted-foreground mb-1.5 block">URL Slug</Label>
            <Input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              required
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Excerpt (English)</Label>
            <Textarea
              rows={3}
              value={form.excerpt_en}
              onChange={(e) => setForm({ ...form, excerpt_en: e.target.value })}
              placeholder="A brief summary for previews and SEO..."
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Excerpt (Hebrew)</Label>
            <Textarea
              rows={3}
              value={form.excerpt_he}
              onChange={(e) => setForm({ ...form, excerpt_he: e.target.value })}
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Body (English)</Label>
            <Textarea
              rows={20}
              value={form.body_en}
              onChange={(e) => setForm({ ...form, body_en: e.target.value })}
              placeholder="Write your post content here..."
              className="font-body"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Body (Hebrew)</Label>
            <Textarea
              rows={20}
              value={form.body_he}
              onChange={(e) => setForm({ ...form, body_he: e.target.value })}
              className="font-body"
              dir="rtl"
            />
          </div>
        </div>

        {/* Right — settings panel */}
        <div className="space-y-5">
          {/* Cover Image */}
          <div className="border border-border rounded-md p-4 bg-card">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Cover Image URL</Label>
            <Input
              value={form.cover_image}
              onChange={(e) => setForm({ ...form, cover_image: e.target.value })}
              placeholder="https://..."
            />
            {form.cover_image && (
              <img
                src={form.cover_image}
                alt="Cover preview"
                className="mt-2 rounded-md w-full h-40 object-cover border border-border"
              />
            )}
          </div>

          {/* Tags */}
          <div className="border border-border rounded-md p-4 bg-card">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Tags (comma-separated)</Label>
            <Input
              value={tagsInput}
              onChange={(e) => handleTagsChange(e.target.value)}
              placeholder="art, printing, tips"
            />
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs pr-1">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Author */}
          <div className="border border-border rounded-md p-4 bg-card">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Author</Label>
            <Input
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
            />
          </div>

          {/* Status */}
          <div className="border border-border rounded-md p-4 bg-card">
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

          {/* Published Date */}
          <div className="border border-border rounded-md p-4 bg-card">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Published Date</Label>
            <Input
              type="datetime-local"
              value={form.published_at}
              onChange={(e) => setForm({ ...form, published_at: e.target.value })}
            />
          </div>

          {/* SEO */}
          <div className="border border-border rounded-md p-4 bg-card space-y-3">
            <p className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">SEO Settings</p>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">SEO Title</Label>
              <Input
                value={form.seo_title}
                onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
                placeholder={form.title_en}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">SEO Description</Label>
              <Textarea
                rows={3}
                value={form.seo_description}
                onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
                placeholder="Meta description for search engines..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBlogEdit;
