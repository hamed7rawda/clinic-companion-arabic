import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { RatingStars } from "@/components/shared/RatingStars";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, X, RefreshCw, CalendarDays, List, Plus, LogIn } from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatTime, logActivity } from "@/lib/clinic-utils";
import { ar } from "date-fns/locale";

interface Appointment {
  id: string;
  patient_id: string | null;
  patient_name: string;
  date: string;
  time: string;
  complaint: string | null;
  status: "booked" | "completed" | "cancelled" | "rescheduled" | "checked_in";
  rating: number | null;
}

const Appointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [view, setView] = useState<"table" | "calendar">("table");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [reschedOpen, setReschedOpen] = useState(false);
  const [reschedTarget, setReschedTarget] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ patient_name: "", date: "", time: "", complaint: "" });

  const submitAdd = async () => {
    const name = addForm.patient_name.trim();
    if (!name || !addForm.date || !addForm.time) {
      toast.error("الاسم والتاريخ والوقت مطلوبة");
      return;
    }
    const { error } = await supabase.from("appointments").insert({
      patient_name: name,
      date: addForm.date,
      time: addForm.time,
      complaint: addForm.complaint || null,
      status: "booked",
    });
    if (error) return toast.error(error.message);
    await logActivity(supabase, "appointment_booked", `تم حجز موعد لـ ${name}`);
    toast.success("تمت إضافة الموعد");
    setAddForm({ patient_name: "", date: "", time: "", complaint: "" });
    setAddOpen(false);
  };

  const load = async () => {
    const { data } = await supabase
      .from("appointments")
      .select("*")
      .order("date", { ascending: false })
      .order("time");
    setAppointments((data as Appointment[]) ?? []);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("appointments-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const filtered = appointments.filter((a) => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (selectedDate) {
      const d = selectedDate.toISOString().split("T")[0];
      if (a.date !== d) return false;
    }
    return true;
  });

  const updateStatus = async (id: string, status: Appointment["status"], name: string) => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    const labels = {
      completed: "إكمال",
      cancelled: "إلغاء",
      booked: "حجز",
      rescheduled: "إعادة جدولة",
    };
    await logActivity(supabase, `appointment_${status}`, `تم ${labels[status]} موعد ${name}`);
    toast.success("تم تحديث الموعد");
  };

  const checkIn = async (a: Appointment) => {
    const { error: qErr } = await supabase.from("queue").insert({
      patient_id: a.patient_id, patient_name: a.patient_name,
      position: Date.now() % 1000, status: "waiting",
    });
    if (qErr) { toast.error("فشل تسجيل الدخول: " + qErr.message); return; }
    await supabase.from("appointments").update({ status: "checked_in" }).eq("id", a.id);
    await logActivity(supabase, "patient_checked_in", `تم تسجيل دخول ${a.patient_name} لطابور الانتظار`);
    toast.success(`تم تسجيل دخول ${a.patient_name}`);
  };

  const openReschedule = (a: Appointment) => {
    setReschedTarget(a);
    setNewDate(a.date);
    setNewTime(a.time?.slice(0, 5) ?? "");
    setReschedOpen(true);
  };

  const submitReschedule = async () => {
    if (!reschedTarget || !newDate || !newTime) {
      toast.error("الرجاء اختيار التاريخ والوقت");
      return;
    }
    const { error } = await supabase
      .from("appointments")
      .update({ date: newDate, time: newTime, status: "rescheduled" })
      .eq("id", reschedTarget.id);
    if (error) return toast.error(error.message);
    await logActivity(
      supabase,
      "appointment_rescheduled",
      `تمت إعادة جدولة موعد ${reschedTarget.patient_name}`
    );
    toast.success("تمت إعادة الجدولة");
    setReschedOpen(false);
  };

  // Highlight days that have appointments on the calendar
  const datesWithAppointments = Array.from(
    new Set(appointments.map((a) => a.date))
  ).map((d) => new Date(d));

  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة المواعيد"
        description="عرض وإدارة جميع مواعيد العيادة"
        action={
          <div className="flex items-center gap-2">
            <Button onClick={() => setAddOpen(true)} className="gap-2 gradient-primary text-primary-foreground hover:opacity-90">
              <Plus className="h-4 w-4" /> إضافة موعد
            </Button>
            <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
              <Button
                variant={view === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("table")}
                className="gap-1"
              >
                <List className="h-4 w-4" /> جدول
              </Button>
              <Button
                variant={view === "calendar" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("calendar")}
                className="gap-1"
              >
                <CalendarDays className="h-4 w-4" /> تقويم
              </Button>
            </div>
          </div>
        }
      />

      <Card className="p-4 shadow-card border-0 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <Label className="mb-1 block text-xs">تصفية بالحالة</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="booked">محجوز</SelectItem>
              <SelectItem value="completed">مكتمل</SelectItem>
              <SelectItem value="cancelled">ملغي</SelectItem>
              <SelectItem value="rescheduled">معاد جدولته</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {selectedDate && (
          <Button variant="outline" size="sm" onClick={() => setSelectedDate(undefined)}>
            مسح تصفية التاريخ ({formatDate(selectedDate)})
          </Button>
        )}
      </Card>

      {view === "calendar" ? (
        <Card className="p-5 shadow-card border-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={ar}
            modifiers={{ hasAppt: datesWithAppointments }}
            modifiersClassNames={{
              hasAppt: "bg-primary-soft text-primary font-bold",
            }}
            className="mx-auto"
          />
        </Card>
      ) : null}

      <Card className="shadow-card border-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">المريض</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">الوقت</TableHead>
                <TableHead className="text-right">الشكوى</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">التقييم</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    لا توجد مواعيد مطابقة
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.patient_name}</TableCell>
                    <TableCell>{formatDate(a.date)}</TableCell>
                    <TableCell>{formatTime(a.time)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{a.complaint ?? "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={a.status} />
                    </TableCell>
                    <TableCell>
                      <RatingStars rating={a.rating} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {a.status === "booked" && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-success hover:bg-success/10"
                              onClick={() => updateStatus(a.id, "completed", a.patient_name)}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 text-destructive hover:bg-destructive/10"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent dir="rtl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>إلغاء الموعد؟</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    سيتم إلغاء موعد {a.patient_name}. لا يمكن التراجع.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>تراجع</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      updateStatus(a.id, "cancelled", a.patient_name)
                                    }
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    تأكيد الإلغاء
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-warning hover:bg-warning/10"
                              onClick={() => openReschedule(a)}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={reschedOpen} onOpenChange={setReschedOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>إعادة جدولة الموعد</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>التاريخ الجديد</Label>
              <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
            </div>
            <div>
              <Label>الوقت الجديد</Label>
              <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={submitReschedule}>تأكيد</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة موعد جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>اسم المريض</Label>
              <Input
                value={addForm.patient_name}
                onChange={(e) => setAddForm({ ...addForm, patient_name: e.target.value })}
                placeholder="مثال: أحمد محمد"
                maxLength={100}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>التاريخ</Label>
                <Input type="date" value={addForm.date} onChange={(e) => setAddForm({ ...addForm, date: e.target.value })} />
              </div>
              <div>
                <Label>الوقت</Label>
                <Input type="time" value={addForm.time} onChange={(e) => setAddForm({ ...addForm, time: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>الشكوى (اختياري)</Label>
              <Textarea
                value={addForm.complaint}
                onChange={(e) => setAddForm({ ...addForm, complaint: e.target.value })}
                placeholder="وصف موجز للشكوى"
                maxLength={500}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={submitAdd}>إضافة الموعد</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Appointments;
