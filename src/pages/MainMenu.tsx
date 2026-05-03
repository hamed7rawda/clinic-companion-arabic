import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  LayoutDashboard, CalendarDays, Users, ListOrdered, FileText,
  Receipt, BarChart3, TrendingUp, Activity, Webhook, Settings as SettingsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type MenuItem = { title: string; url: string; icon: any; desc: string };

const groups: { label: string; color: string; items: MenuItem[] }[] = [
  {
    label: "الإدارة اليومية",
    color: "text-sky-500",
    items: [
      { title: "لوحة التحكم", url: "/dashboard", icon: LayoutDashboard, desc: "نظرة لحظية على نشاط العيادة" },
      { title: "المواعيد", url: "/appointments", icon: CalendarDays, desc: "حجز ومتابعة المواعيد" },
      { title: "المرضى", url: "/patients", icon: Users, desc: "ملفات المرضى وبياناتهم" },
      { title: "قائمة الانتظار", url: "/queue", icon: ListOrdered, desc: "إدارة طابور المراجعة" },
    ],
  },
  {
    label: "السجلات والمالية",
    color: "text-emerald-500",
    items: [
      { title: "السجلات الطبية", url: "/medical-history", icon: FileText, desc: "تاريخ الزيارات والتشخيصات" },
      { title: "الفواتير", url: "/invoices", icon: Receipt, desc: "إصدار وإدارة الفواتير" },
      { title: "التقارير", url: "/reports", icon: BarChart3, desc: "تقارير الأداء والإيرادات" },
      { title: "الإحصائيات", url: "/statistics", icon: TrendingUp, desc: "مؤشرات وتحليلات" },
    ],
  },
  {
    label: "النظام",
    color: "text-amber-500",
    items: [
      { title: "مراقبة الأتمتة", url: "/automation", icon: Activity, desc: "حالة سير العمل التلقائي" },
      { title: "ربط n8n", url: "/webhooks", icon: Webhook, desc: "تكاملات الويبهوك" },
      { title: "الإعدادات", url: "/settings", icon: SettingsIcon, desc: "إعدادات العيادة العامة" },
    ],
  },
];

const MainMenu = () => {
  return (
    <div className="space-y-8">
      <PageHeader title="القائمة الرئيسية" description="اختر القسم الذي تريد الانتقال إليه" />
      {groups.map((g) => (
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
