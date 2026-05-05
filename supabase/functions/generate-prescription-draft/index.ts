import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { audio_base64, mime_type, patient_name } = await req.json();
    if (!audio_base64) {
      return new Response(JSON.stringify({ error: "audio_base64 required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const sys = `أنت مساعد طبي يحلل تسجيل حوار بين الطبيب والمريض ويستخرج مسودة وصفة طبية باللغة العربية بصيغة JSON صارمة.
استخدم الأداة draft_prescription لإرجاع: transcript (نص الحوار)، diagnosis (التشخيص)، medications (مصفوفة: name, dosage, frequency, duration)، labs (مصفوفة سلاسل نصية للتحاليل/الأشعة)، recommendations (نص التوصيات).
إن لم تكن المعلومة موجودة فاترك الحقل فارغاً.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          {
            role: "user",
            content: [
              { type: "text", text: `حلل تسجيل الكشف${patient_name ? ` للمريض: ${patient_name}` : ""} واستخرج مسودة الوصفة.` },
              { type: "input_audio", input_audio: { data: audio_base64, format: (mime_type || "audio/webm").includes("mp4") ? "mp4" : "webm" } },
            ],
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "draft_prescription",
            description: "Return structured prescription draft",
            parameters: {
              type: "object",
              properties: {
                transcript: { type: "string" },
                diagnosis: { type: "string" },
                medications: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      dosage: { type: "string" },
                      frequency: { type: "string" },
                      duration: { type: "string" },
                    },
                    required: ["name"],
                  },
                },
                labs: { type: "array", items: { type: "string" } },
                recommendations: { type: "string" },
              },
              required: ["transcript", "diagnosis", "medications", "labs", "recommendations"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "draft_prescription" } },
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI gateway:", aiRes.status, t);
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "تجاوز حد الطلبات، حاول لاحقاً" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "نفدت أرصدة الذكاء الاصطناعي" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: "AI error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await aiRes.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments ? JSON.parse(call.function.arguments) : null;
    if (!args) {
      return new Response(JSON.stringify({ error: "لم يتم استخراج المسودة" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true, draft: args }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-prescription-draft:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
