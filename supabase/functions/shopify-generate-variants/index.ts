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

    const { productId, action } = await req.json();

    const { data: config } = await supabase.from('shopify_config').select('*').single();
    if (!config?.enabled) {
      return new Response(JSON.stringify({ error: 'Shopify not enabled' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'generate') {
      // Create sync job
      const { data: job } = await supabase
        .from('shopify_sync_jobs')
        .insert({ product_id: productId, status: 'in_progress' })
        .select()
        .single();

      // Fetch product data
      const { data: product } = await supabase.from('products').select('*').eq('id', productId).single();
      const { data: subtypes } = await supabase.from('product_subtypes').select('*').eq('product_id', productId);
      const { data: sizes } = await supabase.from('size_presets').select('*').eq('product_id', productId);

      // Generate combinations (simplified)
      const combinations = [];
      for (const subtype of (subtypes || [])) {
        for (const size of (sizes || [])) {
          combinations.push({
            title: `${product?.name_en} - ${subtype.name_en} - ${size.width_cm}x${size.height_cm}cm`,
            subtype_id: subtype.id,
            size_id: size.id,
          });
        }
      }

      await supabase
        .from('shopify_sync_jobs')
        .update({
          total_combinations: combinations.length,
          combinations: JSON.stringify(combinations),
          status: 'completed',
          synced_count: combinations.length,
        })
        .eq('id', job!.id);

      return new Response(JSON.stringify({ job: job!.id, totalCombinations: combinations.length }), {
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
