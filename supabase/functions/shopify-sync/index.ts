import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { action, orderData } = await req.json();

    // Get Shopify config
    const { data: config } = await supabase
      .from('shopify_config')
      .select('*')
      .single();

    if (!config || !config.enabled) {
      return new Response(JSON.stringify({ error: 'Shopify integration not enabled' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const shopifyHeaders = {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': config.admin_api_token,
    };

    if (action === 'test') {
      const resp = await fetch(
        `https://${config.store_domain}/admin/api/${config.api_version}/shop.json`,
        { headers: shopifyHeaders }
      );
      const data = await resp.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'create_draft_order') {
      const resp = await fetch(
        `https://${config.store_domain}/admin/api/${config.api_version}/draft_orders.json`,
        {
          method: 'POST',
          headers: shopifyHeaders,
          body: JSON.stringify({ draft_order: orderData }),
        }
      );
      const data = await resp.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
