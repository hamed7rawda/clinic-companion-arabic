import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const url = new URL(req.url);

    if (req.method === "GET") {
      const date = url.searchParams.get("date");
      if (!date) return json({ error: "date required" }, 400);

      const { data: cfg } = await supabase
        .from("clinic_config")
        .select("working_hours_start, working_hours_end, slots_per_day")
        .eq("id", 1)
        .maybeSingle();

      const start = (cfg?.working_hours_start ?? "09:00:00").slice(0, 5);
      const end = (cfg?.working_hours_end ?? "17:00:00").slice(0, 5);
      const slots = cfg?.slots_per_day ?? 16;

      const [sh, sm] = start.split(":").map(Number);
      const [eh, em] = end.split(":").map(Number);
      const totalMinutes = (eh * 60 + em) - (sh * 60 + sm);
      const step = Math.max(15, Math.floor(totalMinutes / slots));

      const all: string[] = [];
      for (let i = 0; i < slots; i++) {
        const m = sh * 60 + sm + i * step;
        if (m >= eh * 60 + em) break;
        all.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
      }

      const { data: taken } = await supabase
        .from("appointments")
        .select("time")
        .eq("date", date)
        .neq("status", "cancelled");

      const takenSet = new Set((taken ?? []).map((t: any) => String(t.time).slice(0, 5)));
      const available = all.filter((t) => !takenSet.has(t));
      return json({ available });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const name = String(body.name ?? "").trim().slice(0, 100);
      const phone = String(body.phone ?? "").trim().slice(0, 20);
      const date = String(body.date ?? "").trim();
      const time = String(body.time ?? "").trim();
      const complaint = String(body.complaint ?? "").trim().slice(0, 500) || null;

      if (!name || name.length < 2) return json({ error: "اسم غير صالح" }, 400);
      if (!/^[0-9+\-\s]{6,20}$/.test(phone)) return json({ error: "رقم الهاتف غير صالح" }, 400);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: "تاريخ غير صالح" }, 400);
      if (!/^\d{2}:\d{2}$/.test(time)) return json({ error: "وقت غير صالح" }, 400);

      const { data: clash } = await supabase
        .from("appointments")
        .select("id")
        .eq("date", date)
        .eq("time", time)
        .neq("status", "cancelled")
        .maybeSingle();
      if (clash) return json({ error: "هذا الوقت محجوز بالفعل" }, 409);

      let { data: patient } = await supabase
        .from("patients")
        .select("id")
        .eq("phone", phone)
        .maybeSingle();
      if (!patient) {
        const { data: created, error: pErr } = await supabase
          .from("patients")
          .insert({ name, phone })
          .select("id")
          .single();
        if (pErr) return json({ error: pErr.message }, 500);
        patient = created;
      }

      const { error: aErr } = await supabase.from("appointments").insert({
        patient_id: patient!.id,
        patient_name: name,
        date,
        time,
        complaint,
        status: "booked",
      });
      if (aErr) return json({ error: aErr.message }, 500);

      const { data: q } = await supabase
        .from("queue")
        .select("position")
        .order("position", { ascending: false })
        .limit(1);
      const nextPos = (q?.[0]?.position ?? 0) + 1;

      await supabase.from("queue").insert({
        patient_id: patient!.id,
        patient_name: name,
        position: nextPos,
        status: "waiting",
      });

      await supabase.from("activity_log").insert({
        action: "public_booking",
        description: `حجز عبر الصفحة العامة: ${name} - ${date} ${time}`,
      });

      return json({ ok: true });
    }

    return json({ error: "method not allowed" }, 405);
  } catch (e: any) {
    return json({ error: e?.message ?? "خطأ" }, 500);
  }
});
