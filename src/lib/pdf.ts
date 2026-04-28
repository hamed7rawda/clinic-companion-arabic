import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PrescriptionPdfData {
  doctorName: string;
  specialty?: string;
  patientName: string;
  patientAge?: number | null;
  date: string;
  medications: Array<{ name: string; dosage?: string }>;
  notes?: string;
}

export function generatePrescriptionPDF(d: PrescriptionPdfData) {
  const doc = new jsPDF();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(d.doctorName || "Doctor", 105, 20, { align: "center" });
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  if (d.specialty) doc.text(d.specialty, 105, 27, { align: "center" });
  doc.line(15, 32, 195, 32);

  doc.setFontSize(11);
  doc.text(`Patient: ${d.patientName}`, 15, 42);
  if (d.patientAge) doc.text(`Age: ${d.patientAge}`, 15, 49);
  doc.text(`Date: ${d.date}`, 150, 42);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Rx", 15, 62);

  autoTable(doc, {
    startY: 66,
    head: [["#", "Medication", "Dosage"]],
    body: d.medications.map((m, i) => [String(i + 1), m.name, m.dosage ?? "-"]),
    headStyles: { fillColor: [37, 99, 235] },
    styles: { fontSize: 11, cellPadding: 4 },
  });

  if (d.notes) {
    const y = (doc as any).lastAutoTable.finalY + 10;
    doc.setFont("helvetica", "bold");
    doc.text("Notes:", 15, y);
    doc.setFont("helvetica", "normal");
    doc.text(d.notes, 15, y + 7, { maxWidth: 180 });
  }

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text("Signature: ____________________", 130, 280);
  doc.save(`prescription-${d.patientName}-${d.date}.pdf`);
}

interface InvoicePdfData {
  invoiceNumber: string;
  clinicName: string;
  patientName: string;
  date: string;
  items: Array<{ name: string; qty: number; price: number; total: number }>;
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  paymentMethod: string;
  status: string;
}

export function generateInvoicePDF(d: InvoicePdfData) {
  const doc = new jsPDF();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("INVOICE", 105, 20, { align: "center" });
  doc.setFontSize(12);
  doc.text(d.clinicName, 105, 28, { align: "center" });
  doc.line(15, 33, 195, 33);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Invoice #: ${d.invoiceNumber}`, 15, 42);
  doc.text(`Date: ${d.date}`, 15, 48);
  doc.text(`Patient: ${d.patientName}`, 15, 54);
  doc.text(`Status: ${d.status}`, 150, 42);
  doc.text(`Method: ${d.paymentMethod}`, 150, 48);

  autoTable(doc, {
    startY: 62,
    head: [["Service", "Qty", "Price", "Total"]],
    body: d.items.map((i) => [i.name, String(i.qty), i.price.toFixed(2), i.total.toFixed(2)]),
    headStyles: { fillColor: [37, 99, 235] },
  });

  const y = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  doc.text(`Subtotal: ${d.subtotal.toFixed(2)}`, 140, y);
  doc.text(`Discount: ${d.discount.toFixed(2)}`, 140, y + 7);
  doc.setFont("helvetica", "bold");
  doc.text(`Total: ${d.total.toFixed(2)}`, 140, y + 14);
  doc.text(`Paid: ${d.paid.toFixed(2)}`, 140, y + 21);
  doc.text(`Due: ${(d.total - d.paid).toFixed(2)}`, 140, y + 28);

  doc.save(`invoice-${d.invoiceNumber}.pdf`);
}
