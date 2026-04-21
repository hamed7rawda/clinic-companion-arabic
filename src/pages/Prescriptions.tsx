import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pill, Clock } from "lucide-react";
import { toast } from "sonner";
import { logActivity } from "@/lib/clinic-utils";

interface Prescription {
  id: string;
  patient_name: string;
  medication_name: string;
  dosage: string | null;
  reminder_active: boolean;
}

const Prescriptions = () => {
  const [items, setItems] = useState<Prescription[]>([]);

  const load = async () => {
    const { data } = await supabase.from("prescriptions").select("*").order("created_at", { ascending: false });
    setItems((data as Prescription[]) ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (p: Prescription) => {
    const next = !p.reminder_active;
    const { error } = await supabase
      .from("prescriptions")
      .update({ reminder_active: next })
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    await logActivity(
      supabase,
      "reminder_toggle",
      `${next ? "تفعيل" : "إيقاف"} تذكير ${p.medication_name} لـ ${p.patient_name}`
    );
    toast.success(next ? "تم تفعيل التذكير" : "تم إيقاف التذكير");
    load();
  };

  const active = items.filter((i) => i.reminder_active).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="الأدوية والتذكيرات"
        description="إدارة الوصفات الطبية وتذكيرات المرضى"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5 shadow-card border-0">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Pill className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الأدوية</p>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
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
                        <Switch
                          checked={p.reminder_active}
                          onCheckedChange={() => toggle(p)}
                        />
                        <span className="text-xs text-muted-foreground">
                          {p.reminder_active ? "نشط" : "موقوف"}
                        </span>
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
