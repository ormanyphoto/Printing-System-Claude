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
    const { originCountry, originCity, destCountry, destCity, weight, length, width, height } = await req.json();

    const DHL_API_KEY = Deno.env.get('DHL_API_KEY');
    const DHL_ACCOUNT_NUMBER = Deno.env.get('DHL_ACCOUNT_NUMBER');

    if (!DHL_API_KEY || !DHL_ACCOUNT_NUMBER) {
      return new Response(JSON.stringify({ error: 'DHL credentials not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch('https://express.api.dhl.com/mydhlapi/rates', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(DHL_API_KEY)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerDetails: {
          shipperDetails: { postalCode: '0000', cityName: originCity, countryCode: originCountry },
          receiverDetails: { postalCode: '0000', cityName: destCity, countryCode: destCountry },
        },
        accounts: [{ typeCode: 'shipper', number: DHL_ACCOUNT_NUMBER }],
        plannedShippingDateAndTime: new Date().toISOString(),
        unitOfMeasurement: 'metric',
        isCustomsDeclarable: originCountry !== destCountry,
        packages: [{ weight, dimensions: { length, width, height } }],
      }),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
