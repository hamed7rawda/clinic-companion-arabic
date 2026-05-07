import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CalendarCheck, Stethoscope, ShieldCheck, Clock, FileText, LogIn } from "lucide-react";
import heroImg from "@/assets/landing-hero.jpg";
import { useAuth } from "@/hooks/useAuth";

export default function Landing() {
  const { user } = useAuth();

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-accent-soft via-background to-background font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-glow">
              <Stethoscope className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">عيادتي</span>
          </div>
          <nav className="flex items-center gap-2">
            {user ? (
              <Button asChild size="sm">
                <Link to="/home">لوحة التحكم</Link>
              </Button>
            ) : (
              <Button asChild size="sm" variant="ghost">
                <Link to="/auth"><LogIn className="me-1 h-4 w-4" /> دخول الموظفين</Link>
              </Button>
            )}
            <Button asChild size="sm" className="gradient-primary text-primary-foreground hover:opacity-90">
              <Link to="/book"><CalendarCheck className="me-1 h-4 w-4" /> احجز الآن</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="space-y-6 text-center md:text-right">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              احجز كشفك مع <span className="text-primary">دكتورك</span> في دقائق
            </h1>
            <p className="text-lg text-muted-foreground">
              نظام عيادة متكامل: حجز فوري، قائمة انتظار ذكية، وملف طبي خاص بك.
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <Button asChild size="lg" className="gradient-primary text-primary-foreground hover:opacity-90">
                <Link to="/book"><CalendarCheck className="me-2 h-5 w-5" /> احجز موعد</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/my-records"><FileText className="me-2 h-5 w-5" /> سجلاتي الطبية</Link>
              </Button>
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
              <Badge icon={<Clock className="h-4 w-4" />}>حجز فوري</Badge>
              <Badge icon={<ShieldCheck className="h-4 w-4" />}>بياناتك محمية</Badge>
              <Badge icon={<Stethoscope className="h-4 w-4" />}>متابعة طبية</Badge>
            </div>
          </div>
          <div className="relative">
            <img src={heroImg} alt="دكتور" width={1024} height={1024}
              className="rounded-3xl shadow-elevated w-full h-auto object-cover" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid gap-4 md:grid-cols-3">
          <Feature icon={<CalendarCheck className="h-6 w-6" />} title="احجز موعدك" desc="اختر الوقت المناسب لك من المواعيد المتاحة." />
          <Feature icon={<FileText className="h-6 w-6" />} title="سجلاتك بين يديك" desc="ادخل برقم هاتفك وشاهد وصفاتك وتحاليلك." />
          <Feature icon={<ShieldCheck className="h-6 w-6" />} title="آمن وموثوق" desc="نظام صلاحيات يحمي خصوصية بياناتك الطبية." />
        </div>
      </section>

      <footer className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} نظام عيادتي المتكامل
      </footer>
    </div>
  );
}

function Badge({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft text-primary px-3 py-1.5 text-sm font-medium">
      {icon}{children}
    </span>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card className="p-6 shadow-card border-0 hover:shadow-elevated transition-smooth">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary mb-3">
        {icon}
      </div>
      <h3 className="font-bold text-lg mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </Card>
  );
}
