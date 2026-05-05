import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "doctor" | "nurse" | "reception" | "patient";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  roles: AppRole[];          // effective (override-aware)
  realRoles: AppRole[];      // actual DB roles
  activeRole: AppRole;       // single active role for UI switching
  setActiveRole: (r: AppRole) => void;
  loading: boolean;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = "active_role_override";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [realRoles, setRealRoles] = useState<AppRole[]>([]);
  const [activeRole, setActiveRoleState] = useState<AppRole>(() => {
    return (localStorage.getItem(STORAGE_KEY) as AppRole) || "doctor";
  });
  const [loading, setLoading] = useState(true);

  const loadRoles = async (userId: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const r = (data ?? []).map((x: any) => x.role as AppRole);
    setRealRoles(r);
    // if no override stored, default active to first real role
    const stored = localStorage.getItem(STORAGE_KEY) as AppRole | null;
    if (!stored && r.length) setActiveRoleState(r[0]);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) setTimeout(() => loadRoles(s.user.id), 0);
      else setRealRoles([]);
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) loadRoles(s.user.id);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const setActiveRole = useCallback((r: AppRole) => {
    localStorage.setItem(STORAGE_KEY, r);
    setActiveRoleState(r);
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); };
  const roles: AppRole[] = [activeRole];
  const hasRole = (role: AppRole) => roles.includes(role);

  return (
    <AuthContext.Provider value={{ user, session, roles, realRoles, activeRole, setActiveRole, loading, signOut, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
