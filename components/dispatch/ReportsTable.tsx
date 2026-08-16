"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, ChevronLeft, ChevronRight } from "lucide-react";

interface Booking {
  id: string; name: string; phone: string; pickup: string; dropoff: string;
  date: string; time: string; fare: number; meterFare?: number; fareType?: string;
  vehicle?: string; paymentMethod?: string; paymentStatus?: string; cashCollected?: number;
  isRecurring?: boolean;
  driver?: { id: string; name: string } | null;
  customer?: { id: string; name: string; companyName?: string; accountType?: string } | null;
}

export default function ReportsTable({ bookings }: { bookings: Booking[] }) {
  const [page, setPage] = useState(1);
  const limit = 10;
  const totalPages = Math.ceil(bookings.length / limit);
  const paginated = bookings.slice((page - 1) * limit, page * limit);

  if (!bookings.length) return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
      <p className="text-navy/30 text-sm">No completed bookings found.</p>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {["#", "Date", "Customer", "Driver", "Route", "Vehicle", "Fare", "Payment", "Type"].map((h) => (
                <th key={h} className="text-left text-navy/40 font-medium text-xs py-3 px-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((b, i) => {
              const fare = b.meterFare || b.fare || 0;
              return (
                <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 px-3 text-navy/40 text-xs">{(page - 1) * limit + i + 1}</td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <p className="text-navy font-medium text-xs">{b.date}</p>
                    <p className="text-navy/40 text-[10px]">{b.time}</p>
                  </td>
                  <td className="py-3 px-3">
                    <p className="text-navy font-medium text-xs truncate max-w-[120px]">{b.customer?.companyName || b.name}</p>
                    <p className="text-navy/40 text-[10px]">{b.phone}</p>
                  </td>
                  <td className="py-3 px-3">
                    <p className="text-navy font-medium text-xs">{b.driver?.name || "—"}</p>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1 text-[10px] text-navy/60 mb-0.5">
                      <MapPin className="w-2.5 h-2.5 text-green-500 shrink-0" />
                      <span className="truncate max-w-[180px]">{b.pickup}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-navy/60">
                      <MapPin className="w-2.5 h-2.5 text-crimson shrink-0" />
                      <span className="truncate max-w-[180px]">{b.dropoff}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      b.vehicle === "MPV" ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"
                    }`}>{b.vehicle || "Car"}</span>
                  </td>
                  <td className="py-3 px-3 font-bold text-navy text-xs">
                    £{fare.toFixed(2)}
                    {b.fareType === "meter" && <span className="ml-1 text-[9px] font-semibold text-amber-500">METER</span>}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      b.paymentMethod === "card" ? "bg-green-50 text-green-600" : b.paymentMethod === "invoice" ? "bg-purple-50 text-purple-600" : "bg-amber-50 text-amber-600"
                    }`}>{b.paymentMethod === "invoice" ? "Invoice" : b.paymentMethod === "card" ? "Card" : "Cash"}</span>
                  </td>
                  <td className="py-3 px-3">
                    {b.isRecurring && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">RECURRING</span>}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-gray-100">
          <p className="text-navy/40 text-xs">Page {page} of {totalPages} ({bookings.length} rides)</p>
          <div className="flex gap-1.5">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
              className="p-2 rounded-lg border border-gray-200 text-navy/50 hover:bg-gray-50 disabled:opacity-30 cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="p-2 rounded-lg border border-gray-200 text-navy/50 hover:bg-gray-50 disabled:opacity-30 cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
