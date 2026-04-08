import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";

interface BlogPost {
  id: string;
  title_en: string;
  title_he: string;
  slug: string;
  excerpt_en: string | null;
  excerpt_he: string | null;
  cover_image: string | null;
  tags: string[];
  author: string | null;
  published_at: string;
}

const Blog = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language === "he" ? "he" : "en";

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["public-blog-posts"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BlogPost[];
    },
  });

  const t = (en: string, he: string) => (lang === "he" ? he : en);
  const field = (en: string | null, he: string | null) => (lang === "he" ? he || en : en || he) || "";

  return (
    <div className="min-h-screen bg-background" dir={lang === "he" ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <Link to="/" className="font-display text-xl text-gold hover:opacity-80 transition-opacity">
              Or Many Fine Art
            </Link>
          </div>
          <nav className="flex items-center gap-4">
            <Link to="/" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t("Home", "ראשי")}
            </Link>
            <Link to="/order" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t("Order", "הזמנה")}
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="font-display text-4xl text-foreground mb-2">
          {t("Blog", "בלוג")}
        </h1>
        <p className="font-body text-muted-foreground mb-10">
          {t(
            "Insights, tips, and inspiration for art printing.",
            "תובנות, טיפים והשראה להדפסת אמנות."
          )}
        </p>

        {isLoading ? (
          <div className="text-center py-20 font-body text-muted-foreground">
            {t("Loading...", "טוען...")}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 font-body text-muted-foreground">
            {t("No posts yet. Check back soon!", "אין פוסטים עדיין. בדקו שוב בקרוב!")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group border border-border rounded-lg overflow-hidden bg-card hover:shadow-lg transition-shadow"
              >
                {/* Cover image */}
                {post.cover_image ? (
                  <div className="aspect-[16/10] overflow-hidden">
                    <img
                      src={post.cover_image}
                      alt={field(post.title_en, post.title_he)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="aspect-[16/10] bg-muted/30 flex items-center justify-center">
                    <span className="font-display text-4xl text-muted-foreground/20">B</span>
                  </div>
                )}

                <div className="p-5">
                  {/* Date */}
                  <p className="font-body text-xs text-muted-foreground mb-2">
                    {new Date(post.published_at).toLocaleDateString(lang === "he" ? "he-IL" : "en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                    {post.author && ` — ${post.author}`}
                  </p>

                  {/* Title */}
                  <h2 className="font-display text-lg text-foreground mb-2 group-hover:text-gold transition-colors">
                    {field(post.title_en, post.title_he)}
                  </h2>

                  {/* Excerpt */}
                  {(post.excerpt_en || post.excerpt_he) && (
                    <p className="font-body text-sm text-muted-foreground line-clamp-3 mb-3">
                      {field(post.excerpt_en, post.excerpt_he)}
                    </p>
                  )}

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {post.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8 text-center">
        <p className="font-body text-xs text-muted-foreground">
          {t("Or Many Fine Art - Premium Print Studio", "Or Many Fine Art - סטודיו הדפסה פרימיום")}
        </p>
      </footer>
    </div>
  );
};

export default Blog;
