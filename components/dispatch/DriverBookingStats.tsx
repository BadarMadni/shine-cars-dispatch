"use client";

import { CheckCircle, Clock, XCircle, TrendingUp, Car, Navigation } from "lucide-react";

interface Booking {
  id: string; status: string; fare?: number;
}

const STAT_CONFIG = [
  { key: "total", label: "Total Rides", icon: Car, gradient: "from-blue-500 to-blue-600", bg: "bg-blue-50", color: "text-blue-600" },
  { key: "completed", label: "Completed", icon: CheckCircle, gradient: "from-green-500 to-green-600", bg: "bg-green-50", color: "text-green-600" },
  { key: "active", label: "Active", icon: Navigation, gradient: "from-orange-500 to-orange-600", bg: "bg-orange-50", color: "text-orange-600" },
  { key: "cancelled", label: "Cancelled", icon: XCircle, gradient: "from-red-500 to-red-600", bg: "bg-red-50", color: "text-red-600" },
  { key: "pending", label: "Pending", icon: Clock, gradient: "from-amber-500 to-amber-600", bg: "bg-amber-50", color: "text-amber-600" },
  { key: "earnings", label: "Total Earned", icon: TrendingUp, gradient: "from-purple-500 to-purple-600", bg: "bg-purple-50", color: "text-purple-600" },
];

export default function DriverBookingStats({ bookings }: { bookings: Booking[] }) {
  const counts: Record<string, number> = {
    total: bookings.length,
    completed: bookings.filter((b) => b.status === "completed").length,
    active: bookings.filter((b) => ["accepted", "arrived", "in-progress"].includes(b.status)).length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
    pending: bookings.filter((b) => ["pending", "confirmed", "assigned"].includes(b.status)).length,
    earnings: bookings.filter((b) => b.status === "completed").reduce((sum, b) => sum + (b.fare || 0), 0),
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {STAT_CONFIG.map(({ key, label, icon: Icon, gradient, bg, color }) => (
        <div key={key} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center`}>
              <Icon className={`w-4.5 h-4.5 ${color}`} />
            </div>
            <div className={`h-1.5 w-8 rounded-full bg-gradient-to-r ${gradient} opacity-40`} />
          </div>
          <p className={`text-2xl font-bold ${color}`}>
            {key === "earnings" ? `£${counts[key].toFixed(2)}` : counts[key]}
          </p>
          <p className="text-[11px] text-navy/40 font-medium mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}
