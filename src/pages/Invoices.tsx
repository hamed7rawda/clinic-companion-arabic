import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Printer, DollarSign, Receipt, FileDown } from "lucide-react";
import { toast } from "sonner";
import { generateInvoicePDF } from "@/lib/pdf";
import { StatCard } from "@/components/shared/StatCard";
import { EmptyState } from "@/components/shared/EmptyState";

interface Item { service_name: string; quantity: number; unit_price: number; }
interface Invoice {
  id: string; invoice_number: string; patient_name: string; invoice_date: string;
  subtotal: number; discount: number; total: number; paid_amount: number;
  payment_method: string; status: string; notes: string | null;
}

const PAYMENT_METHODS = [
  { v: "cash", l: "نقدي" },
  { v: "card", l: "بطاقة" },
  { v: "transfer", l: "تحويل" },
  { v: "insurance", l: "تأمين" },
];
const STATUS_LABEL: Record<string, string> = {
  paid: "مدفوعة", unpaid: "دين", partial: "جزئية",
};
const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  paid: "default", partial: "secondary", unpaid: "destructive",
};

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [open, setOpen] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [discount, setDiscount] = useState("0");
  const [paid, setPaid] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Item[]>([{ service_name: "", quantity: 1, unit_price: 0 }]);

  const load = async () => {
    const { data } = await supabase
      .from("invoices").select("*").order("created_at", { ascending: false }).limit(200);
    setInvoices((data ?? []) as Invoice[]);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("invoices-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const subtotal = items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0);
  const total = Math.max(0, subtotal - (Number(discount) || 0));

  const stats = {
    total: invoices.reduce((s, i) => s + Number(i.total), 0),
    paid: invoices.reduce((s, i) => s + Number(i.paid_amount), 0),
    due: invoices.reduce((s, i) => s + (Number(i.total) - Number(i.paid_amount)), 0),
    count: invoices.length,
  };

  const addItem = () => setItems([...items, { service_name: "", quantity: 1, unit_price: 0 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, k: keyof Item, v: string | number) => {
    const next = [...items];
    (next[i] as any)[k] = v;
    setItems(next);
  };

  const reset = () => {
    setPatientName(""); setDiscount("0"); setPaid("0"); setPaymentMethod("cash");
    setNotes(""); setItems([{ service_name: "", quantity: 1, unit_price: 0 }]);
  };

  const handleSave = async () => {
    if (!patientName.trim()) return toast.error("اسم المريض مطلوب");
    const validItems = items.filter((i) => i.service_name.trim() && i.unit_price > 0);
    if (validItems.length === 0) return toast.error("أضف بنداً واحداً على الأقل");

    const paidNum = Number(paid) || 0;
    const status = paidNum >= total ? "paid" : paidNum > 0 ? "partial" : "unpaid";

    const { data: numData } = await supabase.rpc("generate_invoice_number");
    const invoice_number = numData as string;

    const { data: inv, error } = await supabase.from("invoices").insert({
      invoice_number, patient_name: patientName.trim(), subtotal,
      discount: Number(discount) || 0, total, paid_amount: paidNum,
      payment_method: paymentMethod, status, notes: notes.trim() || null,
    }).select().single();

    if (error || !inv) return toast.error("فشل الحفظ: " + (error?.message ?? ""));

    await supabase.from("invoice_items").insert(
      validItems.map((i) => ({
        invoice_id: inv.id, service_name: i.service_name, quantity: i.quantity,
        unit_price: i.unit_price, total: i.quantity * i.unit_price,
      }))
    );

    toast.success(`تم إنشاء الفاتورة ${invoice_number}`);
    reset(); setOpen(false);
  };

  const handlePrint = async (inv: Invoice) => {
    const { data: itemsData } = await supabase
      .from("invoice_items").select("*").eq("invoice_id", inv.id);
    const { data: cfg } = await supabase.from("clinic_config").select("doctor_name").maybeSingle();
    generateInvoicePDF({
      invoiceNumber: inv.invoice_number,
      clinicName: cfg?.doctor_name ?? "Clinic",
      patientName: inv.patient_name,
      date: inv.invoice_date,
      items: (itemsData ?? []).map((i: any) => ({
        name: i.service_name, qty: Number(i.quantity),
        price: Number(i.unit_price), total: Number(i.total),
      })),
      subtotal: Number(inv.subtotal), discount: Number(inv.discount),
      total: Number(inv.total), paid: Number(inv.paid_amount),
      paymentMethod: inv.payment_method, status: STATUS_LABEL[inv.status] ?? inv.status,
    });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("invoices").delete().eq("id", id);
    if (error) return toast.error("فشل الحذف");
    toast.success("تم حذف الفاتورة");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="الفواتير والمدفوعات"
        description="إدارة الفواتير وتتبع المدفوعات والديون"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 gradient-primary text-primary-foreground hover:opacity-90">
                <Plus className="h-4 w-4" /> فاتورة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl" className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>إنشاء فاتورة جديدة</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>اسم المريض</Label>
                  <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} maxLength={100} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>بنود الخدمة</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addItem}>
                      <Plus className="h-3 w-3 me-1" /> إضافة بند
                    </Button>
                  </div>
                  {items.map((it, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <Input placeholder="اسم الخدمة" value={it.service_name}
                          onChange={(e) => updateItem(i, "service_name", e.target.value)} maxLength={120} />
                      </div>
                      <div className="col-span-2">
                        <Input type="number" min="1" value={it.quantity}
                          onChange={(e) => updateItem(i, "quantity", Number(e.target.value))} />
                      </div>
                      <div className="col-span-3">
                        <Input type="number" min="0" placeholder="السعر" value={it.unit_price}
                          onChange={(e) => updateItem(i, "unit_price", Number(e.target.value))} />
                      </div>
                      <div className="col-span-2 flex gap-1 items-center">
                        <span className="text-xs text-muted-foreground flex-1">
                          {(it.quantity * it.unit_price).toFixed(2)}
                        </span>
                        {items.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>الخصم</Label>
                    <Input type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>المدفوع</Label>
                    <Input type="number" min="0" value={paid} onChange={(e) => setPaid(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>طريقة الدفع</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((p) => (
                        <SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>ملاحظات</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
                </div>

                <div className="rounded-lg bg-muted/40 p-3 space-y-1 text-sm">
                  <div className="flex justify-between"><span>المجموع:</span><span>{subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>الخصم:</span><span>{(Number(discount)||0).toFixed(2)}</span></div>
                  <div className="flex justify-between font-bold border-t pt-1">
                    <span>الإجمالي:</span><span>{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSave}>حفظ الفاتورة</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="عدد الفواتير" value={stats.count} icon={Receipt} variant="primary" />
        <StatCard title="الإجمالي" value={stats.total.toFixed(0)} icon={DollarSign} variant="accent" hint="ج.م" />
        <StatCard title="المحصّل" value={stats.paid.toFixed(0)} icon={DollarSign} variant="success" hint="ج.م" />
        <StatCard title="المتبقي (ديون)" value={stats.due.toFixed(0)} icon={DollarSign} variant="destructive" hint="ج.م" />
      </div>

      <Card className="p-0 shadow-card border-0 overflow-hidden">
        {invoices.length === 0 ? (
          <EmptyState icon={Receipt} title="لا توجد فواتير بعد" description="ابدأ بإنشاء أول فاتورة" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-right">
                <tr>
                  <th className="p-3">رقم الفاتورة</th>
                  <th className="p-3">المريض</th>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">الإجمالي</th>
                  <th className="p-3">المدفوع</th>
                  <th className="p-3">المتبقي</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-t hover:bg-muted/20">
                    <td className="p-3 font-mono text-xs">{inv.invoice_number}</td>
                    <td className="p-3 font-medium">{inv.patient_name}</td>
                    <td className="p-3 text-muted-foreground">{inv.invoice_date}</td>
                    <td className="p-3">{Number(inv.total).toFixed(2)}</td>
                    <td className="p-3 text-success">{Number(inv.paid_amount).toFixed(2)}</td>
                    <td className="p-3 text-destructive">{(Number(inv.total) - Number(inv.paid_amount)).toFixed(2)}</td>
                    <td className="p-3">
                      <Badge variant={STATUS_VARIANT[inv.status] ?? "secondary"}>
                        {STATUS_LABEL[inv.status] ?? inv.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handlePrint(inv)} title="طباعة PDF">
                          <Printer className="h-4 w-4 text-primary" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" title="حذف">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent dir="rtl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>حذف الفاتورة؟</AlertDialogTitle>
                              <AlertDialogDescription>
                                سيتم حذف الفاتورة {inv.invoice_number} وجميع بنودها نهائياً.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(inv.id)}>حذف</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
