"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Eye, FileText } from "lucide-react";
import InvoiceDetail from "@/components/dispatch/InvoiceDetail";

interface Invoice {
  id: string; weekStart: string; weekEnd: string; total: number;
  status: string; createdAt: string;
  customer: { name: string; companyName: string | null; email: string; phone: string };
  _count: { items: number };
}

export default function InvoiceTable({ filter, search }: { filter: string; search?: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(() => {
    const status = filter !== "all" ? `&status=${filter}` : "";
    fetch(`/api/invoices?page=${page}&limit=10${status}`)
      .then((r) => r.json())
      .then((d) => { setInvoices(d.invoices || []); setPages(d.pages || 1); })
      .catch(() => {});
  }, [filter, page]);

  useEffect(() => { setPage(1); }, [filter, search]);
  useEffect(() => { load(); const iv = setInterval(load, 15000); return () => clearInterval(iv); }, [load]);

  const handleGenerate = async () => {
    await fetch("/api/invoices/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    load();
  };

  if (!invoices.length) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-navy/20 mx-auto mb-3" />
        <p className="text-navy/40 text-sm mb-3">No invoices found.</p>
        <button onClick={handleGenerate}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-crimson to-crimson-dark text-white text-xs font-bold cursor-pointer">
          Generate Invoices Now
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-3">
        <button onClick={handleGenerate}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-crimson to-crimson-dark text-white text-xs font-bold cursor-pointer hover:shadow-lg transition-shadow">
          Generate Invoices
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-navy/40 font-medium text-xs py-3 px-4">Company</th>
              <th className="text-left text-navy/40 font-medium text-xs py-3 px-4">Week</th>
              <th className="text-left text-navy/40 font-medium text-xs py-3 px-4">Rides</th>
              <th className="text-left text-navy/40 font-medium text-xs py-3 px-4">Total</th>
              <th className="text-left text-navy/40 font-medium text-xs py-3 px-4">Status</th>
              <th className="text-left text-navy/40 font-medium text-xs py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv, i) => (
              <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="py-3 px-4">
                  <p className="font-semibold text-navy">{inv.customer.companyName || inv.customer.name}</p>
                  <p className="text-navy/40 text-xs">{inv.customer.email}</p>
                </td>
                <td className="py-3 px-4 text-navy/60 text-xs whitespace-nowrap">{inv.weekStart} — {inv.weekEnd}</td>
                <td className="py-3 px-4 text-navy/60 text-xs">{inv._count.items}</td>
                <td className="py-3 px-4 font-bold text-navy">&pound;{inv.total.toFixed(2)}</td>
                <td className="py-3 px-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    inv.status === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                  }`}>{inv.status.toUpperCase()}</span>
                </td>
                <td className="py-3 px-4">
                  <button onClick={() => setSelected(inv.id)}
                    className="text-crimson text-xs font-medium hover:underline cursor-pointer flex items-center gap-1">
                    <Eye className="w-3 h-3" /> View
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <p className="text-navy/40 text-xs">Page {page} of {pages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
              className="p-2 rounded-lg border border-gray-200 text-navy/50 hover:bg-gray-50 disabled:opacity-30 cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages}
              className="p-2 rounded-lg border border-gray-200 text-navy/50 hover:bg-gray-50 disabled:opacity-30 cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {selected && <InvoiceDetail id={selected} onClose={() => { setSelected(null); load(); }} />}
    </>
  );
}
