import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/error-messages";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight, RotateCcw, Search } from "lucide-react";

/* ─── Hardcoded base translations extracted from src/i18n.ts ───────────────── */

const BASE_EN: Record<string, string> = {
  "nav.products": "Products",
  "nav.order": "Order",
  "nav.admin": "Admin",
  "brand": "Or Many Fine Art",
  "hero.tagline": "Premium Print Studio",
  "hero.title": "Your Art,",
  "hero.titleItalic": "Perfected",
  "hero.description": "Transform your images into museum-quality prints on metal, canvas, fine art paper, and more.",
  "hero.cta": "Start Your Order",
  "features.title": "How It Works",
  "features.upload.title": "Upload & Detect",
  "features.upload.desc": "Upload your image and we automatically detect the perfect aspect ratio and size options.",
  "features.edit.title": "Edit & Perfect",
  "features.edit.desc": "Crop, adjust colors, add text — fine-tune your image with our built-in photo editor.",
  "features.preview.title": "Preview & Order",
  "features.preview.desc": "See your print in a realistic room mockup and 3D viewer before ordering.",
  "grid.tagline": "Our Collection",
  "grid.title": "Choose Your Medium",
  "grid.from": "From {{price}}",
  "product.hdMetal": "HD Metal Prints",
  "product.hdMetal.desc": "Premium aluminum prints with vivid colors and exceptional durability",
  "product.photoPaper": "Photo & Fine Art Paper",
  "product.photoPaper.desc": "Museum-quality prints on premium photographic and fine art papers",
  "product.framed": "Framed Prints",
  "product.framed.desc": "Elegantly framed prints with custom matting and glass options",
  "product.canvas": "Canvas Prints",
  "product.canvas.desc": "Gallery-wrapped canvas prints on premium cotton canvas",
  "product.dibond": "Dibond Prints",
  "product.dibond.desc": "Durable aluminum composite prints with modern aesthetic",
  "product.plexiglass": "Plexiglass Prints",
  "product.plexiglass.desc": "Stunning acrylic prints with depth and brilliance",
  "product.woodPrint": "Wood Prints",
  "product.woodPrint.desc": "UV printing on natural wood panels with visible grain texture",
  "order.create": "Create Your Print",
  "order.start": "Start Your Order",
  "order.step1": "Upload Your Image",
  "order.step2": "Choose Product",
  "order.step3": "Choose Size",
  "order.step4": "Select Options",
  "order.subtype": "TYPE",
  "order.sizeRatio": "Showing sizes for {{ratio}} aspect ratio",
  "order.roomPreview": "Room Preview",
  "order.scaledNote": "{{w}}×{{h}} cm — scaled to a 3m sofa for reference",
  "order.editPhoto": "Edit Photo",
  "order.back": "Back",
  "order.preview": "Preview",
  "order.uploadPrompt": "Upload an image to see your print on a wall",
  "order.noSizes": "No sizes available for this aspect ratio.",
  "upload.title": "Upload Your Image",
  "upload.drag": "Drag & drop or click to browse",
  "upload.formats.line": "JPEG, PNG, TIFF, HEIC supported",
  "upload.autoDetect": "We'll automatically detect the best aspect ratio and sizes for your image.",
  "upload.uploading": "Uploading... {{progress}}%",
  "upload.remove": "Remove",
  "upload.formats": "JPG, PNG, TIFF • Max 50MB",
  "upload.or": "or click to browse",
  "upload.pleaseWait": "Processing your high-resolution image…",
  "upload.complete": "complete",
  "upload.browse": "Upload Photos",
  "upload.maxSize": "MAX File size - 400 MB",
  "upload.supported": "JPEG, PNG, TIFF, HEIC supported",
  "options.finish": "Finish",
  "options.hangingSystem": "Hanging System",
  "options.subframe": "Hanging System",
  "options.edgeWrap": "Edge / Wrap Style",
  "options.whiteBorder": "White Border (Optional)",
  "options.addFrame": "Add Frame",
  "options.equalSides": "Equal sides",
  "options.allSides": "All sides",
  "options.frameStyle": "Frame Style",
  "options.frameColor": "Frame Color",
  "options.frameWidth": "Frame Width",
  "options.glazing": "Glazing",
  "options.frameProfile": "Frame Profile & Color",
  "options.canvasEdge": "Canvas Edge",
  "options.totalFramedSize": "Total framed size: {{size}}",
  "options.totalBorderSize": "Total size with borders: {{size}}",
  "subframe.pvcAuto": "PVC holder is auto-assigned for small prints",
  "subframe.aluRequired": "Aluminum subframe is required for extra-large prints",
  "canvas.whiteEdges": "White Edge",
  "canvas.whiteEdges.desc": "Image is only on the face of the canvas. Sides of canvas are white.",
  "canvas.galleryWrap": "Folded Edge",
  "canvas.galleryWrap.desc": "Image is printed large enough to wrap onto sides of canvas. Images with important details on the edges should not use this option.",
  "canvas.mirroredWrap": "Mirrored Edge",
  "canvas.mirroredWrap.desc": "The sides of the submitted image are mirrored to seamlessly cover the sides of the canvas.",
  "side.top": "Top",
  "side.bottom": "Bottom",
  "side.left": "Left",
  "side.right": "Right",
  "price.summary": "Price Summary",
  "price.product": "Product",
  "price.type": "Type",
  "price.finish": "Finish",
  "price.frame": "Frame",
  "price.frameColor": "Frame Color",
  "price.glazing": "Glazing",
  "price.size": "Size",
  "price.printSize": "Print Size",
  "price.totalSize": "Total Size",
  "price.area": "Area",
  "price.total": "Total",
  "price.subframe": "Hanging System",
  "price.edgeWrap": "Edge Wrap",
  "price.whiteBorder": "White Border",
  "price.excludingTax": "Price excl. tax, excl. shipping",
  "preview.room": "Room View",
  "preview.artworkView": "Artwork View",
  "preview.title": "Product Preview",
  "preview.inclFrame": "(incl. {{cm}}cm frame)",
  "preview.3d": "3D View",
  "preview.3dHint": "Drag to rotate • Scroll to zoom",
  "preview.3dFullscreen": "Fullscreen",
  "quality.excellent": "Excellent quality",
  "quality.good": "Good quality",
  "quality.low": "Low resolution for this size",
  "quality.recommend": "For best results we recommend printing up to {{cm}} cm",
  "quality.enhance": "Enhance Resolution",
  "quality.enhanceDesc": "We'll upscale your file using our professional enhancement systems for optimal print quality.",
  "quality.enhanceFee": "₪40",
  "summary.product": "Product",
  "summary.size": "Size",
  "summary.viewOrder": "View Order Summary",
  "wall.roomPreview": "Room Preview",
  "wall.inclFrame": "(incl. {{cm}}cm frame)",
  "wall.wallSize": "4m wall",
  "editor.crop": "Crop",
  "editor.color": "Color",
  "editor.text": "Text",
  "editor.aspectRatio": "Aspect Ratio",
  "editor.cropHint": "Drag on the image to crop. The crop will be applied when you click Done.",
  "editor.brightness": "Brightness",
  "editor.contrast": "Contrast",
  "editor.saturation": "Saturation",
  "editor.resetDefaults": "Reset to defaults",
  "editor.resetOriginal": "Original",
  "editor.enterText": "Enter text...",
  "editor.add": "Add",
  "editor.colorLabel": "Color",
  "editor.sizeLabel": "Size",
  "editor.fontLabel": "Font",
  "editor.dragTip": "Drag text on the preview to reposition it",
  "editor.removeText": "Remove",
  "editor.cancel": "Cancel",
  "editor.apply": "Apply Edits",
  "orders.myOrders": "My Orders",
  "orders.loading": "Loading orders…",
  "orders.noOrders": "You haven't placed any orders yet.",
  "orders.startOrder": "Start Your First Order",
  "orders.order": "Order",
  "orders.continue": "Continue",
  "orders.delete": "Delete",
  "nav.myOrders": "My Orders",
  "draft.save": "Save as Draft",
  "draft.saving": "Saving…",
  "draft.saved": "Draft saved!",
  "draft.saveError": "Failed to save draft",
  "draft.loginRequired": "Please log in to save your draft",
  "cart.addToCart": "Add to Cart",
  "cart.adding": "Adding…",
  "cart.success": "Added to cart!",
  "cart.error": "Failed to add to cart",
  "cart.checkout": "Checkout ({{count}} items)",
  "cart.checkoutSingle": "Checkout (1 item)",
  "cart.itemsInCart": "{{count}} items in cart",
  "cart.addMore": "Add another item",
  "footer.tagline": "Premium custom printing. Museum-quality prints on metal, paper, canvas, and more.",
  "footer.products": "Products",
  "footer.support": "Support",
  "footer.contact": "Contact",
  "footer.faq": "FAQ",
  "footer.shipping": "Shipping",
  "footer.rights": "© {{year}} PrintCraft. All rights reserved.",
  "login.createAccount": "Create an account",
  "login.signInAdmin": "Sign in to admin",
  "login.email": "Email",
  "login.password": "Password",
  "login.signUp": "Sign Up",
  "login.signIn": "Sign In",
  "login.alreadyHaveAccount": "Already have an account?",
  "login.needAccount": "Need an account?",
  "login.checkEmail": "Check your email",
  "login.confirmLink": "We sent a confirmation link.",
  "lang.switch": "עברית",
};

