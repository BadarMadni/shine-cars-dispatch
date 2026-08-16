"use client";

import { useState } from "react";
import { MapPin, Clock, Car, ChevronLeft, ChevronRight, LayoutList } from "lucide-react";
import StatusBadge from "./StatusBadge";

interface Booking {
  id: string; pickup: string; dropoff: string;
  pickupDetails?: string | null; dropoffDetails?: string | null;
  date: string; time: string; status: string; fare?: number; vehicle?: string;
  isRecurring?: boolean;
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "completed", label: "Completed" },
  { key: "active", label: "Active" },
  { key: "cancelled", label: "Cancelled" },
  { key: "pending", label: "Pending" },
];

function getFilterStatuses(f: string): string[] {
  if (f === "active") return ["accepted", "arrived", "in-progress"];
  if (f === "pending") return ["pending", "confirmed", "assigned"];
  if (f === "all") return [];
  return [f];
}

export default function DriverBookingsList({ bookings }: { bookings: Booking[] }) {
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 5;

  const statuses = getFilterStatuses(filter);
  const filtered = statuses.length ? bookings.filter((b) => statuses.includes(b.status)) : bookings;
  const totalPages = Math.ceil(filtered.length / limit);
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <LayoutList className="w-4 h-4 text-navy/40" />
          <h3 className="text-sm font-bold text-navy">Bookings</h3>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-navy/5 text-navy/50">{filtered.length}</span>
        </div>
        <div className="flex items-center gap-1.5 sm:ml-auto overflow-x-auto scrollbar-none">
          {FILTERS.map(({ key, label }) => (
            <button key={key} onClick={() => { setFilter(key); setPage(1); }}
              className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-all whitespace-nowrap ${
                filter === key
                  ? "bg-crimson text-white shadow-sm shadow-crimson/20"
                  : "bg-gray-50 text-navy/50 hover:bg-gray-100 hover:text-navy/70"
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {paginated.length === 0 ? (
        <div className="text-center py-12">
          <Car className="w-8 h-8 text-navy/10 mx-auto mb-2" />
          <p className="text-navy/30 text-sm">No bookings found.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {paginated.map((b, i) => (
            <div key={b.id} className="p-4 sm:p-5 hover:bg-gray-50/50 transition-colors">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[10px] font-bold text-navy/30 bg-navy/5 px-1.5 py-0.5 rounded">#{(page - 1) * limit + i + 1}</span>
                    <StatusBadge status={b.status} />
                    {b.vehicle && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        b.vehicle === "MPV" ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"
                      }`}>{b.vehicle}</span>
                    )}
                    {b.isRecurring && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">RECURRING</span>
                    )}
                    {b.fare != null && b.fare > 0 && (
                      <span className="text-sm font-bold text-navy ml-auto">£{b.fare.toFixed(2)}</span>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2 text-sm text-navy/70">
                      <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="w-2.5 h-2.5 text-green-600" />
                      </div>
                      <div><span className="line-clamp-1">{b.pickup}</span>{b.pickupDetails && <span className="text-amber-600 text-xs italic block">{b.pickupDetails}</span>}</div>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-navy/70">
                      <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="w-2.5 h-2.5 text-crimson" />
                      </div>
                      <div><span className="line-clamp-1">{b.dropoff}</span>{b.dropoffDetails && <span className="text-amber-600 text-xs italic block">{b.dropoffDetails}</span>}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-navy/40 font-medium">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{b.time}</span>
                  <span className="flex items-center gap-1"><Car className="w-3 h-3" />{b.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-gray-100">
          <p className="text-navy/40 text-xs">Page {page} of {totalPages}</p>
          <div className="flex gap-1.5">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
              className="p-2 rounded-lg border border-gray-200 text-navy/50 hover:bg-gray-50 disabled:opacity-30 cursor-pointer transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="p-2 rounded-lg border border-gray-200 text-navy/50 hover:bg-gray-50 disabled:opacity-30 cursor-pointer transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
