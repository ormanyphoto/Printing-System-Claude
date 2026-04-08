import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEmbed } from "@/hooks/useEmbed";
import ImageUpload from "@/components/order/ImageUpload";
import PhotoEditor from "@/components/order/PhotoEditor";
import ProductSelector from "@/components/order/ProductSelector";
import SubtypeSelector from "@/components/order/SubtypeSelector";
import SizeSelector from "@/components/order/SizeSelector";
import FinishSelector from "@/components/order/FinishSelector";
import SubframeSelector, { getSubframeSizeCategory } from "@/components/order/SubframeSelector";
import CanvasOptionsSelector, { EDGE_WRAP_OPTIONS, type EdgeWrapOption } from "@/components/order/CanvasOptionsSelector";
import FramedOptionsSelector, { type BorderValues, type FrameWidthOption } from "@/components/order/FramedOptionsSelector";
import WhiteBorderSelector from "@/components/order/WhiteBorderSelector";
import PriceSummary from "@/components/order/PriceSummary";
import WallMockup from "@/components/order/WallMockup";
import ProductPreview from "@/components/order/ProductPreview";
import Product3DPreview from "@/components/order/Product3DPreview";
import StepProgress from "@/components/order/StepProgress";
import QualityIndicator, { getQuality } from "@/components/order/QualityIndicator";
import OrderSummary from "@/components/order/OrderSummary";
import MaterialTooltip from "@/components/order/MaterialTooltip";
import { useOrderFlow } from "@/hooks/useOrderFlow";
import { useLocalizedField } from "@/hooks/useLocalizedField";
import { supabase } from "@/integrations/supabase/client";
import { calculatePrice, formatILS } from "@/lib/pricing";
import type { Tables } from "@/integrations/supabase/types";
import {
  Image as ImageIcon, ImagePlus, Scaling, LayoutGrid, Layers,
  Box, GalleryVerticalEnd, Square, ShoppingCart, Sparkles, PanelTop, Pencil, X, ArrowLeft
} from "lucide-react";

// Products that have subframe/hanging systems
const SUBFRAME_SLUGS = ["hd-metal", "dibond", "plexiglass"];

type PreviewMode = "room" | "product" | "3d";

/** Nested rectangles frame icon — filled frame band */
const FrameIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path fillRule="evenodd" clipRule="evenodd" d="M2 2h20v20H2V2Zm4 4v12h12V6H6Z" />
  </svg>
);

