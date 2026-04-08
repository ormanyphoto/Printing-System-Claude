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

  try {
    const VT_API_KEY = Deno.env.get("VIRUSTOTAL_API_KEY");
    if (!VT_API_KEY) {
      throw new Error("VIRUSTOTAL_API_KEY not configured");
    }

    const { fileName } = await req.json();
    if (!fileName) {
      throw new Error("fileName is required");
    }

    // Authenticate the caller
    const authHeader = req.headers.get("authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the user is authenticated
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || "" } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download the file from storage using service role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: fileData, error: downloadError } = await adminClient.storage
      .from("order-images")
      .download(fileName);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    // Upload to VirusTotal for scanning
    const formData = new FormData();
    formData.append("file", fileData, fileName);

    const uploadRes = await fetch("https://www.virustotal.com/api/v3/files", {
      method: "POST",
      headers: { "x-apikey": VT_API_KEY },
      body: formData,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`VirusTotal upload failed: ${uploadRes.status} ${errText}`);
    }

    const uploadResult = await uploadRes.json();
    const analysisId = uploadResult.data?.id;

    if (!analysisId) {
      throw new Error("No analysis ID returned from VirusTotal");
    }

    // Poll for results (up to 60s with 5s intervals)
    let scanResult = null;
    for (let i = 0; i < 12; i++) {
      await new Promise((r) => setTimeout(r, 5000));

      const analysisRes = await fetch(
        `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
        { headers: { "x-apikey": VT_API_KEY } }
      );

      if (!analysisRes.ok) continue;

      const analysis = await analysisRes.json();
      const status = analysis.data?.attributes?.status;

      if (status === "completed") {
        scanResult = analysis.data.attributes;
        break;
      }
    }

    if (!scanResult) {
      // Timeout — treat as inconclusive, allow the file
      return new Response(
        JSON.stringify({ safe: true, status: "timeout", message: "Scan timed out — file allowed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stats = scanResult.stats || {};
    const malicious = (stats.malicious || 0) + (stats.suspicious || 0);
    const isSafe = malicious === 0;

    // If malicious, delete the file from storage
    if (!isSafe) {
      await adminClient.storage.from("order-images").remove([fileName]);
    }

    return new Response(
      JSON.stringify({
        safe: isSafe,
        status: "completed",
        stats,
        message: isSafe
          ? "File is clean"
          : `File flagged by ${malicious} engine(s) — removed`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