const BASE_HE: Record<string, string> = {
  "nav.products": "מוצרים",
  "nav.order": "הזמנה",
  "nav.admin": "ניהול",
  "brand": "Or Many Fine Art",
  "hero.tagline": "סטודיו להדפסת פרימיום",
  "hero.title": "האמנות שלך,",
  "hero.titleItalic": "בשלמות",
  "hero.description": "הפכו את התמונות שלכם להדפסות באיכות מוזיאון על מתכת, קנבס, נייר אמנותי ועוד.",
  "hero.cta": "התחל הזמנה",
  "features.title": "איך זה עובד",
  "features.upload.title": "העלאה וזיהוי",
  "features.upload.desc": "העלו את התמונה ואנחנו נזהה אוטומטית את יחס הצדדים והגדלים המתאימים.",
  "features.edit.title": "עריכה ושיפור",
  "features.edit.desc": "חיתוך, התאמת צבעים, הוספת טקסט — כוונו את התמונה עם עורך התמונות המובנה.",
  "features.preview.title": "תצוגה מקדימה והזמנה",
  "features.preview.desc": "ראו את ההדפסה שלכם בהדמיית חדר ריאליסטית לפני ההזמנה.",
  "grid.tagline": "הקולקציה שלנו",
  "grid.title": "בחרו את המדיום",
  "grid.from": "החל מ-{{price}}",
  "product.hdMetal": "הדפסות מתכת HD",
  "product.hdMetal.desc": "הדפסות אלומיניום פרימיום עם צבעים חיים ועמידות יוצאת דופן",
  "product.photoPaper": "נייר צילום ואמנות",
  "product.photoPaper.desc": "הדפסות באיכות מוזיאון על ניירות צילום ואמנות פרימיום",
  "product.framed": "הדפסות ממוסגרות",
  "product.framed.desc": "הדפסות ממוסגרות באלגנטיות עם פספרטו ואפשרויות זכוכית",
  "product.canvas": "הדפסות קנבס",
  "product.canvas.desc": "הדפסות קנבס מתוחות על כותנה פרימיום בסגנון גלריה",
  "product.dibond": "הדפסות דיבונד",
  "product.dibond.desc": "הדפסות על לוח אלומיניום מורכב עם מראה מודרני",
  "product.plexiglass": "הדפסות פלקסיגלס",
  "product.plexiglass.desc": "הדפסות אקריליק מרהיבות עם עומק וברק",
  "product.woodPrint": "הדפסות על עץ",
  "product.woodPrint.desc": "הדפסת UV על לוחות עץ טבעיים עם מרקם גרעינים נראה",
  "order.create": "צור את ההדפסה שלך",
  "order.start": "התחל הזמנה",
  "order.step1": "העלה תמונה",
  "order.step2": "בחר מוצר",
  "order.step3": "בחר גודל",
  "order.step4": "בחר אפשרויות",
  "order.subtype": "סוג",
  "order.sizeRatio": "מציג גדלים ליחס {{ratio}}",
  "order.roomPreview": "תצוגה מקדימה בחדר",
  "order.scaledNote": "{{w}}×{{h}} ס״מ — ביחס לספה של 3 מטר",
  "order.editPhoto": "ערוך תמונה",
  "order.back": "חזרה",
  "order.preview": "תצוגה מקדימה",
  "order.uploadPrompt": "העלו תמונה כדי לראות את ההדפסה על קיר",
  "order.noSizes": "אין גדלים זמינים ליחס הצדדים הזה.",
  "upload.title": "העלה את התמונה שלך",
  "upload.drag": "גררו ושחררו או לחצו לבחירה",
  "upload.formats.line": "נתמכים JPEG, PNG, TIFF, HEIC",
  "upload.autoDetect": "נזהה אוטומטית את יחס הצדדים והגדלים הטובים ביותר לתמונה שלכם.",
  "upload.uploading": "מעלה... {{progress}}%",
  "upload.remove": "הסר",
  "upload.formats": "JPG, PNG, TIFF • עד 50MB",
  "upload.or": "או לחץ לבחירה",
  "upload.pleaseWait": "מעבד את התמונה ברזולוציה גבוהה…",
  "upload.complete": "הושלם",
  "upload.browse": "העלה תמונות",
  "upload.maxSize": "גודל קובץ מקסימלי - 400 MB",
  "upload.supported": "נתמכים JPEG, PNG, TIFF, HEIC",
  "options.finish": "גימור",
  "options.hangingSystem": "מערכת תלייה",
  "options.subframe": "מערכת תלייה",
  "options.edgeWrap": "סגנון קצוות / עטיפה",
  "options.whiteBorder": "מסגרת לבנה (אופציונלי)",
  "options.addFrame": "הוסף מסגרת",
  "options.equalSides": "צדדים שווים",
  "options.allSides": "כל הצדדים",
  "options.frameStyle": "סגנון מסגרת",
  "options.frameColor": "צבע מסגרת",
  "options.frameWidth": "רוחב מסגרת",
  "options.glazing": "זיגוג",
  "options.frameProfile": "פרופיל מסגרת וצבע",
  "options.canvasEdge": "קצה קנבס",
  "options.totalFramedSize": "גודל כולל עם מסגרת: {{size}}",
  "options.totalBorderSize": "גודל כולל עם שוליים: {{size}}",
  "subframe.pvcAuto": "מחזיק PVC מוקצה אוטומטית להדפסות קטנות",
  "subframe.aluRequired": "תת-מסגרת אלומיניום נדרשת להדפסות גדולות במיוחד",
  "canvas.whiteEdges": "קצה לבן",
  "canvas.whiteEdges.desc": "התמונה רק על פני הקנבס. צדדי הקנבס לבנים.",
  "canvas.galleryWrap": "קצה מקופל",
  "canvas.galleryWrap.desc": "התמונה מודפסת גדולה מספיק כדי לעטוף את צדדי הקנבס. תמונות עם פרטים חשובים בקצוות לא מומלצות לאפשרות זו.",
  "canvas.mirroredWrap": "קצה משוקף",
  "canvas.mirroredWrap.desc": "צדדי התמונה משוקפים כדי לכסות בצורה חלקה את צדדי הקנבס.",
  "side.top": "למעלה",
  "side.bottom": "למטה",
  "side.left": "שמאל",
  "side.right": "ימין",
  "price.summary": "סיכום מחיר",
  "price.product": "מוצר",
  "price.type": "סוג",
  "price.finish": "גימור",
  "price.frame": "מסגרת",
  "price.frameColor": "צבע מסגרת",
  "price.glazing": "זיגוג",
  "price.size": "גודל",
  "price.printSize": "גודל הדפסה",
  "price.totalSize": "גודל כולל",
  "price.area": "שטח",
  "price.total": "סה״כ",
  "price.subframe": "מערכת תלייה",
  "price.edgeWrap": "סגנון קצוות",
  "price.whiteBorder": "מסגרת לבנה",
  "price.excludingTax": "מחיר לא כולל מע״מ ומשלוח",
  "preview.room": "תצוגה בחדר",
  "preview.artworkView": "תצוגת יצירה",
  "preview.title": "תצוגת מוצר",
  "preview.inclFrame": "(כולל מסגרת {{cm}} ס״מ)",
  "preview.3d": "תצוגת תלת-מימד",
  "preview.3dHint": "גררו לסיבוב • גלגלו לזום",
  "preview.3dFullscreen": "מסך מלא",
  "quality.excellent": "איכות מצוינת",
  "quality.good": "איכות טובה",
  "quality.low": "רזולוציה נמוכה לגודל זה",
  "quality.recommend": "לתוצאות מיטביות מומלץ להדפיס עד {{cm}} ס״מ",
  "quality.enhance": "שדרוג רזולוציה",
  "quality.enhanceDesc": "נשדרג את הקובץ שלך באמצעות מערכות השיפור המקצועיות שלנו לאיכות הדפסה מיטבית.",
  "quality.enhanceFee": "₪40",
  "summary.product": "מוצר",
  "summary.size": "גודל",
  "summary.viewOrder": "סיכום הזמנה",
  "wall.roomPreview": "תצוגה מקדימה בחדר",
  "wall.inclFrame": "(כולל מסגרת {{cm}} ס״מ)",
  "wall.wallSize": "קיר 4 מ׳",
  "editor.crop": "חיתוך",
  "editor.color": "צבע",
  "editor.text": "טקסט",
  "editor.aspectRatio": "יחס צדדים",
  "editor.cropHint": "גררו על התמונה לחיתוך. החיתוך יוחל בלחיצה על סיום.",
  "editor.brightness": "בהירות",
  "editor.contrast": "ניגודיות",
  "editor.saturation": "רוויה",
  "editor.resetDefaults": "אפס לברירת מחדל",
  "editor.resetOriginal": "מקורי",
  "editor.enterText": "הזן טקסט...",
  "editor.add": "הוסף",
  "editor.colorLabel": "צבע",
  "editor.sizeLabel": "גודל",
  "editor.fontLabel": "גופן",
  "editor.dragTip": "גררו טקסט על התצוגה המקדימה למיקום מחדש",
  "editor.removeText": "הסר",
  "editor.cancel": "ביטול",
  "editor.apply": "החל שינויים",
  "orders.myOrders": "ההזמנות שלי",
  "orders.loading": "טוען הזמנות…",
  "orders.noOrders": "עדיין לא ביצעת הזמנות.",
  "orders.startOrder": "התחל הזמנה ראשונה",
  "orders.order": "הזמנה",
  "orders.continue": "המשך",
  "orders.delete": "מחק",
  "nav.myOrders": "ההזמנות שלי",
  "draft.save": "שמור כטיוטה",
  "draft.saving": "שומר…",
  "draft.saved": "הטיוטה נשמרה!",
  "draft.saveError": "שמירת הטיוטה נכשלה",
  "draft.loginRequired": "יש להתחבר כדי לשמור טיוטה",
  "cart.addToCart": "הוסף לסל",
  "cart.adding": "מוסיף…",
  "cart.success": "נוסף לסל!",
  "cart.error": "הוספה לסל נכשלה",
  "cart.checkout": "לתשלום ({{count}} פריטים)",
  "cart.checkoutSingle": "לתשלום (פריט אחד)",
  "cart.itemsInCart": "{{count}} פריטים בסל",
  "cart.addMore": "הוסף פריט נוסף",
  "footer.tagline": "הדפסה מותאמת אישית פרימיום. הדפסות באיכות מוזיאון על מתכת, נייר, קנבס ועוד.",
  "footer.products": "מוצרים",
  "footer.support": "תמיכה",
  "footer.contact": "צור קשר",
  "footer.faq": "שאלות נפוצות",
  "footer.shipping": "משלוחים",
  "footer.rights": "© {{year}} PrintCraft. כל הזכויות שמורות.",
  "login.createAccount": "צור חשבון",
  "login.signInAdmin": "התחבר לניהול",
  "login.email": "אימייל",
  "login.password": "סיסמה",
  "login.signUp": "הרשמה",
  "login.signIn": "התחברות",
  "login.alreadyHaveAccount": "כבר יש לך חשבון?",
  "login.needAccount": "צריך חשבון?",
  "login.checkEmail": "בדוק את האימייל",
  "login.confirmLink": "שלחנו קישור אישור.",
  "lang.switch": "English",
};

