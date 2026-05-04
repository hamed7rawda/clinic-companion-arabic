import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Stethoscope, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const FN = `${SUPABASE_URL}/functions/v1/public-booking`;

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function PublicBooking() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [complaint, setComplaint] = useState("");
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!date) return;
    setLoadingSlots(true);
    setTime("");
    fetch(`${FN}?date=${date}`, { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } })
      .then((r) => r.json())
      .then((d) => setSlots(d.available ?? []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [date]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) return toast.error("الرجاء إدخال الاسم");
    if (!/^[0-9+\-\s]{6,20}$/.test(phone)) return toast.error("رقم هاتف غير صالح");
    if (!time) return toast.error("اختر وقتاً متاحاً");
    setBusy(true);
    try {
      const res = await fetch(FN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: ANON,
          Authorization: `Bearer ${ANON}`,
        },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), complaint, date, time }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "تعذر الحجز");
      setDone(true);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-soft via-background to-accent/10">
        <Card className="w-full max-w-md p-8 text-center shadow-card border-0">
          <CheckCircle2 className="mx-auto h-14 w-14 text-success mb-4" />
          <h1 className="text-2xl font-bold mb-2">تم تأكيد حجزك</h1>
          <p className="text-muted-foreground">سيتم التواصل معك قريباً على رقم {phone}</p>
          <p className="mt-4 text-sm">الموعد: <span className="font-bold">{date} - {time}</span></p>
          <Button className="mt-6 w-full" onClick={() => { setDone(false); setName(""); setPhone(""); setComplaint(""); setTime(""); }}>
            حجز جديد
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-soft via-background to-accent/10">
      <Card className="w-full max-w-lg p-8 shadow-card border-0">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-glow">
            <Stethoscope className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">حجز موعد جديد</h1>
          <p className="text-sm text-muted-foreground mt-1">املأ النموذج لحجز موعدك في العيادة</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>الاسم الكامل</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
          </div>
          <div className="space-y-2">
            <Label>رقم الهاتف</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} required dir="ltr" inputMode="tel" />
          </div>
          <div className="space-y-2">
            <Label>التاريخ</Label>
            <Input type="date" value={date} min={todayStr()} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>الأوقات المتاحة</Label>
            {loadingSlots ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> جاري التحميل...
              </div>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد أوقات متاحة في هذا التاريخ</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slots.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setTime(s)}
                    className={`rounded-md border px-2 py-2 text-sm transition-colors ${
                      time === s ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>الشكوى (اختياري)</Label>
            <Textarea value={complaint} onChange={(e) => setComplaint(e.target.value)} maxLength={500} rows={3} />
          </div>
          <Button type="submit" disabled={busy} className="w-full gradient-primary text-primary-foreground hover:opacity-90">
            {busy && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            تأكيد الحجز
          </Button>
        </form>
      </Card>
    </div>
  );
}
