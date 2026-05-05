import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mic, Square, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { triggerN8nEvent } from "@/lib/n8n";

export function ConsultationRecorder() {
  const [recording, setRecording] = useState(false);
  const [sending, setSending] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [patientName, setPatientName] = useState("");
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
        setBlob(b);
        streamRef.current?.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setBlob(null);
      setElapsed(0);
      setRecording(true);
      timerRef.current = window.setInterval(() => setElapsed((s) => s + 1), 1000);
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

  const send = async () => {
    if (!blob) return;
    setSending(true);
    try {
      const base64 = await blobToBase64(blob);
      const payload = {
        patient_name: patientName || null,
        recorded_at: new Date().toISOString(),
        duration_seconds: elapsed,
        mime_type: blob.type,
        size_bytes: blob.size,
        audio_base64: base64,
      };
      const res = await triggerN8nEvent("consultation_recording", payload);
      if (res) {
        toast.success("تم إرسال التسجيل إلى n8n");
        setBlob(null);
        setElapsed(0);
        setPatientName("");
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

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <Card className="p-4 shadow-card border-0 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${recording ? "bg-destructive animate-pulse" : "bg-muted"}`} />
          <span className="font-semibold">تسجيل جلسة الكشف</span>
          <span className="text-sm text-muted-foreground tabular-nums">{fmt(elapsed)}</span>
        </div>
        <div className="flex items-center gap-2">
          {!recording ? (
            <Button onClick={start} variant="default" size="sm">
              <Mic className="h-4 w-4" /> بدء التسجيل
            </Button>
          ) : (
            <Button onClick={stop} variant="destructive" size="sm">
              <Square className="h-4 w-4" /> إيقاف
            </Button>
          )}
        </div>
      </div>

      {blob && !recording && (
        <div className="space-y-3 border-t pt-3">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto] items-center">
            <Input
              placeholder="اسم المريض (اختياري)"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
            />
            <span className="text-xs text-muted-foreground">
              {(blob.size / 1024).toFixed(1)} KB · {blob.type.split(";")[0]}
            </span>
          </div>
          <audio controls src={URL.createObjectURL(blob)} className="w-full" />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => { setBlob(null); setElapsed(0); }}>
              تجاهل
            </Button>
            <Button size="sm" onClick={send} disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              إرسال إلى n8n
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
