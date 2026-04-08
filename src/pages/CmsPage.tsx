import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface CmsPageData {
  id: string;
  slug: string;
  title_en: string;
  title_he: string | null;
  status: string;
  template: string;
}

interface CmsBlock {
  id: string;
  block_type: string;
  content: Record<string, any>;
  settings: Record<string, any>;
  sort_order: number;
}

const paddingMap: Record<string, string> = {
  sm: "py-6",
  md: "py-12",
  lg: "py-20",
};

const alignMap: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const CmsPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { i18n } = useTranslation();
  const lang = i18n.language === "he" ? "he" : "en";

  const t = (en: string, he: string) => (lang === "he" ? he : en);
  const field = (en: any, he: any) => (lang === "he" ? he || en : en || he) || "";

  // Load page
  const { data: page, isLoading: pageLoading } = useQuery({
    queryKey: ["public-cms-page", slug],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("cms_pages")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();
      if (error) throw error;
      return data as CmsPageData;
    },
    enabled: !!slug,
  });

  // Load blocks
  const { data: blocks = [] } = useQuery({
    queryKey: ["public-cms-blocks", page?.id],
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

  // Set page title
  useEffect(() => {
    if (page) {
      document.title = field(page.title_en, page.title_he);
    }
    return () => { document.title = "Or Many Fine Art"; };
  }, [page]);

  const renderBlock = (block: CmsBlock) => {
    const c = block.content || {};
    const s = block.settings || {};
    const padding = paddingMap[s.padding] || paddingMap.md;
    const align = alignMap[s.text_align] || alignMap.left;
    const bgStyle = s.bg_color ? { backgroundColor: s.bg_color } : {};

    switch (block.block_type) {
      case "hero":
        return (
          <section
            key={block.id}
            className="relative w-full min-h-[400px] flex items-center justify-center bg-cover bg-center"
            style={{
              backgroundImage: c.bg_image_url ? `url(${c.bg_image_url})` : undefined,
              backgroundColor: c.bg_image_url ? undefined : "#1a1a2e",
            }}
          >
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative z-10 text-center px-6 max-w-3xl">
              <h1 className="font-display text-4xl md:text-5xl text-white mb-4">
                {field(c.heading_en, c.heading_he)}
              </h1>
              {(c.subheading_en || c.subheading_he) && (
                <p className="font-body text-lg text-white/80 mb-8">
                  {field(c.subheading_en, c.subheading_he)}
                </p>
              )}
              {c.cta_text && c.cta_link && (
                <Link to={c.cta_link}>
                  <Button size="lg" className="font-body">{c.cta_text}</Button>
                </Link>
              )}
            </div>
          </section>
        );

      case "text":
        return (
          <section key={block.id} className={`${padding} ${align}`} style={bgStyle}>
            <div className="max-w-4xl mx-auto px-6">
              {(c.title_en || c.title_he) && (
                <h2 className="font-display text-2xl md:text-3xl text-foreground mb-4">
                  {field(c.title_en, c.title_he)}
                </h2>
              )}
              {(c.body_en || c.body_he) && (
                <div
                  className="font-body text-foreground leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: field(c.body_en, c.body_he) }}
                />
              )}
            </div>
          </section>
        );

      case "image":
        return (
          <section key={block.id} className={`${padding} ${align}`} style={bgStyle}>
            <div className="max-w-4xl mx-auto px-6">
              {c.image_url && (
                <img
                  src={c.image_url}
                  alt={c.alt_text || ""}
                  className="w-full rounded-lg shadow-md"
                />
              )}
              {(c.caption_en || c.caption_he) && (
                <p className="font-body text-sm text-muted-foreground mt-3">
                  {field(c.caption_en, c.caption_he)}
                </p>
              )}
            </div>
          </section>
        );

      case "gallery": {
        const images = c.images || [];
        return (
          <section key={block.id} className={`${padding}`} style={bgStyle}>
            <div className="max-w-6xl mx-auto px-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((img: any, i: number) => (
                  <div key={i} className="aspect-square overflow-hidden rounded-md">
                    <img src={img.url} alt={img.alt || ""} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      }

      case "cta":
        return (
          <section key={block.id} className={`${padding} text-center`} style={bgStyle}>
            <div className="max-w-2xl mx-auto px-6">
              {c.link && (
                <Link to={c.link}>
                  <Button
                    variant={c.button_style === "outline" ? "outline" : c.button_style === "ghost" ? "ghost" : c.button_style === "secondary" ? "secondary" : "default"}
                    size="lg"
                    className="font-body text-base px-10"
                  >
                    {field(c.text_en, c.text_he)}
                  </Button>
                </Link>
              )}
            </div>
          </section>
        );

      case "video":
        return (
          <section key={block.id} className={`${padding} ${align}`} style={bgStyle}>
            <div className="max-w-4xl mx-auto px-6">
              {c.title && (
                <h3 className="font-display text-xl text-foreground mb-4">{c.title}</h3>
              )}
              {c.video_url && (
                <div className="aspect-video rounded-lg overflow-hidden border border-border">
                  <iframe
                    src={c.video_url.replace("watch?v=", "embed/")}
                    title={c.title || "Video"}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              )}
            </div>
          </section>
        );

      case "html":
        return (
          <section key={block.id} className={`${padding}`} style={bgStyle}>
            <div className="max-w-4xl mx-auto px-6" dangerouslySetInnerHTML={{ __html: c.raw_html || "" }} />
          </section>
        );

      case "faq": {
        const items = c.items || [];
        return (
          <section key={block.id} className={`${padding} ${align}`} style={bgStyle}>
            <div className="max-w-3xl mx-auto px-6 space-y-4">
              {items.map((item: any, i: number) => (
                <details key={i} className="border border-border rounded-md bg-card group">
                  <summary className="font-display text-foreground px-5 py-4 cursor-pointer hover:bg-muted/20 transition-colors list-none flex items-center justify-between">
                    <span>{field(item.question_en, item.question_he)}</span>
                    <span className="text-muted-foreground group-open:rotate-180 transition-transform">&#9660;</span>
                  </summary>
                  <div className="font-body text-muted-foreground px-5 pb-4 leading-relaxed">
                    {field(item.answer_en, item.answer_he)}
                  </div>
                </details>
              ))}
            </div>
          </section>
        );
      }

      case "testimonial":
        return (
          <section key={block.id} className={`${padding} text-center`} style={bgStyle}>
            <div className="max-w-2xl mx-auto px-6">
              <blockquote className="font-body text-lg text-foreground italic leading-relaxed mb-4">
                &ldquo;{field(c.quote_en, c.quote_he)}&rdquo;
              </blockquote>
              <div>
                {c.author && <p className="font-display text-foreground">{c.author}</p>}
                {c.role && <p className="font-body text-sm text-muted-foreground">{c.role}</p>}
              </div>
            </div>
          </section>
        );

      case "columns": {
        const items = c.items || [];
        const colClass =
          c.column_count === 4 ? "grid-cols-2 md:grid-cols-4"
          : c.column_count === 3 ? "grid-cols-1 md:grid-cols-3"
          : "grid-cols-1 md:grid-cols-2";
        return (
          <section key={block.id} className={`${padding}`} style={bgStyle}>
            <div className="max-w-6xl mx-auto px-6">
              <div className={`grid ${colClass} gap-8`}>
                {items.map((item: any, i: number) => (
                  <div key={i} className={`${align}`}>
                    {item.icon && <div className="text-3xl mb-3">{item.icon}</div>}
                    {item.title && <h3 className="font-display text-lg text-foreground mb-2">{item.title}</h3>}
                    {item.body && <p className="font-body text-sm text-muted-foreground leading-relaxed">{item.body}</p>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      }

      default:
        return null;
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-body text-muted-foreground">{t("Loading...", "טוען...")}</p>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="font-display text-2xl text-foreground">{t("Page not found", "הדף לא נמצא")}</p>
        <Link to="/" className="font-body text-sm text-gold hover:underline">
          {t("Go to homepage", "לדף הראשי")}
        </Link>
      </div>
    );
  }

  const isFullWidth = page.template === "full-width";
  const hasSidebar = page.template === "sidebar";

  return (
    <div className="min-h-screen bg-background" dir={lang === "he" ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-display text-lg text-gold hover:opacity-80 transition-opacity">
            Or Many Fine Art
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t("Home", "ראשי")}
            </Link>
            <Link to="/blog" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t("Blog", "בלוג")}
            </Link>
            <Link to="/order" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t("Order", "הזמנה")}
            </Link>
          </nav>
        </div>
      </header>

      {/* Page title (non-hero pages) */}
      {!blocks.some((b) => b.block_type === "hero") && (
        <div className="max-w-4xl mx-auto px-6 pt-12 pb-4">
          <h1 className="font-display text-3xl md:text-4xl text-foreground">
            {field(page.title_en, page.title_he)}
          </h1>
        </div>
      )}

      {/* Blocks */}
      {hasSidebar ? (
        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
          <div>{blocks.map(renderBlock)}</div>
          <aside className="border-l border-border pl-6 hidden lg:block">
            <h3 className="font-display text-lg text-foreground mb-4">{t("Navigation", "ניווט")}</h3>
            <nav className="space-y-2 font-body text-sm">
              <Link to="/" className="block text-muted-foreground hover:text-foreground transition-colors">{t("Home", "ראשי")}</Link>
              <Link to="/blog" className="block text-muted-foreground hover:text-foreground transition-colors">{t("Blog", "בלוג")}</Link>
              <Link to="/order" className="block text-muted-foreground hover:text-foreground transition-colors">{t("Order", "הזמנה")}</Link>
            </nav>
          </aside>
        </div>
      ) : isFullWidth ? (
        <div>{blocks.map(renderBlock)}</div>
      ) : (
        <div className="max-w-4xl mx-auto">{blocks.map(renderBlock)}</div>
      )}

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-8 text-center">
        <p className="font-body text-xs text-muted-foreground">
          {t("Or Many Fine Art - Premium Print Studio", "Or Many Fine Art - סטודיו הדפסה פרימיום")}
        </p>
      </footer>
    </div>
  );
};

export default CmsPage;
