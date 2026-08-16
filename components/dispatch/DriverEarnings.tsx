"use client";

import { motion } from "framer-motion";
import { Users, TrendingUp } from "lucide-react";

interface DriverSummary { id: string; name: string; rides: number; earnings: number }

export default function DriverEarnings({ drivers }: { drivers: DriverSummary[] }) {
  if (!drivers.length) return null;

  const maxEarnings = Math.max(...drivers.map((d) => d.earnings));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center gap-2">
        <Users className="w-4 h-4 text-navy/40" />
        <h3 className="text-sm font-bold text-navy">Driver Earnings</h3>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-navy/5 text-navy/50">{drivers.length}</span>
      </div>

      <div className="p-4 sm:p-5 space-y-3">
        {drivers.map((d, i) => (
          <motion.div key={d.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-navy to-crimson/80 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {d.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-navy truncate">{d.name}</p>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] text-navy/40 font-medium">{d.rides} rides</span>
                  <span className="text-sm font-bold text-navy flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    £{d.earnings.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(d.earnings / maxEarnings) * 100}%` }}
                  transition={{ delay: i * 0.04 + 0.2, duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-crimson to-crimson-dark rounded-full" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
