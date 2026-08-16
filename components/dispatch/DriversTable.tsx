"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Phone, Mail, FileText, ChevronLeft, ChevronRight,
  Eye, ExternalLink, CheckCircle, XCircle, Power, Users,
} from "lucide-react";
import StatusBadge from "./StatusBadge";
import DriverDetail, { Driver } from "./DriverDetail";

export default function DriversTable({ filter, search }: { filter: string; search?: string }) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 5;

  const load = useCallback(() => {
    const q = search ? `&search=${encodeURIComponent(search)}` : "";
    fetch(`/api/drivers?status=${filter}${q}`)
      .then((r) => r.json())
      .then((d) => setDrivers(d.drivers || []))
      .catch(() => {});
  }, [filter, search]);

  useEffect(() => { load(); setPage(1); }, [load]);

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    setUpdating(id);
    try {
      await fetch(`/api/drivers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      load();
      if (selectedId === id) setSelectedId(null);
    } catch {}
    setUpdating(null);
  };

  const toggleEnabled = async (id: string, isEnabled: boolean) => {
    setUpdating(id);
    try {
      await fetch(`/api/drivers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled }),
      });
      load();
    } catch {}
    setUpdating(null);
  };

  const totalPages = Math.ceil(drivers.length / limit);
  const paginated = drivers.slice((page - 1) * limit, page * limit);

  if (!drivers.length) {
    return <p className="text-center text-navy/40 py-12 text-sm">No drivers found.</p>;
  }

  return (
    <>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-100">
              {[{ h: "Driver" }, { h: "Contact", c: "hidden sm:table-cell" }, { h: "Docs", c: "hidden lg:table-cell" },
                { h: "Licence", c: "hidden lg:table-cell" }, { h: "Availability", c: "hidden md:table-cell" }, { h: "Enabled", c: "hidden md:table-cell" },
                { h: "Status" }, { h: "Registered", c: "hidden lg:table-cell" }, { h: "Actions" },
              ].map(({ h, c }) => (
                <th key={h} className={`text-left text-navy/40 font-medium text-xs py-3 px-4 ${c || ""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((d, i) => (
              <motion.tr key={d.id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="py-3.5 px-2 sm:px-4">
                  <p className="font-semibold text-navy">{d.name}</p>
                </td>
                <td className="py-3.5 px-2 sm:px-4 hidden sm:table-cell">
                  <p className="text-navy/60 text-xs flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {d.email}
                  </p>
                  <p className="text-navy/40 text-xs flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" /> {d.phone}
                  </p>
                </td>
                <td className="py-3.5 px-2 sm:px-4 hidden lg:table-cell">
                  <span className="text-xs text-navy/60 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> {d.documents.length}
                  </span>
                </td>
                <td className="py-3.5 px-2 sm:px-4 hidden lg:table-cell">
                  {d.passengerLicense ? (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-600 flex items-center gap-1 w-fit">
                      <Users className="w-3 h-3" /> {d.passengerLicense}
                    </span>
                  ) : <span className="text-xs text-navy/30">—</span>}
                </td>
                <td className="py-3.5 px-2 sm:px-4 hidden md:table-cell">
                  {d.status === "approved" ? (() => {
                    const avail = !d.isAvailable ? { bg: "bg-gray-50 text-gray-500", dot: "bg-gray-400", label: "Offline" }
                      : d.hasActiveRide ? { bg: "bg-orange-50 text-orange-600", dot: "bg-orange-400", label: "Busy" }
                      : { bg: "bg-green-50 text-green-600", dot: "bg-green-500", label: "Available" };
                    return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit ${avail.bg}`}>
                      <span className={`w-2 h-2 rounded-full ${avail.dot}`} />{avail.label}</span>;
                  })() : <span className="text-xs text-navy/30">—</span>}
                </td>
                <td className="py-3.5 px-2 sm:px-4 hidden md:table-cell">
                  {d.status === "approved" && (
                    <button
                      onClick={() => toggleEnabled(d.id, !d.isEnabled)}
                      disabled={updating === d.id}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit cursor-pointer disabled:opacity-50 ${
                        d.isEnabled ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
                      }`}>
                      <Power className="w-3 h-3" />
                      {d.isEnabled ? "Enabled" : "Disabled"}
                    </button>
                  )}
                </td>
                <td className="py-3.5 px-2 sm:px-4"><StatusBadge status={d.status} /></td>
                <td className="py-3.5 px-2 sm:px-4 text-navy/40 text-xs whitespace-nowrap hidden lg:table-cell">
                  {new Date(d.createdAt).toLocaleDateString("en-GB")}
                </td>
                <td className="py-3.5 px-2 sm:px-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSelectedId(d.id)}
                      className="text-crimson text-xs font-medium hover:underline cursor-pointer flex items-center gap-1">
                      <Eye className="w-3 h-3" /> View
                    </button>
                    <Link href={`/drivers/${d.id}`}
                      className="text-blue-500 text-xs font-medium hover:underline flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> Details
                    </Link>
                    {d.status === "pending" && (
                      <>
                        <button onClick={() => updateStatus(d.id, "approved")}
                          disabled={updating === d.id}
                          className="text-green-600 text-xs font-medium hover:underline cursor-pointer flex items-center gap-1 disabled:opacity-50">
                          <CheckCircle className="w-3 h-3" /> Approve
                        </button>
                        <button onClick={() => updateStatus(d.id, "rejected")}
                          disabled={updating === d.id}
                          className="text-red-500 text-xs font-medium hover:underline cursor-pointer flex items-center gap-1 disabled:opacity-50">
                          <XCircle className="w-3 h-3" /> Reject
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <p className="text-navy/40 text-xs">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
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

      <DriverDetail
        driverId={selectedId}
        updating={updating}
        onClose={() => setSelectedId(null)}
        onUpdateStatus={updateStatus}
      />
    </>
  );
}
