import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  try {
    const url = new URL(req.url);

    // Step 1: If called with POST, return the Shopify auth URL
    if (req.method === "POST") {
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

      // Check admin
      const { data: roleData } = await adminClient.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      if (!roleData) {
        return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: config } = await adminClient.from("shopify_config").select("*").limit(1).single();
      if (!config?.store_domain || !config?.client_id) {
        return new Response(JSON.stringify({ error: "Store domain and Client ID must be configured first" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const scopes = (config as any).oauth_scopes || "read_orders,write_orders,read_draft_orders,write_draft_orders";
      const redirectUri = `${supabaseUrl}/functions/v1/shopify-oauth`;
      const nonce = crypto.randomUUID();

      // Store the nonce for CSRF validation
      // Clean up expired states first
      await adminClient.from("shopify_oauth_state").delete().lt("expires_at", new Date().toISOString());
      // Insert the new nonce
      const { error: stateError } = await adminClient.from("shopify_oauth_state").insert({ nonce });
      if (stateError) {
        console.error("Failed to store OAuth state:", stateError);
        return new Response(JSON.stringify({ error: "Failed to initiate OAuth" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const authUrl = `https://${config.store_domain}/admin/oauth/authorize?client_id=${config.client_id}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${nonce}`;

      return new Response(JSON.stringify({ success: true, auth_url: authUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: GET = Shopify redirects here with ?code=xxx&shop=xxx&state=xxx
    if (req.method === "GET") {
      const code = url.searchParams.get("code");
      const shop = url.searchParams.get("shop");
      const state = url.searchParams.get("state");

      if (!code || !shop) {
        return new Response("<h1>Error: Missing code or shop parameter</h1>", {
          status: 400, headers: { "Content-Type": "text/html" },
        });
      }

      // Validate CSRF state nonce
      if (!state) {
        return new Response("<h1>Error: Missing state parameter</h1>", {
          status: 400, headers: { "Content-Type": "text/html" },
        });
      }

      const { data: oauthState } = await adminClient
        .from("shopify_oauth_state")
        .select("*")
        .eq("nonce", state)
        .maybeSingle();

      if (!oauthState) {
        return new Response("<h1>Error: Invalid or unknown OAuth state</h1>", {
          status: 400, headers: { "Content-Type": "text/html" },
        });
      }

      if (new Date(oauthState.expires_at) < new Date()) {
        // Clean up expired state
        await adminClient.from("shopify_oauth_state").delete().eq("nonce", state);
        return new Response("<h1>Error: OAuth state has expired. Please try again.</h1>", {
          status: 400, headers: { "Content-Type": "text/html" },
        });
      }

      // Delete the used state immediately (one-time use)
      await adminClient.from("shopify_oauth_state").delete().eq("nonce", state);

      // Get config for client_id and client_secret
      const { data: config } = await adminClient.from("shopify_config").select("*").limit(1).single();
      if (!config?.client_id || !(config as any).client_secret) {
        return new Response("<h1>Error: Shopify OAuth not configured</h1>", {
          status: 400, headers: { "Content-Type": "text/html" },
        });
      }

      // Validate shop matches configured store domain
      if (config.store_domain && config.store_domain !== shop) {
        return new Response("<h1>Error: Shop domain mismatch</h1>", {
          status: 400, headers: { "Content-Type": "text/html" },
        });
      }

      // Exchange code for permanent access token
      const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: config.client_id,
          client_secret: (config as any).client_secret,
          code,
        }),
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        console.error("Shopify token exchange failed:", errText);
        return new Response("<h1>Error exchanging token</h1>", {
          status: 400, headers: { "Content-Type": "text/html" },
        });
      }

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      if (!accessToken) {
        return new Response("<h1>Error: No access token returned</h1>", {
          status: 400, headers: { "Content-Type": "text/html" },
        });
      }

      // Store the access token in shopify_config
      await adminClient.from("shopify_config").update({
        admin_api_token: accessToken,
        store_domain: shop,
        updated_at: new Date().toISOString(),
      }).eq("id", config.id);

      // Return a nice HTML page that closes itself / redirects
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head><title>Shopify Connected</title></head>
        <body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f9fafb;">
          <div style="text-align:center;">
            <h1 style="color:#16a34a;">✅ Shopify Connected Successfully!</h1>
            <p>Access token has been saved. You can close this tab and return to the admin panel.</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'shopify-oauth-success' }, '*');
                setTimeout(() => window.close(), 2000);
              }
            </script>
          </div>
        </body>
        </html>
      `, { status: 200, headers: { "Content-Type": "text/html" } });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (e) {
    console.error("shopify-oauth error:", e);
    return new Response("<h1>Error</h1><p>An unexpected error occurred.</p>", {
      status: 500, headers: { "Content-Type": "text/html" },
    });
  }
});
