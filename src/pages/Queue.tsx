import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, BellRing, Trash2, Clock, UserCheck, Terminal } from "lucide-react";
import { toast } from "sonner";
import { timeAgo, logActivity } from "@/lib/clinic-utils";

interface QueueItem {
  id: string;
  patient_name: string;
  position: number;
  join_time: string;
  status: string;
}

const commands = [
  { cmd: "/add [اسم]", desc: "إضافة مريض إلى القائمة" },
  { cmd: "/next", desc: "استدعاء المريض التالي" },
  { cmd: "/queue", desc: "عرض قائمة الانتظار الحالية" },
  { cmd: "/remove [اسم]", desc: "إزالة مريض من القائمة" },
  { cmd: "/clear", desc: "مسح القائمة بالكامل" },
  { cmd: "/delay [دقائق]", desc: "إرسال إشعار تأخير لجميع المنتظرين" },
];

const Queue = () => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [delayOpen, setDelayOpen] = useState(false);
  const [delayMin, setDelayMin] = useState("15");

  const load = async () => {
    const { data } = await supabase
      .from("queue")
      .select("*")
      .eq("status", "waiting")
      .order("position");
    setQueue(data ?? []);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("queue-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "queue" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const callNext = async () => {
    const next = queue[0];
    if (!next) return toast.info("لا يوجد مرضى في الانتظار");
    const { error } = await supabase.from("queue").update({ status: "called" }).eq("id", next.id);
    if (error) return toast.error(error.message);
    await logActivity(supabase, "queue_call", `تم استدعاء ${next.patient_name}`);
    toast.success(`تم استدعاء: ${next.patient_name}`);
  };

  const removePatient = async (id: string, name: string) => {
    await supabase.from("queue").delete().eq("id", id);
    await logActivity(supabase, "queue_remove", `تمت إزالة ${name} من القائمة`);
    toast.success("تمت الإزالة");
  };

  const clearQueue = async () => {
    await supabase.from("queue").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await logActivity(supabase, "queue_clear", "تم مسح قائمة الانتظار");
    toast.success("تم مسح القائمة");
  };

  const sendDelay = async () => {
    const min = parseInt(delayMin, 10);
    if (!min || min < 1 || min > 240) return toast.error("أدخل قيمة بين 1 و 240");
    await logActivity(
      supabase,
      "delay_broadcast",
      `إشعار تأخير ${min} دقيقة لـ ${queue.length} مريض`
    );
    toast.success(`تم إرسال إشعار التأخير (${min} دقيقة)`);
    setDelayOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="قائمة الانتظار"
        description="إدارة مباشرة لطابور المرضى"
        action={
          <Badge variant="outline" className="gap-1.5 px-3 py-1 text-success border-success/30">
            <span className="h-2 w-2 rounded-full bg-success live-dot" /> مباشر
          </Badge>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 shadow-card border-0 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold">المرضى في الانتظار ({queue.length})</h2>
            <div className="flex flex-wrap gap-2">
              <Button onClick={callNext} disabled={queue.length === 0} className="gap-2 gradient-primary text-primary-foreground hover:opacity-90">
                <ChevronLeft className="h-4 w-4" /> استدعاء التالي
              </Button>
              <Dialog open={delayOpen} onOpenChange={setDelayOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2" disabled={queue.length === 0}>
                    <BellRing className="h-4 w-4" /> إشعار تأخير
                  </Button>
                </DialogTrigger>
                <DialogContent dir="rtl">
                  <DialogHeader>
                    <DialogTitle>إرسال إشعار تأخير</DialogTitle>
                  </DialogHeader>
                  <div>
                    <Label>الدقائق</Label>
                    <Input
                      type="number"
                      min="1"
                      max="240"
                      value={delayMin}
                      onChange={(e) => setDelayMin(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button onClick={sendDelay}>إرسال لـ {queue.length} مريض</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10" disabled={queue.length === 0}>
                    <Trash2 className="h-4 w-4" /> مسح الكل
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent dir="rtl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>مسح كامل القائمة؟</AlertDialogTitle>
                    <AlertDialogDescription>
                      سيتم حذف جميع المرضى الـ {queue.length} من قائمة الانتظار. لا يمكن التراجع.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>تراجع</AlertDialogCancel>
                    <AlertDialogAction onClick={clearQueue} className="bg-destructive hover:bg-destructive/90">
                      تأكيد المسح
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {queue.length === 0 ? (
            <div className="py-16 text-center">
              <UserCheck className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">القائمة فارغة الآن</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {queue.map((q, idx) => (
                <li
                  key={q.id}
                  className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-smooth hover:border-primary/40"
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${
                      idx === 0
                        ? "gradient-primary text-primary-foreground shadow-glow"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {q.position}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-semibold">{q.patient_name}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> منذ {timeAgo(q.join_time)}
                    </p>
                  </div>
                  {idx === 0 && (
                    <Badge className="bg-accent text-accent-foreground">التالي</Badge>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removePatient(q.id, q.patient_name)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5 shadow-card border-0">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <Terminal className="h-5 w-5 text-accent" /> أوامر الممرض
          </h2>
          <p className="mb-3 text-xs text-muted-foreground">
            الأوامر المتاحة عبر بوت تيليجرام:
          </p>
          <ul className="space-y-2">
            {commands.map((c) => (
              <li key={c.cmd} className="rounded-lg bg-muted/50 p-2.5 text-sm">
                <code className="block font-mono text-primary font-bold" dir="ltr">
                  {c.cmd}
                </code>
                <p className="mt-0.5 text-xs text-muted-foreground">{c.desc}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default Queue;
