import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const VIRUSTOTAL_API_KEY = Deno.env.get('VIRUSTOTAL_API_KEY');
    if (!VIRUSTOTAL_API_KEY) {
      return new Response(JSON.stringify({ error: 'VirusTotal API key not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { fileUrl } = await req.json();

    // Submit URL for scanning
    const scanResp = await fetch('https://www.virustotal.com/api/v3/urls', {
      method: 'POST',
      headers: {
        'x-apikey': VIRUSTOTAL_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `url=${encodeURIComponent(fileUrl)}`,
    });

    const scanData = await scanResp.json();

    return new Response(JSON.stringify({
      status: 'submitted',
      analysisId: scanData.data?.id,
      message: 'File submitted for scanning',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
