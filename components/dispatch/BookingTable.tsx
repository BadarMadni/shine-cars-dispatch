"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, Phone, ChevronLeft, ChevronRight } from "lucide-react";
import StatusBadge from "@/components/dispatch/StatusBadge";
import BookingDetail from "@/components/dispatch/BookingDetail";

interface Booking {
  id: string; name: string; phone: string;
  pickup: string; dropoff: string;
  date: string; time: string;
  distance: number; fare: number;
  status: string; createdAt: string; notes: string | null;
}

export default function BookingTable({ filter }: { filter: string }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [selected, setSelected] = useState<Booking | null>(null);

  const load = useCallback(() => {
    fetch(`/api/bookings?status=${filter}&page=${page}&limit=10`)
      .then((r) => r.json())
      .then((d) => { setBookings(d.bookings || []); setPages(d.pages || 1); })
      .catch(() => {});
  }, [filter, page]);

  useEffect(() => { load(); }, [load]);

  if (!bookings.length) {
    return <p className="text-center text-navy/40 py-12 text-sm">No bookings found.</p>;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {["Customer", "Pickup", "Drop-off", "Date", "Fare", "Status", ""].map((h) => (
                <th key={h} className="text-left text-navy/40 font-medium text-xs py-3 px-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bookings.map((b, i) => (
              <motion.tr key={b.id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="py-3.5 px-4">
                  <p className="font-semibold text-navy">{b.name}</p>
                  <p className="text-navy/40 text-xs flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {b.phone}
                  </p>
                </td>
                <td className="py-3.5 px-4">
                  <p className="text-navy/70 text-xs flex items-center gap-1 max-w-[200px] truncate">
                    <MapPin className="w-3 h-3 text-green-500 shrink-0" /> {b.pickup}
                  </p>
                </td>
                <td className="py-3.5 px-4">
                  <p className="text-navy/70 text-xs flex items-center gap-1 max-w-[200px] truncate">
                    <Navigation className="w-3 h-3 text-crimson shrink-0" /> {b.dropoff}
                  </p>
                </td>
                <td className="py-3.5 px-4 text-navy/60 text-xs whitespace-nowrap">{b.date} {b.time}</td>
                <td className="py-3.5 px-4 font-bold text-navy">&pound;{b.fare.toFixed(2)}</td>
                <td className="py-3.5 px-4"><StatusBadge status={b.status} /></td>
                <td className="py-3.5 px-4">
                  <button onClick={() => setSelected(b)}
                    className="text-crimson text-xs font-medium hover:underline cursor-pointer">
                    View
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <p className="text-navy/40 text-xs">Page {page} of {pages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
              className="p-2 rounded-lg border border-gray-200 text-navy/50 hover:bg-gray-50 disabled:opacity-30 cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages}
              className="p-2 rounded-lg border border-gray-200 text-navy/50 hover:bg-gray-50 disabled:opacity-30 cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {selected && <BookingDetail booking={selected} onClose={() => { setSelected(null); load(); }} />}
    </>
  );
}
