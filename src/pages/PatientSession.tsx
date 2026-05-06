import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, Square, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/clinic-utils";
import { PrescriptionDraftEditor, type DraftData } from "@/components/medical/PrescriptionDraftEditor";

interface Patient {
  id: string;
  name: string;
  phone: string | null;
  age: number | null;
  gender: string | null;
  medical_history: string | null;
  allergies: string | null;
}

interface Visit {
  id: string;
  visit_date: string;
  diagnosis: string | null;
  prescriptions: string | null;
}

const PatientSession = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [history, setHistory] = useState<Visit[]>([]);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [draft, setDraft] = useState<DraftData | null>(null);
  const [consultationId, setConsultationId] = useState<string | null>(null);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);

  useEffect(() => {
    if (!id) return;
    supabase.from("patients").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      if (!data) { toast.error("المريض غير موجود"); navigate("/patients"); return; }
      setPatient(data as any);
    });
    supabase.from("medical_history").select("*").eq("patient_id", id).order("visit_date", { ascending: false })
      .then(({ data }) => setHistory((data ?? []) as Visit[]));
  }, [id, navigate]);

  const pickMime = () => {
    const opts = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/webm", "audio/mp4"];
    for (const t of opts) if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) return t;
    return "";
  };

  const blobToBase64 = (b: Blob) => new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(r.error);
    r.onloadend = () => resolve((r.result as string).split(",")[1] ?? "");
    r.readAsDataURL(b);
  });

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1, sampleRate: 16000 },
      });
      streamRef.current = stream;
      const mt = pickMime();
      const mr = new MediaRecorder(stream, mt ? { mimeType: mt, audioBitsPerSecond: 24000 } : { audioBitsPerSecond: 24000 });
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        const b = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        if (b.size > 0) await processAudio(b);
      };
      mr.start();
      mediaRef.current = mr;
      setElapsed(0); elapsedRef.current = 0; setRecording(true); setDraft(null);
      timerRef.current = window.setInterval(() => { elapsedRef.current += 1; setElapsed(elapsedRef.current); }, 1000);
    } catch (err) {
      console.error(err);
      toast.error("تعذر الوصول للميكروفون");
    }
  };

  const stop = () => {
    mediaRef.current?.stop();
    setRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const processAudio = async (b: Blob) => {
    if (!patient) return;
    setProcessing(true);
    try {
      const audio_base64 = await blobToBase64(b);
      const { data, error } = await supabase.functions.invoke("generate-prescription-draft", {
        body: { audio_base64, mime_type: b.type, patient_name: patient.name },
      });
      if (error) throw error;
      const d = data?.draft as DraftData;
      if (!d) throw new Error("no draft");

      const { data: ins, error: insErr } = await supabase.from("consultations").insert({
        patient_id: patient.id,
        patient_name: patient.name,
        patient_phone: patient.phone,
        transcript: d.transcript,
        diagnosis: d.diagnosis,
        medications: d.medications as any,
        labs: d.labs as any,
        recommendations: d.recommendations,
        audio_duration: elapsedRef.current,
        status: "draft",
      }).select("id").maybeSingle();
      if (insErr) throw insErr;

      setConsultationId(ins?.id ?? null);
      setDraft(d);
      toast.success("تم استخراج المسودة، راجعها قبل الاعتماد");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "تعذر استخراج المسودة");
    } finally {
      setProcessing(false);
    }
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  if (!patient) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`جلسة كشف — ${patient.name}`} description={`الهاتف: ${patient.phone ?? "—"} • العمر: ${patient.age ?? "—"} • الجنس: ${patient.gender ?? "—"}`} />

      <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-2">
        <ArrowRight className="h-4 w-4" /> رجوع
      </Button>

      <Card className="p-5 shadow-card border-0 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${recording ? "bg-destructive animate-pulse" : processing ? "bg-warning animate-pulse" : "bg-muted"}`} />
            <span className="font-semibold">تسجيل جلسة الكشف</span>
            <span className="text-sm text-muted-foreground tabular-nums">{fmt(elapsed)}</span>
            {processing && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3 animate-pulse" /> جاري تحليل التسجيل بالذكاء الاصطناعي...
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {!recording ? (
              <Button onClick={start} disabled={processing}><Mic className="h-4 w-4" /> بدء التسجيل</Button>
            ) : (
              <Button onClick={stop} variant="destructive"><Square className="h-4 w-4" /> إيقاف وتحليل</Button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">سيتم استخراج مسودة الوصفة تلقائياً من الذكاء الاصطناعي بعد الإيقاف.</p>
      </Card>

      {draft && consultationId && (
        <PrescriptionDraftEditor
          consultationId={consultationId}
          patient={patient}
          initial={draft}
          onApproved={() => {
            setDraft(null); setConsultationId(null); setElapsed(0);
            // refresh history
            supabase.from("medical_history").select("*").eq("patient_id", patient.id)
              .order("visit_date", { ascending: false }).then(({ data }) => setHistory((data ?? []) as Visit[]));
          }}
        />
      )}

      <Card className="shadow-card border-0">
        <div className="p-4 border-b"><h3 className="font-bold">السجل الطبي للمريض</h3></div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">التشخيص</TableHead>
                <TableHead className="text-right">الوصفات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="py-10 text-center text-muted-foreground">لا توجد زيارات سابقة</TableCell></TableRow>
              ) : history.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>{formatDate(v.visit_date)}</TableCell>
                  <TableCell>{v.diagnosis ?? "—"}</TableCell>
                  <TableCell className="max-w-md truncate">{v.prescriptions ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {patient.allergies && (
          <div className="p-4 border-t">
            <Badge variant="destructive" className="me-2">حساسية</Badge>
            <span className="text-sm">{patient.allergies}</span>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PatientSession;
