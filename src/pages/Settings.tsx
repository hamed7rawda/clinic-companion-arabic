import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Save, Bot, Database, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Config {
  id: number;
  doctor_name: string | null;
  specialty: string | null;
  working_hours_start: string | null;
  working_hours_end: string | null;
  slots_per_day: number | null;
  doctor_chat_id: string | null;
  nurse_chat_id: string | null;
  google_sheet_id: string | null;
  reminder_morning: string | null;
  reminder_afternoon: string | null;
  reminder_evening: string | null;
  telegram_status: boolean | null;
  sheets_status: boolean | null;
  openai_status: boolean | null;
}

const Settings = () => {
  const [cfg, setCfg] = useState<Config | null>(null);

  const load = async () => {
    const { data } = await supabase.from("clinic_config").select("*").eq("id", 1).single();
    setCfg(data as Config);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!cfg) return;
    const { error } = await supabase.from("clinic_config").update({
      doctor_name: cfg.doctor_name,
      specialty: cfg.specialty,
      working_hours_start: cfg.working_hours_start,
      working_hours_end: cfg.working_hours_end,
      slots_per_day: cfg.slots_per_day,
      doctor_chat_id: cfg.doctor_chat_id,
      nurse_chat_id: cfg.nurse_chat_id,
      google_sheet_id: cfg.google_sheet_id,
      reminder_morning: cfg.reminder_morning,
      reminder_afternoon: cfg.reminder_afternoon,
      reminder_evening: cfg.reminder_evening,
      updated_at: new Date().toISOString(),
    }).eq("id", 1);
    if (error) return toast.error(error.message);
    toast.success("تم حفظ الإعدادات");
  };

  if (!cfg) return <p className="p-6 text-center text-muted-foreground">جارٍ التحميل...</p>;

  const update = (k: keyof Config, v: any) => setCfg({ ...cfg, [k]: v });

  return (
    <div className="space-y-6">
      <PageHeader
        title="الإعدادات"
        description="إدارة بيانات العيادة وتكاملات النظام"
        action={
          <Button onClick={save} className="gap-2 gradient-primary text-primary-foreground hover:opacity-90">
            <Save className="h-4 w-4" /> حفظ التغييرات
          </Button>
        }
      />

      <Card className="p-5 shadow-card border-0">
        <h2 className="mb-4 text-lg font-bold">بيانات العيادة</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>اسم الطبيب</Label>
            <Input value={cfg.doctor_name ?? ""} onChange={(e) => update("doctor_name", e.target.value)} maxLength={100} />
          </div>
          <div>
            <Label>التخصص</Label>
            <Input value={cfg.specialty ?? ""} onChange={(e) => update("specialty", e.target.value)} maxLength={100} />
          </div>
          <div>
            <Label>بداية الدوام</Label>
            <Input type="time" value={cfg.working_hours_start ?? ""} onChange={(e) => update("working_hours_start", e.target.value)} />
          </div>
          <div>
            <Label>نهاية الدوام</Label>
            <Input type="time" value={cfg.working_hours_end ?? ""} onChange={(e) => update("working_hours_end", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label>عدد المواعيد المتاحة يومياً</Label>
            <Input type="number" min="1" max="100" value={cfg.slots_per_day ?? 0} onChange={(e) => update("slots_per_day", parseInt(e.target.value, 10))} />
          </div>
        </div>
      </Card>

      <Card className="p-5 shadow-card border-0">
        <h2 className="mb-4 text-lg font-bold">إعدادات الإشعارات</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>معرف تيليجرام للطبيب</Label>
            <Input value={cfg.doctor_chat_id ?? ""} onChange={(e) => update("doctor_chat_id", e.target.value)} placeholder="123456789" maxLength={50} />
          </div>
          <div>
            <Label>معرف تيليجرام للممرض</Label>
            <Input value={cfg.nurse_chat_id ?? ""} onChange={(e) => update("nurse_chat_id", e.target.value)} placeholder="987654321" maxLength={50} />
          </div>
          <div>
            <Label>تذكير الصباح</Label>
            <Input type="time" value={cfg.reminder_morning ?? ""} onChange={(e) => update("reminder_morning", e.target.value)} />
          </div>
          <div>
            <Label>تذكير الظهر</Label>
            <Input type="time" value={cfg.reminder_afternoon ?? ""} onChange={(e) => update("reminder_afternoon", e.target.value)} />
          </div>
          <div>
            <Label>تذكير المساء</Label>
            <Input type="time" value={cfg.reminder_evening ?? ""} onChange={(e) => update("reminder_evening", e.target.value)} />
          </div>
          <div>
            <Label>معرف Google Sheet</Label>
            <Input value={cfg.google_sheet_id ?? ""} onChange={(e) => update("google_sheet_id", e.target.value)} placeholder="1AbC..." maxLength={200} />
          </div>
        </div>
      </Card>

      <Card className="p-5 shadow-card border-0">
        <h2 className="mb-4 text-lg font-bold">حالة التكاملات</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10 text-info">
              <Bot className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Telegram Bot</p>
              <Badge variant="outline" className={cfg.telegram_status ? "border-success/40 text-success" : "border-destructive/40 text-destructive"}>
                {cfg.telegram_status ? "✅ متصل" : "❌ غير متصل"}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
              <Database className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Google Sheets</p>
              <Badge variant="outline" className={cfg.sheets_status ? "border-success/40 text-success" : "border-destructive/40 text-destructive"}>
                {cfg.sheets_status ? "✅ متصل" : "❌ غير متصل"}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">OpenAI</p>
              <Badge variant="outline" className={cfg.openai_status ? "border-success/40 text-success" : "border-destructive/40 text-destructive"}>
                {cfg.openai_status ? "✅ متصل" : "❌ غير متصل"}
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
