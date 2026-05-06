import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
import { Search, UserPlus, Phone, Calendar, AlertTriangle, Mic } from "lucide-react";
import { toast } from "sonner";
import { formatDate, logActivity } from "@/lib/clinic-utils";
import { z } from "zod";

interface Patient {
  id: string;
  chat_id: string | null;
  name: string;
  age: number | null;
  phone: string | null;
  allergies: string | null;
  address: string | null;
  gender: string | null;
  medical_history: string | null;
  register_date: string;
}

const patientSchema = z.object({
  name: z.string().trim().min(2, "الاسم قصير جداً").max(100, "الاسم طويل"),
  age: z.coerce.number().int().min(0).max(130).optional().or(z.literal(NaN)),
  phone: z.string().trim().max(20).optional(),
  address: z.string().trim().max(200).optional(),
  gender: z.string().trim().max(20).optional(),
  medical_history: z.string().trim().max(1000).optional(),
  allergies: z.string().trim().max(500).optional(),
});

const Patients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", age: "", phone: "", address: "", gender: "", medical_history: "", allergies: "" });
  const [duplicates, setDuplicates] = useState<Patient[]>([]);
  const [forceUnique, setForceUnique] = useState(false);

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

  // Detect possible duplicates while typing
  useEffect(() => {
    const n = form.name.trim();
    if (n.length < 2) { setDuplicates([]); return; }
    const exact = patients.filter((p) => p.name.trim() === n || p.name.includes(n) || n.includes(p.name));
    setDuplicates(exact);
    setForceUnique(false);
  }, [form.name, patients]);

  const openPatient = (p: Patient) => navigate(`/patient/${p.id}`);

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
    if (duplicates.length > 0 && !forceUnique) {
      toast.error("يوجد مريض بنفس الاسم. أضف تمييزاً للاسم (مثل اسم الأب) أو أكد المتابعة.");
      return;
    }
    const ageVal = parseInt(form.age, 10);
    const { data: inserted, error } = await supabase.from("patients").insert({
      name: form.name.trim(),
      age: isNaN(ageVal) ? null : ageVal,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      gender: form.gender.trim() || null,
      medical_history: form.medical_history.trim() || null,
      allergies: form.allergies.trim() || null,
    }).select("id").maybeSingle();
    if (error) return toast.error(error.message);
    await logActivity(supabase, "patient_added", `تم تسجيل مريض جديد: ${form.name}`);
    toast.success("تمت إضافة المريض");
    setForm({ name: "", age: "", phone: "", address: "", gender: "", medical_history: "", allergies: "" });
    setAddOpen(false);
    load();
    if (inserted?.id) navigate(`/patient/${inserted.id}`);
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
                    placeholder="مثال: أحمد محمد علي"
                  />
                  {duplicates.length > 0 && (
                    <div className="mt-2 rounded-md border border-warning/40 bg-warning/10 p-2 text-xs space-y-1">
                      <p className="font-semibold text-warning-foreground flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" /> يوجد {duplicates.length} مريض باسم مشابه:
                      </p>
                      <ul className="ps-4 list-disc text-muted-foreground">
                        {duplicates.slice(0, 3).map((d) => (
                          <li key={d.id}>{d.name}{d.phone ? ` — ${d.phone}` : ""}</li>
                        ))}
                      </ul>
                      <p className="text-muted-foreground">أضف تمييزاً للاسم (اسم الأب/اللقب) أو أكد المتابعة.</p>
                      <label className="flex items-center gap-2 cursor-pointer mt-1">
                        <input type="checkbox" checked={forceUnique} onChange={(e) => setForceUnique(e.target.checked)} />
                        <span>أؤكد أنه شخص مختلف رغم تشابه الاسم</span>
                      </label>
                    </div>
                  )}
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
                <div>
                  <Label>الجنس</Label>
                  <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                    <SelectTrigger><SelectValue placeholder="اختر الجنس" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">ذكر</SelectItem>
                      <SelectItem value="female">أنثى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label>العنوان</Label>
                  <Input
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    maxLength={200}
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
                <div className="sm:col-span-2">
                  <Label>التاريخ الطبي</Label>
                  <Textarea
                    value={form.medical_history}
                    onChange={(e) => setForm({ ...form, medical_history: e.target.value })}
                    placeholder="الأمراض المزمنة، العمليات السابقة، ..."
                    maxLength={1000}
                    rows={3}
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
              className="p-4 shadow-card hover:shadow-elevated transition-smooth cursor-pointer border-0 group"
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
                <Mic className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-smooth" />
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
    </div>
  );
};

export default Patients;
