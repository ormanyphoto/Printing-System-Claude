import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";

interface BlogPostData {
  id: string;
  title_en: string;
  title_he: string | null;
  slug: string;
  excerpt_en: string | null;
  excerpt_he: string | null;
  body_en: string | null;
  body_he: string | null;
  cover_image: string | null;
  tags: string[];
  author: string | null;
  published_at: string;
  seo_title: string | null;
  seo_description: string | null;
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { i18n } = useTranslation();
  const lang = i18n.language === "he" ? "he" : "en";

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["public-blog-post", slug],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();
      if (error) throw error;
      return data as BlogPostData;
    },
    enabled: !!slug,
  });

  const t = (en: string, he: string) => (lang === "he" ? he : en);
  const field = (en: string | null | undefined, he: string | null | undefined) =>
    (lang === "he" ? he || en : en || he) || "";

  // Set page title for SEO
  useEffect(() => {
    if (post) {
      document.title = post.seo_title || field(post.title_en, post.title_he);
    }
    return () => {
      document.title = "Or Many Fine Art";
    };
  }, [post]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-body text-muted-foreground">{t("Loading...", "טוען...")}</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="font-display text-2xl text-foreground">{t("Post not found", "הפוסט לא נמצא")}</p>
        <Link to="/blog" className="font-body text-sm text-gold hover:underline">
          {t("Back to blog", "חזרה לבלוג")}
        </Link>
      </div>
    );
  }

  const bodyContent = field(post.body_en, post.body_he);

  return (
    <div className="min-h-screen bg-background" dir={lang === "he" ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-display text-lg text-gold hover:opacity-80 transition-opacity">
            Or Many Fine Art
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/blog" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t("Blog", "בלוג")}
            </Link>
            <Link to="/order" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t("Order", "הזמנה")}
            </Link>
          </nav>
        </div>
      </header>

      {/* Cover image */}
      {post.cover_image && (
        <div className="w-full max-h-[480px] overflow-hidden">
          <img
            src={post.cover_image}
            alt={field(post.title_en, post.title_he)}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <article className="max-w-3xl mx-auto px-6 py-12">
        {/* Back link */}
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 font-body text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("Back to blog", "חזרה לבלוג")}
        </Link>

        {/* Title */}
        <h1 className="font-display text-3xl md:text-4xl text-foreground mb-4 leading-tight">
          {field(post.title_en, post.title_he)}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-3 mb-8 font-body text-sm text-muted-foreground">
          {post.author && <span>{post.author}</span>}
          {post.author && <span className="text-border">|</span>}
          <span>
            {new Date(post.published_at).toLocaleDateString(lang === "he" ? "he-IL" : "en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}

        {/* Body */}
        <div
          className="font-body text-foreground leading-relaxed prose prose-sm max-w-none
            prose-headings:font-display prose-headings:text-foreground
            prose-p:text-foreground prose-p:leading-relaxed
            prose-a:text-gold prose-a:no-underline hover:prose-a:underline
            prose-strong:text-foreground
            prose-img:rounded-md prose-img:border prose-img:border-border"
          dangerouslySetInnerHTML={{ __html: bodyContent }}
        />
      </article>

      {/* Footer */}
      <footer className="border-t border-border mt-8 py-8 text-center">
        <p className="font-body text-xs text-muted-foreground">
          {t("Or Many Fine Art - Premium Print Studio", "Or Many Fine Art - סטודיו הדפסה פרימיום")}
        </p>
      </footer>
    </div>
  );
};

export default BlogPost;
