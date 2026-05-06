import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, CalendarDays, Users, ListOrdered,
  BarChart3, Settings as SettingsIcon, Activity, Stethoscope, Receipt,
  TrendingUp, Webhook, LogOut, Home, ShieldCheck, Pill, FlaskConical,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider,
  SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAuth, AppRole } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RoleSwitcher } from "@/components/auth/RoleSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";

type NavEntry = { title: string; url: string; icon: typeof LayoutDashboard; roles?: AppRole[]; external?: boolean };

const mainItems: NavEntry[] = [
  { title: "القائمة الرئيسية", url: "/", icon: Home },
  { title: "لوحة التحكم", url: "/dashboard", icon: LayoutDashboard, roles: ["doctor", "reception"] },
  { title: "المواعيد", url: "/appointments", icon: CalendarDays, roles: ["doctor", "reception", "nurse"] },
  { title: "المرضى", url: "/patients", icon: Users, roles: ["doctor", "nurse", "reception"] },
  { title: "قائمة الانتظار", url: "/queue", icon: ListOrdered, roles: ["doctor", "nurse", "reception"] },
];

const recordsItems: NavEntry[] = [
  { title: "الفواتير", url: "/invoices", icon: Receipt, roles: ["doctor", "reception"] },
  { title: "التقارير", url: "/reports", icon: BarChart3, roles: ["doctor"] },
  { title: "الإحصائيات", url: "/statistics", icon: TrendingUp, roles: ["doctor"] },
];

const systemItems: NavEntry[] = [
  { title: "مراقبة الأتمتة", url: "/automation", icon: Activity, roles: ["doctor"] },
  { title: "ربط n8n", url: "/webhooks", icon: Webhook, roles: ["doctor"] },
  { title: "إدارة الصلاحيات", url: "/users", icon: ShieldCheck, roles: ["doctor"] },
  { title: "الإعدادات", url: "/settings", icon: SettingsIcon, roles: ["doctor"] },
];

const patientItems: NavEntry[] = [
  { title: "وصفاتي", url: "/my-records", icon: Pill, roles: ["patient"], external: true },
  { title: "تحاليلي", url: "/my-records", icon: FlaskConical, roles: ["patient"], external: true },
];

const filterByRoles = (items: NavEntry[], roles: AppRole[]) =>
  items.filter((it) => !it.roles || it.roles.some((r) => roles.includes(r)));

function ClinicSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { activeRole } = useAuth();
  const effectiveRoles: AppRole[] = [activeRole];

  const handleNavClick = () => { if (isMobile) setOpenMobile(false); };

  const renderItems = (items: NavEntry[], accent: string) =>
    items.map((item) => {
      const isActive = item.url === "/" ? location.pathname === "/" : location.pathname.startsWith(item.url);
      return (
        <SidebarMenuItem key={item.title + item.url}>
          <SidebarMenuButton asChild tooltip={item.title}>
            <NavLink to={item.url} end={item.url === "/"} onClick={handleNavClick}
              className={cn("transition-smooth rounded-md",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-bold shadow-md"
                  : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
              <item.icon className={cn("h-5 w-5 shrink-0", !isActive && accent)} />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });

  const isPatient = activeRole === "patient";

  return (
    <Sidebar collapsible="icon" side="right">
      <SidebarHeader className="border-b border-sidebar-border p-4 bg-sidebar-background">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-primary shadow-glow">
            <Stethoscope className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold leading-tight text-sidebar-foreground">نظام العيادة</h1>
              <p className="text-xs text-sidebar-foreground/60">المتكامل</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {isPatient ? (
          <Group label="بوابة المريض" labelColor="text-violet-200/90" iconColor="text-violet-300/90"
            items={[{ title: "القائمة الرئيسية", url: "/", icon: Home }, ...patientItems]}
            renderItems={renderItems} collapsed={collapsed} />
        ) : (
          <>
            <Group label="الإدارة اليومية" labelColor="text-sky-200/90" iconColor="text-sky-300/90"
              items={filterByRoles(mainItems, effectiveRoles)} renderItems={renderItems} collapsed={collapsed} />
            <Group label="السجلات والمالية" labelColor="text-emerald-200/90" iconColor="text-emerald-300/90"
              items={filterByRoles(recordsItems, effectiveRoles)} renderItems={renderItems} collapsed={collapsed} />
            <Group label="النظام" labelColor="text-amber-200/90" iconColor="text-amber-300/90"
              items={filterByRoles(systemItems, effectiveRoles)} renderItems={renderItems} collapsed={collapsed} />
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}

function Group({
  label, labelColor, iconColor, items, renderItems, collapsed,
}: {
  label: string; labelColor: string; iconColor: string; items: NavEntry[];
  renderItems: (items: NavEntry[], accent: string) => React.ReactNode; collapsed: boolean;
}) {
  if (items.length === 0) return null;
  if (collapsed) {
    return <SidebarGroup><SidebarGroupContent><SidebarMenu>{renderItems(items, iconColor)}</SidebarMenu></SidebarGroupContent></SidebarGroup>;
  }
  return (
    <SidebarGroup>
      <SidebarGroupLabel className={cn("font-bold uppercase tracking-wide text-xs", labelColor)}>{label}</SidebarGroupLabel>
      <SidebarGroupContent><SidebarMenu>{renderItems(items, iconColor)}</SidebarMenu></SidebarGroupContent>
    </SidebarGroup>
  );
}

const ROLE_LABEL: Record<string, string> = {
  doctor: "دكتور", nurse: "ممرض", reception: "استقبال", patient: "مريض",
};

export function ClinicLayout() {
  const { user, activeRole, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("تم تسجيل الخروج");
    navigate("/auth", { replace: true });
  };

  return (
    <SidebarProvider defaultOpen>
      <div dir="rtl" className="flex min-h-screen w-full bg-background font-sans">
        <ClinicSidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <div className="hidden md:flex items-center gap-2 text-sm">
              <span className="flex h-2 w-2 rounded-full bg-success live-dot" />
              <span className="text-muted-foreground">النظام نشط</span>
            </div>
            <div className="ms-auto flex items-center gap-3">
              <ThemeToggle />
              <RoleSwitcher />
              <Badge variant="secondary" className="text-xs">{ROLE_LABEL[activeRole]}</Badge>
              <span className="hidden sm:inline text-xs text-muted-foreground truncate max-w-[140px]">
                {user?.email}
              </span>
              <Button variant="ghost" size="icon" onClick={handleSignOut} title="تسجيل الخروج">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 animate-fade-in">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
