import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Appt { id: string; patient_name: string; patient_id: string | null; date: string; time: string; status: string; complaint: string | null; }

const NurseCheckIn = () => {
  const [appts, setAppts] = useState<Appt[]>([]);
  const today = new Date().toISOString().slice(0, 10);

  const load = () => {
    supabase.from("appointments").select("*").eq("date", today).order("time").then(({ data }) => setAppts((data ?? []) as any));
  };
  useEffect(load, [today]);

  const checkIn = async (a: Appt) => {
    const { error } = await supabase.from("queue").insert({
      patient_id: a.patient_id, patient_name: a.patient_name, position: Date.now() % 1000, status: "waiting",
    });
    if (error) { toast.error("فشل تسجيل الدخول"); return; }
    await supabase.from("appointments").update({ status: "checked_in" }).eq("id", a.id);
    toast.success(`تم تسجيل دخول ${a.patient_name}`);
    load();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="تسجيل دخول المرضى" description="مواعيد اليوم — اضغط لتسجيل وصول المريض إلى قائمة الانتظار" />
      <Card className="shadow-card border-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الوقت</TableHead>
                <TableHead className="text-right">المريض</TableHead>
                <TableHead className="text-right">الشكوى</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appts.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">لا توجد مواعيد اليوم</TableCell></TableRow>
              ) : appts.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono">{a.time?.slice(0, 5)}</TableCell>
                  <TableCell>{a.patient_name}</TableCell>
                  <TableCell className="max-w-xs truncate">{a.complaint ?? "—"}</TableCell>
                  <TableCell>
                    {a.status === "checked_in"
                      ? <Badge className="bg-success/15 text-success border-success/30" variant="outline">تم الدخول</Badge>
                      : <Badge variant="outline">{a.status}</Badge>}
                  </TableCell>
                  <TableCell>
                    {a.status !== "checked_in" && (
                      <Button size="sm" onClick={() => checkIn(a)}><CheckCircle2 className="h-4 w-4" /> تسجيل دخول</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};
export default NurseCheckIn;
