"use client";

import { motion } from "framer-motion";
import { TrendingUp, PoundSterling, Car, Users } from "lucide-react";

interface Props {
  totalRides: number;
  totalRevenue: number;
  platformRevenue: number;
  driverCount: number;
}

const cards = [
  { key: "totalRides", label: "Total Rides", icon: Car, color: "from-blue-500 to-blue-600" },
  { key: "totalRevenue", label: "Total Revenue", icon: PoundSterling, color: "from-green-500 to-green-600", currency: true },
  { key: "platformRevenue", label: "Platform (15%)", icon: TrendingUp, color: "from-indigo-500 to-indigo-600", currency: true },
  { key: "driverCount", label: "Active Drivers", icon: Users, color: "from-purple-500 to-purple-600" },
] as const;

export default function ReportsSummary({ totalRides, totalRevenue, platformRevenue, driverCount }: Props) {
  const data = { totalRides, totalRevenue, platformRevenue, driverCount };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {cards.map(({ key, label, icon: Icon, color, ...rest }, i) => (
        <motion.div key={key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm">
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-2 sm:mb-3`}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <p className="text-navy/50 text-[10px] sm:text-xs font-medium mb-0.5">{label}</p>
          <p className="text-lg sm:text-2xl font-bold text-navy">
            {"currency" in rest && rest.currency ? "£" : ""}{data[key].toLocaleString(undefined, { minimumFractionDigits: "currency" in rest ? 2 : 0, maximumFractionDigits: 2 })}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
