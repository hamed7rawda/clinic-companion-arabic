import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, CalendarDays, Users, ListOrdered, FileText, Pill,
  BarChart3, Settings as SettingsIcon, Activity, Stethoscope, Receipt,
  TrendingUp, Webhook, LogOut, ChevronDown,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider,
  SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const mainItems = [
  { title: "الرئيسية", url: "/", icon: LayoutDashboard },
  { title: "المواعيد", url: "/appointments", icon: CalendarDays },
  { title: "المرضى", url: "/patients", icon: Users },
  { title: "قائمة الانتظار", url: "/queue", icon: ListOrdered },
];

const recordsItems = [
  { title: "السجلات الطبية", url: "/medical-history", icon: FileText },
  { title: "الأدوية والوصفات", url: "/prescriptions", icon: Pill },
  { title: "الفواتير", url: "/invoices", icon: Receipt },
  { title: "التقارير", url: "/reports", icon: BarChart3 },
  { title: "الإحصائيات", url: "/statistics", icon: TrendingUp },
];

const systemItems = [
  { title: "مراقبة الأتمتة", url: "/automation", icon: Activity },
  { title: "ربط n8n", url: "/webhooks", icon: Webhook },
  { title: "الإعدادات", url: "/settings", icon: SettingsIcon },
];

function ClinicSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const renderItems = (items: typeof mainItems) =>
    items.map((item) => {
      const isActive = item.url === "/"
        ? location.pathname === "/"
        : location.pathname.startsWith(item.url);
      return (
        <SidebarMenuItem key={item.url}>
          <SidebarMenuButton asChild tooltip={item.title}>
            <NavLink to={item.url} end={item.url === "/"}
              className={cn("transition-smooth",
                isActive ? "bg-primary-soft text-primary font-semibold" : "hover:bg-sidebar-accent")}>
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });

  return (
    <Sidebar collapsible="icon" side="right">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-primary shadow-glow">
            <Stethoscope className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold leading-tight">نظام العيادة</h1>
              <p className="text-xs text-muted-foreground">المتكامل</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>الإدارة اليومية</SidebarGroupLabel>
          <SidebarGroupContent><SidebarMenu>{renderItems(mainItems)}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>السجلات والمالية</SidebarGroupLabel>
          <SidebarGroupContent><SidebarMenu>{renderItems(recordsItems)}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>النظام</SidebarGroupLabel>
          <SidebarGroupContent><SidebarMenu>{renderItems(systemItems)}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

const ROLE_LABEL: Record<string, string> = {
  doctor: "دكتور", nurse: "ممرض", reception: "استقبال",
};

export function ClinicLayout() {
  const { user, roles, signOut } = useAuth();
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
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <div className="flex items-center gap-2 text-sm">
              <span className="flex h-2 w-2 rounded-full bg-success live-dot" />
              <span className="text-muted-foreground">النظام نشط</span>
            </div>
            <div className="ms-auto flex items-center gap-3">
              <span className="hidden md:inline text-xs text-muted-foreground">
                {new Date().toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" })}
              </span>
              {roles.length > 0 && (
                <div className="flex gap-1">
                  {roles.map((r) => (
                    <Badge key={r} variant="secondary" className="text-xs">{ROLE_LABEL[r] ?? r}</Badge>
                  ))}
                </div>
              )}
              <span className="hidden sm:inline text-xs text-muted-foreground truncate max-w-[160px]">
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
