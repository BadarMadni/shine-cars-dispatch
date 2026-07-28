"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  X, MapPin, Navigation, Route, PoundSterling, Phone, User, Calendar, Clock, Car, CreditCard,
} from "lucide-react";
import StatusBadge from "@/components/dispatch/StatusBadge";

interface Booking {
  id: string; name: string; phone: string;
  pickup: string; dropoff: string;
  date: string; time: string;
  distance: number; fare: number;
  vehicle?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  status: string; createdAt: string; notes: string | null;
}

const statuses = ["pending", "confirmed", "in-progress", "completed", "cancelled"];

export default function BookingDetail({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const [status, setStatus] = useState(booking.status);
  const [notes, setNotes] = useState(
    booking.notes?.startsWith("stripe:") ? "" : (booking.notes || "")
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await fetch(`/api/bookings/${booking.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, notes }),
    });
    setSaving(false);
    onClose();
  };

  const rows = [
    { icon: User, color: "text-blue-500", label: "Customer", value: booking.name },
    { icon: Phone, color: "text-navy/40", label: "Phone", value: booking.phone },
    { icon: MapPin, color: "text-green-500", label: "Pickup", value: booking.pickup },
    { icon: Navigation, color: "text-crimson", label: "Drop-off", value: booking.dropoff },
    { icon: Calendar, color: "text-purple-500", label: "Date", value: booking.date },
    { icon: Clock, color: "text-purple-500", label: "Time", value: booking.time },
    { icon: Route, color: "text-gold", label: "Distance", value: `${booking.distance.toFixed(1)} miles` },
    { icon: Car, color: "text-blue-500", label: "Vehicle", value: (booking.vehicle || "car").toUpperCase() },
    { icon: PoundSterling, color: "text-gold", label: "Fare", value: `£${booking.fare.toFixed(2)}` },
    { icon: CreditCard, color: "text-indigo-500", label: "Payment", value: `${(booking.paymentMethod || "cash").toUpperCase()} — ${(booking.paymentStatus || "unpaid").toUpperCase()}` },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-navy">Booking Details</h3>
            <p className="text-navy/40 text-xs mt-0.5">ID: {booking.id.slice(0, 8)}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-navy/40 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-navy/50 text-xs">Current:</span>
            <StatusBadge status={booking.status} />
          </div>

          <div className="space-y-3">
            {rows.map(({ icon: Icon, color, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} />
                <div>
                  <p className="text-navy/40 text-xs">{label}</p>
                  <p className="text-navy text-sm font-medium">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-navy/60 text-xs font-medium mb-1.5">Update Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-navy outline-none focus:border-crimson/50">
              {statuses.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-navy/60 text-xs font-medium mb-1.5">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              placeholder="Add notes about this booking..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-navy outline-none focus:border-crimson/50 resize-none" />
          </div>
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
