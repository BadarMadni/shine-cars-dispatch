"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";

interface Props { open: boolean; onClose: () => void; onGenerated: () => void }

export default function GenerateInvoicesModal({ open, onClose, onGenerated }: Props) {
  const [weekStart, setWeekStart] = useState("");
  const [weekEnd, setWeekEnd] = useState("");
  const [driverId, setDriverId] = useState("");
  const [drivers, setDrivers] = useState<{ id: string; name: string }[]>([]);
  const [regenerate, setRegenerate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetch("/api/drivers?status=approved").then((r) => r.json()).then((d) => {
        setDrivers((d.drivers || d || []).map((dr: { id: string; name: string }) => ({ id: dr.id, name: dr.name })));
      }).catch(() => {});

      const now = new Date();
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const end = new Date(now);
      end.setDate(end.getDate() - mondayOffset);
      const start = new Date(end);
      start.setDate(start.getDate() - 7);
      setWeekStart(start.toISOString().split("T")[0]);
      setWeekEnd(end.toISOString().split("T")[0]);
      setResult(null);
    }
  }, [open]);

  const handleGenerate = async () => {
    if (!weekStart || !weekEnd) return;
    setLoading(true);
    setResult(null);
    try {
      const body: Record<string, string | boolean> = { weekStart, weekEnd };
      if (driverId) body.driverId = driverId;
      if (regenerate) body.regenerate = true;
      const r = await fetch("/api/driver-invoices/generate", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const d = await r.json();
      if (d.success) {
        setResult(`${d.invoicesCreated} invoice(s) generated`);
        if (d.invoicesCreated > 0) setTimeout(onGenerated, 1500);
      } else setResult("Failed to generate");
    } catch { setResult("Error generating invoices"); }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-navy">Generate Driver Invoices</h3>
              <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer"><X className="w-5 h-5 text-navy/40" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-navy/50 block mb-1">Week Start</label>
                <input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-crimson/40" />
              </div>
              <div>
                <label className="text-xs font-medium text-navy/50 block mb-1">Week End</label>
                <input type="date" value={weekEnd} onChange={(e) => setWeekEnd(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-crimson/40" />
              </div>
              <div>
                <label className="text-xs font-medium text-navy/50 block mb-1">Driver (optional — all if blank)</label>
                <select value={driverId} onChange={(e) => setDriverId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-crimson/40 bg-white">
                  <option value="">All Drivers</option>
                  {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={regenerate} onChange={(e) => setRegenerate(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-crimson accent-crimson cursor-pointer" />
                <span className="text-xs font-medium text-navy/50">Regenerate (delete existing invoices for this period)</span>
              </label>
            </div>

            {result && (
              <p className={`text-sm font-semibold text-center ${result.includes("0") || result.includes("Failed") || result.includes("Error") ? "text-amber-500" : "text-green-600"}`}>
                {result}
              </p>
            )}

            <button onClick={handleGenerate} disabled={loading || !weekStart || !weekEnd}
              className="w-full bg-crimson hover:bg-crimson-dark text-white py-3 rounded-xl text-sm font-bold cursor-pointer transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : "Generate Invoices"}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