const Order = () => {
  const { t, i18n } = useTranslation();
  const { lf } = useLocalizedField();
  
  const navigate = useNavigate();
  const isEmbed = useEmbed();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSlug = searchParams.get("product");
  const { uploadedImage, isUploading, uploadProgress, handleFileSelect, clearImage, setEditedUrl, updateAspectRatio, resetToOriginal, setUploadedImage } = useOrderFlow();
  const [userId, setUserId] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("room");
  const [prevPrice, setPrevPrice] = useState<number | null>(null);
  const [priceAnimating, setPriceAnimating] = useState(false);

  const isTiff = uploadedImage?.file?.name ? /\.tiff?$/i.test(uploadedImage.file.name) : false;
  const previewSrc = isTiff
    ? (uploadedImage?.thumbnailUrl || uploadedImage?.previewUrl || "")
    : (uploadedImage?.storageUrl || uploadedImage?.thumbnailUrl || "");

  // Core selections
  const [selectedProduct, setSelectedProduct] = useState<Tables<"products"> | null>(null);
  const [selectedSubtype, setSelectedSubtype] = useState<Tables<"product_subtypes"> | null>(null);
  const [selectedSize, setSelectedSize] = useState<Tables<"size_presets"> | null>(null);

  // Product-specific selections
  const [selectedFinish, setSelectedFinish] = useState<Tables<"finishes"> | null>(null);
  const [selectedSubframe, setSelectedSubframe] = useState<Tables<"subframe_options"> | null>(null);
  const [canvasEdgeWrap, setCanvasEdgeWrap] = useState<EdgeWrapOption>(EDGE_WRAP_OPTIONS[0]);
  const [borders, setBorders] = useState<BorderValues>({ top: 0, bottom: 0, left: 0, right: 0 });
  const [selectedFrameWidth, setSelectedFrameWidth] = useState<FrameWidthOption | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedFrameStyle, setSelectedFrameStyle] = useState<Tables<"frame_styles"> | null>(null);
  const [selectedFrameColor, setSelectedFrameColor] = useState<{ id: string; color_name_en: string; color_name_he: string; hex_code: string } | null>(null);
  const [selectedGlazing, setSelectedGlazing] = useState<Tables<"glazing_options"> | null>(null);
  const [addFrame, setAddFrame] = useState(false);
  const [enhanceQuality, setEnhanceQuality] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  // Auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const slug = selectedProduct?.slug;
  const wantsFrame = slug === "framed" || (slug === "photo-paper" && addFrame);
  const frameWidthCm = selectedFrameWidth ? Number(selectedFrameWidth.width_cm) : 1.5;

  const defaultDims = useMemo(() => {
    if (!uploadedImage) return { w: 60, h: 40 };
    const { width, height } = uploadedImage;
    if (width >= height) return { w: 60, h: Math.round(60 * height / width) };
    return { w: Math.round(60 * width / height), h: 60 };
  }, [uploadedImage]);

  // ── Queries ──
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("enabled", true).order("sort_order");
      return data ?? [];
    },
  });

  useEffect(() => {
    if (products.length > 0 && !selectedProduct && initialSlug) {
      const match = products.find((p) => p.slug === initialSlug);
      if (match) setSelectedProduct(match);
    }
  }, [products, initialSlug, selectedProduct]);

  const { data: subtypes = [] } = useQuery({
    queryKey: ["subtypes", selectedProduct?.id],
    queryFn: async () => {
      if (!selectedProduct) return [];
      const { data } = await supabase.from("product_subtypes").select("*").eq("product_id", selectedProduct.id).eq("enabled", true).order("sort_order");
      return data ?? [];
    },
    enabled: !!selectedProduct,
  });

  useEffect(() => { setSelectedSubtype(subtypes.length > 0 ? subtypes[0] : null); }, [subtypes]);

  // Fetch ALL sizes for the product, then pick the closest aspect ratio to the image
  const { data: allSizesForProduct = [] } = useQuery({
    queryKey: ["sizes", selectedProduct?.id],
    queryFn: async () => {
      if (!selectedProduct) return [];
      const { data } = await supabase.from("size_presets").select("*").eq("product_id", selectedProduct.id).eq("enabled", true).order("width_cm").order("height_cm");
      return data ?? [];
    },
    enabled: !!selectedProduct,
  });

  // Find the best matching aspect ratio from available sizes
  const bestAspectRatio = useMemo(() => {
    if (!uploadedImage || allSizesForProduct.length === 0) return null;
    const imageRatio = uploadedImage.width / uploadedImage.height;
    const availableRatios = [...new Set(allSizesForProduct.map((s) => s.aspect_ratio))];
    
    // Parse aspect ratio string "W:H" to numeric value
    const parseRatio = (r: string) => {
      const [w, h] = r.split(":").map(Number);
      return w && h ? w / h : 1;
    };
    
    let closest = availableRatios[0];
    let minDiff = Math.abs(imageRatio - parseRatio(closest));
    for (const r of availableRatios) {
      const diff = Math.abs(imageRatio - parseRatio(r));
      if (diff < minDiff) { minDiff = diff; closest = r; }
    }
    return closest;
  }, [uploadedImage, allSizesForProduct]);

  // Filter sizes to the best matching aspect ratio
  const sizes = useMemo(() => {
    if (!bestAspectRatio) return [];
    return allSizesForProduct.filter((s) => s.aspect_ratio === bestAspectRatio);
  }, [allSizesForProduct, bestAspectRatio]);

  // Update the image's aspect ratio to match the closest available one
  useEffect(() => {
    if (bestAspectRatio && uploadedImage && uploadedImage.aspectRatio !== bestAspectRatio) {
      updateAspectRatio(bestAspectRatio);
    }
  }, [bestAspectRatio, uploadedImage, updateAspectRatio]);

  useEffect(() => {
    if (sizes.length === 0) { setSelectedSize(null); return; }
    let best = sizes[0];
    let bestDiff = Math.abs(sizes[0].width_cm - 60);
    for (const s of sizes) {
      const diff = Math.abs(s.width_cm - 60);
      if (diff < bestDiff) { bestDiff = diff; best = s; }
    }
    setSelectedSize(best);
  }, [sizes]);

  const { data: priceTiers = [] } = useQuery({
    queryKey: ["priceTiers", selectedProduct?.id],
    queryFn: async () => {
      if (!selectedProduct) return [];
      const { data } = await supabase.from("price_tiers").select("*").eq("product_id", selectedProduct.id);
      return data ?? [];
    },
    enabled: !!selectedProduct,
  });

  const { data: finishes = [] } = useQuery({
    queryKey: ["finishes", selectedSubtype?.id],
    queryFn: async () => {
      if (!selectedSubtype) return [];
      const { data } = await supabase.from("finishes").select("*").eq("subtype_id", selectedSubtype.id).eq("enabled", true).order("sort_order");
      return data ?? [];
    },
    enabled: !!selectedSubtype,
  });

  useEffect(() => { setSelectedFinish(finishes.length > 0 ? finishes[0] : null); }, [finishes]);

  const { data: subframeOptions = [] } = useQuery({
    queryKey: ["subframeOptions"],
    queryFn: async () => {
      const { data } = await supabase.from("subframe_options").select("*").eq("enabled", true);
      return data ?? [];
    },
    enabled: !!slug && SUBFRAME_SLUGS.includes(slug),
  });

  const { data: frameStyles = [] } = useQuery({
    queryKey: ["frameStyles"],
    queryFn: async () => {
      const { data } = await supabase.from("frame_styles").select("*").eq("enabled", true).order("sort_order");
      return data ?? [];
    },
    enabled: wantsFrame,
  });

  const { data: frameWidths = [] } = useQuery({
    queryKey: ["frameWidths"],
    queryFn: async () => {
      const { data } = await supabase.from("frame_widths").select("*").eq("enabled", true).order("sort_order");
      return (data ?? []) as FrameWidthOption[];
    },
    enabled: wantsFrame,
  });

  useEffect(() => {
    if (frameWidths.length > 0 && !selectedFrameWidth) setSelectedFrameWidth(frameWidths[0]);
  }, [frameWidths, selectedFrameWidth]);

  const { data: allFrameColors = [] } = useQuery({
    queryKey: ["frameColors"],
    queryFn: async () => {
      const { data } = await supabase.from("frame_colors").select("*");
      return data ?? [];
    },
    enabled: wantsFrame,
  });

  const { data: glazingOptions = [] } = useQuery({
    queryKey: ["glazingOptions"],
    queryFn: async () => {
      const { data } = await supabase.from("glazing_options").select("*").eq("enabled", true).order("sort_order");
      return data ?? [];
    },
    enabled: wantsFrame,
  });

  useEffect(() => {
    if (frameStyles.length > 0 && !selectedFrameStyle) setSelectedFrameStyle(frameStyles[0]);
  }, [frameStyles, selectedFrameStyle]);

  useEffect(() => {
    if (glazingOptions.length > 0 && !selectedGlazing) setSelectedGlazing(glazingOptions[0]);
  }, [glazingOptions, selectedGlazing]);

  const currentFrameColors = useMemo(() => {
    if (!selectedFrameStyle) return [];
    return allFrameColors.filter((c) => c.frame_style_id === selectedFrameStyle.id);
  }, [allFrameColors, selectedFrameStyle]);

  useEffect(() => {
    if (currentFrameColors.length > 0) setSelectedFrameColor(currentFrameColors[0]);
    else setSelectedFrameColor(null);
  }, [currentFrameColors]);

  const sizeCategory = useMemo(() => {
    if (!selectedSize) return "medium" as const;
    return getSubframeSizeCategory(selectedSize.width_cm, selectedSize.height_cm);
  }, [selectedSize]);

  useEffect(() => {
    if (!slug || !SUBFRAME_SLUGS.includes(slug) || subframeOptions.length === 0) return;
    if (sizeCategory === "small") {
      const pvc = subframeOptions.find((o) => o.material === "PVC");
      if (pvc) setSelectedSubframe(pvc);
    } else if (sizeCategory === "extra-large") {
      const alu = subframeOptions.find((o) => o.material === "Aluminum");
      if (alu) setSelectedSubframe(alu);
    } else {
      const plastic = subframeOptions.find((o) => o.material === "Plastic");
      if (plastic) setSelectedSubframe(plastic);
    }
  }, [sizeCategory, subframeOptions, slug]);

  // ── Pricing ──
  const applicableTier = useMemo(() => {
    if (priceTiers.length === 0) return null;
    if (selectedSubtype) {
      const match = priceTiers.find((pt) => pt.subtype_id === selectedSubtype.id);
      if (match) return match;
    }
    return priceTiers.find((pt) => !pt.subtype_id) ?? priceTiers[0];
  }, [priceTiers, selectedSubtype]);

  const priceBreakdown = useMemo(() => {
    if (!selectedSize || !applicableTier || !selectedProduct) return null;

    const items: { label: string; value: string; amount: number }[] = [];
    let totalSurchargePercent = 0;

    const isFramedPricing = selectedProduct.slug === "framed" || (selectedProduct.slug === "photo-paper" && addFrame);
    const isPhotoPaperLocal = selectedProduct.slug === "photo-paper";
    const hasBorderPricing = isFramedPricing || isPhotoPaperLocal;
    const pricingW = hasBorderPricing ? selectedSize.width_cm + borders.left + borders.right : selectedSize.width_cm;
    const pricingH = hasBorderPricing ? selectedSize.height_cm + borders.top + borders.bottom : selectedSize.height_cm;

    if (selectedFinish && selectedFinish.surcharge_pct > 0) {
      totalSurchargePercent += Number(selectedFinish.surcharge_pct);
      items.push({ label: `${lf(selectedFinish.name_en, selectedFinish.name_he)} ${t("options.finish").toLowerCase()}`, value: `+${selectedFinish.surcharge_pct}%`, amount: 0 });
    }

    if (selectedSubframe && SUBFRAME_SLUGS.includes(selectedProduct.slug) && Number(selectedSubframe.surcharge_pct) > 0) {
      totalSurchargePercent += Number(selectedSubframe.surcharge_pct);
      items.push({ label: lf(selectedSubframe.name_en, selectedSubframe.name_he), value: `+${selectedSubframe.surcharge_pct}%`, amount: 0 });
    }

    if (selectedProduct.slug === "canvas" && canvasEdgeWrap.surchargePercent > 0) {
      totalSurchargePercent += canvasEdgeWrap.surchargePercent;
      items.push({ label: t(canvasEdgeWrap.labelKey), value: `+${canvasEdgeWrap.surchargePercent}%`, amount: 0 });
    }

    const basePrice = calculatePrice(pricingW, pricingH, applicableTier, totalSurchargePercent);
    let total = basePrice;
    items.unshift({ label: t("price.product"), value: formatILS(basePrice), amount: basePrice });

    // Enhancement fee
    if (enhanceQuality) {
      const enhanceFee = 40;
      total += enhanceFee;
      items.push({ label: t("quality.enhance"), value: formatILS(enhanceFee), amount: enhanceFee });
    }

    if (isFramedPricing && selectedFrameStyle) {
      const perimeter = 2 * (pricingW + pricingH);
      const frameWidthSurchargePct = selectedFrameWidth ? Number(selectedFrameWidth.surcharge_pct) : 0;
      const frameCost = Math.round(perimeter * Number(selectedFrameStyle.price_per_cm) * (1 + frameWidthSurchargePct / 100));
      total += frameCost;
      items.push({ label: `${lf(selectedFrameStyle.name_en, selectedFrameStyle.name_he)} ${t("price.frame").toLowerCase()}${selectedFrameWidth ? ` (${Number(selectedFrameWidth.width_cm)} cm)` : ""}`, value: formatILS(frameCost), amount: frameCost });
    }

    if (isFramedPricing && selectedGlazing) {
      const areaSqm = (pricingW * pricingH) / 10000;
      const glazingCost = Math.round(areaSqm * Number(selectedGlazing.price_sqm));
      total += glazingCost;
      items.push({ label: lf(selectedGlazing.name_en, selectedGlazing.name_he), value: formatILS(glazingCost), amount: glazingCost });
    }

    return {
      items: items.map(({ label, value }) => ({ label, value })),
      total,
      pricingW,
      pricingH,
    };
  }, [selectedSize, applicableTier, selectedProduct, selectedFinish, selectedSubframe, canvasEdgeWrap, borders, selectedFrameStyle, selectedGlazing, selectedFrameWidth, addFrame, enhanceQuality, t, lf]);

  // Price animation
  useEffect(() => {
    if (priceBreakdown && prevPrice !== null && prevPrice !== priceBreakdown.total) {
      setPriceAnimating(true);
      const timer = setTimeout(() => setPriceAnimating(false), 600);
      return () => clearTimeout(timer);
    }
    if (priceBreakdown) setPrevPrice(priceBreakdown.total);
  }, [priceBreakdown?.total]);

  useEffect(() => {
    if (priceBreakdown) setPrevPrice(priceBreakdown.total);
  }, [priceBreakdown?.total]);

  // ── Draft save/load ──
  const buildSelections = useCallback(() => {
    const slugLocal = (selectedProduct?.slug || "").toLowerCase();
    const isCanvas = slugLocal === "canvas";
    const hasSubframes = ["hd-metal", "dibond", "plexiglass"].includes(slugLocal);
    const isFramedProduct = slugLocal === "framed";
    const isPhotoPaperLocal = slugLocal === "photo-paper";
    const supportsFraming = isFramedProduct || (isPhotoPaperLocal && addFrame);

    return {
      productSlug: selectedProduct?.slug,
      productId: selectedProduct?.id,
      subtypeId: selectedSubtype?.id,
      sizeId: selectedSize?.id,
      finishId: selectedFinish?.id,
      subframeId: hasSubframes ? selectedSubframe?.id : undefined,
      canvasEdgeWrapId: isCanvas ? canvasEdgeWrap.id : undefined,
      borders,
      frameWidthId: supportsFraming ? selectedFrameWidth?.id : undefined,
      frameStyleId: supportsFraming ? selectedFrameStyle?.id : undefined,
      frameColorId: supportsFraming ? selectedFrameColor?.id : undefined,
      glazingId: supportsFraming ? selectedGlazing?.id : undefined,
      addFrame: supportsFraming ? addFrame : false,
      enhanceQuality,
      imageUrl: uploadedImage?.storageUrl,
      aspectRatio: uploadedImage?.aspectRatio,
      productName: selectedProduct ? lf(selectedProduct.name_en, selectedProduct.name_he) : undefined,
    };
  }, [selectedProduct, selectedSubtype, selectedSize, selectedFinish, selectedSubframe, canvasEdgeWrap, borders, selectedFrameWidth, selectedFrameStyle, selectedFrameColor, selectedGlazing, addFrame, uploadedImage, lf]);

  const handleSaveDraft = useCallback(async () => {
    if (!userId) { toast.info(t("draft.loginRequired")); navigate("/login"); return; }
    setSavingDraft(true);
    try {
      const selections = buildSelections();
      const totalPrice = priceBreakdown?.total ?? 0;
      if (draftId) {
        await supabase.from("orders").update({ product_selections: selections as any, total_price_ils: totalPrice, image_url: uploadedImage?.storageUrl ?? null, status: "draft" }).eq("id", draftId);
      } else {
        const { data } = await supabase.from("orders").insert({ user_id: userId, product_selections: selections as any, total_price_ils: totalPrice, image_url: uploadedImage?.storageUrl ?? null, status: "draft" }).select("id").single();
        if (data) setDraftId(data.id);
      }
      toast.success(t("draft.saved"));
    } catch { toast.error(t("draft.saveError")); }
    finally { setSavingDraft(false); }
  }, [userId, draftId, buildSelections, priceBreakdown, uploadedImage, t, navigate]);

  const handleAddToCart = useCallback(async () => {
    if (!priceBreakdown || !selectedProduct) return;
    const totalPrice = priceBreakdown.total;
    const pW = priceBreakdown.pricingW;
    const pH = priceBreakdown.pricingH;
    const areaSqm = (pW * pH) / 10000;

    const selections: Record<string, any> = {
      ...buildSelections(),
      subtypeName: selectedSubtype ? lf(selectedSubtype.name_en, selectedSubtype.name_he) : undefined,
      finishName: selectedFinish ? lf(selectedFinish.name_en, selectedFinish.name_he) : undefined,
      frameStyleName: selectedFrameStyle ? lf(selectedFrameStyle.name_en, selectedFrameStyle.name_he) : undefined,
      frameColorName: selectedFrameColor ? lf(selectedFrameColor.color_name_en, selectedFrameColor.color_name_he) : undefined,
      glazingName: selectedGlazing ? lf(selectedGlazing.name_en, selectedGlazing.name_he) : undefined,
      sizeCm: selectedSize ? `${selectedSize.width_cm}×${selectedSize.height_cm}` : undefined,
      subframeName: selectedSubframe ? lf(selectedSubframe.name_en, selectedSubframe.name_he) : undefined,
      canvasEdgeWrapName: canvasEdgeWrap ? t(`canvas.edge.${canvasEdgeWrap.id}`, canvasEdgeWrap.id) : undefined,
      frameWidthCm: selectedFrameWidth ? Number(selectedFrameWidth.width_cm) : undefined,
      whiteBorders: (borders.top || borders.bottom || borders.left || borders.right)
        ? `${borders.top}/${borders.right}/${borders.bottom}/${borders.left} cm`
        : undefined,
      totalSize: pW !== selectedSize?.width_cm || pH !== selectedSize?.height_cm
        ? `${pW.toFixed(1)}×${pH.toFixed(1)} cm`
        : undefined,
      area: `${areaSqm.toFixed(2)} m²`,
    };

    setAddingToCart(true);
    try {
      const { data: syncData, error: syncError } = await supabase.functions.invoke("shopify-sync", {
        body: { action: "add_to_cart", items: [{ selections, totalPrice }] },
      });
      if (syncError) throw syncError;
      if (!syncData?.success) {
        const errorMsg = syncData?.error || "Sync failed";
        if (errorMsg.includes("No variant mapping")) {
          toast.error("No Shopify variant mapped for this configuration. Please contact support.");
        } else {
          toast.error(t("cart.error"));
        }
        throw new Error(errorMsg);
      }
      const cartAddUrl = syncData.cart_add_url;
      if (cartAddUrl) {
        const inIframe = window !== window.parent;
        if (isEmbed || inIframe) {
          window.parent.postMessage({ type: "lovable:checkout", url: cartAddUrl }, "*");
        } else {
          window.open(cartAddUrl, "_blank");
        }
      }
      toast.success(t("cart.success"));
    } catch (e: any) {
      console.error("Add to cart error:", e);
    } finally {
      setAddingToCart(false);
    }
  }, [buildSelections, priceBreakdown, selectedProduct, selectedSubtype, selectedFinish, selectedFrameStyle, selectedFrameColor, selectedGlazing, selectedSize, selectedSubframe, selectedFrameWidth, canvasEdgeWrap, borders, lf, t, isEmbed]);

  // Draft load
  const [pendingDraft, setPendingDraft] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    if (!userId || draftLoaded) return;
    (async () => {
      const { data } = await supabase.from("orders").select("*").eq("user_id", userId).eq("status", "draft").order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (data) {
        setDraftId(data.id);
        const sel = data.product_selections as Record<string, any>;
        setPendingDraft(sel);
        if (sel?.productSlug) setSearchParams({ product: sel.productSlug });
        if (sel?.addFrame) setAddFrame(true);
        if (sel?.borders) setBorders(sel.borders);
        if (sel?.imageUrl && sel?.aspectRatio && !uploadedImage) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            setUploadedImage({
              file: new File([], "draft-image"), previewUrl: sel.imageUrl, originalPreviewUrl: sel.imageUrl,
              thumbnailUrl: sel.imageUrl, width: img.naturalWidth, height: img.naturalHeight,
              aspectRatio: sel.aspectRatio, originalAspectRatio: sel.aspectRatio, storageUrl: sel.imageUrl,
            });
          };
          img.src = sel.imageUrl;
        }
      }
      setDraftLoaded(true);
    })();
  }, [userId, draftLoaded, setSearchParams, uploadedImage, setUploadedImage]);

  // Restore draft selections
  useEffect(() => { if (pendingDraft && subtypes.length > 0 && pendingDraft.subtypeId) { const m = subtypes.find((s) => s.id === pendingDraft.subtypeId); if (m) setSelectedSubtype(m); } }, [subtypes, pendingDraft]);
  useEffect(() => { if (pendingDraft && sizes.length > 0 && pendingDraft.sizeId) { const m = sizes.find((s) => s.id === pendingDraft.sizeId); if (m) setSelectedSize(m); } }, [sizes, pendingDraft]);
  useEffect(() => { if (pendingDraft && finishes.length > 0 && pendingDraft.finishId) { const m = finishes.find((f) => f.id === pendingDraft.finishId); if (m) setSelectedFinish(m); } }, [finishes, pendingDraft]);
  useEffect(() => { if (pendingDraft && frameStyles.length > 0 && pendingDraft.frameStyleId) { const m = frameStyles.find((f) => f.id === pendingDraft.frameStyleId); if (m) setSelectedFrameStyle(m); } }, [frameStyles, pendingDraft]);
  useEffect(() => { if (pendingDraft && frameWidths.length > 0 && pendingDraft.frameWidthId) { const m = frameWidths.find((f) => f.id === pendingDraft.frameWidthId); if (m) setSelectedFrameWidth(m); } }, [frameWidths, pendingDraft]);
  useEffect(() => { if (pendingDraft && currentFrameColors.length > 0 && pendingDraft.frameColorId) { const m = currentFrameColors.find((c) => c.id === pendingDraft.frameColorId); if (m) setSelectedFrameColor(m); } }, [currentFrameColors, pendingDraft]);
  useEffect(() => { if (pendingDraft && glazingOptions.length > 0 && pendingDraft.glazingId) { const m = glazingOptions.find((g) => g.id === pendingDraft.glazingId); if (m) setSelectedGlazing(m); } }, [glazingOptions, pendingDraft]);

  // ── Handlers ──
  const handleProductSelect = (product: Tables<"products">) => {
    setSelectedProduct(product);
    setSelectedSize(null);
    setSelectedFinish(null);
    setSelectedSubframe(null);
    setCanvasEdgeWrap(EDGE_WRAP_OPTIONS[0]);
    setBorders({ top: 0, bottom: 0, left: 0, right: 0 });
    setSelectedFrameStyle(null);
    setSelectedFrameWidth(null);
    setSelectedFrameColor(null);
    setSelectedGlazing(null);
    setAddFrame(false);
    setSearchParams({ product: product.slug });
  };

  // Auto-select HD Metal as default after upload completes & open product section
  const hadImageRef = useRef(false);
  useEffect(() => {
    if (uploadedImage && !hadImageRef.current && products.length > 0) {
      hadImageRef.current = true;
      if (!selectedProduct) {
        const hdMetal = products.find((p) => p.slug === "hd-metal");
        if (hdMetal) {
          handleProductSelect(hdMetal);
        }
      }
      setExpandedSection("product");
    }
    if (!uploadedImage) {
      hadImageRef.current = false;
    }
  }, [uploadedImage, products]);

  const step1Done = !!selectedProduct;
  const step2Done = !!uploadedImage;
  const step3Done = !!selectedSize;

  // No auto-close: sections stay open after selections
  const hasSubframe = slug && SUBFRAME_SLUGS.includes(slug);
  const hasFinishes = finishes.length > 0;
  const isCanvas = slug === "canvas";
  const isFramed = wantsFrame;
  const isPhotoPaper = slug === "photo-paper";
  const showPreview = !!uploadedImage && !!selectedProduct;

  // Compute current step for progress
  const currentStep = !step1Done ? 1 : !step2Done ? 2 : !step3Done ? 3 : !priceBreakdown ? 4 : 5;

  // Order summary lines
  const summaryLines = useMemo(() => {
    const lines: { label: string; value: string }[] = [];
    if (selectedProduct) lines.push({ label: t("summary.product", "Product"), value: lf(selectedProduct.name_en, selectedProduct.name_he) });
    if (selectedSubtype && subtypes.length > 1) lines.push({ label: t("order.subtype", "Sub-Type"), value: lf(selectedSubtype.name_en, selectedSubtype.name_he) });
    if (selectedSize) lines.push({ label: t("summary.size", "Size"), value: `${selectedSize.width_cm} × ${selectedSize.height_cm} cm` });
    if (selectedFinish) lines.push({ label: t("options.finish"), value: lf(selectedFinish.name_en, selectedFinish.name_he) });
    if (hasSubframe && selectedSubframe) lines.push({ label: t("options.subframe", "Hanging System"), value: lf(selectedSubframe.name_en, selectedSubframe.name_he) });
    if (isCanvas) lines.push({ label: t("options.canvasEdge", "Canvas Edge"), value: t(canvasEdgeWrap.labelKey) });
    // White border (for photo paper or framed)
    const hasBorders = borders.top > 0 || borders.bottom > 0 || borders.left > 0 || borders.right > 0;
    if ((isFramed || isPhotoPaper) && hasBorders) {
      const allEqual = borders.top === borders.bottom && borders.top === borders.left && borders.top === borders.right;
      const borderValue = allEqual
        ? `${borders.top} cm`
        : `${borders.top} / ${borders.bottom} / ${borders.left} / ${borders.right} cm`;
      lines.push({ label: t("options.whiteBorder", "White Border"), value: borderValue });
    }
    // Frame options
    if (isFramed && selectedFrameStyle) lines.push({ label: t("options.frameStyle", "Frame Style"), value: lf(selectedFrameStyle.name_en, selectedFrameStyle.name_he) });
    if (isFramed && selectedFrameColor) lines.push({ label: t("options.frameColor", "Frame Color"), value: lf(selectedFrameColor.color_name_en, selectedFrameColor.color_name_he) });
    if (isFramed && selectedFrameWidth) lines.push({ label: t("options.frameWidth", "Frame Width"), value: `${Number(selectedFrameWidth.width_cm)} cm` });
    if (isFramed && selectedGlazing) lines.push({ label: t("options.glazing", "Glazing"), value: lf(selectedGlazing.name_en, selectedGlazing.name_he) });
    if (enhanceQuality) lines.push({ label: t("quality.enhance"), value: `+${t("quality.enhanceFee")}` });
    return lines;
  }, [selectedProduct, selectedSubtype, selectedSize, selectedFinish, selectedSubframe, selectedFrameStyle, selectedFrameColor, selectedFrameWidth, selectedGlazing, canvasEdgeWrap, borders, isFramed, isCanvas, isPhotoPaper, hasSubframe, subtypes, enhanceQuality, lf, t]);

  // Preview mode content rendering
  const renderPreview = () => {
    if (!uploadedImage) return null;
    const w = selectedSize?.width_cm ?? defaultDims.w;
    const h = selectedSize?.height_cm ?? defaultDims.h;
    const commonProps = {
      imageUrl: previewSrc,
      widthCm: w,
      heightCm: h,
      productName: lf(selectedProduct?.name_en, selectedProduct?.name_he),
      productSlug: selectedProduct?.slug,
      borders: (isFramed || isPhotoPaper) ? borders : undefined,
      frameWidthCm: isFramed ? frameWidthCm : undefined,
      frameColorHex: isFramed && selectedFrameColor ? selectedFrameColor.hex_code : undefined,
      frameColorId: isFramed && selectedFrameColor ? selectedFrameColor.id : undefined,
    };

    if (previewMode === "room") {
      return (
        <WallMockup
          {...commonProps}
          finishName={lf(selectedFinish?.name_en, selectedFinish?.name_he)}
        />
      );
    }
    if (previewMode === "product") {
      return (
        <ProductPreview {...commonProps} />
      );
    }
    if (previewMode === "3d") {
      return (
        <div className="w-full h-full">
          <Product3DPreview
            {...commonProps}
            edgeWrap={isCanvas ? canvasEdgeWrap.id : undefined}
            subframeData={hasSubframe && selectedSubframe ? {
              material: selectedSubframe.material,
              width_cm: selectedSubframe.width_cm,
              height_cm: selectedSubframe.height_cm,
              inset_cm: selectedSubframe.inset_cm,
              color: selectedSubframe.color,
            } : undefined}
          />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <main>
        <div className="w-full">
          <div className="mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-start gap-0" style={{ direction: "ltr" }}>

              {/* ── LEFT COLUMN: Preview (2/3) ── */}
              {showPreview && (
                <div className="hidden lg:flex lg:flex-col lg:w-2/3 lg:self-start lg:sticky lg:top-0 bg-muted/20 h-screen" style={{ direction: i18n.language === "he" ? "rtl" : "ltr" }}>
                  {/* Preview mode toggles */}
                  <div className="absolute top-4 end-4 z-10 flex gap-1 bg-background/90 backdrop-blur-sm rounded-lg border border-border p-1 shadow-sm">
                    {(["room", "product", "3d"] as PreviewMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setPreviewMode(mode)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-body font-semibold uppercase tracking-wider transition-colors ${
                          previewMode === mode
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        {mode === "room" && <ImageIcon className="w-4 h-4" strokeWidth={2.5} />}
                        {mode === "product" && <Square className="w-4 h-4" strokeWidth={2.5} />}
                        {mode === "3d" && <Box className="w-4 h-4" strokeWidth={2.5} />}
                        {mode === "room" ? t("preview.room", "Room View") : mode === "product" ? t("preview.artworkView", "Artwork View") : t("preview.3d", "3D")}
                      </button>
                    ))}
                  </div>
                  {/* Preview content - fill the panel */}
                  <div className="flex items-center justify-center flex-1 min-h-0 p-2">
                    <div className="w-full h-full flex items-center justify-center">
                      {renderPreview()}
                    </div>
                  </div>
                </div>
              )}

              {/* ── RIGHT COLUMN: Options (1/3) ── */}
              <div className={`${showPreview ? "lg:w-1/3 lg:border-s lg:border-border" : "w-full max-w-2xl mx-auto"} transition-all lg:flex lg:flex-col lg:max-h-[calc(100vh-60px)]`} style={{ direction: i18n.language === "he" ? "rtl" : "ltr" }}>

                <div className="lg:overflow-y-auto lg:flex-1 lg:min-h-0 px-5 py-4 lg:px-8 space-y-1">
                  {/* Back button */}
                  <div className="border-b border-border">
                    <button
                      onClick={() => navigate("/")}
                      className="flex items-center gap-2 px-1 py-3 font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span className="uppercase tracking-wider text-xs font-semibold">{t("order.back", "Back")}</span>
                    </button>
                  </div>

                  {/* STEP 1: Upload Photo (moved to top) */}
                   <section>
                    {step2Done && uploadedImage ? (
                      <>
                        {/* Compact bar on mobile/tablet */}
                        <div className="lg:hidden flex items-center gap-3 p-3 border border-border rounded-sm bg-card mb-2">
                          <img src={previewSrc} alt="" className="w-10 h-10 object-cover rounded" />
                          <span className="flex-1 font-body text-sm text-foreground truncate">{t("order.step1")}</span>
                          <button onClick={() => setShowEditor(true)} className="font-body text-xs text-accent font-medium px-2">{t("order.editPhoto")}</button>
                          <button onClick={() => { clearImage(); setSelectedSize(null); }} className="font-body text-xs text-muted-foreground px-2">✕</button>
                        </div>
                        {/* Desktop: upload row with inline edit/remove */}
                        <div className="hidden lg:block border-b border-border">
                          <div className="flex items-center gap-3 px-1 py-4">
                            <span className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-muted-foreground">
                              <ImagePlus className="w-5 h-5" strokeWidth={1.5} />
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-body text-sm font-bold uppercase tracking-wide text-foreground">{t("order.step1", "Upload Photo")}</p>
                              <p className="font-body text-sm text-muted-foreground truncate mt-0.5">{uploadedImage?.file?.name || ""}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => setShowEditor(true)}
                                className="flex items-center gap-1.5 font-body text-xs uppercase tracking-wider h-8"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                {t("order.editPhoto", "Edit")}
                              </Button>
                              <button
                                onClick={() => { clearImage(); setSelectedSize(null); }}
                                className="flex items-center gap-1.5 font-body text-xs uppercase tracking-wider text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="py-4">
                        <ImageUpload
                          uploadedImage={uploadedImage}
                          isUploading={isUploading}
                          uploadProgress={uploadProgress}
                          onFileSelect={handleFileSelect}
                          onClear={() => { clearImage(); setSelectedSize(null); }}
                          onEdit={() => setShowEditor(true)}
                        />
                      </div>
                    )}
                    <Dialog open={showEditor && !!uploadedImage} onOpenChange={(open) => !open && setShowEditor(false)}>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
                        {uploadedImage && (
                          <PhotoEditor imageUrl={uploadedImage.previewUrl} aspectRatio={uploadedImage.aspectRatio} onDone={(dataUrl, newAspectRatio) => { setEditedUrl(dataUrl); if (newAspectRatio) updateAspectRatio(newAspectRatio); setShowEditor(false); }} onCancel={() => setShowEditor(false)} onReset={() => { resetToOriginal(); setShowEditor(false); }} />
                        )}
                      </DialogContent>
                    </Dialog>
                  </section>

                  {/* STEP 2: Choose Product - only shown after upload */}
                  {step2Done && (
                    <OptionRow
                      icon={<LayoutGrid className="w-5 h-5" strokeWidth={1.5} />}
                      label={t("order.step2", "Choose Product")}
                      value={selectedProduct ? lf(selectedProduct.name_en, selectedProduct.name_he) : ""}
                      expandable
                      expanded={expandedSection === "product"}
                      onToggle={() => toggleSection("product")}
                      done={!!selectedProduct}
                      expandedContent={
                        <ProductSelector products={products} selectedSlug={slug ?? null} onSelect={handleProductSelect} />
                      }
                    />
                  )}

                  {/* STEP 3: Size (right after product) */}
                  {step1Done && step2Done && (
                    <OptionRow
                      icon={<Scaling className="w-5 h-5" strokeWidth={1.5} />}
                      label={t("order.step3", "Size")}
                      value={selectedSize ? `${selectedSize.width_cm} × ${selectedSize.height_cm} cm` : ""}
                      expandable
                      expanded={expandedSection === "size"}
                      onToggle={() => toggleSection("size")}
                      done={!!selectedSize}
                      expandedContent={
                        <div>
                          <p className="font-body text-xs text-muted-foreground mb-3">
                            {t("order.sizeRatio", { ratio: uploadedImage?.aspectRatio })}
                          </p>
                          <SizeSelector sizes={sizes} selectedSizeId={selectedSize?.id ?? null} onSelectSize={setSelectedSize} />
                          {selectedSize && uploadedImage && (() => {
                            const { quality } = getQuality(uploadedImage.width, uploadedImage.height, selectedSize.width_cm, selectedSize.height_cm);
                            const needsEnhance = quality === "low" || quality === "good";
                            return (
                              <>
                                <div className="mt-3">
                                  <QualityIndicator
                                    imageWidthPx={uploadedImage.width}
                                    imageHeightPx={uploadedImage.height}
                                    printWidthCm={selectedSize.width_cm}
                                    printHeightCm={selectedSize.height_cm}
                                  />
                                </div>
                                {needsEnhance && (
                                  <div className="mt-3 flex items-center justify-between gap-3 p-3 rounded-md border border-accent/30 bg-accent/5">
                                    <div className="flex items-center gap-2.5">
                                      <Sparkles className="w-5 h-5 text-accent flex-shrink-0" strokeWidth={1.5} />
                                      <div>
                                        <p className="font-body text-sm font-semibold text-foreground">{t("quality.enhance")}</p>
                                        <p className="font-body text-xs text-muted-foreground">{t("quality.enhanceDesc")}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                      <span className="font-body text-sm font-semibold text-accent">+{t("quality.enhanceFee")}</span>
                                      <Switch checked={enhanceQuality} onCheckedChange={setEnhanceQuality} />
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                          {isPhotoPaper && !addFrame && selectedSize && (
                            <div className="mt-4">
                              <WhiteBorderSelector borders={borders} onBordersChange={setBorders} printWidthCm={selectedSize.width_cm} printHeightCm={selectedSize.height_cm} maxNarrowSideCm={110} />
                            </div>
                          )}
                        </div>
                      }
                    />
                  )}

                  {/* Sub-type / Finish */}
                  {step1Done && step2Done && selectedProduct && (
                    <>
                      {subtypes.length > 1 && (
                        <OptionRow
                          icon={<Layers className="w-5 h-5" strokeWidth={1.5} />}
                          label={t("order.subtype", "Sub-Type")}
                          value={selectedSubtype ? lf(selectedSubtype.name_en, selectedSubtype.name_he) : ""}
                          expandable
                          expanded={expandedSection === "subtype"}
                          onToggle={() => toggleSection("subtype")}
                          done={!!selectedSubtype}
                          expandedContent={
                            <SubtypeSelector subtypes={subtypes} selectedId={selectedSubtype?.id ?? null} onSelect={setSelectedSubtype} />
                          }
                        />
                      )}
                      {hasFinishes && (
                        <OptionRow
                          icon={<Sparkles className="w-5 h-5" strokeWidth={1.5} />}
                          label={t("options.finish")}
                          value={selectedFinish ? lf(selectedFinish.name_en, selectedFinish.name_he) : ""}
                          expandable
                          expanded={expandedSection === "finish"}
                          onToggle={() => toggleSection("finish")}
                          done={!!selectedFinish}
                          expandedContent={
                            <FinishSelector finishes={finishes} selectedId={selectedFinish?.id ?? null} onSelect={setSelectedFinish} />
                          }
                        />
                      )}
                    </>
                  )}

                  {/* Mobile inline preview */}
                  {uploadedImage && selectedSize && (
                    <div className="lg:hidden my-4">
                      <ProductPreview
                        imageUrl={previewSrc}
                        widthCm={selectedSize.width_cm}
                        heightCm={selectedSize.height_cm}
                        productName={lf(selectedProduct?.name_en, selectedProduct?.name_he)}
                        productSlug={selectedProduct?.slug}
                        borders={(isFramed || isPhotoPaper) ? borders : undefined}
                        frameWidthCm={isFramed ? frameWidthCm : undefined}
                        frameColorHex={isFramed && selectedFrameColor ? selectedFrameColor.hex_code : undefined}
                        frameColorId={isFramed && selectedFrameColor ? selectedFrameColor.id : undefined}
                        extraHeaderContent={
                          <Product3DPreview imageUrl={previewSrc} widthCm={selectedSize.width_cm} heightCm={selectedSize.height_cm} productSlug={selectedProduct?.slug} borders={(isFramed || isPhotoPaper) ? borders : undefined} frameWidthCm={isFramed ? frameWidthCm : undefined} frameColorHex={isFramed && selectedFrameColor ? selectedFrameColor.hex_code : undefined} frameColorId={isFramed && selectedFrameColor ? selectedFrameColor.id : undefined} edgeWrap={isCanvas ? canvasEdgeWrap.id : undefined} subframeData={hasSubframe && selectedSubframe ? { material: selectedSubframe.material, width_cm: selectedSubframe.width_cm, height_cm: selectedSubframe.height_cm, inset_cm: selectedSubframe.inset_cm, color: selectedSubframe.color } : undefined} />
                        }
                      />
                    </div>
                  )}

                  {/* STEP 4: Product Options */}
                  {step3Done && selectedSize && (
                    <>
                      {hasSubframe && subframeOptions.length > 0 && (
                        <OptionRow
                          icon={<GalleryVerticalEnd className="w-5 h-5" strokeWidth={1.5} />}
                          label={t("options.subframe", "Hanging System")}
                          value={selectedSubframe ? lf(selectedSubframe.name_en, selectedSubframe.name_he) : ""}
                          expandable
                          expanded={expandedSection === "subframe"}
                          onToggle={() => toggleSection("subframe")}
                          done={!!selectedSubframe}
                          expandedContent={
                            <SubframeSelector subframeOptions={subframeOptions} selectedId={selectedSubframe?.id ?? null} onSelect={setSelectedSubframe} sizeCategory={sizeCategory} />
                          }
                        />
                      )}
                      {isCanvas && (
                        <OptionRow
                          icon={<PanelTop className="w-5 h-5" strokeWidth={1.5} />}
                          label={t("options.canvasEdge", "Canvas Edge")}
                          value={t(canvasEdgeWrap.labelKey)}
                          expandable
                          expanded={expandedSection === "canvasEdge"}
                          onToggle={() => toggleSection("canvasEdge")}
                          done={!!canvasEdgeWrap}
                          expandedContent={
                            <CanvasOptionsSelector selectedId={canvasEdgeWrap.id} onSelect={setCanvasEdgeWrap} />
                          }
                        />
                      )}
                      {isPhotoPaper && (
                        <div className="border-b border-border">
                          <button
                            onClick={() => setAddFrame(!addFrame)}
                            className="w-full flex items-center justify-between px-1 py-4 font-body text-sm"
                          >
                            <span className="flex items-center gap-3">
                              <span className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-muted-foreground">
                                <FrameIcon className="w-5 h-5" />
                              </span>
                              <span className="font-bold uppercase tracking-wide text-xs">{t("options.addFrame")}</span>
                            </span>
                            <span className="shrink-0" dir="ltr"><Switch checked={addFrame} onCheckedChange={setAddFrame} /></span>
                          </button>
                        </div>
                      )}
                      {isFramed && (
                        <>
                          {/* White Border */}
                          <OptionRow
                            key={`white-border-${addFrame}`}
                            icon={<Square className="w-5 h-5" strokeWidth={1.5} />}
                            label={t("options.whiteBorder", "White Border")}
                            value={borders.top > 0 ? `${borders.top} cm` : ""}
                            expandable
                            expanded={expandedSection === "whiteBorder"}
                            onToggle={() => toggleSection("whiteBorder")}
                            done={true}
                            expandedContent={
                              <FramedOptionsSelector
                                borders={borders} onBordersChange={setBorders}
                                frameWidths={[]} selectedFrameWidthId={null} onFrameWidthChange={() => {}}
                                frameStyles={[]} frameColors={[]}
                                selectedFrameStyleId={null} selectedFrameColorId={null}
                                onSelectFrameStyle={() => {}} onSelectFrameColor={() => {}}
                                glazingOptions={[]} selectedGlazingId={null} onSelectGlazing={() => {}}
                                printWidthCm={selectedSize.width_cm} printHeightCm={selectedSize.height_cm}
                                maxNarrowSideCm={isPhotoPaper ? 110 : undefined}
                                showOnly="whiteBorder"
                              />
                            }
                          />
                          {/* Frame Width */}
                          <OptionRow
                            icon={<Scaling className="w-5 h-5" strokeWidth={1.5} />}
                            label={t("options.frameWidth", "Frame Width")}
                            value={selectedFrameWidth ? `${Number(selectedFrameWidth.width_cm)} cm` : ""}
                            expandable
                            expanded={expandedSection === "frameWidth"}
                            onToggle={() => toggleSection("frameWidth")}
                            done={!!selectedFrameWidth}
                            expandedContent={
                              <FramedOptionsSelector
                                borders={borders} onBordersChange={setBorders}
                                frameWidths={frameWidths} selectedFrameWidthId={selectedFrameWidth?.id ?? null} onFrameWidthChange={setSelectedFrameWidth}
                                frameStyles={[]} frameColors={[]}
                                selectedFrameStyleId={null} selectedFrameColorId={null}
                                onSelectFrameStyle={() => {}} onSelectFrameColor={() => {}}
                                glazingOptions={[]} selectedGlazingId={null} onSelectGlazing={() => {}}
                                printWidthCm={selectedSize.width_cm} printHeightCm={selectedSize.height_cm}
                                showOnly="frameWidth"
                              />
                            }
                          />
                          {/* Frame Style */}
                          <OptionRow
                            icon={<FrameIcon className="w-5 h-5" />}
                            label={t("options.frameStyle", "Frame Style")}
                            value={selectedFrameStyle ? lf(selectedFrameStyle.name_en, selectedFrameStyle.name_he) : ""}
                            expandable
                            expanded={expandedSection === "frameStyle"}
                            onToggle={() => toggleSection("frameStyle")}
                            done={!!selectedFrameStyle}
                            expandedContent={
                              <FramedOptionsSelector
                                borders={borders} onBordersChange={setBorders}
                                frameWidths={[]} selectedFrameWidthId={null} onFrameWidthChange={() => {}}
                                frameStyles={frameStyles} frameColors={[]}
                                selectedFrameStyleId={selectedFrameStyle?.id ?? null} selectedFrameColorId={null}
                                onSelectFrameStyle={(fs) => { setSelectedFrameStyle(fs); setSelectedFrameColor(null); }} onSelectFrameColor={() => {}}
                                glazingOptions={[]} selectedGlazingId={null} onSelectGlazing={() => {}}
                                printWidthCm={selectedSize.width_cm} printHeightCm={selectedSize.height_cm}
                                showOnly="frameStyle"
                              />
                            }
                          />
                          {/* Frame Color */}
                          {currentFrameColors.length > 0 && (
                            <OptionRow
                              icon={<Sparkles className="w-5 h-5" strokeWidth={1.5} />}
                              label={t("options.frameColor", "Frame Color")}
                              value={selectedFrameColor ? lf(selectedFrameColor.color_name_en, selectedFrameColor.color_name_he) : ""}
                              expandable
                              expanded={expandedSection === "frameColor"}
                              onToggle={() => toggleSection("frameColor")}
                              done={!!selectedFrameColor}
                              expandedContent={
                                <FramedOptionsSelector
                                  borders={borders} onBordersChange={setBorders}
                                  frameWidths={[]} selectedFrameWidthId={null} onFrameWidthChange={() => {}}
                                  frameStyles={[]} frameColors={currentFrameColors}
                                  selectedFrameStyleId={null} selectedFrameColorId={selectedFrameColor?.id ?? null}
                                  onSelectFrameStyle={() => {}} onSelectFrameColor={setSelectedFrameColor}
                                  glazingOptions={[]} selectedGlazingId={null} onSelectGlazing={() => {}}
                                  printWidthCm={selectedSize.width_cm} printHeightCm={selectedSize.height_cm}
                                  showOnly="frameColor"
                                />
                              }
                            />
                          )}
                          {/* Glazing */}
                          <OptionRow
                            icon={<Layers className="w-5 h-5" strokeWidth={1.5} />}
                            label={t("options.glazing", "Glazing")}
                            value={selectedGlazing ? lf(selectedGlazing.name_en, selectedGlazing.name_he) : ""}
                            expandable
                            expanded={expandedSection === "glazing"}
                            onToggle={() => toggleSection("glazing")}
                            done={!!selectedGlazing}
                            expandedContent={
                              <FramedOptionsSelector
                                borders={borders} onBordersChange={setBorders}
                                frameWidths={[]} selectedFrameWidthId={null} onFrameWidthChange={() => {}}
                                frameStyles={[]} frameColors={[]}
                                selectedFrameStyleId={null} selectedFrameColorId={null}
                                onSelectFrameStyle={() => {}} onSelectFrameColor={() => {}}
                                glazingOptions={glazingOptions} selectedGlazingId={selectedGlazing?.id ?? null} onSelectGlazing={setSelectedGlazing}
                                printWidthCm={selectedSize.width_cm} printHeightCm={selectedSize.height_cm}
                                showOnly="glazing"
                              />
                            }
                          />
                        </>
                      )}
                    </>
                  )}

                  {/* Wall Mockup - mobile only */}
                  {uploadedImage && (
                    <div className="lg:hidden animate-fade-in my-4">
                      <WallMockup imageUrl={previewSrc} widthCm={selectedSize?.width_cm ?? defaultDims.w} heightCm={selectedSize?.height_cm ?? defaultDims.h} productName={lf(selectedProduct?.name_en, selectedProduct?.name_he)} productSlug={selectedProduct?.slug} borders={(isFramed || isPhotoPaper) ? borders : undefined} frameWidthCm={isFramed ? frameWidthCm : undefined} frameColorHex={isFramed && selectedFrameColor ? selectedFrameColor.hex_code : undefined} frameColorId={isFramed && selectedFrameColor ? selectedFrameColor.id : undefined} finishName={lf(selectedFinish?.name_en, selectedFinish?.name_he)} />
                    </div>
                  )}

                </div>

                {/* Sticky Cart Section */}
                {priceBreakdown && selectedSize && selectedProduct && (
                  <div className="sticky bottom-0 bg-card border-t border-border px-5 lg:px-8 py-4 space-y-3 z-10">
                    <OrderSummary lines={summaryLines} />
                    <div className="flex items-baseline justify-between">
                      <span className="font-body text-xs text-muted-foreground">{t("price.excludingTax", "Price excl. tax, excl. shipping")}</span>
                      <span
                        className={`font-display text-2xl font-semibold text-foreground transition-all duration-500 ${
                          priceAnimating ? "scale-110 text-accent" : "scale-100"
                        }`}
                      >
                        {formatILS(priceBreakdown.total)}
                      </span>
                    </div>
                    <div className="flex gap-3">
                      {!isEmbed && (
                        <Button variant="outline" className="flex-shrink-0" disabled={savingDraft} onClick={handleSaveDraft}>
                          {savingDraft ? t("draft.saving") : t("draft.save")}
                        </Button>
                      )}
                      <Button className="flex-1 h-12 text-base font-semibold" disabled={addingToCart} onClick={handleAddToCart}>
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        {addingToCart ? t("cart.adding") : t("cart.addToCart")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

/** Expandable option row */
function OptionRow({ icon, label, value, onClick, expandable, expandedContent, expanded, onToggle, done }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onClick?: () => void;
  expandable?: boolean;
  expandedContent?: React.ReactNode;
  expanded?: boolean;
  onToggle?: () => void;
  done?: boolean;
}) {
  const handleClick = () => {
    if (expandable && onToggle) onToggle();
    else if (onClick) onClick();
  };

  return (
    <div className="border-b border-border">
      <button
        onClick={handleClick}
        className="w-full flex items-center gap-3 px-1 py-4 text-left group hover:bg-muted/30 transition-colors"
      >
        <span className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-muted-foreground">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-body text-sm font-bold uppercase tracking-wide text-foreground">{label}</p>
          {value && <p className="font-body text-sm text-muted-foreground truncate mt-0.5">{value}</p>}
        </div>
        <svg className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${expanded ? "rotate-90" : ""} ${document.documentElement.dir === "rtl" && !expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
      {expandable && expanded && (
        <div className="px-1 pb-4 animate-fade-in">
          {expandedContent}
        </div>
      )}
    </div>
  );
}

export default Order;
