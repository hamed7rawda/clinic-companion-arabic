import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Stethoscope, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().trim().email("البريد غير صالح").max(255);
const passwordSchema = z.string().min(8, "كلمة السر 8 أحرف على الأقل").max(72);
const nameSchema = z.string().trim().min(2, "الاسم قصير جداً").max(100);

export default function Auth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err: any) {
      return toast.error(err.errors?.[0]?.message ?? "بيانات غير صالحة");
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      if (error.message.includes("Email not confirmed")) {
        return toast.error("الرجاء تأكيد بريدك الإلكتروني أولاً");
      }
      return toast.error("بيانات الدخول غير صحيحة");
    }
    toast.success("مرحباً بك");
    navigate("/", { replace: true });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      nameSchema.parse(name);
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err: any) {
      return toast.error(err.errors?.[0]?.message ?? "بيانات غير صالحة");
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { display_name: name },
      },
    });
    setBusy(false);
    if (error) {
      if (error.message.includes("already registered")) {
        return toast.error("البريد مسجّل مسبقاً");
      }
      return toast.error(error.message);
    }
    toast.success("تم التسجيل! تحقق من بريدك لتأكيد الحساب");
  };

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-soft via-background to-accent/10 p-4">
      <Card className="w-full max-w-md p-8 shadow-card border-0">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-glow">
            <Stethoscope className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">نظام العيادة المتكامل</h1>
          <p className="text-sm text-muted-foreground mt-1">سجّل دخولك للمتابعة</p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">تسجيل الدخول</TabsTrigger>
            <TabsTrigger value="signup">حساب جديد</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="si-email">البريد الإلكتروني</Label>
                <Input id="si-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="si-pw">كلمة السر</Label>
                <Input id="si-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required dir="ltr" />
              </div>
              <Button type="submit" disabled={busy} className="w-full gradient-primary text-primary-foreground hover:opacity-90">
                {busy && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                دخول
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="su-name">الاسم الكامل</Label>
                <Input id="su-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="su-email">البريد الإلكتروني</Label>
                <Input id="su-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="su-pw">كلمة السر (8 أحرف على الأقل)</Label>
                <Input id="su-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required dir="ltr" />
              </div>
              <Button type="submit" disabled={busy} className="w-full gradient-primary text-primary-foreground hover:opacity-90">
                {busy && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                إنشاء حساب
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                المستخدم الأول يحصل على دور الدكتور تلقائياً
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
