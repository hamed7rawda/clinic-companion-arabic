import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/shared/StatCard";
import { Users, Calendar, CheckCircle2, DollarSign } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";

interface DailyPoint { date: string; patients: number; visits: number; }
interface MonthlyPoint { month: string; revenue: number; }

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--success))", "hsl(var(--destructive))"];

export default function Statistics() {
  const [daily, setDaily] = useState<DailyPoint[]>([]);
  const [monthly, setMonthly] = useState<MonthlyPoint[]>([]);
  const [statusBreak, setStatusBreak] = useState<Array<{ name: string; value: number }>>([]);
  const [totals, setTotals] = useState({ patients: 0, appointments: 0, completed: 0, revenue: 0 });

  useEffect(() => { load(); }, []);

  const load = async () => {
    const since30 = new Date(); since30.setDate(since30.getDate() - 29);
    const sinceStr = since30.toISOString().split("T")[0];

    const [{ data: appts }, { count: pat }, { data: invoices }] = await Promise.all([
      supabase.from("appointments").select("date,status,patient_name").gte("date", sinceStr),
      supabase.from("patients").select("*", { count: "exact", head: true }),
      supabase.from("invoices").select("invoice_date,paid_amount,total"),
    ]);

    // Build daily for last 30 days
    const dayMap = new Map<string, { patients: Set<string>; visits: number }>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(); d.setDate(d.getDate() - (29 - i));
      dayMap.set(d.toISOString().split("T")[0], { patients: new Set(), visits: 0 });
    }
    (appts ?? []).forEach((a: any) => {
      const e = dayMap.get(a.date);
      if (e) {
        e.patients.add(a.patient_name);
        if (a.status === "completed") e.visits++;
      }
    });
    setDaily(Array.from(dayMap.entries()).map(([date, v]) => ({
      date: date.slice(5),
      patients: v.patients.size,
      visits: v.visits,
    })));

    // Status breakdown
    const sb: Record<string, number> = {};
    (appts ?? []).forEach((a: any) => { sb[a.status] = (sb[a.status] ?? 0) + 1; });
    const statusLabels: Record<string, string> = {
      booked: "محجوز", completed: "مكتمل", cancelled: "ملغي", no_show: "لم يحضر",
    };
    setStatusBreak(Object.entries(sb).map(([k, v]) => ({ name: statusLabels[k] ?? k, value: v })));

    // Monthly revenue last 6 months
    const monthMap = new Map<string, number>();
    for (let i = 0; i < 6; i++) {
      const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
      monthMap.set(d.toISOString().slice(0, 7), 0);
    }
    (invoices ?? []).forEach((inv: any) => {
      const m = inv.invoice_date.slice(0, 7);
      if (monthMap.has(m)) monthMap.set(m, (monthMap.get(m) ?? 0) + Number(inv.paid_amount));
    });
    setMonthly(Array.from(monthMap.entries()).map(([month, revenue]) => ({ month, revenue })));

    const completed = (appts ?? []).filter((a: any) => a.status === "completed").length;
    const revenue = (invoices ?? []).reduce((s: number, i: any) => s + Number(i.paid_amount), 0);
    setTotals({ patients: pat ?? 0, appointments: appts?.length ?? 0, completed, revenue });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="إحصائيات الدكتور" description="نظرة شاملة على أداء العيادة (آخر 30 يوماً)" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="إجمالي المرضى" value={totals.patients} icon={Users} variant="primary" />
        <StatCard title="المواعيد (30 يوم)" value={totals.appointments} icon={Calendar} variant="accent" />
        <StatCard title="زيارات مكتملة" value={totals.completed} icon={CheckCircle2} variant="success" />
        <StatCard title="الإيرادات (محصّلة)" value={totals.revenue.toFixed(0)} icon={DollarSign} variant="primary" hint="ج.م" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5 shadow-card border-0">
          <h3 className="mb-4 text-lg font-bold">المرضى يومياً (آخر 30 يوم)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="patients" fill="hsl(var(--primary))" name="مرضى" radius={[4, 4, 0, 0]} />
              <Bar dataKey="visits" fill="hsl(var(--accent))" name="زيارات مكتملة" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5 shadow-card border-0">
          <h3 className="mb-4 text-lg font-bold">الإيرادات الشهرية (6 أشهر)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5 shadow-card border-0 lg:col-span-2">
          <h3 className="mb-4 text-lg font-bold">توزيع المواعيد حسب الحالة</h3>
          {statusBreak.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">لا توجد بيانات</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusBreak} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {statusBreak.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}