const ALL_KEYS = Object.keys(BASE_EN).sort();

/* ─── Component ────────────────────────────────────────────────────────────── */

interface TranslationOverride {
  id: string;
  key: string;
  lang: string;
  value: string;
}

const AdminTranslations = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [editingCell, setEditingCell] = useState<{ key: string; lang: "en" | "he" } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Load overrides from Supabase
  const { data: overrides = [] } = useQuery({
    queryKey: ["admin-translation-overrides"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("translation_overrides").select("*");
      return (data ?? []) as TranslationOverride[];
    },
  });

  // Build lookup map: { "key::lang" -> override }
  const overrideMap = useMemo(() => {
    const m: Record<string, TranslationOverride> = {};
    overrides.forEach((o) => { m[`${o.key}::${o.lang}`] = o; });
    return m;
  }, [overrides]);

  // Get effective value for a key + lang
  const getValue = (key: string, lang: "en" | "he"): string => {
    const ovr = overrideMap[`${key}::${lang}`];
    if (ovr) return ovr.value;
    return lang === "en" ? (BASE_EN[key] ?? "") : (BASE_HE[key] ?? "");
  };

  const hasOverride = (key: string, lang: "en" | "he"): boolean => {
    return !!overrideMap[`${key}::${lang}`];
  };

  // Filter keys by search
  const filteredKeys = useMemo(() => {
    if (!search.trim()) return ALL_KEYS;
    const q = search.toLowerCase();
    return ALL_KEYS.filter((k) => {
      const enVal = getValue(k, "en").toLowerCase();
      const heVal = getValue(k, "he").toLowerCase();
      return k.toLowerCase().includes(q) || enVal.includes(q) || heVal.includes(q);
    });
  }, [search, overrideMap]);

  // Group keys by prefix
  const groups = useMemo(() => {
    const g: Record<string, string[]> = {};
    filteredKeys.forEach((k) => {
      const prefix = k.includes(".") ? k.split(".")[0] : "_other";
      if (!g[prefix]) g[prefix] = [];
      g[prefix].push(k);
    });
    return Object.entries(g).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredKeys]);

  // Save override mutation
  const saveOverride = useMutation({
    mutationFn: async ({ key, lang, value }: { key: string; lang: string; value: string }) => {
      const existing = overrideMap[`${key}::${lang}`];
      if (existing) {
        const { error } = await (supabase as any).from("translation_overrides").update({ value }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("translation_overrides").insert({ key, lang, value });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-translation-overrides"] });
      setEditingCell(null);
      toast({ title: "Saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  // Reset (delete override) mutation
  const resetOverride = useMutation({
    mutationFn: async ({ key, lang }: { key: string; lang: string }) => {
      const existing = overrideMap[`${key}::${lang}`];
      if (!existing) return;
      const { error } = await (supabase as any).from("translation_overrides").delete().eq("id", existing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-translation-overrides"] });
      toast({ title: "Reset to default" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const startEdit = (key: string, lang: "en" | "he") => {
    setEditingCell({ key, lang });
    setEditValue(getValue(key, lang));
  };

  const commitEdit = () => {
    if (!editingCell) return;
    const baseVal = editingCell.lang === "en" ? BASE_EN[editingCell.key] : BASE_HE[editingCell.key];
    // Only save if different from base
    if (editValue === (baseVal ?? "")) {
      // If there's an existing override, delete it
      if (hasOverride(editingCell.key, editingCell.lang)) {
        resetOverride.mutate({ key: editingCell.key, lang: editingCell.lang });
      } else {
        setEditingCell(null);
      }
      return;
    }
    saveOverride.mutate({ key: editingCell.key, lang: editingCell.lang, value: editValue });
  };

  const toggleGroup = (prefix: string) => {
    setOpenGroups((prev) => ({ ...prev, [prefix]: !prev[prefix] }));
  };

  const isHebrewMissing = (key: string): boolean => {
    const val = getValue(key, "he");
    return !val || val.trim() === "";
  };

  return (
    <div>
      <h1 className="font-display text-2xl text-gold mb-2">Translations</h1>
      <p className="font-body text-sm text-muted-foreground mb-6">
        Manage English and Hebrew translations. Overrides are saved to the database. Keys without a Hebrew value are highlighted.
      </p>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search keys or values..."
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <p className="font-body text-xs text-muted-foreground mb-4">
        {filteredKeys.length} of {ALL_KEYS.length} keys shown &middot; {overrides.length} override(s) active
      </p>

      {/* Grouped collapsible sections */}
      <div className="space-y-2">
        {groups.map(([prefix, keys]) => {
          const isOpen = openGroups[prefix] !== false; // default open
          return (
            <Collapsible key={prefix} open={isOpen} onOpenChange={() => toggleGroup(prefix)}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`} />
                <span className="font-display text-sm font-semibold">{prefix}.*</span>
                <span className="font-body text-xs text-muted-foreground ml-auto">{keys.length} key{keys.length !== 1 ? "s" : ""}</span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border border-border rounded-md mt-1 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="font-body font-medium text-left px-3 py-2 text-muted-foreground w-[25%]">Key</th>
                        <th className="font-body font-medium text-left px-3 py-2 text-muted-foreground w-[30%]">English</th>
                        <th className="font-body font-medium text-left px-3 py-2 text-muted-foreground w-[30%]">Hebrew</th>
                        <th className="font-body font-medium text-left px-3 py-2 text-muted-foreground w-[15%]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {keys.map((key) => {
                        const heMissing = isHebrewMissing(key);
                        const enOverride = hasOverride(key, "en");
                        const heOverride = hasOverride(key, "he");
                        const isEditingEn = editingCell?.key === key && editingCell?.lang === "en";
                        const isEditingHe = editingCell?.key === key && editingCell?.lang === "he";

                        return (
                          <tr
                            key={key}
                            className={`border-b border-border last:border-0 ${heMissing ? "bg-yellow-50 dark:bg-yellow-900/10" : ""}`}
                          >
                            <td className="px-3 py-2 font-mono text-xs text-muted-foreground break-all">{key}</td>

                            {/* English value */}
                            <td className="px-3 py-2">
                              {isEditingEn ? (
                                <div className="flex gap-1">
                                  <Input
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="h-7 text-xs"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") commitEdit();
                                      if (e.key === "Escape") setEditingCell(null);
                                    }}
                                  />
                                  <Button size="sm" variant="default" className="h-7 px-2 text-xs" onClick={commitEdit}>OK</Button>
                                </div>
                              ) : (
                                <button
                                  className={`text-left w-full font-body text-xs cursor-pointer hover:bg-muted/40 rounded px-1 py-0.5 transition-colors ${enOverride ? "text-blue-600 font-medium" : "text-foreground"}`}
                                  onClick={() => startEdit(key, "en")}
                                  title="Click to edit"
                                >
                                  {getValue(key, "en") || <span className="text-muted-foreground italic">empty</span>}
                                </button>
                              )}
                            </td>

                            {/* Hebrew value */}
                            <td className="px-3 py-2" dir="rtl">
                              {isEditingHe ? (
                                <div className="flex gap-1" dir="ltr">
                                  <Input
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="h-7 text-xs"
                                    dir="rtl"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") commitEdit();
                                      if (e.key === "Escape") setEditingCell(null);
                                    }}
                                  />
                                  <Button size="sm" variant="default" className="h-7 px-2 text-xs" onClick={commitEdit}>OK</Button>
                                </div>
                              ) : (
                                <button
                                  className={`text-right w-full font-body text-xs cursor-pointer hover:bg-muted/40 rounded px-1 py-0.5 transition-colors ${heOverride ? "text-blue-600 font-medium" : "text-foreground"} ${heMissing ? "italic text-muted-foreground" : ""}`}
                                  onClick={() => startEdit(key, "he")}
                                  title="Click to edit"
                                >
                                  {getValue(key, "he") || <span className="text-muted-foreground italic">missing</span>}
                                </button>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-3 py-2">
                              {(enOverride || heOverride) && (
                                <div className="flex gap-1">
                                  {enOverride && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-1.5 text-xs font-body gap-1 text-muted-foreground hover:text-foreground"
                                      onClick={() => resetOverride.mutate({ key, lang: "en" })}
                                      title="Reset English to default"
                                    >
                                      <RotateCcw className="h-3 w-3" /> EN
                                    </Button>
                                  )}
                                  {heOverride && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-1.5 text-xs font-body gap-1 text-muted-foreground hover:text-foreground"
                                      onClick={() => resetOverride.mutate({ key, lang: "he" })}
                                      title="Reset Hebrew to default"
                                    >
                                      <RotateCcw className="h-3 w-3" /> HE
                                    </Button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      {filteredKeys.length === 0 && (
        <p className="font-body text-center text-muted-foreground py-12">No keys match your search.</p>
      )}
    </div>
  );
};

export default AdminTranslations;
