import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Send, Loader2, FileText, Pill, FlaskConical, ClipboardList } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { triggerN8nEvent } from "@/lib/n8n";
import { toast } from "sonner";

export interface Medication {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
}

export interface DraftData {
  transcript: string;
  diagnosis: string;
  medications: Medication[];
  labs: string[];
  recommendations: string;
}

interface Props {
  consultationId: string;
  patient: { id: string; name: string; phone: string | null };
  initial: DraftData;
  onApproved: () => void;
}

export function PrescriptionDraftEditor({ consultationId, patient, initial, onApproved }: Props) {
  const [diagnosis, setDiagnosis] = useState(initial.diagnosis ?? "");
  const [medications, setMedications] = useState<Medication[]>(initial.medications ?? []);
  const [labs, setLabs] = useState<string[]>(initial.labs ?? []);
  const [recommendations, setRecommendations] = useState(initial.recommendations ?? "");
  const [sending, setSending] = useState(false);

  const updateMed = (i: number, k: keyof Medication, v: string) => {
    setMedications((arr) => arr.map((m, idx) => idx === i ? { ...m, [k]: v } : m));
  };

  const approve = async () => {
    setSending(true);
    try {
      const { error } = await supabase.from("consultations").update({
        diagnosis, medications: medications as any, labs: labs as any, recommendations,
        status: "approved", approved_at: new Date().toISOString(),
      }).eq("id", consultationId);
      if (error) throw error;

      // Also write to medical_history for legacy listing
      await supabase.from("medical_history").insert({
        patient_id: patient.id,
        patient_name: patient.name,
        diagnosis,
        prescriptions: medications.map(m => `${m.name}${m.dosage ? ` ${m.dosage}` : ""}${m.frequency ? ` - ${m.frequency}` : ""}`).join(" | "),
        follow_up_status: "sent",
      });

      await triggerN8nEvent("prescription_approved", {
        consultation_id: consultationId,
        patient_id: patient.id,
        patient_name: patient.name,
        patient_phone: patient.phone,
        diagnosis, medications, labs, recommendations,
        approved_at: new Date().toISOString(),
      });

      toast.success("تم اعتماد وإرسال الوصفة");
      onApproved();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "فشل اعتماد الوصفة");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="p-5 shadow-card border-0 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="font-bold">مسودة الوصفة الطبية</h3>
          <Badge variant="outline" className="bg-warning/10 text-warning-foreground border-warning/30">مسودة قيد المراجعة</Badge>
        </div>
      </div>

      {initial.transcript && (
        <details className="rounded-md border bg-muted/40 p-3">
          <summary className="cursor-pointer text-sm font-semibold">نص الحوار المُستخرج</summary>
          <p className="mt-2 text-sm whitespace-pre-wrap text-muted-foreground">{initial.transcript}</p>
        </details>
      )}

      <div className="space-y-2">
        <Label className="flex items-center gap-2"><ClipboardList className="h-4 w-4" /> التشخيص</Label>
        <Textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} rows={2} placeholder="التشخيص الرئيسي..." />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2"><Pill className="h-4 w-4" /> الأدوية</Label>
          <Button variant="outline" size="sm" onClick={() => setMedications([...medications, { name: "" }])}>
            <Plus className="h-4 w-4" /> إضافة دواء
          </Button>
        </div>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">الجرعة</TableHead>
                <TableHead className="text-right">التكرار</TableHead>
                <TableHead className="text-right">المدة</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medications.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-6 text-center text-muted-foreground text-sm">لا توجد أدوية</TableCell></TableRow>
              ) : medications.map((m, i) => (
                <TableRow key={i}>
                  <TableCell><Input value={m.name} onChange={(e) => updateMed(i, "name", e.target.value)} /></TableCell>
                  <TableCell><Input value={m.dosage ?? ""} onChange={(e) => updateMed(i, "dosage", e.target.value)} placeholder="500mg" /></TableCell>
                  <TableCell><Input value={m.frequency ?? ""} onChange={(e) => updateMed(i, "frequency", e.target.value)} placeholder="مرتين يومياً" /></TableCell>
                  <TableCell><Input value={m.duration ?? ""} onChange={(e) => updateMed(i, "duration", e.target.value)} placeholder="5 أيام" /></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => setMedications(medications.filter((_, idx) => idx !== i))}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2"><FlaskConical className="h-4 w-4" /> التحاليل والأشعة</Label>
          <Button variant="outline" size="sm" onClick={() => setLabs([...labs, ""])}>
            <Plus className="h-4 w-4" /> إضافة
          </Button>
        </div>
        <div className="space-y-2">
          {labs.length === 0 && <p className="text-sm text-muted-foreground">لا توجد تحاليل مطلوبة</p>}
          {labs.map((l, i) => (
            <div key={i} className="flex gap-2">
              <Input value={l} onChange={(e) => setLabs(labs.map((x, idx) => idx === i ? e.target.value : x))} placeholder="مثال: تحليل CBC" />
              <Button variant="ghost" size="icon" onClick={() => setLabs(labs.filter((_, idx) => idx !== i))}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>التوصيات</Label>
        <Textarea value={recommendations} onChange={(e) => setRecommendations(e.target.value)} rows={3} placeholder="نصائح للمريض..." />
      </div>

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button onClick={approve} disabled={sending} size="lg">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          اعتماد وإرسال
        </Button>
      </div>
    </Card>
  );
}
