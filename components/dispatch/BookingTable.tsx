"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, Navigation, Phone, ChevronLeft, ChevronRight } from "lucide-react";
import { Plus } from "lucide-react";
import StatusBadge from "@/components/dispatch/StatusBadge";
import BookingDetail from "@/components/dispatch/BookingDetail";
import CreateBookingModal from "@/components/dispatch/CreateBookingModal";

interface Booking {
  id: string; name: string; phone: string;
  pickup: string; dropoff: string; stops?: string | null;
  date: string; time: string;
  distance: number; fare: number;
  vehicle?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  status: string; createdAt: string; notes: string | null;
}

export default function BookingTable({ filter, search }: { filter: string; search?: string }) {
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(() => {
    const q = search ? `&search=${encodeURIComponent(search)}` : "";
    fetch(`/api/bookings?status=${filter}&page=${page}&limit=5${q}`)
      .then((r) => r.json())
      .then((d) => { setBookings(d.bookings || []); setPages(d.pages || 1); })
      .catch(() => {});
  }, [filter, page, search]);

  useEffect(() => { setPage(1); }, [search]);

  useEffect(() => {
    load();
    const iv = setInterval(load, 10000);
    return () => clearInterval(iv);
  }, [load]);

  useEffect(() => {
    const openId = searchParams.get("open");
    if (!openId || selected) return;
    fetch(`/api/bookings/${openId}`)
      .then((r) => r.json())
      .then((d) => { if (d.booking) setSelected(d.booking); })
      .catch(() => {});
  }, [searchParams, selected]);

  const createBtn = (
    <button onClick={() => setShowCreate(true)}
      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-crimson to-crimson-dark text-white text-xs font-bold cursor-pointer hover:shadow-lg transition-shadow">
      <Plus className="w-4 h-4" />New Booking
    </button>
  );

  if (!bookings.length) {
    return (
      <div className="text-center py-12">
        <div className="mb-4">{createBtn}</div>
        <p className="text-navy/40 text-sm">No bookings found.</p>
        {showCreate && <CreateBookingModal onClose={() => { setShowCreate(false); load(); }} />}
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-3 px-1">{createBtn}</div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-navy/40 font-medium text-xs py-3 px-2 sm:px-4">Customer</th>
              <th className="text-left text-navy/40 font-medium text-xs py-3 px-2 sm:px-4 hidden md:table-cell">Pickup</th>
              <th className="text-left text-navy/40 font-medium text-xs py-3 px-2 sm:px-4 hidden md:table-cell">Drop-off</th>
              <th className="text-left text-navy/40 font-medium text-xs py-3 px-2 sm:px-4">Date</th>
              <th className="text-left text-navy/40 font-medium text-xs py-3 px-2 sm:px-4 hidden sm:table-cell">Vehicle</th>
              <th className="text-left text-navy/40 font-medium text-xs py-3 px-2 sm:px-4">Fare</th>
              <th className="text-left text-navy/40 font-medium text-xs py-3 px-2 sm:px-4">Status</th>
              <th className="text-left text-navy/40 font-medium text-xs py-3 px-2 sm:px-4"></th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b, i) => (
              <motion.tr key={b.id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="py-3.5 px-2 sm:px-4">
                  <p className="font-semibold text-navy">{b.name}</p>
                  <p className="text-navy/40 text-xs flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {b.phone}
                  </p>
                </td>
                <td className="py-3.5 px-2 sm:px-4 hidden md:table-cell">
                  <p className="text-navy/70 text-xs flex items-center gap-1 max-w-[200px] truncate">
                    <MapPin className="w-3 h-3 text-green-500 shrink-0" /> {b.pickup}
                  </p>
                  {b.stops && (() => { try { const s = JSON.parse(b.stops); return s.length > 0 ? <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full font-medium mt-0.5 inline-block">{s.length} stop{s.length > 1 ? "s" : ""}</span> : null; } catch { return null; } })()}
                </td>
                <td className="py-3.5 px-2 sm:px-4 hidden md:table-cell">
                  <p className="text-navy/70 text-xs flex items-center gap-1 max-w-[200px] truncate">
                    <Navigation className="w-3 h-3 text-crimson shrink-0" /> {b.dropoff}
                  </p>
                </td>
                <td className="py-3.5 px-2 sm:px-4 text-navy/60 text-xs whitespace-nowrap">{b.date} {b.time}</td>
                <td className="py-3.5 px-2 sm:px-4 hidden sm:table-cell">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    b.vehicle === "mpv" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                  }`}>{(b.vehicle || "car").toUpperCase()}</span>
                </td>
                <td className="py-3.5 px-2 sm:px-4 font-bold text-navy">&pound;{b.fare.toFixed(2)}</td>
                <td className="py-3.5 px-2 sm:px-4"><StatusBadge status={b.status} /></td>
                <td className="py-3.5 px-2 sm:px-4">
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
      {showCreate && <CreateBookingModal onClose={() => { setShowCreate(false); load(); }} />}
    </>
  );
}
