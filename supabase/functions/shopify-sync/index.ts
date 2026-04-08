import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Build a deterministic mapping key from selection IDs */
function buildMappingKey(sel: Record<string, unknown>): string {
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

/** Recalculate price server-side from stored selection IDs to prevent client manipulation */
async function recalculatePrice(
  adminClient: any,
  sel: Record<string, unknown>,
): Promise<number | null> {
  try {
    const productId = sel.productId as string;
    const sizeId = sel.sizeId as string;
    if (!productId || !sizeId) return null;

    // Fetch all needed data in parallel
    const [sizeRes, productRes, tierRes, finishRes, subframeRes, frameStyleRes, frameWidthRes, glazingRes] = await Promise.all([
      adminClient.from("size_presets").select("*").eq("id", sizeId).single(),
      adminClient.from("products").select("slug").eq("id", productId).single(),
      adminClient.from("price_tiers").select("*").eq("product_id", productId),
      sel.finishId ? adminClient.from("finishes").select("*").eq("id", sel.finishId).single() : Promise.resolve({ data: null }),
      sel.subframeId ? adminClient.from("subframe_options").select("*").eq("id", sel.subframeId).single() : Promise.resolve({ data: null }),
      sel.frameStyleId ? adminClient.from("frame_styles").select("*").eq("id", sel.frameStyleId).single() : Promise.resolve({ data: null }),
      sel.frameWidthId ? adminClient.from("frame_widths").select("*").eq("id", sel.frameWidthId).single() : Promise.resolve({ data: null }),
      sel.glazingId ? adminClient.from("glazing_options").select("*").eq("id", sel.glazingId).single() : Promise.resolve({ data: null }),
    ]);

    const size = sizeRes.data;
    if (!size) return null;

    const widthCm = size.width_cm;
    const heightCm = size.height_cm;
    const areaSqm = (widthCm * heightCm) / 10000;

    const subtypeId = sel.subtypeId as string | undefined;
    const priceTiers = tierRes.data || [];
    const tier = priceTiers.find(
      (t: any) => t.product_id === productId && (subtypeId ? t.subtype_id === subtypeId : !t.subtype_id)
    ) || priceTiers.find(
      (t: any) => t.product_id === productId && !t.subtype_id
    );
    if (!tier) return null;

    const pricePerSqm = areaSqm <= tier.tier_threshold_sqm ? tier.tier1_price_sqm : tier.tier2_price_sqm;
    let basePrice = areaSqm * pricePerSqm;

    const finish = finishRes.data;
    if (finish?.surcharge_pct) basePrice *= (1 + finish.surcharge_pct / 100);

    const subframe = subframeRes.data;
    if (subframe?.surcharge_pct) basePrice *= (1 + subframe.surcharge_pct / 100);

    const frameStyle = frameStyleRes.data;
    const frameWidth = frameWidthRes.data;
    if (frameStyle?.price_per_cm && frameWidth) {
      const perimeterCm = 2 * (widthCm + heightCm);
      let frameCost = perimeterCm * frameStyle.price_per_cm;
      if (frameWidth.surcharge_pct) frameCost *= (1 + frameWidth.surcharge_pct / 100);
      basePrice += Math.round(frameCost);
    }

    const glazing = glazingRes.data;
    if (glazing?.price_sqm) {
      basePrice += Math.round(areaSqm * glazing.price_sqm);
    }

    return Math.round(basePrice);
  } catch (err) {
    console.error("Server-side price recalculation failed, falling back to client price:", err);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Get Shopify config
    const { data: config } = await adminClient.from("shopify_config").select("*").limit(1).single();
    if (!config || !config.store_domain) {
      return new Response(JSON.stringify({ success: false, error: "Shopify store domain not configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const configuredToken = (config.admin_api_token || "").trim();
    const fallbackToken = (Deno.env.get("SHOPIFY_ADMIN_TOKEN") || "").trim();
    const tokenCandidates = Array.from(new Set([configuredToken, fallbackToken].filter((t) => t.length > 0)));
    if (tokenCandidates.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "Shopify Admin API token not configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const shopifyToken = tokenCandidates[0];

    const body = await req.json();
    const { action } = body;
    const shopifyBase = `https://${config.store_domain}/admin/api/${config.api_version}`;

    // ── Add to Cart: look up pre-created variant and return cart-add URL ──
    if (action === "add_to_cart") {
      const { items, selections } = body;

      // Support both multi-item and single-item format
      const lineItems: { selections: Record<string, any> }[] =
        items ?? [{ selections }];

      if (lineItems.length === 0 || !lineItems[0].selections) {
        return new Response(JSON.stringify({ success: false, error: "items or selections required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // For now we handle the first item (single-item cart add)
      const sel = lineItems[0].selections;
      const mappingKey = buildMappingKey(sel);
      console.log("Looking up variant mapping for key:", mappingKey);

      const { data: mapping, error: mappingErr } = await adminClient
        .from("shopify_variant_mappings")
        .select("shopify_variant_id")
        .eq("mapping_key", mappingKey)
        .eq("enabled", true)
        .maybeSingle();

      if (mappingErr) {
        console.error("Mapping lookup error:", mappingErr);
        return new Response(JSON.stringify({ success: false, error: "Failed to look up variant mapping" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!mapping) {
        console.warn("No variant mapping found for key:", mappingKey);
        return new Response(JSON.stringify({
          success: false,
          error: "No variant mapping found for this configuration. Please contact support or check admin mappings.",
          mapping_key: mappingKey,
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const variantId = mapping.shopify_variant_id;

      // Build concise line-item properties
      const properties: string[] = [];
      if (sel.subtypeName) properties.push(`Subtype=${sel.subtypeName}`);
      if (sel.sizeCm) properties.push(`Size=${sel.sizeCm}`);
      if (sel.finishName) properties.push(`Finish=${sel.finishName}`);
      if (sel.frameStyleName) properties.push(`Frame=${sel.frameStyleName}`);
      if (sel.frameColorName) properties.push(`Frame Color=${sel.frameColorName}`);
      if (sel.frameWidthCm) properties.push(`Frame Width=${sel.frameWidthCm} cm`);
      if (sel.glazingName) properties.push(`Glazing=${sel.glazingName}`);
      if (sel.subframeName) properties.push(`Subframe=${sel.subframeName}`);
      if (sel.canvasEdgeWrapName) properties.push(`Edge Wrap=${sel.canvasEdgeWrapName}`);
      if (sel.whiteBorders) properties.push(`White Border=${sel.whiteBorders}`);
      if (sel.totalSize) properties.push(`Total Size=${sel.totalSize}`);
      if (sel.area) properties.push(`Area=${sel.area}`);
      // Include the uploaded image URL for cart preview (underscore prefix hides from order confirmation but Shopify renders it as image in cart)
      if (sel.imageUrl) properties.push(`_preview_image=${sel.imageUrl}`);

      // Build Shopify cart-add URL with properties
      const params = new URLSearchParams();
      params.set("id", variantId);
      params.set("quantity", "1");
      properties.forEach((prop, i) => {
        const [name, ...rest] = prop.split("=");
        params.set(`properties[${name}]`, rest.join("="));
      });

      const cartAddUrl = `https://${config.store_domain}/cart/add?${params.toString()}`;

      console.log("Cart add URL built for variant:", variantId);

      return new Response(
        JSON.stringify({
          success: true,
          cart_add_url: cartAddUrl,
          variant_id: variantId,
          store_domain: config.store_domain,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Admin-only actions below (test, create_order) ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: roleData } = await adminClient.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "test") {
      const res = await fetch(`${shopifyBase}/shop.json`, {
        headers: { "X-Shopify-Access-Token": shopifyToken, "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const errText = await res.text();
        return new Response(JSON.stringify({ success: false, error: `Shopify API error [${res.status}]: ${errText}` }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const shopData = await res.json();
      return new Response(JSON.stringify({ success: true, shop: shopData.shop }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create_order") {
      const { orderId } = body;
      if (!orderId) {
        return new Response(JSON.stringify({ success: false, error: "orderId required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: order, error: orderErr } = await adminClient.from("orders").select("*").eq("id", orderId).single();
      if (orderErr || !order) {
        return new Response(JSON.stringify({ success: false, error: "Order not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (order.shopify_order_id) {
        return new Response(JSON.stringify({ success: false, error: "Order already synced to Shopify" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const sel = order.product_selections as Record<string, unknown>;
      const lineItemTitle = (sel?.productName as string) || "Custom Print";

      // ── Server-side price recalculation to prevent client-side manipulation ──
      const verifiedPrice = await recalculatePrice(adminClient, sel);
      const finalPrice = verifiedPrice ?? order.total_price_ils;
      if (verifiedPrice !== null && verifiedPrice !== order.total_price_ils) {
        console.warn(`Price mismatch for order ${orderId}: client=${order.total_price_ils}, server=${verifiedPrice}. Using server price.`);
        await adminClient.from("orders").update({ total_price_ils: verifiedPrice }).eq("id", orderId);
      }

      const properties: { name: string; value: string }[] = [];
      if (sel?.subtypeName) properties.push({ name: "Subtype", value: String(sel.subtypeName) });
      if (sel?.sizeCm) properties.push({ name: "Size", value: String(sel.sizeCm) });
      if (sel?.finishName) properties.push({ name: "Finish", value: String(sel.finishName) });
      if (sel?.frameStyleName) properties.push({ name: "Frame", value: String(sel.frameStyleName) });
      if (sel?.frameColorName) properties.push({ name: "Frame Color", value: String(sel.frameColorName) });
      if (sel?.glazingName) properties.push({ name: "Glazing", value: String(sel.glazingName) });
      // Intentionally NOT including image_url to keep checkout summaries clean

      const draftOrderPayload = {
        draft_order: {
          line_items: [{ title: lineItemTitle, quantity: 1, price: String(finalPrice), properties }],
          ...(order.customer_email ? { customer: { email: order.customer_email } } : {}),
          note: `Lovable order ${order.id}`,
          tags: "lovable-sync",
        },
      };

      const res = await fetch(`${shopifyBase}/draft_orders.json`, {
        method: "POST",
        headers: { "X-Shopify-Access-Token": shopifyToken, "Content-Type": "application/json" },
        body: JSON.stringify(draftOrderPayload),
      });
      if (!res.ok) {
        const errText = await res.text();
        return new Response(JSON.stringify({ success: false, error: `Shopify API error [${res.status}]: ${errText}` }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const shopifyData = await res.json();
      const shopifyDraftId = String(shopifyData.draft_order?.id || "");
      const invoiceUrl = shopifyData.draft_order?.invoice_url || "";
      await adminClient.from("orders").update({ shopify_order_id: shopifyDraftId, status: "pending", total_price_ils: finalPrice }).eq("id", orderId);
      return new Response(JSON.stringify({ success: true, shopify_draft_order_id: shopifyDraftId, invoice_url: invoiceUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: false, error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("shopify-sync error:", e);
    return new Response(JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
