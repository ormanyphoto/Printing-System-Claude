import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildMappingKey(sel: Record<string, string | boolean | undefined>): string {
  const parts = [
    sel.productId || "",
    sel.subtypeId || "",
    sel.sizeId || "",
    sel.finishId || "",
    sel.frameStyleId || "",
    sel.frameColorId || "",
    sel.frameWidthId || "",
    sel.glazingId || "",
    sel.subframeId || "",
    sel.canvasEdgeWrapId || "",
    sel.addFrame ? "frame" : "noframe",
  ];
  return parts.join("|");
}
/** Calculate shipping weight from product dimensions using the standard formula */
function calcShippingWeight(widthCm: number, heightCm: number): { packW: number; packH: number; packD: number; weightKg: number } {
  const packW = widthCm + 10;
  const packH = heightCm + 10;
  const packD = 7;
  const volumetric = (packW * packH * packD) / 5000;
  const weightKg = Math.ceil(volumetric * 2) / 2; // round UP to nearest 0.5 kg
  return { packW, packH, packD, weightKg };
}

/** Set box dimensions as metafields on Shopify variants via GraphQL (batched, max 25 metafields per call) */
async function setVariantBoxMetafields(
  storeDomain: string, apiVersion: string, shopifyToken: string,
  variantDims: { variantId: string; packW: number; packH: number; packD: number }[],
): Promise<string[]> {
  const graphqlUrl = `https://${storeDomain}/admin/api/${apiVersion}/graphql.json`;
  const errors: string[] = [];
  // 3 metafields per variant; Shopify allows max 25 per call → 8 variants per call
  const VARS_PER_CALL = 8;
  for (let i = 0; i < variantDims.length; i += VARS_PER_CALL) {
    const chunk = variantDims.slice(i, i + VARS_PER_CALL);
    const metafields = chunk.flatMap(v => [
      { ownerId: `gid://shopify/ProductVariant/${v.variantId}`, namespace: "shipping", key: "box_width_cm", value: String(v.packW), type: "number_decimal" },
      { ownerId: `gid://shopify/ProductVariant/${v.variantId}`, namespace: "shipping", key: "box_height_cm", value: String(v.packH), type: "number_decimal" },
      { ownerId: `gid://shopify/ProductVariant/${v.variantId}`, namespace: "shipping", key: "box_depth_cm", value: String(v.packD), type: "number_decimal" },
    ]);
    const query = `mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { id }
        userErrors { field message }
      }
    }`;
    try {
      const res = await fetch(graphqlUrl, {
        method: "POST",
        headers: { "X-Shopify-Access-Token": shopifyToken, "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables: { metafields } }),
      });
      if (!res.ok) {
        errors.push(`Metafield batch: HTTP ${res.status}`);
      } else {
        const json = await res.json();
        const userErrors = json?.data?.metafieldsSet?.userErrors ?? [];
        if (userErrors.length > 0) {
          errors.push(`Metafield errors: ${JSON.stringify(userErrors).substring(0, 300)}`);
        }
      }
    } catch (e) {
      errors.push(`Metafield error: ${e instanceof Error ? e.message : String(e)}`);
    }
    // Small rate-limit pause between GraphQL calls
    if (i + VARS_PER_CALL < variantDims.length) {
      await new Promise(r => setTimeout(r, 250));
    }
  }
  return errors;
}

interface Combination {
  productId: string;
  productName: string;
  subtypeId: string;
  subtypeName: string;
  sizeId: string;
  sizeName: string;
  finishId: string;
  finishName: string;
  frameStyleId: string;
  frameStyleName: string;
  frameColorId: string;
  frameColorName: string;
  frameWidthId: string;
  frameWidthName: string;
  glazingId: string;
  glazingName: string;
  subframeId: string;
  subframeName: string;
  canvasEdgeWrapId: string;
  addFrame: boolean;
  mappingKey: string;
  variantTitle: string;
  price: number;
}

/** Calculate the price for a combination using the same logic as frontend pricing.ts */
function calculateComboPrice(
  combo: Omit<Combination, "price">,
  size: any,
  finish: any,
  subframe: any,
  frameStyle: any,
  frameWidth: any,
  glazing: any,
  priceTiers: any[],
): number {
  if (!size?.id) return 0;

  const widthCm = size.width_cm;
  const heightCm = size.height_cm;
  const areaSqm = (widthCm * heightCm) / 10000;

  const tier = priceTiers.find(
    (t: any) => t.product_id === combo.productId &&
      (combo.subtypeId ? t.subtype_id === combo.subtypeId : !t.subtype_id)
  ) || priceTiers.find(
    (t: any) => t.product_id === combo.productId && !t.subtype_id
  );

  if (!tier) return 0;

  const pricePerSqm = areaSqm <= tier.tier_threshold_sqm
    ? tier.tier1_price_sqm
    : tier.tier2_price_sqm;
  let basePrice = areaSqm * pricePerSqm;

  if (finish?.surcharge_pct) {
    basePrice *= (1 + finish.surcharge_pct / 100);
  }

  if (subframe?.surcharge_pct) {
    basePrice *= (1 + subframe.surcharge_pct / 100);
  }

  if (frameStyle?.price_per_cm && frameWidth) {
    // Match frontend: perimeter uses print dimensions (no frame width added)
    const perimeterCm = 2 * (widthCm + heightCm);
    let frameCost = perimeterCm * frameStyle.price_per_cm;
    if (frameWidth.surcharge_pct) {
      frameCost *= (1 + frameWidth.surcharge_pct / 100);
    }
    basePrice += Math.round(frameCost);
  }

  if (glazing?.price_sqm) {
    // Match frontend: glazing area uses print dimensions (no frame width added)
    const glazingArea = (widthCm * heightCm) / 10000;
    basePrice += Math.round(glazingArea * glazing.price_sqm);
  }

  return Math.round(basePrice);
}

function getProductCapabilities(product: any) {
  const slug = (product.slug || "").toLowerCase();
  const isCanvas = slug === "canvas";
  const isFramed = slug === "framed";
  const isPhotoPaper = slug === "photo-paper";
  const hasSubframes = ["hd-metal", "dibond", "plexiglass"].includes(slug);

  return {
    supportsEdgeWraps: isCanvas,
    supportsSubframes: hasSubframes,
    supportsOptionalFraming: isPhotoPaper,
    alwaysFramed: isFramed,
    neverFramed: !isFramed && !isPhotoPaper,
  };
}

function getSubframesForSize(
  widthCm: number,
  heightCm: number,
  allSubframes: any[],
): any[] {
  const longEdge = Math.max(widthCm, heightCm);
  if (longEdge <= 50) {
    return allSubframes.filter((s: any) => s.material === "PVC");
  }
  if (longEdge > 120) {
    return allSubframes.filter((s: any) => s.material === "Aluminum");
  }
  return allSubframes.filter((s: any) => s.material === "Plastic" || s.material === "Aluminum");
}

function generateCombinations(
  product: any,
  subtypes: any[],
  sizes: any[],
  finishes: any[],
  frameStyles: any[],
  frameColors: any[],
  frameWidths: any[],
  glazingOptions: any[],
  subframes: any[],
  priceTiers: any[],
): Combination[] {
  const combos: Combination[] = [];
  const caps = getProductCapabilities(product);

  const productSubtypes = subtypes.filter((s: any) => s.product_id === product.id && s.enabled);
  const productSizes = sizes.filter((s: any) => s.product_id === product.id && s.enabled);

  const subtypeList = productSubtypes.length > 0 ? productSubtypes : [{ id: "", name_en: "" }];
  const sizeList = productSizes.length > 0 ? productSizes : [{ id: "", width_cm: 0, height_cm: 0 }];

  const getFinishesForSubtype = (subtypeId: string) => {
    if (!subtypeId) return [{ id: "", name_en: "" }];
    const sf = finishes.filter((f: any) => f.subtype_id === subtypeId && f.enabled);
    return sf.length > 0 ? sf : [{ id: "", name_en: "" }];
  };

  const canHaveFrame = caps.alwaysFramed || caps.supportsOptionalFraming;
  const enabledFrameStyles = canHaveFrame ? frameStyles.filter((f: any) => f.enabled) : [];
  const enabledFrameWidths = canHaveFrame ? frameWidths.filter((f: any) => f.enabled) : [];
  const enabledGlazing = canHaveFrame ? glazingOptions.filter((g: any) => g.enabled) : [];
  const enabledSubframes = caps.supportsSubframes ? subframes.filter((s: any) => s.enabled) : [];
  const edgeWraps = caps.supportsEdgeWraps ? ["white", "gallery", "mirrored"] : [""];

  for (const subtype of subtypeList) {
    const subtypeFinishes = getFinishesForSubtype(subtype.id);

    for (const size of sizeList) {
      const sizeSubframes = caps.supportsSubframes && size.id
        ? getSubframesForSize(size.width_cm, size.height_cm, enabledSubframes)
        : [];

      for (const finish of subtypeFinishes) {
        for (const edgeWrap of edgeWraps) {
          const sizeName = size.id ? `${size.width_cm}×${size.height_cm}` : "";
          const baseTitleParts = [product.name_en];
          if (subtype.name_en) baseTitleParts.push(subtype.name_en);
          if (sizeName) baseTitleParts.push(sizeName);
          if (finish.name_en) baseTitleParts.push(finish.name_en);
          if (edgeWrap) baseTitleParts.push(`Edge:${edgeWrap}`);

          if (!caps.alwaysFramed) {
            if (caps.supportsSubframes && sizeSubframes.length > 0) {
              for (const subframe of sizeSubframes) {
                const sfSel = {
                  productId: product.id, subtypeId: subtype.id, sizeId: size.id, finishId: finish.id,
                  frameStyleId: "", frameColorId: "", frameWidthId: "", glazingId: "",
                  subframeId: subframe.id, canvasEdgeWrapId: edgeWrap, addFrame: false,
                };
                const sfTitle = [...baseTitleParts, `SF:${subframe.name_en}`];
                const comboBase = {
                  ...sfSel, productName: product.name_en, subtypeName: subtype.name_en || "",
                  sizeName, finishName: finish.name_en || "", frameStyleName: "", frameColorName: "",
                  frameWidthName: "", glazingName: "", subframeName: subframe.name_en,
                  mappingKey: buildMappingKey(sfSel), variantTitle: sfTitle.join(" / "),
                };
                combos.push({ ...comboBase, price: calculateComboPrice(comboBase, size, finish, subframe, null, null, null, priceTiers) });
              }
            } else if (!caps.supportsSubframes) {
              const noFrameSel = {
                productId: product.id, subtypeId: subtype.id, sizeId: size.id, finishId: finish.id,
                frameStyleId: "", frameColorId: "", frameWidthId: "", glazingId: "",
                subframeId: "", canvasEdgeWrapId: edgeWrap, addFrame: false,
              };
              const comboBase = {
                ...noFrameSel, productName: product.name_en, subtypeName: subtype.name_en || "",
                sizeName, finishName: finish.name_en || "", frameStyleName: "", frameColorName: "",
                frameWidthName: "", glazingName: "", subframeName: "",
                mappingKey: buildMappingKey(noFrameSel), variantTitle: baseTitleParts.join(" / "),
              };
              combos.push({ ...comboBase, price: calculateComboPrice(comboBase, size, finish, null, null, null, null, priceTiers) });
            }
          }

          for (const fStyle of enabledFrameStyles) {
            const styleColors = frameColors.filter((c: any) => c.frame_style_id === fStyle.id);
            const colorList = styleColors.length > 0 ? styleColors : [{ id: "", color_name_en: "" }];

            for (const fColor of colorList) {
              for (const fWidth of enabledFrameWidths) {
                const glazList = enabledGlazing.length > 0 ? enabledGlazing : [{ id: "", name_en: "" }];
                for (const glaz of glazList) {
                  const frameSel = {
                    productId: product.id, subtypeId: subtype.id, sizeId: size.id, finishId: finish.id,
                    frameStyleId: fStyle.id, frameColorId: fColor.id, frameWidthId: fWidth.id,
                    glazingId: glaz.id, subframeId: "", canvasEdgeWrapId: edgeWrap, addFrame: true,
                  };
                  const frameTitleParts = [product.name_en];
                  if (subtype.name_en) frameTitleParts.push(subtype.name_en);
                  if (sizeName) frameTitleParts.push(sizeName);
                  if (finish.name_en) frameTitleParts.push(finish.name_en);
                  frameTitleParts.push(fStyle.name_en);
                  if (fColor.color_name_en) frameTitleParts.push(fColor.color_name_en);
                  frameTitleParts.push(`${fWidth.width_cm}cm`);
                  if (glaz.name_en) frameTitleParts.push(glaz.name_en);
                  if (edgeWrap) frameTitleParts.push(`Edge:${edgeWrap}`);

                  const comboBase = {
                    ...frameSel, productName: product.name_en, subtypeName: subtype.name_en || "",
                    sizeName, finishName: finish.name_en || "", frameStyleName: fStyle.name_en,
                    frameColorName: fColor.color_name_en || "", frameWidthName: `${fWidth.width_cm}cm`,
                    glazingName: glaz.name_en || "", subframeName: "",
                    mappingKey: buildMappingKey(frameSel), variantTitle: frameTitleParts.join(" / "),
                  };
                  combos.push({ ...comboBase, price: calculateComboPrice(comboBase, size, finish, null, fStyle, fWidth, glaz, priceTiers) });
                }
              }
            }
          }
        }
      }
    }
  }

  return combos;
}

/** Fetch all reference data needed for combo generation */
async function fetchAllReferenceData(adminClient: any, productId?: string) {
  const { data: allProducts } = await adminClient.from("products").select("*").eq("enabled", true).order("sort_order");
  const products = productId
    ? (allProducts ?? []).filter((p: any) => p.id === productId)
    : (allProducts ?? []);

  const [
    { data: subtypes },
    { data: sizes },
    { data: finishes },
    { data: frameStyles },
    { data: frameColors },
    { data: frameWidths },
    { data: glazingOptions },
    { data: subframes },
    { data: priceTiers },
  ] = await Promise.all([
    adminClient.from("product_subtypes").select("*").eq("enabled", true),
    adminClient.from("size_presets").select("*").eq("enabled", true),
    adminClient.from("finishes").select("*").eq("enabled", true),
    adminClient.from("frame_styles").select("*").eq("enabled", true),
    adminClient.from("frame_colors").select("*"),
    adminClient.from("frame_widths").select("*").eq("enabled", true),
    adminClient.from("glazing_options").select("*").eq("enabled", true),
    adminClient.from("subframe_options").select("*").eq("enabled", true),
    adminClient.from("price_tiers").select("*"),
  ]);

  return { products, subtypes: subtypes ?? [], sizes: sizes ?? [], finishes: finishes ?? [], frameStyles: frameStyles ?? [], frameColors: frameColors ?? [], frameWidths: frameWidths ?? [], glazingOptions: glazingOptions ?? [], subframes: subframes ?? [], priceTiers: priceTiers ?? [] };
}

/** Find or create the "Uploader" Shopify custom collection */
async function getOrCreateUploaderCollection(shopifyBase: string, shopifyToken: string): Promise<string | null> {
  let collectionId: string | null = null;
  const collectionsRes = await fetch(`${shopifyBase}/custom_collections.json?title=Uploader`, {
    headers: { "X-Shopify-Access-Token": shopifyToken, "Content-Type": "application/json" },
  });
  if (collectionsRes.ok) {
    const collectionsData = await collectionsRes.json();
    if (collectionsData.custom_collections?.length > 0) {
      collectionId = String(collectionsData.custom_collections[0].id);
    }
  }
  if (!collectionId) {
    const createCollRes = await fetch(`${shopifyBase}/custom_collections.json`, {
      method: "POST",
      headers: { "X-Shopify-Access-Token": shopifyToken, "Content-Type": "application/json" },
      body: JSON.stringify({ custom_collection: { title: "Uploader", published: true } }),
    });
    if (createCollRes.ok) {
      const collData = await createCollRes.json();
      collectionId = String(collData.custom_collection?.id);
    }
  }
  return collectionId;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Auth check - admin only (or background self-invocation with service role)
    const authHeader = req.headers.get("Authorization");
    const isBackgroundRun = req.headers.get("x-background-run") === "true";
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For background self-invocations, the token IS the service role key — skip user auth
    const token = authHeader.replace("Bearer ", "");
    if (isBackgroundRun && token === serviceRoleKey) {
      // Trusted background call, skip user check
    } else {
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const userId = claimsData.claims.sub;
      const { data: roleData } = await adminClient
        .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
      if (!roleData) {
        return new Response(JSON.stringify({ error: "Admin access required" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Get Shopify config
    const { data: config } = await adminClient.from("shopify_config").select("*").limit(1).single();
    if (!config?.store_domain) {
      return new Response(JSON.stringify({ success: false, error: "Shopify not configured" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const shopifyToken = (config.admin_api_token || Deno.env.get("SHOPIFY_ADMIN_TOKEN") || "").trim();
    if (!shopifyToken) {
      return new Response(JSON.stringify({ success: false, error: "Shopify token not configured" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const shopifyBase = `https://${config.store_domain}/admin/api/${config.api_version}`;

    const body = await req.json();
    const { action, productId, jobId } = body;

    // ── Preview combinations (no Shopify calls) ──
    if (action === "preview") {
      const refData = await fetchAllReferenceData(adminClient, productId);

      let allCombos: Combination[] = [];
      for (const product of refData.products) {
        allCombos = allCombos.concat(generateCombinations(
          product, refData.subtypes, refData.sizes, refData.finishes, refData.frameStyles,
          refData.frameColors, refData.frameWidths, refData.glazingOptions, refData.subframes, refData.priceTiers,
        ));
      }

      return new Response(JSON.stringify({
        success: true, total: allCombos.length,
        products: refData.products.map((p: any) => ({ id: p.id, name: p.name_en })),
        combinations: allCombos.slice(0, 100),
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Generate Start: create job with all combinations ──
    if (action === "generate_start") {
      const refData = await fetchAllReferenceData(adminClient, productId);

      let allCombos: Combination[] = [];
      for (const product of refData.products) {
        allCombos = allCombos.concat(generateCombinations(
          product, refData.subtypes, refData.sizes, refData.finishes, refData.frameStyles,
          refData.frameColors, refData.frameWidths, refData.glazingOptions, refData.subframes, refData.priceTiers,
        ));
      }

      // Filter out combos that already have a mapping
      const existingKeys = new Set<string>();
      // Fetch all existing mapping keys in batches
      let from = 0;
      const batchSize = 1000;
      while (true) {
        const { data: batch } = await adminClient
          .from("shopify_variant_mappings")
          .select("mapping_key")
          .range(from, from + batchSize - 1);
        if (!batch || batch.length === 0) break;
        batch.forEach((r: any) => existingKeys.add(r.mapping_key));
        if (batch.length < batchSize) break;
        from += batchSize;
      }

      const newCombos = allCombos.filter(c => !existingKeys.has(c.mappingKey));
      console.log(`Total combos: ${allCombos.length}, already mapped: ${existingKeys.size}, new to sync: ${newCombos.length}`);

      if (newCombos.length === 0) {
        return new Response(JSON.stringify({
          success: true, job_id: null, total: allCombos.length,
          new_count: 0, skipped: existingKeys.size,
          message: "All variants already synced — nothing to do.",
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Get or create collection
      const collectionId = await getOrCreateUploaderCollection(shopifyBase, shopifyToken);

      // Store combos as lean objects (only what we need for Shopify creation)
      // Include size dimensions for shipping weight calculation
      const sizeMap = new Map(refData.sizes.map((s: any) => [s.id, s]));
      const leanCombos = newCombos.map(c => {
        const size = sizeMap.get(c.sizeId);
        return {
          mk: c.mappingKey, vt: c.variantTitle, p: c.price,
          pid: c.productId, pn: c.productName,
          stid: c.subtypeId, sid: c.sizeId, fid: c.finishId,
          fsid: c.frameStyleId, fcid: c.frameColorId, fwid: c.frameWidthId,
          gid: c.glazingId, sfid: c.subframeId, cew: c.canvasEdgeWrapId,
          af: c.addFrame,
          // size dims for shipping calc
          sw: size?.width_cm ?? 0,
          sh: size?.height_cm ?? 0,
          // pre-stored shipping data (if available on size_presets)
          pw: size?.pack_width_cm ?? null,
          ph: size?.pack_height_cm ?? null,
          pd: size?.pack_depth_cm ?? null,
          pwt: size?.pack_weight_kg ?? null,
        };
      });

      const { data: job, error: jobError } = await adminClient
        .from("shopify_sync_jobs")
        .insert({
          product_id: productId || null,
          status: "pending",
          total_combinations: newCombos.length,
          synced_count: 0,
          last_batch_index: 0,
          combinations: leanCombos,
          collection_id: collectionId,
          error_log: [],
        })
        .select("id")
        .single();

      if (jobError) throw jobError;

      return new Response(JSON.stringify({
        success: true, job_id: job.id,
        total: allCombos.length, new_count: newCombos.length,
        skipped: allCombos.length - newCombos.length,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Generate Batch: process next batch of a job ──
    if (action === "generate_batch") {
      if (!jobId) {
        return new Response(JSON.stringify({ success: false, error: "jobId required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: job, error: jobErr } = await adminClient
        .from("shopify_sync_jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (jobErr || !job) {
        return new Response(JSON.stringify({ success: false, error: "Job not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (job.status === "completed") {
        return new Response(JSON.stringify({
          success: true, status: "completed",
          synced_count: job.synced_count, total: job.total_combinations,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Mark as running
      await adminClient.from("shopify_sync_jobs").update({ status: "running", updated_at: new Date().toISOString() }).eq("id", jobId);

      const combos = job.combinations as any[];
      const SHOPIFY_BATCH = 100; // Shopify max variants per product
      const BATCHES_PER_CALL = 3; // Process up to 3 Shopify products per edge function call
      let batchIdx = job.last_batch_index;
      let syncedThisCall = 0;
      const errors: string[] = [];
      const collectionId = job.collection_id;

      // Split all combos into Shopify-product-sized batches (100 variants each)
      const shopifyBatches: any[][] = [];
      for (let i = 0; i < combos.length; i += SHOPIFY_BATCH) {
        shopifyBatches.push(combos.slice(i, i + SHOPIFY_BATCH));
      }

      const endBatch = Math.min(batchIdx + BATCHES_PER_CALL, shopifyBatches.length);

      for (let bi = batchIdx; bi < endBatch; bi++) {
        const batch = shopifyBatches[bi];
        
        // Double-check: skip combos already mapped (in case of resume after partial)
        const batchKeys = batch.map((c: any) => c.mk);
        const { data: existingMappings } = await adminClient
          .from("shopify_variant_mappings")
          .select("mapping_key")
          .in("mapping_key", batchKeys);
        const existingSet = new Set((existingMappings ?? []).map((m: any) => m.mapping_key));
        const newBatch = batch.filter((c: any) => !existingSet.has(c.mk));

        if (newBatch.length === 0) {
          syncedThisCall += batch.length;
          continue;
        }

        // Determine product title from first combo in batch
        const shopifyProductTitle = newBatch[0].pn;

        const variants = newBatch.map((combo: any) => {
          // Use pre-stored shipping data or calculate from dimensions
          let weightKg = combo.pwt;
          if (weightKg == null && combo.sw > 0 && combo.sh > 0) {
            const shipping = calcShippingWeight(combo.sw, combo.sh);
            weightKg = shipping.weightKg;
          }
          return {
            title: combo.vt,
            price: combo.p.toFixed ? combo.p.toFixed(2) : String(combo.p),
            sku: combo.mk.substring(0, 255),
            inventory_management: null,
            option1: combo.vt.substring(0, 255),
            requires_shipping: true,
            weight: weightKg ?? 0,
            weight_unit: "kg",
          };
        });

        const shopifyPayload = {
          product: {
            title: shopifyProductTitle,
            vendor: "Or Many Fine Art",
            product_type: "Custom Print",
            tags: "uploader,auto-generated",
            published: true,
            options: [{ name: "Configuration" }],
            variants,
          },
        };

        try {
          const createRes = await fetch(`${shopifyBase}/products.json`, {
            method: "POST",
            headers: { "X-Shopify-Access-Token": shopifyToken, "Content-Type": "application/json" },
            body: JSON.stringify(shopifyPayload),
          });

          if (!createRes.ok) {
            const errText = await createRes.text();
            errors.push(`Batch ${bi}: Shopify error [${createRes.status}]: ${errText.substring(0, 500)}`);
            continue;
          }

          const shopifyData = await createRes.json();
          const createdVariants = shopifyData.product?.variants ?? [];
          const shopifyProductId = shopifyData.product?.id;

          // Add to collection
          if (collectionId && shopifyProductId) {
            await fetch(`${shopifyBase}/collects.json`, {
              method: "POST",
              headers: { "X-Shopify-Access-Token": shopifyToken, "Content-Type": "application/json" },
              body: JSON.stringify({ collect: { product_id: shopifyProductId, collection_id: Number(collectionId) } }),
            });
          }

          // Store mappings
          const mappingRows = newBatch.map((combo: any, idx: number) => {
            const shopifyVariant = createdVariants[idx];
            return {
              product_id: combo.pid,
              subtype_id: combo.stid || null,
              size_id: combo.sid || null,
              finish_id: combo.fid || null,
              frame_style_id: combo.fsid || null,
              frame_color_id: combo.fcid || null,
              frame_width_id: combo.fwid || null,
              glazing_id: combo.gid || null,
              subframe_id: combo.sfid || null,
              canvas_edge_wrap_id: combo.cew || null,
              add_frame: combo.af,
              mapping_key: combo.mk,
              shopify_variant_id: shopifyVariant ? String(shopifyVariant.id) : "MISSING",
              enabled: true,
            };
          }).filter((r: any) => r.shopify_variant_id !== "MISSING");

          if (mappingRows.length > 0) {
            const { error: insertErr } = await adminClient
              .from("shopify_variant_mappings")
              .upsert(mappingRows, { onConflict: "mapping_key" });
            if (insertErr) {
              errors.push(`Batch ${bi}: DB error: ${insertErr.message}`);
            } else {
              syncedThisCall += mappingRows.length;
            }
          }

          // Set box dimensions as metafields on the created variants
          const variantDims = newBatch.map((combo: any, idx: number) => {
            const sv = createdVariants[idx];
            if (!sv) return null;
            let packW = combo.pw, packH = combo.ph, packD = combo.pd;
            if (packW == null && combo.sw > 0 && combo.sh > 0) {
              const s = calcShippingWeight(combo.sw, combo.sh);
              packW = s.packW; packH = s.packH; packD = s.packD;
            }
            if (packW == null) return null;
            return { variantId: String(sv.id), packW, packH, packD };
          }).filter(Boolean) as { variantId: string; packW: number; packH: number; packD: number }[];

          if (variantDims.length > 0) {
            const mfErrors = await setVariantBoxMetafields(config.store_domain, config.api_version, shopifyToken, variantDims);
            if (mfErrors.length > 0) {
              errors.push(...mfErrors.map(e => `Batch ${bi}: ${e}`));
            }
          }

          // Rate limit
          if (bi < endBatch - 1) {
            await new Promise((r) => setTimeout(r, 1000));
          }
        } catch (e) {
          errors.push(`Batch ${bi}: ${e instanceof Error ? e.message : String(e)}`);
        }
      }

      const newSyncedCount = job.synced_count + syncedThisCall;
      const isComplete = endBatch >= shopifyBatches.length;
      const newStatus = isComplete ? "completed" : "running";

      const existingErrors = (job.error_log as any[]) || [];
      const allErrors = [...existingErrors, ...errors];

      await adminClient.from("shopify_sync_jobs").update({
        status: newStatus,
        synced_count: newSyncedCount,
        last_batch_index: endBatch,
        error_log: allErrors,
        updated_at: new Date().toISOString(),
      }).eq("id", jobId);

      return new Response(JSON.stringify({
        success: true,
        status: newStatus,
        synced_count: newSyncedCount,
        total: job.total_combinations,
        processed_batches: endBatch,
        total_batches: shopifyBatches.length,
        errors_this_call: errors,
        is_complete: isComplete,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Get job status ──
    if (action === "job_status") {
      if (!jobId) {
        return new Response(JSON.stringify({ success: false, error: "jobId required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: job } = await adminClient.from("shopify_sync_jobs").select("id, status, total_combinations, synced_count, last_batch_index, error_log, created_at, updated_at").eq("id", jobId).single();
      if (!job) {
        return new Response(JSON.stringify({ success: false, error: "Job not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: true, job }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Refresh Prices Start: compute new prices, store in a sync job ──
    if (action === "refresh_prices_start") {
      const refData = await fetchAllReferenceData(adminClient, productId);

      let allCombos: Combination[] = [];
      for (const product of refData.products) {
        allCombos = allCombos.concat(generateCombinations(
          product, refData.subtypes, refData.sizes, refData.finishes, refData.frameStyles,
          refData.frameColors, refData.frameWidths, refData.glazingOptions, refData.subframes, refData.priceTiers,
        ));
      }

      const priceMap = new Map<string, number>();
      for (const c of allCombos) {
        priceMap.set(c.mappingKey, c.price);
      }

      // Fetch existing mappings with pagination (support up to 40,000)
      const PAGE_SIZE = 1000;
      const MAX_PAGES = 40; // 40 * 1000 = 40,000
      let allMappings: any[] = [];
      for (let page = 0; page < MAX_PAGES; page++) {
        let q = adminClient.from("shopify_variant_mappings")
          .select("id, mapping_key, shopify_variant_id")
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
        if (productId) q = q.eq("product_id", productId);
        const { data: pageData, error: fetchErr } = await q;
        if (fetchErr) throw fetchErr;
        if (!pageData || pageData.length === 0) break;
        allMappings = allMappings.concat(pageData);
        if (pageData.length < PAGE_SIZE) break;
      }
      const existingMappings = allMappings;

      // Build a title map from combinations for display
      const titleMap = new Map<string, string>();
      for (const c of allCombos) {
        titleMap.set(c.mappingKey, c.variantTitle);
      }

      const items = (existingMappings ?? [])
        .filter((m: any) => priceMap.has(m.mapping_key))
        .map((m: any) => ({
          vid: m.shopify_variant_id,
          price: priceMap.get(m.mapping_key),
          mk: m.mapping_key,
          title: titleMap.get(m.mapping_key) || m.mapping_key,
        }));

      if (items.length === 0) {
        return new Response(JSON.stringify({ success: true, job_id: null, total: 0, message: "No variants to update." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: job, error: jobError } = await adminClient.from("shopify_sync_jobs").insert({
        product_id: productId || null,
        status: "pending",
        total_combinations: items.length,
        synced_count: 0,
        last_batch_index: 0,
        combinations: items,
        error_log: [],
      }).select("id").single();
      if (jobError) throw jobError;

      return new Response(JSON.stringify({ success: true, job_id: job.id, total: items.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Refresh Prices Batch: update a chunk of Shopify variants ──
    if (action === "refresh_prices_batch") {
      if (!jobId) {
        return new Response(JSON.stringify({ success: false, error: "jobId required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: job, error: jobErr } = await adminClient.from("shopify_sync_jobs").select("*").eq("id", jobId).single();
      if (jobErr || !job) {
        return new Response(JSON.stringify({ success: false, error: "Job not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (job.status === "completed") {
        return new Response(JSON.stringify({ success: true, is_complete: true, updated: job.synced_count, total: job.total_combinations }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (job.status === "paused") {
        return new Response(JSON.stringify({ success: true, is_complete: false, paused: true, updated: job.synced_count, total: job.total_combinations, processed: job.last_batch_index }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await adminClient.from("shopify_sync_jobs").update({ status: "running", updated_at: new Date().toISOString() }).eq("id", jobId);

      const items = job.combinations as any[];
      // Time-based cutoff: process as many as possible within 50s (edge fn timeout ~60s)
      const TIME_LIMIT_MS = 50_000;
      const callStart = Date.now();
      const startIdx = job.last_batch_index;
      let currentIdx = startIdx;
      let updated = 0;
      let skipped = 0;
      const errors: string[] = [];
      const updatedVariants: { vid: string; title: string; price: string }[] = [];
      let requestCount = 0;

      for (let i = startIdx; i < items.length; i++) {
        // Check time budget before each variant
        if (Date.now() - callStart > TIME_LIMIT_MS) break;

        const item = items[i];
        currentIdx = i + 1;
        try {
          const newPrice = Number(item.price).toFixed(2);

          // Fetch current variant price from Shopify
          requestCount++;
          const getRes = await fetch(`${shopifyBase}/variants/${item.vid}.json`, {
            headers: { "X-Shopify-Access-Token": shopifyToken, "Content-Type": "application/json" },
          });
          if (getRes.ok) {
            const variantData = await getRes.json();
            const currentPrice = variantData.variant?.price;
            if (currentPrice === newPrice) {
              skipped++;
              // Minimal delay for GET-only to respect rate limits
              if (requestCount % 4 === 0) await new Promise(r => setTimeout(r, 100));
              continue;
            }
          }
          // Rate limit before PUT
          await new Promise(r => setTimeout(r, 250));

          requestCount++;
          const res = await fetch(`${shopifyBase}/variants/${item.vid}.json`, {
            method: "PUT",
            headers: { "X-Shopify-Access-Token": shopifyToken, "Content-Type": "application/json" },
            body: JSON.stringify({ variant: { id: Number(item.vid), price: newPrice } }),
          });
          if (!res.ok) {
            const errText = await res.text();
            errors.push(`${item.vid}: ${res.status} ${errText.substring(0, 150)}`);
          } else {
            updated++;
            updatedVariants.push({ vid: item.vid, title: item.title || item.mk || item.vid, price: newPrice });
          }
        } catch (e) {
          errors.push(`${item.vid}: ${e instanceof Error ? e.message : String(e)}`);
        }
        // Rate limit after PUT
        if (requestCount % 2 === 0) await new Promise(r => setTimeout(r, 350));
      }
      const endIdx = currentIdx;

      const newSyncedCount = job.synced_count + updated;
      const isComplete = endIdx >= items.length;
      const existingErrors = (job.error_log as any[]) || [];

      await adminClient.from("shopify_sync_jobs").update({
        status: isComplete ? "completed" : "running",
        synced_count: newSyncedCount,
        last_batch_index: endIdx,
        error_log: [...existingErrors, ...errors],
        updated_at: new Date().toISOString(),
      }).eq("id", jobId);

      // If not complete and not paused, self-invoke to continue in the background
      if (!isComplete && job.status !== "paused") {
        const selfUrl = `${supabaseUrl}/functions/v1/shopify-generate-variants`;
        fetch(selfUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
            "x-background-run": "true",
          },
          body: JSON.stringify({ action: "refresh_prices_batch", jobId, _background: true }),
        }).catch(err => console.error("Self-invoke failed:", err));
      }

      return new Response(JSON.stringify({
        success: true,
        updated: newSyncedCount,
        total: items.length,
        processed: endIdx,
        skipped,
        errors_this_call: errors,
        updated_variants: updatedVariants,
        is_complete: isComplete,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Legacy generate (kept for backwards compat but redirects to new flow) ──
    if (action === "generate") {
      return new Response(JSON.stringify({
        success: false,
        error: "Please use the new batched generation flow (generate_start + generate_batch).",
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: false, error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("shopify-generate-variants error:", e);
    return new Response(JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
