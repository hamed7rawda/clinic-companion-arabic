import { useAuth, AppRole } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCog } from "lucide-react";

const LABEL: Record<AppRole, string> = {
  doctor: "دكتور",
  nurse: "ممرض",
  reception: "استقبال",
  patient: "مريض",
};

export function RoleSwitcher() {
  const { activeRole, setActiveRole } = useAuth();
  return (
    <div className="flex items-center gap-2">
      <UserCog className="h-4 w-4 text-muted-foreground" />
      <Select value={activeRole} onValueChange={(v) => setActiveRole(v as AppRole)}>
        <SelectTrigger className="h-8 w-32 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(LABEL) as AppRole[]).map((r) => (
            <SelectItem key={r} value={r} className="text-xs">
              {LABEL[r]} <span className="text-muted-foreground ms-1">(تجريبي)</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
