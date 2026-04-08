import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const url = new URL(req.url);
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Handle OAuth callback
  if (url.searchParams.has('code')) {
    const code = url.searchParams.get('code')!;
    const shop = url.searchParams.get('shop')!;
    const state = url.searchParams.get('state')!;

    // Verify state
    const { data: stateRecord } = await supabase
      .from('shopify_oauth_state')
      .select('*')
      .eq('nonce', state)
      .single();

    if (!stateRecord) {
      return new Response('Invalid state', { status: 400 });
    }

    // Get config
    const { data: config } = await supabase
      .from('shopify_config')
      .select('*')
      .single();

    if (!config) {
      return new Response('Config not found', { status: 500 });
    }

    // Exchange code for token
    const tokenResp = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: config.client_id,
        client_secret: config.client_secret,
        code,
      }),
    });

    const tokenData = await tokenResp.json();

    // Save token
    await supabase
      .from('shopify_config')
      .update({
        admin_api_token: tokenData.access_token,
        store_domain: shop,
        enabled: true,
      })
      .eq('id', config.id);

    // Clean up state
    await supabase.from('shopify_oauth_state').delete().eq('nonce', state);

    return new Response('<html><body><h1>Shopify connected!</h1><script>window.close();</script></body></html>', {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // Initiate OAuth
  if (req.method === 'POST') {
    const { shop } = await req.json();
    const { data: config } = await supabase.from('shopify_config').select('*').single();
    if (!config) {
      return new Response(JSON.stringify({ error: 'Config not found' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const nonce = crypto.randomUUID();
    await supabase.from('shopify_oauth_state').insert({ nonce });

    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/shopify-oauth`;
    const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${config.client_id}&scope=${config.oauth_scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${nonce}`;

    return new Response(JSON.stringify({ authUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response('Method not allowed', { status: 405, headers: corsHeaders });
});
