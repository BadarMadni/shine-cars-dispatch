"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone, Clock, Car, Palette, Hash, Loader2, Shield, Power } from "lucide-react";
import StatusBadge from "@/components/dispatch/StatusBadge";
import DriverBookingStats from "@/components/dispatch/DriverBookingStats";
import DriverBookingsList from "@/components/dispatch/DriverBookingsList";

interface Driver {
  id: string; name: string; email: string; phone: string;
  status: string; isAvailable: boolean; isEnabled: boolean;
  vehicleMake?: string; vehicleColor?: string; vehicleReg?: string;
  createdAt: string;
  bookings: { id: string; pickup: string; dropoff: string; date: string; time: string; status: string; fare?: number; vehicle?: string }[];
}

export default function DriverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/drivers/${id}`)
      .then((r) => r.json())
      .then((d) => setDriver(d.driver || null))
      .catch(() => setDriver(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="w-6 h-6 text-navy/30 animate-spin" />
    </div>
  );

  if (!driver) return (
    <div className="text-center py-20">
      <p className="text-navy/40">Driver not found.</p>
      <button onClick={() => router.back()} className="text-crimson text-sm mt-2 cursor-pointer">Go back</button>
    </div>
  );

  const initials = driver.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const avail = !driver.isAvailable
    ? { bg: "bg-gray-100 text-gray-500", dot: "bg-gray-400", label: "Offline" }
    : { bg: "bg-green-50 text-green-600", dot: "bg-green-500", label: "Available" };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-navy via-navy/90 to-crimson/80 rounded-2xl p-5 sm:p-7 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-20 w-24 h-24 bg-white/5 rounded-full translate-y-1/2" />
        <button onClick={() => router.back()} className="relative z-10 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer mb-4 backdrop-blur-sm">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-xl font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold truncate">{driver.name}</h1>
              <StatusBadge status={driver.status} />
              {driver.status === "approved" && (
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${avail.bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${avail.dot}`} />{avail.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 text-white/60 text-xs flex-wrap">
              <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{driver.email}</span>
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{driver.phone}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Joined {new Date(driver.createdAt).toLocaleDateString("en-GB")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle + Quick Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Car, label: "Vehicle", value: driver.vehicleMake || "Not set", color: "text-blue-600", bg: "bg-blue-50" },
          { icon: Palette, label: "Colour", value: driver.vehicleColor || "Not set", color: "text-purple-600", bg: "bg-purple-50" },
          { icon: Hash, label: "Reg No.", value: driver.vehicleReg || "Not set", color: "text-amber-600", bg: "bg-amber-50", bold: true },
        ].map(({ icon: Icon, label, value, color, bg, bold }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-navy/40 font-medium">{label}</p>
              <p className={`text-sm text-navy truncate ${bold ? "font-bold" : "font-semibold"}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      <DriverBookingStats bookings={driver.bookings} />
      <DriverBookingsList bookings={driver.bookings} />
    </div>
  );
}
