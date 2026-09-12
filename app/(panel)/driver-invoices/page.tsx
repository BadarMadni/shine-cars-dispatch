"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FileText, Plus, Search } from "lucide-react";
import GenerateInvoicesModal from "@/components/dispatch/GenerateInvoicesModal";

interface Invoice {
  id: string; weekStart: string; weekEnd: string; totalFares: number;
  commissionRate: number; commissionAmount: number; licenceFee: number;
  otherCharges: number; netPayable: number; status: string; createdAt: string;
  driver: { name: string; email: string; phone: string };
  _count: { items: number };
}

const TABS = ["all", "unpaid", "paid"] as const;

function fmtDate(d: string) {
  const p = d.split("-");
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d;
}

export default function DriverInvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [tab, setTab] = useState<typeof TABS[number]>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (tab !== "all") params.set("status", tab);
    const r = await fetch(`/api/driver-invoices?${params}`);
    const d = await r.json();
    setInvoices(d.invoices || []);
    setTotal(d.total || 0);
    setPages(d.pages || 1);
    setLoading(false);
  }, [page, tab]);

  useEffect(() => { load(); }, [load]);

  const filtered = search
    ? invoices.filter((inv) => inv.driver.name.toLowerCase().includes(search.toLowerCase()))
    : invoices;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-crimson" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-navy">Driver Invoices</h1>
            <p className="text-navy/50 text-xs sm:text-sm">Weekly billing for drivers with commission & licence fee.</p>
          </div>
        </div>
        <button onClick={() => setShowGenerate(true)}
          className="flex items-center gap-2 bg-crimson hover:bg-crimson-dark text-white px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-colors">
          <Plus className="w-4 h-4" /> Generate
        </button>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button key={t} onClick={() => { setTab(t); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize cursor-pointer transition-colors ${
                tab === t ? "bg-crimson text-white" : "bg-gray-100 text-navy/50 hover:bg-gray-200"
              }`}>{t}</button>
          ))}
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/30" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search driver..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-crimson/40" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Driver", "Week", "Rides", "Total Fares", "Commission", "Licence", "Net Payable", "Status"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-navy/40 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-navy/30">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-navy/30">No invoices found</td></tr>
              ) : filtered.map((inv, i) => (
                <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  onClick={() => router.push(`/driver-invoices/${inv.id}`)}
                  className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors">
                  <td className="px-4 py-3 font-semibold text-navy">{inv.driver.name}</td>
                  <td className="px-4 py-3 text-navy/60 text-xs">{fmtDate(inv.weekStart)} – {fmtDate(inv.weekEnd)}</td>
                  <td className="px-4 py-3 text-navy/60">{inv._count.items}</td>
                  <td className="px-4 py-3 font-semibold text-navy">£{inv.totalFares.toFixed(2)}</td>
                  <td className="px-4 py-3 text-crimson font-semibold">{inv.commissionRate}% (£{inv.commissionAmount.toFixed(2)})</td>
                  <td className="px-4 py-3 text-amber-600 font-medium">£{inv.licenceFee.toFixed(2)}</td>
                  <td className="px-4 py-3 font-bold text-green-600">£{inv.netPayable.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                      inv.status === "paid" ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
                    }`}>{inv.status}</span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-navy/40">{total} invoices</p>
            <div className="flex gap-1">
              {Array.from({ length: pages }, (_, i) => (
                <button key={i} onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold cursor-pointer ${
                    page === i + 1 ? "bg-crimson text-white" : "text-navy/40 hover:bg-gray-100"
                  }`}>{i + 1}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      <GenerateInvoicesModal open={showGenerate} onClose={() => setShowGenerate(false)} onGenerated={() => { setShowGenerate(false); load(); }} />
    </div>
  );
}
