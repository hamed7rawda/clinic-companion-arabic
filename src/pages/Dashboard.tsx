import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CalendarCheck2,
  Users2,
  CheckCircle2,
  XCircle,
  UserPlus,
  BellRing,
  Activity as ActivityIcon,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { formatTime, timeAgo, logActivity } from "@/lib/clinic-utils";

interface Appointment {
  id: string;
  patient_name: string;
  time: string;
  status: string;
  complaint: string | null;
}
interface QueueItem {
  id: string;
  patient_name: string;
  position: number;
  join_time: string;
}
interface ActivityRow {
  id: string;
  action: string;
  description: string | null;
  created_at: string;
}

const Dashboard = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [delayOpen, setDelayOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [delayMin, setDelayMin] = useState("15");

  const today = new Date().toISOString().split("T")[0];

  const loadAll = async () => {
    const [{ data: apps }, { data: q }, { data: a }] = await Promise.all([
      supabase.from("appointments").select("*").eq("date", today).order("time"),
      supabase.from("queue").select("*").eq("status", "waiting").order("position"),
      supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(10),
    ]);
    setAppointments(apps ?? []);
    setQueue(q ?? []);
    setActivity(a ?? []);
  };

  useEffect(() => {
    loadAll();
    const ch = supabase
      .channel("dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "queue" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "activity_log" }, loadAll)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = {
    today: appointments.length,
    waiting: queue.length,
    completed: appointments.filter((a) => a.status === "completed").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
  };

  const handleAddToQueue = async () => {
    const name = newName.trim();
    if (!name) {
      toast.error("الرجاء إدخال اسم المريض");
      return;
    }
    if (name.length > 100) {
      toast.error("الاسم طويل جداً");
      return;
    }
    const nextPos = (queue[queue.length - 1]?.position ?? 0) + 1;
    const { error } = await supabase.from("queue").insert({
      patient_name: name,
      position: nextPos,
    });
    if (error) return toast.error("فشل الإضافة: " + error.message);
    await logActivity(supabase, "queue_join", `تمت إضافة ${name} إلى قائمة الانتظار`);
    toast.success(`تمت إضافة ${name} إلى القائمة`);
    setNewName("");
    setAddOpen(false);
  };

  const handleDelay = async () => {
    const minutes = parseInt(delayMin, 10);
    if (!minutes || minutes < 1 || minutes > 240) {
      toast.error("أدخل عدد دقائق صحيح (1-240)");
      return;
    }
    await logActivity(
      supabase,
      "delay_broadcast",
      `تم إرسال إشعار تأخير ${minutes} دقيقة لـ ${queue.length} مريض`
    );
    toast.success(`تم إرسال إشعار تأخير ${minutes} دقيقة لجميع المنتظرين`);
    setDelayOpen(false);
  };

  // Group appointments by hour for timeline
  const timeline = appointments.reduce((acc, app) => {
    const hour = app.time?.slice(0, 2) ?? "00";
    if (!acc[hour]) acc[hour] = [];
    acc[hour].push(app);
    return acc;
  }, {} as Record<string, Appointment[]>);

  return (
    <div className="space-y-6">
      <PageHeader
        title="لوحة التحكم الرئيسية"
        description="نظرة عامة لحظية على نشاط العيادة اليوم"
        action={
          <>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <UserPlus className="h-4 w-4" /> إضافة للانتظار
                </Button>
              </DialogTrigger>
              <DialogContent dir="rtl">
                <DialogHeader>
                  <DialogTitle>إضافة مريض إلى قائمة الانتظار</DialogTitle>
                  <DialogDescription>سيُضاف المريض في نهاية القائمة</DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="pname">اسم المريض</Label>
                  <Input
                    id="pname"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="مثال: أحمد محمد"
                    maxLength={100}
                  />
                </div>
                <DialogFooter>
                  <Button onClick={handleAddToQueue}>إضافة</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={delayOpen} onOpenChange={setDelayOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 gradient-primary text-primary-foreground hover:opacity-90">
                  <BellRing className="h-4 w-4" /> إشعار تأخير
                </Button>
              </DialogTrigger>
              <DialogContent dir="rtl">
                <DialogHeader>
                  <DialogTitle>إرسال إشعار تأخير</DialogTitle>
                  <DialogDescription>
                    سيتم إرسال رسالة لجميع المرضى المنتظرين ({queue.length} مريض)
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="delay">مدة التأخير (دقائق)</Label>
                  <Input
                    id="delay"
                    type="number"
                    min="1"
                    max="240"
                    value={delayMin}
                    onChange={(e) => setDelayMin(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button onClick={handleDelay}>إرسال</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="مواعيد اليوم" value={stats.today} icon={CalendarCheck2} variant="primary" />
        <StatCard title="قائمة الانتظار" value={stats.waiting} icon={Users2} variant="accent" hint="مريض حالياً" />
        <StatCard title="زيارات مكتملة" value={stats.completed} icon={CheckCircle2} variant="success" />
        <StatCard title="إلغاءات" value={stats.cancelled} icon={XCircle} variant="destructive" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Live queue */}
        <Card className="p-5 shadow-card border-0 lg:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">قائمة الانتظار المباشرة</h2>
            <span className="flex items-center gap-1.5 text-xs text-success">
              <span className="h-2 w-2 rounded-full bg-success live-dot" />
              مباشر
            </span>
          </div>
          {queue.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              لا يوجد مرضى في الانتظار حالياً
            </p>
          ) : (
            <ul className="space-y-2">
              {queue.map((q) => (
                <li
                  key={q.id}
                  className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 p-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                    {q.position}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold">{q.patient_name}</p>
                    <p className="text-xs text-muted-foreground">
                      <Clock className="me-1 inline h-3 w-3" />
                      انضم {timeAgo(q.join_time)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Today's timeline */}
        <Card className="p-5 shadow-card border-0 lg:col-span-2">
          <h2 className="mb-4 text-lg font-bold">جدول اليوم</h2>
          {appointments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              لا توجد مواعيد لليوم
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(timeline)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([hour, apps]) => (
                  <div key={hour} className="flex gap-4">
                    <div className="w-16 shrink-0 text-sm font-bold text-primary">
                      {formatTime(hour + ":00")}
                    </div>
                    <div className="flex-1 space-y-2 border-r-2 border-primary/20 pe-4">
                      {apps.map((a) => (
                        <div
                          key={a.id}
                          className="rounded-lg bg-primary-soft/50 p-3 text-sm"
                        >
                          <p className="font-semibold">{a.patient_name}</p>
                          {a.complaint && (
                            <p className="text-xs text-muted-foreground">{a.complaint}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Card>
      </div>

      {/* Activity feed */}
      <Card className="p-5 shadow-card border-0">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <ActivityIcon className="h-5 w-5 text-accent" />
          آخر النشاطات
        </h2>
        {activity.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">لا توجد نشاطات</p>
        ) : (
          <ul className="space-y-2">
            {activity.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 border-b border-border/50 py-2 last:border-0"
              >
                <span className="text-sm">{a.description}</span>
                <span className="text-xs text-muted-foreground">{timeAgo(a.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
