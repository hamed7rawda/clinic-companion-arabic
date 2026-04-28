import { supabase } from "@/integrations/supabase/client";

/**
 * Triggers an n8n webhook via the trigger-n8n edge function.
 * Webhooks are configured in the database (n8n_webhooks table).
 */
export async function triggerN8nEvent(eventType: string, payload: Record<string, any>) {
  try {
    const { data, error } = await supabase.functions.invoke("trigger-n8n", {
      body: { event_type: eventType, payload },
    });
    if (error) throw error;
    return data;
  } catch (err) {
    console.error("n8n trigger error:", err);
    return null;
  }
}
