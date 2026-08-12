"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, X, Loader2, FileText, Shield, Car, CreditCard, Calendar, ZoomIn } from "lucide-react";

interface Document {
  id: string; type: string; fileUrl?: string; expiryDate: string;
}

export interface Driver {
  id: string; name: string; email: string; phone: string;
  status: string; isAvailable: boolean; isEnabled: boolean;
  createdAt: string; documents: Document[];
  vehicleMake?: string; vehicleColor?: string; vehicleReg?: string;
}

interface FullDriver extends Omit<Driver, "documents"> { documents: { id: string; type: string; fileUrl: string; expiryDate: string }[] }

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

const DOC_META: Record<string, { label: string; icon: typeof FileText; color: string }> = {
  driver_licence: { label: "Driver Licence", icon: CreditCard, color: "from-blue-500 to-blue-600" },
  driving_licence: { label: "Driving Licence", icon: CreditCard, color: "from-blue-500 to-blue-600" },
  mot_certificate: { label: "MOT Certificate", icon: FileText, color: "from-emerald-500 to-emerald-600" },
  taxi_badge: { label: "Taxi Badge", icon: Shield, color: "from-purple-500 to-purple-600" },
  vehicle_taxi_plate: { label: "Vehicle Taxi Plate", icon: Car, color: "from-amber-500 to-amber-600" },
};

interface DriverDetailProps {
  driverId: string | null;
  updating: string | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: "approved" | "rejected") => void;
}

export default function DriverDetail({ driverId, updating, onClose, onUpdateStatus }: DriverDetailProps) {
  const [driver, setDriver] = useState<FullDriver | null>(null);
  const [loading, setLoading] = useState(false);
  const [lightbox, setLightbox] = useState<{ url: string; label: string } | null>(null);

  useEffect(() => {
    if (!driverId) { setDriver(null); return; }
    setLoading(true);
    fetch(`/api/drivers/${driverId}`)
      .then((r) => r.json())
      .then((d) => setDriver(d.driver || null))
      .catch(() => setDriver(null))
      .finally(() => setLoading(false));
  }, [driverId]);

  return (
    <>
    <AnimatePresence>
      {driverId && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            {loading || !driver ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 text-navy/30 animate-spin" />
              </div>
            ) : (
              <>
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
                  {(driver.vehicleMake || driver.vehicleColor || driver.vehicleReg) && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="text-sm font-bold text-navy mb-2 flex items-center gap-1.5"><Car className="w-4 h-4" /> Vehicle</h4>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        {[["Make", driver.vehicleMake], ["Color", driver.vehicleColor], ["Reg No.", driver.vehicleReg]].map(([l, v]) => (
                          <div key={l}><p className="text-navy/40 text-xs mb-0.5">{l}</p><p className="text-navy font-medium">{v || "—"}</p></div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-navy mb-3">Documents ({driver.documents.length})</h4>
                    {driver.documents.length === 0 ? (
                      <p className="text-navy/40 text-xs">No documents uploaded yet.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {driver.documents.map((doc) => {
                          const meta = DOC_META[doc.type] || { label: doc.type, icon: FileText, color: "from-gray-500 to-gray-600" };
                          const Icon = meta.icon;
                          return (
                            <div key={doc.id}
                              className="group relative border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 hover:shadow-md transition-all cursor-pointer"
                              onClick={() => setLightbox({ url: doc.fileUrl, label: meta.label })}>
                              <div className="relative h-32 overflow-hidden bg-gray-50">
                                <img src={doc.fileUrl} alt={doc.type}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                  <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                              <div className="p-2.5">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${meta.color} flex items-center justify-center`}>
                                    <Icon className="w-3 h-3 text-white" />
                                  </div>
                                  <p className="text-xs font-semibold text-navy truncate">{meta.label}</p>
                                </div>
                                <div className="flex items-center gap-1 text-navy/40">
                                  <Calendar className="w-3 h-3" />
                                  <p className="text-[10px]">Exp: {doc.expiryDate}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
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
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Fullscreen Lightbox */}
    <AnimatePresence>
      {lightbox && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
            className="relative max-w-4xl w-full max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">{lightbox.label}</h3>
              <button onClick={() => setLightbox(null)}
                className="text-white/60 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <img src={lightbox.url} alt={lightbox.label}
              className="w-full max-h-[80vh] object-contain rounded-xl" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
