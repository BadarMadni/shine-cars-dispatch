"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, UserCheck, MapPin, Navigation, Clock, Car, Calendar, Phone, User } from "lucide-react";

interface LatestBooking { id: string; status: string; date: string }
interface RecurringBooking {
  id: string; name: string; phone: string; pickup: string; dropoff: string;
  time: string; vehicle: string; fare: number; distance: number; days: string; isActive: boolean;
  customer: { companyName: string | null; accountType: string };
  driver?: { id: string; name: string } | null;
  bookings?: LatestBooking[];
}
interface Driver { id: string; name: string; isAvailable: boolean }
const ALL_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const STATUSES = ["pending", "confirmed", "assigned", "accepted", "arrived", "in-progress", "completed", "cancelled"];
const statusCls: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-600", confirmed: "bg-blue-50 text-blue-600", assigned: "bg-purple-50 text-purple-600",
  accepted: "bg-indigo-50 text-indigo-600", arrived: "bg-cyan-50 text-cyan-600", "in-progress": "bg-orange-50 text-orange-600",
  completed: "bg-green-50 text-green-600", cancelled: "bg-red-50 text-red-500",
};

export default function RecurringDetail({ item, onClose }: { item: RecurringBooking; onClose: () => void }) {
  const [driverId, setDriverId] = useState(item.driver?.id || "");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [saving, setSaving] = useState(false);
  const [bookingStatus, setBookingStatus] = useState(item.bookings?.[0]?.status || "");
  const latestBooking = item.bookings?.[0];
  const days: string[] = (() => { try { return JSON.parse(item.days); } catch { return []; } })();

  useEffect(() => {
    fetch("/api/drivers?status=approved").then((r) => r.json()).then((d) => setDrivers(d.drivers || [])).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    await fetch(`/api/recurring/${item.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driverId: driverId || null }),
    });
    if (latestBooking && bookingStatus !== latestBooking.status) {
      await fetch(`/api/bookings/${latestBooking.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: bookingStatus, driverId: driverId || undefined }),
      });
    }
    setSaving(false);
    onClose();
  };

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
            <p className="text-navy/40 text-xs mt-0.5">{item.customer.companyName || "Company"}</p>
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
                <span key={d} className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  days.includes(d) ? "bg-crimson/10 text-crimson border border-crimson/30" : "bg-gray-100 text-navy/20"
                }`}>{d.slice(0, 3).toUpperCase()}</span>
              ))}
            </div>
          </div>

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

          {latestBooking && (
            <div className="pt-2 border-t border-gray-100">
              <label className="block text-navy/60 text-xs font-medium mb-1.5">
                <Calendar className="w-3.5 h-3.5 inline mr-1" />Latest Ride Status
                <span className="text-navy/30 ml-1">({latestBooking.date})</span>
              </label>
              <select value={bookingStatus} onChange={(e) => setBookingStatus(e.target.value)} className={selectCls}>
                {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
              <span className={`inline-block mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-lg ${statusCls[bookingStatus] || ""}`}>
                {bookingStatus.charAt(0).toUpperCase() + bookingStatus.slice(1)}
              </span>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-navy/60 font-medium text-sm hover:bg-gray-50 cursor-pointer">
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-crimson to-crimson-dark text-white font-bold text-sm cursor-pointer disabled:opacity-60">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
