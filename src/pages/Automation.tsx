import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { timeAgo } from "@/lib/clinic-utils";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ar } from "date-fns/locale";

interface Workflow {
  id: string;
  workflow_key: string;
  workflow_name: string;
  last_run_at: string | null;
  status: "success" | "failed" | "pending";
  next_run_at: string | null;
}

const descriptions: Record<string, string> = {
  daily_reminder: "يرسل تذكيرات للمرضى بمواعيد الغد",
  daily_report: "يرسل ملخص اليوم للطبيب",
  medication_reminders: "تذكيرات الأدوية 3 مرات يومياً (8ص / 2م / 8م)",
  follow_up: "رسائل متابعة للمرضى بعد 24 ساعة من الزيارة",
  rating_requests: "طلب تقييم بعد كل زيارة مكتملة",
};

const Automation = () => {
  const [items, setItems] = useState<Workflow[]>([]);

  useEffect(() => {
    supabase
      .from("workflow_runs")
      .select("*")
      .order("workflow_key")
      .then(({ data }) => setItems((data as Workflow[]) ?? []));
  }, []);

  const countdown = (next: string | null) => {
    if (!next) return "—";
    try {
      const d = parseISO(next);
      if (d.getTime() < Date.now()) return "قيد التشغيل قريباً";
      return formatDistanceToNow(d, { addSuffix: false, locale: ar });
    } catch {
      return "—";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="مراقبة الأتمتة"
        description="حالة سير العمل التلقائي عبر n8n"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((w) => {
          const ok = w.status === "success";
          return (
            <Card key={w.id} className="p-5 shadow-card border-0 hover:shadow-elevated transition-smooth">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-bold leading-tight">{w.workflow_name}</h3>
                {ok ? (
                  <Badge variant="outline" className="border-success/40 text-success gap-1">
                    <CheckCircle2 className="h-3 w-3" /> ناجح
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-destructive/40 text-destructive gap-1">
                    <AlertCircle className="h-3 w-3" /> فشل
                  </Badge>
                )}
              </div>

              <p className="mt-2 text-xs text-muted-foreground">
                {descriptions[w.workflow_key] ?? ""}
              </p>

              <div className="mt-4 space-y-2 border-t pt-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> آخر تشغيل
                  </span>
                  <span className="font-medium">
                    {w.last_run_at ? timeAgo(w.last_run_at) : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 text-accent" /> التشغيل القادم
                  </span>
                  <span className="font-medium text-accent">{countdown(w.next_run_at)}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Automation;
