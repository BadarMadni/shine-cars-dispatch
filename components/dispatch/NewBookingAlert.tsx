"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, MapPin, Navigation, User, Phone, Calendar, Clock, Route, PoundSterling, X, Check,
} from "lucide-react";
import { playNotificationSound } from "@/components/dispatch/NotificationSound";

interface Booking {
  id: string; name: string; phone: string;
  pickup: string; dropoff: string;
  date: string; time: string;
  distance: number; fare: number;
  status: string; createdAt: string;
}

export default function NewBookingAlert() {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [visible, setVisible] = useState(false);
  const lastIdRef = useRef<string>("");
  const initializedRef = useRef(false);

  const checkNewBookings = useCallback(async () => {
    try {
      const res = await fetch("/api/bookings?limit=1");
      const data = await res.json();

      if (!initializedRef.current) {
        lastIdRef.current = data.bookings?.[0]?.id || "";
        initializedRef.current = true;
        return;
      }

      if (!data.bookings?.length) return;
      const latest = data.bookings[0];

      if (latest.id && latest.id !== lastIdRef.current) {
        lastIdRef.current = latest.id;
        setBooking(latest);
        setVisible(true);
        playNotificationSound();
      }
    } catch {}
  }, []);

  useEffect(() => {
    checkNewBookings();
    const interval = setInterval(checkNewBookings, 5000);
    return () => clearInterval(interval);
  }, [checkNewBookings]);

  const dismiss = () => setVisible(false);

  const confirm = async () => {
    if (!booking) return;
    await fetch(`/api/bookings/${booking.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "confirmed" }),
    });
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && booking && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={dismiss}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 40 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
          >
            {/* Animated header */}
            <motion.div
              initial={{ height: 0 }} animate={{ height: "auto" }}
              className="bg-gradient-to-r from-crimson to-crimson-dark p-6 text-white text-center"
            >
              <motion.div
                animate={{ rotate: [0, -15, 15, -15, 15, 0] }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="inline-block"
              >
                <Bell className="w-10 h-10 mx-auto mb-2" />
              </motion.div>
              <h3 className="text-xl font-bold">New Booking!</h3>
              <p className="text-white/70 text-sm mt-1">A new ride has been requested</p>
            </motion.div>

            {/* Booking details */}
            <div className="p-6 space-y-3">
              {[
                { icon: User, color: "text-blue-500", label: "Customer", val: booking.name },
                { icon: Phone, color: "text-navy/40", label: "Phone", val: booking.phone },
                { icon: MapPin, color: "text-green-500", label: "Pickup", val: booking.pickup },
                { icon: Navigation, color: "text-crimson", label: "Drop-off", val: booking.dropoff },
                { icon: Calendar, color: "text-purple-500", label: "Date & Time", val: `${booking.date} at ${booking.time}` },
                { icon: Route, color: "text-gold", label: "Distance", val: `${booking.distance.toFixed(1)} miles` },
                { icon: PoundSterling, color: "text-gold", label: "Fare", val: `£${booking.fare.toFixed(2)}` },
              ].map(({ icon: Icon, color, label, val }, i) => (
                <motion.div key={label}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} />
                  <div>
                    <p className="text-navy/40 text-xs">{label}</p>
                    <p className="text-navy text-sm font-medium">{val}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={dismiss}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-navy/60 font-medium text-sm hover:bg-gray-50 cursor-pointer flex items-center justify-center gap-2">
                <X className="w-4 h-4" /> Dismiss
              </button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={confirm}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-sm cursor-pointer flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> Confirm
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
