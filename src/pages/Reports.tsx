import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/shared/RatingStars";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Download, FileBarChart } from "lucide-react";
import { formatDate, formatTime } from "@/lib/clinic-utils";
import { toast } from "sonner";

interface Appt {
  id: string;
  patient_name: string;
  date: string;
  time: string;
  status: "booked" | "completed" | "cancelled" | "rescheduled";
  rating: number | null;
}

const Reports = () => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [appts, setAppts] = useState<Appt[]>([]);

  useEffect(() => {
    supabase
      .from("appointments")
      .select("*")
      .eq("date", date)
      .order("time")
      .then(({ data }) => setAppts((data as Appt[]) ?? []));
  }, [date]);

  const stats = useMemo(() => {
    const total = appts.length;
    const booked = appts.filter((a) => a.status === "booked").length;
    const completed = appts.filter((a) => a.status === "completed").length;
    const cancelled = appts.filter((a) => a.status === "cancelled").length;
    const rescheduled = appts.filter((a) => a.status === "rescheduled").length;
    const ratings = appts.filter((a) => a.rating).map((a) => a.rating as number);
    const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    return { total, booked, completed, cancelled, rescheduled, avgRating };
  }, [appts]);

  const exportPDF = () => {
    toast.info("جارٍ تجهيز التقرير... استخدم Ctrl+P / Cmd+P للطباعة");
    setTimeout(() => window.print(), 300);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="التقارير اليومية"
        description="ملخص الأداء اليومي للعيادة"
        action={
          <Button onClick={exportPDF} variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> تصدير PDF
          </Button>
        }
      />

      <Card className="p-4 shadow-card border-0 flex flex-wrap items-end gap-3">
        <div>
          <Label>تاريخ التقرير</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <Badge className="bg-primary-soft text-primary border-0 px-3 py-1.5">
          {formatDate(date, "EEEE d MMMM yyyy")}
        </Badge>
      </Card>

      <Card className="p-6 shadow-elevated border-0 gradient-soft">
        <div className="mb-6 flex items-center gap-3">
          <FileBarChart className="h-7 w-7 text-primary" />
          <div>
            <h2 className="text-xl font-bold">تقرير اليوم</h2>
            <p className="text-sm text-muted-foreground">{formatDate(date)}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "الإجمالي", value: stats.total, color: "text-foreground" },
            { label: "محجوز", value: stats.booked, color: "text-success" },
            { label: "مكتمل", value: stats.completed, color: "text-muted-foreground" },
            { label: "ملغي", value: stats.cancelled, color: "text-destructive" },
            { label: "معاد جدولته", value: stats.rescheduled, color: "text-warning" },
          ].map((s) => (
            <Card key={s.label} className="p-4 text-center border-0 bg-card/80">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`mt-1 text-3xl font-bold ${s.color}`}>{s.value}</p>
            </Card>
          ))}
        </div>

        <Card className="mt-4 p-4 border-0 bg-card/80 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">متوسط التقييم</p>
            <p className="text-2xl font-bold mt-1">
              {stats.avgRating.toFixed(1)}
              <span className="text-sm text-muted-foreground"> / 5</span>
            </p>
          </div>
          <RatingStars rating={Math.round(stats.avgRating)} size={22} />
        </Card>

        <div className="mt-6">
          <h3 className="mb-3 font-semibold">قائمة المرضى</h3>
          {appts.length === 0 ? (
            <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
              لا توجد مواعيد في هذا اليوم
            </p>
          ) : (
            <ul className="space-y-2">
              {appts.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-card/80 p-3"
                >
                  <div>
                    <span className="font-medium">{a.patient_name}</span>
                    <span className="ms-2 text-xs text-muted-foreground">{formatTime(a.time)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <RatingStars rating={a.rating} />
                    <StatusBadge status={a.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Reports;
