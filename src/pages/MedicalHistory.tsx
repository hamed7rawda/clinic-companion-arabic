import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, Mic, Sparkles } from "lucide-react";
import { formatDate } from "@/lib/clinic-utils";
import { toast } from "sonner";

interface Visit {
  id: string;
  patient_name: string;
  visit_date: string;
  diagnosis: string | null;
  prescriptions: string | null;
  follow_up_status: "pending" | "sent";
}

interface PatientRow { id: string; name: string; phone: string | null; }

const MedicalHistory = () => {
  const navigate = useNavigate();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");

  // Start session form
  const [patientQuery, setPatientQuery] = useState("");
  const [matches, setMatches] = useState<PatientRow[]>([]);

  useEffect(() => {
    supabase.from("medical_history").select("*").order("visit_date", { ascending: false })
      .then(({ data }) => setVisits((data as Visit[]) ?? []));
  }, []);

  useEffect(() => {
    if (patientQuery.length < 2) { setMatches([]); return; }
    const t = setTimeout(() => {
      supabase.from("patients").select("id,name,phone").ilike("name", `%${patientQuery}%`).limit(6)
        .then(({ data }) => setMatches((data ?? []) as any));
    }, 200);
    return () => clearTimeout(t);
  }, [patientQuery]);

  const startSession = (p: PatientRow) => navigate(`/patient/${p.id}`);

  const startNewPatient = async () => {
    if (!patientQuery.trim()) { toast.error("اكتب اسم المريض"); return; }
    const { data, error } = await supabase.from("patients").insert({ name: patientQuery.trim() }).select("id").maybeSingle();
    if (error || !data) { toast.error("فشل إنشاء المريض"); return; }
    navigate(`/patient/${data.id}`);
  };

  const filtered = visits.filter((v) => {
    if (search && !v.patient_name.includes(search)) return false;
    if (date && v.visit_date !== date) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader title="السجلات الطبية" description="ابدأ جلسة كشف جديدة أو استعرض السجلات السابقة" />

      <Card className="p-5 shadow-card border-0 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-bold">بدء جلسة كشف جديدة</h3>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="اكتب اسم المريض..."
            value={patientQuery}
            onChange={(e) => setPatientQuery(e.target.value)}
          />
          <Button onClick={startNewPatient} disabled={!patientQuery.trim()}>
            <Mic className="h-4 w-4" /> بدء الجلسة (مريض جديد)
          </Button>
        </div>
        {matches.length > 0 && (
          <div className="rounded-md border divide-y">
            {matches.map((p) => (
              <button key={p.id} onClick={() => startSession(p)}
                className="w-full text-right p-3 hover:bg-muted/50 transition-smooth flex justify-between items-center">
                <div>
                  <p className="font-semibold text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.phone ?? "—"}</p>
                </div>
                <Badge variant="outline">ابدأ الجلسة</Badge>
              </button>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4 shadow-card border-0 grid gap-3 sm:grid-cols-2">
        <Input startIcon={<Search className="h-4 w-4" />} placeholder="ابحث باسم المريض..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Card>

      <Card className="shadow-card border-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">المريض</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">التشخيص</TableHead>
                <TableHead className="text-right">الوصفات</TableHead>
                <TableHead className="text-right">المتابعة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">لا توجد سجلات مطابقة</TableCell></TableRow>
              ) : filtered.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.patient_name}</TableCell>
                  <TableCell>{formatDate(v.visit_date)}</TableCell>
                  <TableCell>{v.diagnosis ?? "—"}</TableCell>
                  <TableCell>{v.prescriptions ?? "—"}</TableCell>
                  <TableCell>
                    {v.follow_up_status === "sent" ? (
                      <Badge className="bg-success/15 text-success border-success/30 hover:bg-success/20" variant="outline">مُرسل</Badge>
                    ) : (
                      <Badge className="bg-warning/15 text-warning-foreground border-warning/30 hover:bg-warning/20" variant="outline">قيد الانتظار</Badge>
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
export default MedicalHistory;
