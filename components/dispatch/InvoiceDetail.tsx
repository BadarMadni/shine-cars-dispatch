"use client";

import { useState, useEffect } from "react";
import { X, MapPin, Navigation, Calendar } from "lucide-react";
import { motion } from "framer-motion";

interface InvoiceItem {
  id: string; fare: number; date: string; pickup: string; dropoff: string;
  booking: { vehicle: string; time: string; status: string };
}

interface InvoiceFull {
  id: string; weekStart: string; weekEnd: string; total: number; status: string;
  customer: { name: string; companyName: string | null; email: string; phone: string };
  items: InvoiceItem[];
}

export default function InvoiceDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const [invoice, setInvoice] = useState<InvoiceFull | null>(null);

  useEffect(() => {
    fetch(`/api/invoices/${id}`).then((r) => r.json()).then((d) => setInvoice(d.invoice)).catch(() => {});
  }, [id]);

  const toggleStatus = async () => {
    if (!invoice) return;
    const newStatus = invoice.status === "paid" ? "unpaid" : "paid";
    await fetch(`/api/invoices/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setInvoice({ ...invoice, status: newStatus });
  };

  if (!invoice) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-navy">{invoice.customer.companyName || invoice.customer.name}</h2>
            <p className="text-navy/40 text-xs">{invoice.weekStart} — {invoice.weekEnd}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"><X className="w-5 h-5 text-navy/40" /></button>
        </div>

        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
            <div>
              <p className="text-navy/50 text-xs">Total</p>
              <p className="text-2xl font-extrabold text-navy">&pound;{invoice.total.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                invoice.status === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
              }`}>{invoice.status.toUpperCase()}</span>
            </div>
          </div>

          <p className="text-navy/50 text-xs font-medium">{invoice.items.length} Bookings</p>

          {invoice.items.map((item) => (
            <div key={item.id} className="bg-gray-50 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-navy/60">
                  <Calendar className="w-3 h-3" /> {new Date(item.date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short" })}, {item.date} at {item.booking.time}
                </div>
                <span className="text-xs font-bold text-navy">&pound;{item.fare.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-navy/50">
                <MapPin className="w-3 h-3 text-green-500 shrink-0" />
                <span className="truncate">{item.pickup}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-navy/50">
                <Navigation className="w-3 h-3 text-crimson shrink-0" />
                <span className="truncate">{item.dropoff}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-5 border-t border-gray-100">
          <button onClick={toggleStatus}
            className={`w-full py-3 rounded-xl font-bold text-sm cursor-pointer transition-colors ${
              invoice.status === "paid"
                ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                : "bg-green-500 text-white hover:bg-green-600"
            }`}>
            {invoice.status === "paid" ? "Mark as Unpaid" : "Mark as Paid"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
