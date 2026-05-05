import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Search, Loader2, Pill, FlaskConical, FileText } from "lucide-react";
import { toast } from "sonner";

interface Record {
  kind: string; id: string; patient_name: string; date: string;
  diagnosis: string | null;
  medications: { name: string; dosage?: string; frequency?: string; duration?: string }[];
  labs: string[];
  recommendations: string | null;
}

const PublicRecords = () => {
  const [phone, setPhone] = useState("");
  const [records, setRecords] = useState<Record[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"prescriptions" | "labs">("prescriptions");

  const lookup = async () => {
    if (phone.length < 6) { toast.error("أدخل رقم هاتف صحيح"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("public-records", { body: { phone } });
      if (error) throw error;
      setRecords((data?.records ?? []) as any);
    } catch (e: any) {
      toast.error(e?.message || "تعذر جلب السجلات");
    } finally { setLoading(false); }
  };

  const allLabs = records?.flatMap((r) => (r.labs ?? []).map((l) => ({ lab: l, date: r.date }))) ?? [];

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="text-center space-y-2">
          <div className="mx-auto h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
            <Stethoscope className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">سجلاتي الطبية</h1>
          <p className="text-sm text-muted-foreground">أدخل رقم هاتفك للاطلاع على وصفاتك وتحاليلك المعتمدة</p>
        </header>

        <Card className="p-5 shadow-card border-0 space-y-3">
          <div className="space-y-2">
            <Label>رقم الهاتف</Label>
            <div className="flex gap-2">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01xxxxxxxxx" inputMode="tel" />
              <Button onClick={lookup} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                بحث
              </Button>
            </div>
          </div>
        </Card>

        {records && (
          <>
            <div className="flex gap-2">
              <Button variant={tab === "prescriptions" ? "default" : "outline"} size="sm" onClick={() => setTab("prescriptions")}>
                <Pill className="h-4 w-4" /> وصفاتي ({records.length})
              </Button>
              <Button variant={tab === "labs" ? "default" : "outline"} size="sm" onClick={() => setTab("labs")}>
                <FlaskConical className="h-4 w-4" /> تحاليلي ({allLabs.length})
              </Button>
            </div>

            {tab === "prescriptions" && (
              <div className="space-y-3">
                {records.length === 0 && (
                  <Card className="p-8 text-center text-muted-foreground shadow-card border-0">لا توجد سجلات معتمدة</Card>
                )}
                {records.map((r) => (
                  <Card key={r.id} className="p-5 shadow-card border-0 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 font-semibold">
                          <FileText className="h-4 w-4 text-primary" />
                          {r.patient_name}
                        </div>
                        <p className="text-xs text-muted-foreground">{new Date(r.date).toLocaleDateString("ar-EG")}</p>
                      </div>
                      <Badge className="bg-success/15 text-success border-success/30" variant="outline">معتمد</Badge>
                    </div>
                    {r.diagnosis && <div><span className="text-xs font-bold text-muted-foreground">التشخيص: </span><span className="text-sm">{r.diagnosis}</span></div>}
                    {r.medications?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-muted-foreground mb-1">الأدوية:</p>
                        <ul className="text-sm space-y-1 list-disc pe-5">
                          {r.medications.map((m, i) => (
                            <li key={i}><strong>{m.name}</strong> {m.dosage} {m.frequency ? `- ${m.frequency}` : ""} {m.duration ? `(${m.duration})` : ""}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {r.recommendations && <div className="text-sm bg-muted/50 rounded p-2"><strong>التوصيات: </strong>{r.recommendations}</div>}
                  </Card>
                ))}
              </div>
            )}

            {tab === "labs" && (
              <Card className="p-5 shadow-card border-0">
                {allLabs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">لا توجد تحاليل/أشعة مطلوبة</p>
                ) : (
                  <ul className="space-y-2">
                    {allLabs.map((l, i) => (
                      <li key={i} className="flex justify-between border-b pb-2 last:border-0">
                        <span className="flex items-center gap-2"><FlaskConical className="h-4 w-4 text-primary" /> {l.lab}</span>
                        <span className="text-xs text-muted-foreground">{new Date(l.date).toLocaleDateString("ar-EG")}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}
          </>
        )}

        <div className="text-center text-xs text-muted-foreground">
          <Link to="/book" className="underline">حجز موعد جديد</Link>
        </div>
      </div>
    </div>
  );
};
export default PublicRecords;
