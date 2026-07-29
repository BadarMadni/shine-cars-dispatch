"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Clock, FileText, X } from "lucide-react";

interface Document {
  id: string; type: string; fileUrl: string; expiryDate: string;
}

export interface Driver {
  id: string; name: string; email: string; phone: string;
  status: string; isAvailable: boolean; isEnabled: boolean;
  createdAt: string; documents: Document[];
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
    driving_licence: "Driving Licence", mot_certificate: "MOT Certificate",
    taxi_badge: "Taxi Badge", vehicle_taxi_plate: "Vehicle Taxi Plate",
  };
  return <>{labels[type] || type}</>;
}

interface DriverDetailProps {
  driver: Driver | null;
  updating: string | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: "approved" | "rejected") => void;
}

export default function DriverDetail({ driver, updating, onClose, onUpdateStatus }: DriverDetailProps) {
  return (
    <AnimatePresence>
      {driver && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-navy">{driver.name}</h3>
                <StatusBadge status={driver.status} />
              </div>
              <button onClick={onClose} className="text-navy/30 hover:text-navy cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-navy/40 text-xs mb-1">Email</p>
                  <p className="text-sm text-navy font-medium">{driver.email}</p>
                </div>
                <div>
                  <p className="text-navy/40 text-xs mb-1">Phone</p>
                  <p className="text-sm text-navy font-medium">{driver.phone}</p>
                </div>
                <div>
                  <p className="text-navy/40 text-xs mb-1">Registered</p>
                  <p className="text-sm text-navy font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(driver.createdAt).toLocaleDateString("en-GB")}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-navy mb-3">Documents ({driver.documents.length})</h4>
                {driver.documents.length === 0 ? (
                  <p className="text-navy/40 text-xs">No documents uploaded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {driver.documents.map((doc) => (
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

              {driver.status === "pending" && (
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button onClick={() => onUpdateStatus(driver.id, "approved")}
                    disabled={updating === driver.id}
                    className="flex-1 bg-green-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors cursor-pointer disabled:opacity-50">
                    Approve Driver
                  </button>
                  <button onClick={() => onUpdateStatus(driver.id, "rejected")}
                    disabled={updating === driver.id}
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
  );
}
