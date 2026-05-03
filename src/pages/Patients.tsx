import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, UserPlus, Phone, Calendar, AlertTriangle, Pill } from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatTime, logActivity } from "@/lib/clinic-utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { z } from "zod";

interface Patient {
  id: string;
  chat_id: string | null;
  name: string;
  age: number | null;
  phone: string | null;
  allergies: string | null;
  register_date: string;
}

const patientSchema = z.object({
  name: z.string().trim().min(2, "الاسم قصير جداً").max(100, "الاسم طويل"),
  age: z.coerce.number().int().min(0).max(130).optional().or(z.literal(NaN)),
  phone: z.string().trim().max(20).optional(),
  chat_id: z.string().trim().max(50).optional(),
  allergies: z.string().trim().max(500).optional(),
});

const Patients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Patient | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [appts, setAppts] = useState<any[]>([]);
  const [meds, setMeds] = useState<any[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", age: "", phone: "", chat_id: "", allergies: "" });

  const load = async () => {
    const { data } = await supabase
      .from("patients")
      .select("*")
      .order("register_date", { ascending: false });
    setPatients(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const openPatient = async (p: Patient) => {
    setSelected(p);
    const [{ data: a }, { data: h }, { data: m }] = await Promise.all([
      supabase.from("appointments").select("*").eq("patient_name", p.name).order("date", { ascending: false }),
      supabase.from("medical_history").select("*").eq("patient_name", p.name).order("visit_date", { ascending: false }),
      supabase.from("prescriptions").select("*").eq("patient_name", p.name),
    ]);
    setAppts(a ?? []);
    setHistory(h ?? []);
    setMeds(m ?? []);
  };

  const filtered = patients.filter(
    (p) =>
      p.name.includes(search) ||
      (p.phone ?? "").includes(search) ||
      (p.chat_id ?? "").includes(search)
  );

  const handleAdd = async () => {
    const result = patientSchema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    const ageVal = parseInt(form.age, 10);
    const { error } = await supabase.from("patients").insert({
      name: form.name.trim(),
      age: isNaN(ageVal) ? null : ageVal,
      phone: form.phone.trim() || null,
      chat_id: form.chat_id.trim() || null,
      allergies: form.allergies.trim() || null,
    });
    if (error) return toast.error(error.message);
    await logActivity(supabase, "patient_added", `تم تسجيل مريض جديد: ${form.name}`);
    toast.success("تمت إضافة المريض");
    setForm({ name: "", age: "", phone: "", chat_id: "", allergies: "" });
    setAddOpen(false);
    load();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="سجل المرضى"
        description={`${patients.length} مريض مسجل في النظام`}
        action={
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 gradient-primary text-primary-foreground hover:opacity-90">
                <UserPlus className="h-4 w-4" /> مريض جديد
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle>تسجيل مريض جديد</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>الاسم الكامل *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    maxLength={100}
                  />
                </div>
                <div>
                  <Label>العمر</Label>
                  <Input
                    type="number"
                    min="0"
                    max="130"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                  />
                </div>
                <div>
                  <Label>الهاتف</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    maxLength={20}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>معرف تيليجرام (Chat ID)</Label>
                  <Input
                    value={form.chat_id}
                    onChange={(e) => setForm({ ...form, chat_id: e.target.value })}
                    maxLength={50}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>الحساسية الدوائية</Label>
                  <Input
                    value={form.allergies}
                    onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                    placeholder="مثال: بنسلين، سلفا"
                    maxLength={500}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAdd}>تسجيل</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="p-4 shadow-card border-0">
        <Input
          startIcon={<Search className="h-4 w-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث بالاسم أو الهاتف أو المعرف..."
        />
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center shadow-card border-dashed">
          <p className="text-sm text-muted-foreground">
            {search ? "لا توجد نتائج مطابقة" : "ابدأ بتسجيل أول مريض"}
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <Card
              key={p.id}
              onClick={() => openPatient(p)}
              className="p-4 shadow-card hover:shadow-elevated transition-smooth cursor-pointer border-0"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full gradient-accent text-accent-foreground font-bold">
                    {p.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.age ? `${p.age} سنة` : "بدون عمر"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1.5 text-xs">
                {p.phone && (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" /> {p.phone}
                  </p>
                )}
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" /> سُجِّل {formatDate(p.register_date)}
                </p>
                {p.allergies && p.allergies !== "لا يوجد" && (
                  <p className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5" /> {p.allergies}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent dir="rtl" side="left" className="w-full sm:max-w-xl overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="text-xl">{selected.name}</SheetTitle>
                <SheetDescription>
                  {selected.age ? `${selected.age} سنة` : ""} • {selected.phone ?? "—"}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {selected.allergies && (
                  <Card className="p-3 border-destructive/30 bg-destructive/5">
                    <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
                      <AlertTriangle className="h-4 w-4" /> الحساسية: {selected.allergies}
                    </p>
                  </Card>
                )}

                <div>
                  <h3 className="mb-2 font-semibold">سجل المواعيد ({appts.length})</h3>
                  {appts.length === 0 ? (
                    <p className="text-xs text-muted-foreground">لا توجد مواعيد</p>
                  ) : (
                    <ul className="space-y-2">
                      {appts.map((a) => (
                        <li key={a.id} className="rounded-lg border p-2 text-sm flex items-center justify-between">
                          <span>{formatDate(a.date)} • {formatTime(a.time)}</span>
                          <StatusBadge status={a.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">السجل الطبي ({history.length})</h3>
                  {history.length === 0 ? (
                    <p className="text-xs text-muted-foreground">لا توجد سجلات</p>
                  ) : (
                    <ul className="space-y-2">
                      {history.map((h) => (
                        <li key={h.id} className="rounded-lg border p-3 text-sm">
                          <p className="font-medium">{formatDate(h.visit_date)}</p>
                          {h.diagnosis && <p className="text-xs text-muted-foreground mt-1">التشخيص: {h.diagnosis}</p>}
                          {h.prescriptions && <p className="text-xs text-muted-foreground">الوصفة: {h.prescriptions}</p>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h3 className="mb-2 flex items-center gap-2 font-semibold">
                    <Pill className="h-4 w-4 text-accent" /> الأدوية ({meds.length})
                  </h3>
                  {meds.length === 0 ? (
                    <p className="text-xs text-muted-foreground">لا توجد أدوية نشطة</p>
                  ) : (
                    <ul className="space-y-2">
                      {meds.map((m) => (
                        <li key={m.id} className="rounded-lg border p-2 text-sm">
                          <p className="font-medium">{m.medication_name}</p>
                          <p className="text-xs text-muted-foreground">{m.dosage}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Patients;
