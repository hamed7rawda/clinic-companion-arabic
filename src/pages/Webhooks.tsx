import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Webhook, Send, Bell } from "lucide-react";
import { toast } from "sonner";
import { triggerN8nEvent } from "@/lib/n8n";
import { EmptyState } from "@/components/shared/EmptyState";

const EVENT_TYPES = [
  { v: "appointment_reminder", l: "تذكير موعد" },
  { v: "appointment_booked", l: "تأكيد حجز" },
  { v: "appointment_cancelled", l: "إلغاء موعد" },
  { v: "follow_up", l: "متابعة بعد الزيارة" },
  { v: "daily_report", l: "تقرير يومي للدكتور" },
  { v: "prescription_ready", l: "وصفة جاهزة" },
  { v: "delay_notice", l: "إشعار تأخير" },
];

interface Webhook { id: string; name: string; url: string; event_type: string; active: boolean; }
interface NotifLog {
  id: string; channel: string; recipient: string; patient_name: string | null;
  notification_type: string; status: string; sent_at: string | null; created_at: string; error: string | null;
}

export default function Webhooks() {
  const [hooks, setHooks] = useState<Webhook[]>([]);
  const [logs, setLogs] = useState<NotifLog[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [eventType, setEventType] = useState("appointment_reminder");

  const load = async () => {
    const [{ data: h }, { data: l }] = await Promise.all([
      supabase.from("n8n_webhooks").select("*").order("created_at", { ascending: false }),
      supabase.from("notifications_log").select("*").order("created_at", { ascending: false }).limit(30),
    ]);
    setHooks((h ?? []) as Webhook[]);
    setLogs((l ?? []) as NotifLog[]);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("webhooks-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "n8n_webhooks" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications_log" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const handleSave = async () => {
    if (!name.trim() || name.length > 100) return toast.error("اسم غير صالح");
    try { new URL(url); } catch { return toast.error("رابط غير صالح"); }
    const { error } = await supabase.from("n8n_webhooks").insert({
      name: name.trim(), url: url.trim(), event_type: eventType, active: true,
    });
    if (error) return toast.error(error.message);
    toast.success("تم إضافة الويب هوك");
    setName(""); setUrl(""); setOpen(false);
  };

  const toggle = async (id: string, active: boolean) => {
    await supabase.from("n8n_webhooks").update({ active }).eq("id", id);
  };

  const remove = async (id: string) => {
    await supabase.from("n8n_webhooks").delete().eq("id", id);
    toast.success("تم الحذف");
  };

  const test = async (h: Webhook) => {
    toast.loading("جاري إرسال طلب اختبار...", { id: "test" });
    const res = await triggerN8nEvent(h.event_type, {
      test: true, message: "اختبار ربط من نظام العيادة",
    });
    toast.dismiss("test");
    if (res?.success) toast.success("تم إرسال الاختبار بنجاح");
    else toast.error("فشل الاختبار - راجع الرابط");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="ربط n8n والإشعارات"
        description="إدارة الويب هوكس لإرسال WhatsApp/SMS وتذكيرات تلقائية"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 gradient-primary text-primary-foreground hover:opacity-90">
                <Plus className="h-4 w-4" /> إضافة Webhook
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader><DialogTitle>إضافة n8n Webhook</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>اسم الوصف</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: تذكيرات WhatsApp" />
                </div>
                <div className="space-y-2">
                  <Label>رابط n8n Webhook</Label>
                  <Input value={url} onChange={(e) => setUrl(e.target.value)} dir="ltr"
                    placeholder="https://n8n.example.com/webhook/..." />
                </div>
                <div className="space-y-2">
                  <Label>نوع الحدث</Label>
                  <Select value={eventType} onValueChange={setEventType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((e) => <SelectItem key={e.v} value={e.v}>{e.l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter><Button onClick={handleSave}>حفظ</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="p-5 shadow-card border-0">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <Webhook className="h-5 w-5 text-primary" /> الويب هوكس النشطة
        </h3>
        {hooks.length === 0 ? (
          <EmptyState icon={Webhook} title="لا توجد ويب هوكس بعد"
            description="أضف رابط n8n لتشغيل الإشعارات التلقائية" />
        ) : (
          <div className="space-y-2">
            {hooks.map((h) => (
              <div key={h.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{h.name}</p>
                    <Badge variant="secondary" className="text-xs">
                      {EVENT_TYPES.find((e) => e.v === h.event_type)?.l ?? h.event_type}
                    </Badge>
                  </div>
                  <p className="truncate text-xs text-muted-foreground" dir="ltr">{h.url}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={h.active} onCheckedChange={(v) => toggle(h.id, v)} />
                  <Button variant="ghost" size="icon" onClick={() => test(h)} title="اختبار">
                    <Send className="h-4 w-4 text-primary" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent dir="rtl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>حذف الويب هوك؟</AlertDialogTitle>
                        <AlertDialogDescription>سيتوقف هذا الحدث عن إرسال إشعارات.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove(h.id)}>حذف</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5 shadow-card border-0">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <Bell className="h-5 w-5 text-accent" /> سجل الإشعارات الأخيرة
        </h3>
        {logs.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">لا توجد إشعارات بعد</p>
        ) : (
          <div className="space-y-1.5">
            {logs.map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-2 border-b border-border/50 py-2 text-sm last:border-0">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Badge variant={l.status === "sent" ? "default" : l.status === "failed" ? "destructive" : "secondary"}
                    className="text-xs">{l.status}</Badge>
                  <span className="truncate">{l.patient_name ?? l.recipient}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    [{l.channel}] {EVENT_TYPES.find((e) => e.v === l.notification_type)?.l ?? l.notification_type}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(l.created_at).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
