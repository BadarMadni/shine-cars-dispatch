"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Printer, PoundSterling, Percent, FileText, CheckCircle, Trash2 } from "lucide-react";

interface InvoiceItem {
  id: string; fare: number; date: string; pickup: string; dropoff: string;
  booking?: { vehicle?: string; time?: string; status?: string };
}
interface Invoice {
  id: string; weekStart: string; weekEnd: string; totalFares: number;
  commissionRate: number; commissionAmount: number; licenceFee: number;
  otherCharges: number; otherChargesNote?: string; netPayable: number;
  status: string; createdAt: string;
  driver: { name: string; email: string; phone: string };
  items: InvoiceItem[];
}

function fmtDate(d: string) { const p = d.split("-"); return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d; }

export default function DriverInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [otherAmt, setOtherAmt] = useState("");
  const [otherNote, setOtherNote] = useState("");
  const [savingOther, setSavingOther] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    fetch(`/api/driver-invoices/${id}`).then((r) => r.json()).then((d) => {
      setInvoice(d.invoice || null);
      setOtherAmt(String(d.invoice?.otherCharges || "0"));
      setOtherNote(d.invoice?.otherChargesNote || "");
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const toggleStatus = async () => {
    if (!invoice) return;
    setUpdating(true);
    const newStatus = invoice.status === "paid" ? "unpaid" : "paid";
    await fetch(`/api/driver-invoices/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    load();
    setUpdating(false);
  };

  const deleteInvoice = async () => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    setDeleting(true);
    await fetch(`/api/driver-invoices/${id}`, { method: "DELETE" });
    router.push("/driver-invoices");
  };

  const saveOtherCharges = async () => {
    setSavingOther(true);
    await fetch(`/api/driver-invoices/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otherCharges: otherAmt, otherChargesNote: otherNote }),
    });
    load();
    setSavingOther(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-navy/30 animate-spin" /></div>;
  if (!invoice) return <div className="text-center py-20 text-navy/40">Invoice not found</div>;

  const paid = invoice.status === "paid";
  const cards = [
    { label: "Total Fares", value: `£${invoice.totalFares.toFixed(2)}`, icon: PoundSterling, color: "text-blue-600", bg: "bg-blue-50" },
    { label: `Commission (${invoice.commissionRate}%)`, value: `£${invoice.commissionAmount.toFixed(2)}`, icon: Percent, color: "text-crimson", bg: "bg-red-50" },
    { label: "Licence Fee", value: `£${invoice.licenceFee.toFixed(2)}`, icon: FileText, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Net Payable", value: `£${invoice.netPayable.toFixed(2)}`, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 print:p-0">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer">
            <ArrowLeft className="w-4 h-4 text-navy" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-navy">{invoice.driver.name}</h1>
            <p className="text-navy/40 text-xs">{fmtDate(invoice.weekStart)} – {fmtDate(invoice.weekEnd)}</p>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${paid ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"}`}>
            {invoice.status}
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={deleteInvoice} disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-sm font-medium text-red-600 cursor-pointer transition-colors">
            <Trash2 className="w-4 h-4" /> {deleting ? "..." : "Delete"}
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-medium text-navy cursor-pointer transition-colors">
            <Printer className="w-4 h-4" /> Export PDF
          </button>
          <button onClick={toggleStatus} disabled={updating}
            className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-colors ${paid ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-green-500 hover:bg-green-600 text-white"}`}>
            {updating ? "..." : paid ? "Mark Unpaid" : "Mark Paid"}
          </button>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold">Shine Cars — Driver Invoice</h1>
        <p className="text-sm text-gray-500">Driver: {invoice.driver.name} | {fmtDate(invoice.weekStart)} – {fmtDate(invoice.weekEnd)} | Status: {invoice.status.toUpperCase()}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(({ label, value, icon: Icon, color, bg }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 print:border print:shadow-none">
            <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-2`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-[10px] text-navy/40 font-medium uppercase">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </motion.div>
        ))}
      </div>

      {/* Other Charges */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 print:hidden">
        <h3 className="text-sm font-bold text-navy mb-3">Other Charges</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-navy/40 text-sm">£</span>
            <input type="number" value={otherAmt} onChange={(e) => setOtherAmt(e.target.value)}
              className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-crimson/40" min="0" step="0.5" />
          </div>
          <input value={otherNote} onChange={(e) => setOtherNote(e.target.value)} placeholder="Reason (optional)"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-crimson/40" />
          <button onClick={saveOtherCharges} disabled={savingOther}
            className="bg-navy hover:bg-navy/80 text-white px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors">
            {savingOther ? "..." : "Save"}
          </button>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-bold text-navy">{invoice.items.length} Ride{invoice.items.length !== 1 ? "s" : ""}</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {["#", "Date", "Pickup", "Dropoff", "Vehicle", "Fare", `Commission (${invoice.commissionRate}%)`].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold text-navy/40 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => {
              const comm = Math.round(item.fare * (invoice.commissionRate / 100) * 100) / 100;
              return (
                <tr key={item.id} className="border-b border-gray-50">
                  <td className="px-4 py-2.5 text-navy/40">{i + 1}</td>
                  <td className="px-4 py-2.5 text-navy/60 text-xs">{fmtDate(item.date)}</td>
                  <td className="px-4 py-2.5 text-navy text-xs max-w-[180px] truncate">{item.pickup}</td>
                  <td className="px-4 py-2.5 text-navy text-xs max-w-[180px] truncate">{item.dropoff}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      item.booking?.vehicle === "mpv" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                    }`}>{item.booking?.vehicle || "car"}</span>
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-navy">£{item.fare.toFixed(2)}</td>
                  <td className="px-4 py-2.5 font-semibold text-crimson">£{comm.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
