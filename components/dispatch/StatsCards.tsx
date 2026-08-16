"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList, Clock, CheckCircle, PoundSterling, CalendarDays, TrendingUp,
} from "lucide-react";

interface Stats {
  total: number; pending: number; confirmed: number;
  completed: number; todayCount: number; revenue: number;
  platformRevenue: number;
}

const cards = [
  { key: "total", label: "Total Bookings", icon: ClipboardList, color: "from-blue-500 to-blue-600" },
  { key: "pending", label: "Pending", icon: Clock, color: "from-amber-500 to-amber-600" },
  { key: "confirmed", label: "Confirmed", icon: TrendingUp, color: "from-green-500 to-green-600" },
  { key: "completed", label: "Completed", icon: CheckCircle, color: "from-emerald-500 to-emerald-600" },
  { key: "todayCount", label: "Today", icon: CalendarDays, color: "from-purple-500 to-purple-600" },
  { key: "revenue", label: "Revenue", icon: PoundSterling, color: "from-crimson to-crimson-dark", isCurrency: true },
  { key: "platformRevenue", label: "Platform (15%)", icon: TrendingUp, color: "from-indigo-500 to-indigo-600", isCurrency: true },
] as const;

export default function StatsCards() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/bookings/stats").then((r) => r.json()).then((d: Stats) => {
      d.platformRevenue = Math.round(d.revenue * 0.15 * 100) / 100;
      setStats(d);
    }).catch(() => {});
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
      {cards.map(({ key, label, icon: Icon, color, ...rest }, i) => (
        <motion.div key={key}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-white rounded-2xl p-3.5 sm:p-5 border border-gray-100 shadow-sm">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-2 sm:mb-3`}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <p className="text-navy/50 text-[10px] sm:text-xs font-medium mb-0.5 sm:mb-1">{label}</p>
          <p className="text-lg sm:text-2xl font-bold text-navy">
            {"isCurrency" in rest && rest.isCurrency ? "£" : ""}
            {stats ? (stats[key as keyof Stats] as number).toLocaleString() : "—"}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
