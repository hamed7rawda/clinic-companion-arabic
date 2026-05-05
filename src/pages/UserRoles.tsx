import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

type AppRole = "doctor" | "nurse" | "reception" | "patient";
const ROLE_LABEL: Record<AppRole, string> = { doctor: "دكتور", nurse: "ممرض", reception: "استقبال", patient: "مريض" };

interface Row { user_id: string; email: string | null; display_name: string | null; roles: AppRole[]; }

export default function UserRoles() {
  const { hasRole, loading } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data: profiles } = await supabase.from("profiles").select("user_id, email, display_name");
    const { data: ur } = await supabase.from("user_roles").select("user_id, role");
    const map = new Map<string, AppRole[]>();
    (ur ?? []).forEach((r: any) => {
      const arr = map.get(r.user_id) ?? [];
      arr.push(r.role);
      map.set(r.user_id, arr);
    });
    setRows((profiles ?? []).map((p: any) => ({
      user_id: p.user_id, email: p.email, display_name: p.display_name,
      roles: map.get(p.user_id) ?? [],
    })));
  };

  useEffect(() => { load(); }, []);

  if (loading) return null;
  if (!hasRole("doctor")) return <Navigate to="/" replace />;

  const setRole = async (user_id: string, role: AppRole) => {
    setBusy(true);
    await supabase.from("user_roles").delete().eq("user_id", user_id);
    const { error } = await supabase.from("user_roles").insert({ user_id, role });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("تم تحديث الصلاحية");
    load();
  };

  return (
    <div>
      <PageHeader title="إدارة الصلاحيات" description="حدد دور كل مستخدم في النظام" />
      <Card className="p-4 shadow-card border-0">
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.user_id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
              <div>
                <p className="font-bold text-sm">{r.display_name ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{r.email}</p>
                <div className="mt-1 flex gap-1">
                  {r.roles.length === 0 ? <Badge variant="outline">بدون دور</Badge> :
                    r.roles.map((x) => <Badge key={x} variant="secondary">{ROLE_LABEL[x]}</Badge>)}
                </div>
              </div>
              <Select disabled={busy} onValueChange={(v) => setRole(r.user_id, v as AppRole)}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="تعيين دور" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="doctor">دكتور</SelectItem>
                  <SelectItem value="nurse">ممرض</SelectItem>
                  <SelectItem value="reception">استقبال</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
