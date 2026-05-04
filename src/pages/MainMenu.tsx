import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  LayoutDashboard, CalendarDays, Users, ListOrdered, FileText,
  Receipt, BarChart3, TrendingUp, Activity, Webhook, Settings as SettingsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

type AppRole = "doctor" | "nurse" | "reception";
type MenuItem = { title: string; url: string; icon: any; desc: string; roles?: AppRole[] };

const groups: { label: string; color: string; items: MenuItem[] }[] = [
  {
    label: "الإدارة اليومية",
    color: "text-sky-500",
    items: [
      { title: "لوحة التحكم", url: "/dashboard", icon: LayoutDashboard, desc: "نظرة لحظية على نشاط العيادة", roles: ["doctor", "reception"] },
      { title: "المواعيد", url: "/appointments", icon: CalendarDays, desc: "حجز ومتابعة المواعيد", roles: ["doctor", "reception"] },
      { title: "المرضى", url: "/patients", icon: Users, desc: "ملفات المرضى وبياناتهم" },
      { title: "قائمة الانتظار", url: "/queue", icon: ListOrdered, desc: "إدارة طابور المراجعة" },
    ],
  },
  {
    label: "السجلات والمالية",
    color: "text-emerald-500",
    items: [
      { title: "السجلات الطبية", url: "/medical-history", icon: FileText, desc: "تاريخ الزيارات والتشخيصات", roles: ["doctor"] },
      { title: "الفواتير", url: "/invoices", icon: Receipt, desc: "إصدار وإدارة الفواتير", roles: ["doctor", "reception"] },
      { title: "التقارير", url: "/reports", icon: BarChart3, desc: "تقارير الأداء والإيرادات", roles: ["doctor"] },
      { title: "الإحصائيات", url: "/statistics", icon: TrendingUp, desc: "مؤشرات وتحليلات", roles: ["doctor"] },
    ],
  },
  {
    label: "النظام",
    color: "text-amber-500",
    items: [
      { title: "مراقبة الأتمتة", url: "/automation", icon: Activity, desc: "حالة سير العمل التلقائي", roles: ["doctor"] },
      { title: "ربط n8n", url: "/webhooks", icon: Webhook, desc: "تكاملات الويبهوك", roles: ["doctor"] },
      { title: "الإعدادات", url: "/settings", icon: SettingsIcon, desc: "إعدادات العيادة العامة", roles: ["doctor"] },
    ],
  },
];

const MainMenu = () => {
  const { roles } = useAuth();
  const effective = (roles.length ? roles : ["reception"]) as AppRole[];
  const visible = groups
    .map((g) => ({ ...g, items: g.items.filter((it) => !it.roles || it.roles.some((r) => effective.includes(r))) }))
    .filter((g) => g.items.length > 0);
  return (
    <div className="space-y-8">
      <PageHeader title="القائمة الرئيسية" description="اختر القسم الذي تريد الانتقال إليه" />
      {visible.map((g) => (
        <section key={g.label} className="space-y-3">
          <h2 className={cn("text-base font-bold", g.color)}>{g.label}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {g.items.map((it) => (
              <Link key={it.url} to={it.url}>
                <Card className="p-4 shadow-card border-0 transition-smooth hover:shadow-glow hover:-translate-y-0.5 h-full">
                  <div className="flex items-start gap-3">
                    <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted", g.color)}>
                      <it.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm">{it.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{it.desc}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default MainMenu;
