import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status = "booked" | "completed" | "cancelled" | "rescheduled";

const labels: Record<Status, string> = {
  booked: "محجوز",
  completed: "مكتمل",
  cancelled: "ملغي",
  rescheduled: "معاد جدولته",
};

const styles: Record<Status, string> = {
  booked: "bg-success/15 text-success border-success/30 hover:bg-success/20",
  completed: "bg-muted text-muted-foreground border-border hover:bg-muted",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/20",
  rescheduled: "bg-warning/15 text-warning-foreground border-warning/30 hover:bg-warning/20",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge variant="outline" className={cn("font-medium", styles[status])}>
      {labels[status]}
    </Badge>
  );
}
