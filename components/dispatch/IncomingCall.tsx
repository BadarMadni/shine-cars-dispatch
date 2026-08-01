"use client";

import { motion } from "framer-motion";
import { Phone, PhoneOff, User, MapPin, Navigation } from "lucide-react";
import { playNotificationSound } from "@/components/dispatch/NotificationSound";
import { useEffect } from "react";

interface ActiveBooking {
  id: string; pickup: string; dropoff: string; date: string; time: string; status: string;
}

interface CallerInfo {
  number: string;
  name?: string;
  lastPickup?: string;
  totalTrips?: number;
  activeBooking?: ActiveBooking;
}

interface Props {
  caller: CallerInfo;
  onAccept: () => void;
  onReject: () => void;
}

export default function IncomingCall({ caller, onAccept, onReject }: Props) {
  useEffect(() => {
    playNotificationSound();
    const interval = setInterval(playNotificationSound, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-navy rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden text-center"
      >
        {/* Pulsing ring animation */}
        <div className="pt-10 pb-6 relative">
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-green-500/20"
          />
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-green-500/10"
          />
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto relative">
            <motion.div animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}>
              <Phone className="w-8 h-8 text-green-400" />
            </motion.div>
          </div>
        </div>

        <p className="text-green-400 text-xs font-semibold tracking-wider uppercase mb-2">
          Incoming Call
        </p>
        <h3 className="text-white text-2xl font-bold mb-1">
          {caller.name || "Unknown Caller"}
        </h3>
        <p className="text-white/50 text-sm mb-1">{caller.number}</p>

        {caller.totalTrips !== undefined && (
          <div className="flex items-center justify-center gap-4 text-white/40 text-xs mt-3 mb-2">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" /> {caller.totalTrips} trips
            </span>
            {caller.lastPickup && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {caller.lastPickup}
              </span>
            )}
          </div>
        )}

        {caller.activeBooking && (
          <div className="mx-6 mb-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left">
            <p className="text-amber-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Active Booking — {caller.activeBooking.status}</p>
            <div className="flex items-start gap-2 text-xs text-white/70">
              <Navigation className="w-3 h-3 mt-0.5 text-amber-400 shrink-0" />
              <div>
                <p>{caller.activeBooking.pickup}</p>
                <p className="text-white/40">→ {caller.activeBooking.dropoff}</p>
                <p className="text-white/30 mt-1">{caller.activeBooking.date} at {caller.activeBooking.time}</p>
              </div>
            </div>
          </div>
        )}

        {/* Accept / Reject buttons */}
        <div className="flex gap-4 p-8 pt-6 justify-center">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={onReject}
            className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center cursor-pointer shadow-lg shadow-red-500/30">
            <PhoneOff className="w-7 h-7 text-white" />
          </motion.button>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={onAccept}
            className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center cursor-pointer shadow-lg shadow-green-500/30">
            <Phone className="w-7 h-7 text-white" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
