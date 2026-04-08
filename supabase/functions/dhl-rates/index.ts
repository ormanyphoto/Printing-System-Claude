import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DHL_API_URL = "https://express.api.dhl.com/mydhlapi";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const DHL_API_KEY = Deno.env.get("DHL_API_KEY");
    const DHL_ACCOUNT_NUMBER = Deno.env.get("DHL_ACCOUNT_NUMBER");
    if (!DHL_ACCOUNT_NUMBER) {
      return new Response(JSON.stringify({ error: "DHL_ACCOUNT_NUMBER is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { sizes, origin_country = "IL", origin_city = "Tel Aviv", origin_postal = "6100000", dest_country = "IL", dest_city = "Tel Aviv", dest_postal = "6100000" } = body;

    if (!sizes || !Array.isArray(sizes) || sizes.length === 0) {
      return new Response(JSON.stringify({ error: "No sizes provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = new Date();
    const plannedDate = today.toISOString().split("T")[0];

    const rates: any[] = [];
    const errors: any[] = [];

    // Process in batches to avoid rate limiting
    for (const size of sizes) {
      const width = size.pack_width_cm || size.width_cm + 5;
      const height = size.pack_height_cm || size.height_cm + 5;
      const depth = size.pack_depth_cm || 10;
      const weight = size.pack_weight_kg || Math.max(0.5, (width * height * depth) / 5000);

      try {
        const rateReq = {
          customerDetails: {
            shipperDetails: {
              postalCode: origin_postal,
              cityName: origin_city,
              countryCode: origin_country,
            },
            receiverDetails: {
              postalCode: dest_postal,
              cityName: dest_city,
              countryCode: dest_country,
            },
          },
          accounts: [{ typeCode: "shipper", number: DHL_ACCOUNT_NUMBER }],
          plannedShippingDateAndTime: `${plannedDate}T10:00:00 GMT+03:00`,
          unitOfMeasurement: "metric",
          isCustomsDeclarable: false,
          packages: [
            {
              weight: Math.round(weight * 100) / 100,
              dimensions: {
                length: Math.round(Math.max(width, height)),
                width: Math.round(Math.min(width, height)),
                height: Math.round(depth),
              },
            },
          ],
        };

        const resp = await fetch(`${DHL_API_URL}/rates`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${btoa(DHL_API_KEY + ":")}`,
          },
          body: JSON.stringify(rateReq),
        });

        if (resp.ok) {
          const data = await resp.json();
          const products = data.products || [];
          const cheapest = products.reduce((min: any, p: any) => {
            const total = p.totalPrice?.[0]?.price ?? Infinity;
            return total < (min?.price ?? Infinity) ? { price: total, currency: p.totalPrice?.[0]?.priceCurrency, service: p.productName, deliveryDate: p.deliveryCapabilities?.estimatedDeliveryDateAndTime } : min;
          }, null);

          rates.push({
            id: size.id,
            size: `${size.width_cm}x${size.height_cm}`,
            product_name: size.product_name,
            pack_dimensions: `${Math.round(width)}x${Math.round(height)}x${Math.round(depth)}`,
            weight_kg: Math.round(weight * 100) / 100,
            cheapest_rate: cheapest?.price ?? null,
            currency: cheapest?.currency ?? null,
            service: cheapest?.service ?? null,
            delivery_date: cheapest?.deliveryDate ?? null,
            all_services: products.map((p: any) => ({
              name: p.productName,
              price: p.totalPrice?.[0]?.price,
              currency: p.totalPrice?.[0]?.priceCurrency,
            })),
          });
        } else {
          const errBody = await resp.text();
          errors.push({
            id: size.id,
            size: `${size.width_cm}x${size.height_cm}`,
            status: resp.status,
            error: errBody.substring(0, 500),
          });
        }
      } catch (e: any) {
        errors.push({
          id: size.id,
          size: `${size.width_cm}x${size.height_cm}`,
          error: e.message,
        });
      }

      // Small delay between requests to avoid rate limiting
      await new Promise((r) => setTimeout(r, 200));
    }

    return new Response(
      JSON.stringify({ rates, errors, message: `${rates.length} rates fetched, ${errors.length} errors` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("DHL rates error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
