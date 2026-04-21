import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";
import { formatDate } from "@/lib/clinic-utils";

interface Visit {
  id: string;
  patient_name: string;
  visit_date: string;
  diagnosis: string | null;
  prescriptions: string | null;
  follow_up_status: "pending" | "sent";
}

const MedicalHistory = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    supabase
      .from("medical_history")
      .select("*")
      .order("visit_date", { ascending: false })
      .then(({ data }) => setVisits((data as Visit[]) ?? []));
  }, []);

  const filtered = visits.filter((v) => {
    if (search && !v.patient_name.includes(search)) return false;
    if (date && v.visit_date !== date) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="السجلات الطبية"
        description="جميع زيارات المرضى وتشخيصاتهم"
      />

      <Card className="p-4 shadow-card border-0 grid gap-3 sm:grid-cols-2">
        <div className="relative">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث باسم المريض..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pe-10"
          />
        </div>
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
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    لا توجد سجلات مطابقة
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.patient_name}</TableCell>
                    <TableCell>{formatDate(v.visit_date)}</TableCell>
                    <TableCell>{v.diagnosis ?? "—"}</TableCell>
                    <TableCell>{v.prescriptions ?? "—"}</TableCell>
                    <TableCell>
                      {v.follow_up_status === "sent" ? (
                        <Badge className="bg-success/15 text-success border-success/30 hover:bg-success/20" variant="outline">
                          مُرسل
                        </Badge>
                      ) : (
                        <Badge className="bg-warning/15 text-warning-foreground border-warning/30 hover:bg-warning/20" variant="outline">
                          قيد الانتظار
                        </Badge>
                      )}
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

export default MedicalHistory;
