"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone, Mail, Clock, CheckCircle, XCircle, Eye, X,
  FileText, ChevronLeft, ChevronRight,
} from "lucide-react";

interface Document {
  id: string;
  type: string;
  fileUrl: string;
  expiryDate: string;
}

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  isAvailable: boolean;
  createdAt: string;
  documents: Document[];
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-50 text-amber-600",
    approved: "bg-green-50 text-green-600",
    rejected: "bg-red-50 text-red-600",
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${styles[status] || "bg-gray-50 text-gray-600"}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function DocLabel({ type }: { type: string }) {
  const labels: Record<string, string> = {
    driving_licence: "Driving Licence",
    mot_certificate: "MOT Certificate",
    taxi_badge: "Taxi Badge",
    vehicle_taxi_plate: "Vehicle Taxi Plate",
  };
  return <>{labels[type] || type}</>;
}

export default function DriversTable({ filter }: { filter: string }) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selected, setSelected] = useState<Driver | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 5;

  const load = useCallback(() => {
    fetch(`/api/drivers?status=${filter}`)
      .then((r) => r.json())
      .then((d) => setDrivers(d.drivers || []))
      .catch(() => {});
  }, [filter]);

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
      if (selected?.id === id) setSelected(null);
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
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {["Driver", "Contact", "Documents", "Availability", "Status", "Registered", "Actions"].map((h) => (
                <th key={h} className="text-left text-navy/40 font-medium text-xs py-3 px-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((d, i) => (
              <motion.tr key={d.id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="py-3.5 px-4">
                  <p className="font-semibold text-navy">{d.name}</p>
                </td>
                <td className="py-3.5 px-4">
                  <p className="text-navy/60 text-xs flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {d.email}
                  </p>
                  <p className="text-navy/40 text-xs flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" /> {d.phone}
                  </p>
                </td>
                <td className="py-3.5 px-4">
                  <span className="text-xs text-navy/60 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> {d.documents.length} uploaded
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  {d.status === "approved" ? (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit ${
                      d.isAvailable
                        ? "bg-green-50 text-green-600"
                        : "bg-orange-50 text-orange-600"
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${d.isAvailable ? "bg-green-500" : "bg-orange-400"}`} />
                      {d.isAvailable ? "Available" : "Busy"}
                    </span>
                  ) : (
                    <span className="text-xs text-navy/30">—</span>
                  )}
                </td>
                <td className="py-3.5 px-4"><StatusBadge status={d.status} /></td>
                <td className="py-3.5 px-4 text-navy/40 text-xs whitespace-nowrap">
                  {new Date(d.createdAt).toLocaleDateString("en-GB")}
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSelected(d)}
                      className="text-crimson text-xs font-medium hover:underline cursor-pointer flex items-center gap-1">
                      <Eye className="w-3 h-3" /> View
                    </button>
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

      {/* Driver Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-navy">{selected.name}</h3>
                  <StatusBadge status={selected.status} />
                </div>
                <button onClick={() => setSelected(null)} className="text-navy/30 hover:text-navy cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-navy/40 text-xs mb-1">Email</p>
                    <p className="text-sm text-navy font-medium">{selected.email}</p>
                  </div>
                  <div>
                    <p className="text-navy/40 text-xs mb-1">Phone</p>
                    <p className="text-sm text-navy font-medium">{selected.phone}</p>
                  </div>
                  <div>
                    <p className="text-navy/40 text-xs mb-1">Registered</p>
                    <p className="text-sm text-navy font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(selected.createdAt).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-navy mb-3">Documents ({selected.documents.length})</h4>
                  {selected.documents.length === 0 ? (
                    <p className="text-navy/40 text-xs">No documents uploaded yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {selected.documents.map((doc) => (
                        <div key={doc.id} className="border border-gray-100 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold text-navy">
                              <DocLabel type={doc.type} />
                            </p>
                            <p className="text-xs text-navy/40">Expires: {doc.expiryDate}</p>
                          </div>
                          {doc.fileUrl.startsWith("data:image") ? (
                            <img src={doc.fileUrl} alt={doc.type}
                              className="w-full h-40 object-cover rounded-lg" />
                          ) : (
                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                              className="text-crimson text-xs font-medium hover:underline flex items-center gap-1">
                              <FileText className="w-3 h-3" /> View Document
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selected.status === "pending" && (
                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button onClick={() => updateStatus(selected.id, "approved")}
                      disabled={updating === selected.id}
                      className="flex-1 bg-green-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors cursor-pointer disabled:opacity-50">
                      Approve Driver
                    </button>
                    <button onClick={() => updateStatus(selected.id, "rejected")}
                      disabled={updating === selected.id}
                      className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50">
                      Reject Driver
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
