import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/error-messages";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Pencil, Trash2, Plus, Search } from "lucide-react";

interface BlogPost {
  id: string;
  title_en: string;
  title_he: string;
  slug: string;
  status: string;
  author: string;
  tags: string[];
  published_at: string | null;
  created_at: string;
}

const AdminBlog = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: posts = [] } = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BlogPost[];
    },
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast({ title: "Deleted" });
    },
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

  const filtered = posts.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.title_en.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.author || "").toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-gold">Blog Posts</h1>
        <Button variant="outline" onClick={() => navigate("/admin/blog/new")}>
          <Plus className="h-4 w-4 mr-1.5" /> New Post
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-40">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="pl-8 h-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 border-b border-border">
              <th className="text-left px-4 py-2.5 font-body font-semibold text-muted-foreground">Title</th>
              <th className="text-left px-4 py-2.5 font-body font-semibold text-muted-foreground">Slug</th>
              <th className="text-left px-4 py-2.5 font-body font-semibold text-muted-foreground">Status</th>
              <th className="text-left px-4 py-2.5 font-body font-semibold text-muted-foreground">Author</th>
              <th className="text-left px-4 py-2.5 font-body font-semibold text-muted-foreground">Tags</th>
              <th className="text-left px-4 py-2.5 font-body font-semibold text-muted-foreground">Published</th>
              <th className="text-right px-4 py-2.5 font-body font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0 bg-card hover:bg-muted/20">
                <td className="px-4 py-3 font-display text-foreground">{p.title_en}</td>
                <td className="px-4 py-3 font-body text-muted-foreground text-xs">/{p.slug}</td>
                <td className="px-4 py-3">{statusBadge(p.status)}</td>
                <td className="px-4 py-3 font-body text-muted-foreground">{p.author || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(p.tags || []).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 font-body text-muted-foreground text-xs">
                  {p.published_at ? new Date(p.published_at).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link to={`/admin/blog/${p.slug}`}>
                      <Button variant="ghost" size="sm" className="font-body text-xs h-7 px-2">
                        <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="font-body text-xs h-7 px-2 text-destructive hover:text-destructive"
                      onClick={() => { if (confirm("Delete this post?")) deletePost.mutate(p.id); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-muted-foreground font-body">
                  {posts.length === 0 ? 'No blog posts yet. Click "+ New Post" to create one.' : "No posts match your filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminBlog;
