import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { triggerN8nEvent } from "@/lib/n8n";
import { toast } from "sonner";
import { Activity } from "lucide-react";

interface Patient { id: string; name: string; }

const NurseVitals = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState("");
  const [bp, setBp] = useState("");
  const [hr, setHr] = useState("");
  const [temp, setTemp] = useState("");
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("patients").select("id,name").order("name").then(({ data }) => setPatients((data ?? []) as any));
  }, []);

  const save = async () => {
    if (!patientId) { toast.error("اختر المريض"); return; }
    const p = patients.find((x) => x.id === patientId);
    setSaving(true);
    try {
      await supabase.from("activity_log").insert({
        action: "vitals_recorded",
        description: `العلامات الحيوية ${p?.name}: ضغط ${bp}, نبض ${hr}, حرارة ${temp}, وزن ${weight}`,
      });
      await triggerN8nEvent("vitals_recorded", {
        patient_id: patientId, patient_name: p?.name,
        blood_pressure: bp, heart_rate: hr, temperature: temp, weight,
      });
      toast.success("تم حفظ العلامات الحيوية");
      setBp(""); setHr(""); setTemp(""); setWeight(""); setPatientId("");
    } catch (e: any) {
      toast.error(e?.message || "فشل الحفظ");
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="العلامات الحيوية" description="تسجيل قياسات المريض قبل دخوله للطبيب" />
      <Card className="p-5 shadow-card border-0 space-y-4 max-w-xl">
        <div className="space-y-2">
          <Label>المريض</Label>
          <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className="w-full h-10 rounded-md border bg-background px-3 text-sm">
            <option value="">— اختر —</option>
            {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label>ضغط الدم</Label><Input value={bp} onChange={(e) => setBp(e.target.value)} placeholder="120/80" /></div>
          <div className="space-y-1"><Label>النبض (bpm)</Label><Input value={hr} onChange={(e) => setHr(e.target.value)} placeholder="72" /></div>
          <div className="space-y-1"><Label>الحرارة (°C)</Label><Input value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="37" /></div>
          <div className="space-y-1"><Label>الوزن (kg)</Label><Input value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70" /></div>
        </div>
        <Button onClick={save} disabled={saving}><Activity className="h-4 w-4" /> حفظ القياسات</Button>
      </Card>
    </div>
  );
};
export default NurseVitals;
