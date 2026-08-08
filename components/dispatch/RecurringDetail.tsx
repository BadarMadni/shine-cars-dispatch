"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, UserCheck, MapPin, Navigation, Clock, Car, Calendar, Phone, User, CheckCircle } from "lucide-react";

interface RideRecord { id: string; status: string; date: string; time: string; fare: number }
interface RecurringBooking {
  id: string; name: string; phone: string; pickup: string; dropoff: string;
  time: string; vehicle: string; fare: number; distance: number; days: string; isActive: boolean;
  customer: { companyName: string | null; accountType: string };
  driver?: { id: string; name: string } | null;
  bookings?: RideRecord[];
}
interface Driver { id: string; name: string; isAvailable: boolean }
const ALL_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const statusCls: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-600", confirmed: "bg-blue-50 text-blue-600", assigned: "bg-purple-50 text-purple-600",
  accepted: "bg-indigo-50 text-indigo-600", arrived: "bg-cyan-50 text-cyan-600", "in-progress": "bg-orange-50 text-orange-600",
  completed: "bg-green-50 text-green-600", cancelled: "bg-red-50 text-red-500",
};

export default function RecurringDetail({ item, onClose }: { item: RecurringBooking; onClose: () => void }) {
  const [driverId, setDriverId] = useState(item.driver?.id || "");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [saving, setSaving] = useState(false);
  const [rides, setRides] = useState<RideRecord[]>([]);
  const days: string[] = (() => { try { return JSON.parse(item.days); } catch { return []; } })();
  const STATUSES = ["pending", "confirmed", "assigned", "accepted", "arrived", "in-progress", "completed", "cancelled"];

  useEffect(() => {
    fetch("/api/drivers?status=approved").then((r) => r.json()).then((d) => setDrivers(d.drivers || [])).catch(() => {});
    fetch(`/api/recurring/${item.id}`).then((r) => r.json()).then((d) => setRides(d.recurring?.bookings || [])).catch(() => {});
  }, [item.id]);

  const save = async () => {
    setSaving(true);
    await fetch(`/api/recurring/${item.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driverId: driverId || null }),
    });
    setSaving(false);
    onClose();
  };

  const updateRideStatus = async (rideId: string, status: string) => {
    await fetch(`/api/bookings/${rideId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setRides((prev) => prev.map((r) => r.id === rideId ? { ...r, status } : r));
  };

  const completedRides = rides.filter((r) => r.status === "completed").length;
  const thisWeekStart = new Date(); thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay() + 1);
  const weekStr = thisWeekStart.toISOString().split("T")[0];
  const thisWeekRides = rides.filter((r) => r.date >= weekStr);
  const thisWeekCompleted = thisWeekRides.filter((r) => r.status === "completed").length;

  const selectCls = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-navy outline-none focus:border-crimson/50";
  const infoCls = "flex items-start gap-2.5 text-sm text-navy/70";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-navy">Recurring Booking</h3>
            <p className="text-navy/40 text-xs mt-0.5">{item.customer.companyName || "Individual"}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${item.isActive ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
              {item.isActive ? "Active" : "Inactive"}
            </span>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-navy/40 cursor-pointer"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className={infoCls}><User className="w-4 h-4 text-navy/30 mt-0.5 shrink-0" /><div><p className="text-navy/40 text-xs">Passenger</p><p className="font-medium text-navy">{item.name}</p></div></div>
            <div className={infoCls}><Phone className="w-4 h-4 text-navy/30 mt-0.5 shrink-0" /><div><p className="text-navy/40 text-xs">Phone</p><p className="font-medium text-navy">{item.phone}</p></div></div>
          </div>
          <div className="space-y-2">
            <div className={infoCls}><MapPin className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /><div><p className="text-navy/40 text-xs">Pickup</p><p className="font-medium text-navy">{item.pickup}</p></div></div>
            <div className={infoCls}><Navigation className="w-4 h-4 text-crimson mt-0.5 shrink-0" /><div><p className="text-navy/40 text-xs">Drop-off</p><p className="font-medium text-navy">{item.dropoff}</p></div></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className={infoCls}><Clock className="w-4 h-4 text-navy/30 mt-0.5 shrink-0" /><div><p className="text-navy/40 text-xs">Time</p><p className="font-medium text-navy">{item.time}</p></div></div>
            <div className={infoCls}><Car className="w-4 h-4 text-navy/30 mt-0.5 shrink-0" /><div><p className="text-navy/40 text-xs">Vehicle</p><p className="font-medium text-navy uppercase">{item.vehicle}</p></div></div>
            <div><p className="text-navy/40 text-xs">Fare</p><p className="font-bold text-crimson text-lg">&pound;{item.fare.toFixed(2)}</p></div>
          </div>

          <div>
            <p className="text-navy/40 text-xs font-medium mb-2">Schedule</p>
            <div className="flex flex-wrap gap-1.5">
              {ALL_DAYS.map((d) => (
                <span key={d} className={`px-2.5 py-1 rounded-lg text-xs font-bold ${days.includes(d) ? "bg-crimson/10 text-crimson border border-crimson/30" : "bg-gray-100 text-navy/20"}`}>{d.slice(0, 3).toUpperCase()}</span>
              ))}
            </div>
          </div>

          {/* Weekly Stats */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <p className="text-navy text-sm font-semibold">Completion Stats</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div><p className="text-2xl font-bold text-navy">{thisWeekCompleted}/{thisWeekRides.length}</p><p className="text-navy/40 text-xs">This Week</p></div>
              <div><p className="text-2xl font-bold text-navy">{completedRides}/{rides.length}</p><p className="text-navy/40 text-xs">All Time</p></div>
            </div>
          </div>

          {/* Ride History */}
          {rides.length > 0 && (
            <div>
              <p className="text-navy/40 text-xs font-medium mb-2"><Calendar className="w-3.5 h-3.5 inline mr-1" />Recent Rides</p>
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                {rides.slice(0, 10).map((r) => (
                  <div key={r.id} className="flex items-center gap-2 py-2 px-3 bg-gray-50 rounded-lg text-xs">
                    <span className="text-navy/60 shrink-0">{r.date}</span>
                    <span className="font-bold text-navy shrink-0">&pound;{r.fare.toFixed(2)}</span>
                    <select value={r.status} onChange={(e) => updateRideStatus(r.id, e.target.value)}
                      className={`text-xs font-semibold px-2 py-1 rounded-md border-0 outline-none cursor-pointer ${statusCls[r.status] || "bg-gray-100 text-gray-500"}`}>
                      {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-gray-100">
            <label className="block text-navy/60 text-xs font-medium mb-1.5">
              <UserCheck className="w-3.5 h-3.5 inline mr-1" />Assign Driver
            </label>
            <select value={driverId} onChange={(e) => setDriverId(e.target.value)} className={selectCls}>
              <option value="">Unassigned</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>{d.name} {d.isAvailable ? "(Available)" : "(Busy)"}</option>
              ))}
            </select>
            {item.driver && <p className="text-xs text-navy/40 mt-1">Currently: {item.driver.name}</p>}
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-navy/60 font-medium text-sm hover:bg-gray-50 cursor-pointer">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-crimson to-crimson-dark text-white font-bold text-sm cursor-pointer disabled:opacity-60">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
