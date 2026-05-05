import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { ReactNode } from "react";

type AppRole = "doctor" | "nurse" | "reception" | "patient";

export function RoleRoute({ allow, children }: { allow: AppRole[]; children: ReactNode }) {
  const { roles, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  const effective = (roles.length ? roles : ["doctor"]) as AppRole[];
  if (!effective.some((r) => allow.includes(r))) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
