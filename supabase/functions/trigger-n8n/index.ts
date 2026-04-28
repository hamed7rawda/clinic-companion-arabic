import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { event_type, payload } = await req.json();
    if (!event_type || typeof event_type !== "string") {
      return new Response(JSON.stringify({ error: "event_type required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: hooks } = await supabase
      .from("n8n_webhooks")
      .select("*")
      .eq("event_type", event_type)
      .eq("active", true);

    if (!hooks || hooks.length === 0) {
      return new Response(JSON.stringify({ success: true, dispatched: 0, message: "No active webhooks" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = await Promise.allSettled(
      hooks.map(async (h: any) => {
        const res = await fetch(h.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event_type, timestamp: new Date().toISOString(), ...payload }),
        });

        await supabase.from("notifications_log").insert({
          channel: "n8n",
          recipient: h.url,
          patient_name: payload?.patient_name ?? null,
          message: JSON.stringify(payload).slice(0, 500),
          notification_type: event_type,
          status: res.ok ? "sent" : "failed",
          error: res.ok ? null : `HTTP ${res.status}`,
          sent_at: new Date().toISOString(),
        });

        return { hook: h.name, ok: res.ok, status: res.status };
      })
    );

    const dispatched = results.filter((r) => r.status === "fulfilled" && (r as any).value.ok).length;

    return new Response(JSON.stringify({ success: true, dispatched, total: hooks.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("trigger-n8n error:", err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
