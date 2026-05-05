import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mic, Square, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { triggerN8nEvent } from "@/lib/n8n";

export function ConsultationRecorder() {
  const [recording, setRecording] = useState(false);
  const [sending, setSending] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [patientName, setPatientName] = useState("");
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const elapsedRef = useRef(0);
  const patientNameRef = useRef("");

  const pickMime = () => {
    const opts = [
      "audio/webm;codecs=opus",
      "audio/ogg;codecs=opus",
      "audio/webm",
      "audio/mp4",
    ];
    for (const t of opts) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) return t;
    }
    return "";
  };

  const blobToBase64 = (b: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1] ?? "");
      };
      reader.readAsDataURL(b);
    });

  const autoSend = async (b: Blob) => {
    setSending(true);
    try {
      const base64 = await blobToBase64(b);
      const payload = {
        patient_name: patientNameRef.current || null,
        recorded_at: new Date().toISOString(),
        duration_seconds: elapsedRef.current,
        mime_type: b.type,
        size_bytes: b.size,
        audio_base64: base64,
      };
      const res = await triggerN8nEvent("consultation_recording", payload);
      if (res) {
        toast.success("تم إرسال التسجيل تلقائياً إلى n8n");
        setElapsed(0);
        elapsedRef.current = 0;
        setPatientName("");
        patientNameRef.current = "";
      } else {
        toast.error("فشل الإرسال — تحقق من ربط n8n");
      }
    } catch (err) {
      console.error(err);
      toast.error("خطأ أثناء الإرسال");
    } finally {
      setSending(false);
    }
  };

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1, sampleRate: 16000 },
      });
      streamRef.current = stream;
      const mimeType = pickMime();
      const mr = new MediaRecorder(stream, mimeType ? { mimeType, audioBitsPerSecond: 24000 } : { audioBitsPerSecond: 24000 });
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      mr.onstop = () => {
        const b = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        streamRef.current?.getTracks().forEach((t) => t.stop());
        if (b.size > 0) autoSend(b);
      };
      mr.start();
      mediaRef.current = mr;
      setElapsed(0);
      elapsedRef.current = 0;
      setRecording(true);
      timerRef.current = window.setInterval(() => {
        elapsedRef.current += 1;
        setElapsed(elapsedRef.current);
      }, 1000);
    } catch (err) {
      toast.error("تعذر الوصول للميكروفون");
      console.error(err);
    }
  };

  const stop = () => {
    mediaRef.current?.stop();
    setRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <Card className="p-4 shadow-card border-0 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${recording ? "bg-destructive animate-pulse" : sending ? "bg-warning animate-pulse" : "bg-muted"}`} />
          <span className="font-semibold">تسجيل جلسة الكشف</span>
          <span className="text-sm text-muted-foreground tabular-nums">{fmt(elapsed)}</span>
          {sending && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> جاري الإرسال...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="اسم المريض (اختياري)"
            value={patientName}
            onChange={(e) => {
              setPatientName(e.target.value);
              patientNameRef.current = e.target.value;
            }}
            className="h-9 w-48"
            disabled={recording || sending}
          />
          {!recording ? (
            <Button onClick={start} variant="default" size="sm" disabled={sending}>
              <Mic className="h-4 w-4" /> بدء التسجيل
            </Button>
          ) : (
            <Button onClick={stop} variant="destructive" size="sm">
              <Square className="h-4 w-4" /> إيقاف وإرسال
            </Button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        سيتم إرسال التسجيل تلقائياً إلى n8n فور الضغط على إيقاف.
      </p>
    </Card>
  );
}
