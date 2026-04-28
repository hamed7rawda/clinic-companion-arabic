import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Pill, Clock, Plus, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { logActivity } from "@/lib/clinic-utils";
import { generatePrescriptionPDF } from "@/lib/pdf";
import { triggerN8nEvent } from "@/lib/n8n";

interface Prescription {
  id: string;
  patient_name: string;
  medication_name: string;
  dosage: string | null;
  reminder_active: boolean;
  created_at: string;
}

const Prescriptions = () => {
  const [items, setItems] = useState<Prescription[]>([]);
  const [open, setOpen] = useState(false);
  const [patient, setPatient] = useState("");
  const [med, setMed] = useState("");
  const [dosage, setDosage] = useState("");
  const [notes, setNotes] = useState("");

  const load = async () => {
    const { data } = await supabase.from("prescriptions").select("*").order("created_at", { ascending: false });
    setItems((data as Prescription[]) ?? []);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("rx-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "prescriptions" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const toggle = async (p: Prescription) => {
    const next = !p.reminder_active;
    const { error } = await supabase.from("prescriptions").update({ reminder_active: next }).eq("id", p.id);
    if (error) return toast.error(error.message);
    await logActivity(supabase, "reminder_toggle",
      `${next ? "تفعيل" : "إيقاف"} تذكير ${p.medication_name} لـ ${p.patient_name}`);
    toast.success(next ? "تم تفعيل التذكير" : "تم إيقاف التذكير");
  };

  const handleSave = async () => {
    if (!patient.trim() || !med.trim()) return toast.error("الاسم والدواء مطلوبان");
    const { error } = await supabase.from("prescriptions").insert({
      patient_name: patient.trim(), medication_name: med.trim(),
      dosage: dosage.trim() || null, reminder_active: true,
    });
    if (error) return toast.error(error.message);
    toast.success("تم حفظ الوصفة");
    triggerN8nEvent("prescription_ready", { patient_name: patient.trim(), medication: med.trim(), dosage });
    setPatient(""); setMed(""); setDosage(""); setNotes(""); setOpen(false);
  };

  const handlePrint = async (p: Prescription) => {
    const { data: cfg } = await supabase.from("clinic_config")
      .select("doctor_name,specialty").maybeSingle();
    generatePrescriptionPDF({
      doctorName: cfg?.doctor_name ?? "Doctor",
      specialty: cfg?.specialty ?? undefined,
      patientName: p.patient_name,
      date: new Date(p.created_at).toLocaleDateString("en-CA"),
      medications: [{ name: p.medication_name, dosage: p.dosage ?? undefined }],
    });
  };

  const handleDelete = async (id: string) => {
    await supabase.from("prescriptions").delete().eq("id", id);
    toast.success("تم الحذف");
  };

  const active = items.filter((i) => i.reminder_active).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="الأدوية والوصفات"
        description="إدارة الوصفات الطبية وتذكيرات المرضى وطباعة PDF"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 gradient-primary text-primary-foreground hover:opacity-90">
                <Plus className="h-4 w-4" /> وصفة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader><DialogTitle>إنشاء وصفة طبية</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>اسم المريض</Label>
                  <Input value={patient} onChange={(e) => setPatient(e.target.value)} maxLength={100} />
                </div>
                <div className="space-y-2">
                  <Label>اسم الدواء</Label>
                  <Input value={med} onChange={(e) => setMed(e.target.value)} maxLength={120} />
                </div>
                <div className="space-y-2">
                  <Label>الجرعة</Label>
                  <Input value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="مثال: قرص × 3 مرات يومياً" maxLength={120} />
                </div>
                <div className="space-y-2">
                  <Label>ملاحظات</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
                </div>
              </div>
              <DialogFooter><Button onClick={handleSave}>حفظ</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5 shadow-card border-0">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Pill className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الوصفات</p>
              <p className="text-2xl font-bold">{items.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 shadow-card border-0">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/15 text-success">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">تذكيرات مفعلة</p>
              <p className="text-2xl font-bold">{active}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 shadow-card border-0 bg-primary-soft/40">
          <p className="text-xs text-muted-foreground">جدول التذكيرات</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge className="bg-primary text-primary-foreground hover:bg-primary">8 ص</Badge>
            <Badge className="bg-primary text-primary-foreground hover:bg-primary">2 م</Badge>
            <Badge className="bg-primary text-primary-foreground hover:bg-primary">8 م</Badge>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">3 مرات يومياً</p>
        </Card>
      </div>

      <Card className="shadow-card border-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">المريض</TableHead>
                <TableHead className="text-right">الدواء</TableHead>
                <TableHead className="text-right">الجرعة</TableHead>
                <TableHead className="text-right">التذكير</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    لا توجد وصفات
                  </TableCell>
                </TableRow>
              ) : (
                items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.patient_name}</TableCell>
                    <TableCell>{p.medication_name}</TableCell>
                    <TableCell className="text-muted-foreground">{p.dosage ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={p.reminder_active} onCheckedChange={() => toggle(p)} />
                        <span className="text-xs text-muted-foreground">
                          {p.reminder_active ? "نشط" : "موقوف"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handlePrint(p)} title="طباعة PDF">
                          <Printer className="h-4 w-4 text-primary" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent dir="rtl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>حذف الوصفة؟</AlertDialogTitle>
                              <AlertDialogDescription>لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(p.id)}>حذف</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default Prescriptions;
