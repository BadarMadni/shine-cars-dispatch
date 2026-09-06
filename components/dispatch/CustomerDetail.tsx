"use client";

import { useState, useEffect } from "react";
import {
  Building2, UserRound, Mail, Phone, Calendar, MapPin,
  Navigation, X, PoundSterling, Route, Clock, Pencil, Save, Loader2,
} from "lucide-react";
import StatusBadge from "@/components/dispatch/StatusBadge";

interface Customer {
  id: string; name: string; email: string; phone: string;
  accountType: string; companyName?: string; totalRides: number; createdAt: string;
}

interface Booking {
  id: string; pickup: string; dropoff: string; stops?: string | null;
  pickupDetails?: string | null; dropoffDetails?: string | null; buildingInfo?: string | null;
  date: string; time: string; distance: number; fare: number; vehicle: string; status: string;
  paymentMethod: string; paymentStatus: string; createdAt: string;
  fareType?: string; meterFare?: number | null; cashCollected?: number | null;
}

interface Props { customer: Customer; onClose: () => void; onUpdate?: (c: Customer) => void }

export default function CustomerDetail({ customer, onClose, onUpdate }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    accountType: customer.accountType,
    companyName: customer.companyName || "",
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/customers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: customer.id, ...form }),
      });
      const data = await res.json();
      if (data.customer) {
        onUpdate?.({ ...customer, ...form, companyName: form.companyName || undefined });
        setEditing(false);
      }
    } catch {} finally { setSaving(false); }
  };

  useEffect(() => {
    fetch(`/api/customers/${customer.id}/bookings`)
      .then((r) => r.json())
      .then((d) => setBookings(d.bookings || []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, [customer.id]);

  const totalSpent = bookings.reduce((sum, b) => sum + b.fare, 0);
  const completed = bookings.filter((b) => b.status === "completed").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-gray-100 shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="p-6 border-b border-gray-100 shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                (editing ? form.accountType : customer.accountType) === "company" ? "bg-amber-100" : "bg-blue-100"
              }`}>
                {(editing ? form.accountType : customer.accountType) === "company"
                  ? <Building2 className="w-7 h-7 text-amber-700" />
                  : <UserRound className="w-7 h-7 text-blue-700" />}
              </div>
              <div>
                {editing ? (
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="text-navy font-bold text-xl border-b-2 border-blue-400 outline-none bg-transparent w-full" />
                ) : (
                  <h3 className="text-navy font-bold text-xl">{customer.name}</h3>
                )}
                {!editing && customer.companyName && <p className="text-navy/50 text-sm">{customer.companyName}</p>}
                {editing ? (
                  <select value={form.accountType} onChange={(e) => setForm({ ...form, accountType: e.target.value })}
                    className="mt-1 text-xs font-medium px-2.5 py-1 rounded-full border border-gray-200 outline-none bg-white text-navy">
                    <option value="individual">Individual</option>
                    <option value="company">Company</option>
                  </select>
                ) : (
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                    customer.accountType === "company"
                      ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {customer.accountType === "company" ? "Company" : "Individual"}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {editing ? (
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 cursor-pointer disabled:opacity-50">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save
                </button>
              ) : (
                <button onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-100 cursor-pointer">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
              )}
              <button onClick={() => { setEditing(false); onClose(); }} className="text-navy/30 hover:text-navy/60 cursor-pointer p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Info Grid */}
          {editing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              <div className="flex items-center gap-2.5 text-sm">
                <Mail className="w-4 h-4 text-navy/30 shrink-0" />
                <div className="flex-1"><p className="text-navy/40 text-xs">Email</p>
                  <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="text-navy/80 w-full border-b border-gray-300 outline-none bg-transparent py-0.5" />
                </div>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <Phone className="w-4 h-4 text-navy/30 shrink-0" />
                <div className="flex-1"><p className="text-navy/40 text-xs">Phone</p>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="text-navy/80 w-full border-b border-gray-300 outline-none bg-transparent py-0.5" />
                </div>
              </div>
              {form.accountType === "company" && (
                <div className="flex items-center gap-2.5 text-sm sm:col-span-2">
                  <Building2 className="w-4 h-4 text-navy/30 shrink-0" />
                  <div className="flex-1"><p className="text-navy/40 text-xs">Company Name</p>
                    <input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                      className="text-navy/80 w-full border-b border-gray-300 outline-none bg-transparent py-0.5" />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2.5 text-sm">
                <Calendar className="w-4 h-4 text-navy/30 shrink-0" />
                <div><p className="text-navy/40 text-xs">Joined</p><p className="text-navy/80">{new Date(customer.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p></div>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <PoundSterling className="w-4 h-4 text-navy/30 shrink-0" />
                <div><p className="text-navy/40 text-xs">Total Spent</p><p className="text-navy/80 font-semibold">£{totalSpent.toFixed(2)}</p></div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {[
                { icon: <Mail className="w-4 h-4 text-navy/30 shrink-0" />, label: "Email", value: customer.email },
                { icon: <Phone className="w-4 h-4 text-navy/30 shrink-0" />, label: "Phone", value: customer.phone },
                { icon: <Calendar className="w-4 h-4 text-navy/30 shrink-0" />, label: "Joined", value: new Date(customer.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) },
                { icon: <PoundSterling className="w-4 h-4 text-navy/30 shrink-0" />, label: "Total Spent", value: `£${totalSpent.toFixed(2)}`, bold: true },
              ].map(({ icon, label, value, bold }) => (
                <div key={label} className="flex items-center gap-2.5 text-sm">
                  {icon}
                  <div><p className="text-navy/40 text-xs">{label}</p><p className={`text-navy/80${bold ? " font-semibold" : ""}`}>{value}</p></div>
                </div>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-blue-50 rounded-xl px-4 py-3 text-center">
              <p className="text-blue-700 font-bold text-lg">{customer.totalRides}</p>
              <p className="text-blue-600/60 text-xs">Total Rides</p>
            </div>
            <div className="bg-green-50 rounded-xl px-4 py-3 text-center">
              <p className="text-green-700 font-bold text-lg">{completed}</p>
              <p className="text-green-600/60 text-xs">Completed</p>
            </div>
            <div className="bg-amber-50 rounded-xl px-4 py-3 text-center">
              <p className="text-amber-700 font-bold text-lg">£{totalSpent.toFixed(2)}</p>
              <p className="text-amber-600/60 text-xs">Total Spent</p>
            </div>
          </div>
        </div>

        {/* Rides */}
        <div className="flex-1 overflow-y-auto p-6">
          <h4 className="text-navy font-semibold mb-4">
            Ride History
            <span className="text-navy/30 text-sm font-normal ml-2">({bookings.length})</span>
          </h4>
          {loading ? (<p className="text-navy/30 text-sm text-center py-8">Loading rides...</p>
          ) : bookings.length === 0 ? (<p className="text-navy/30 text-sm text-center py-8">No rides yet</p>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <div key={b.id} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  {/* Top row: status + vehicle + fare */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={b.status} />
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        b.vehicle === "mpv"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {b.vehicle.toUpperCase()}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        b.paymentStatus === "paid"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-navy/50"
                      }`}>
                        {b.paymentMethod.toUpperCase()} — {b.paymentStatus.toUpperCase()}
                      </span>
                      {b.fareType === "meter" && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600">METER</span>
                      )}
                    </div>
                    <span className="text-navy font-bold">
                      {b.fareType === "meter" && !b.meterFare
                        ? `£${b.fare.toFixed(2)} – £${(b.fare * 1.1).toFixed(2)}`
                        : `£${(b.meterFare ?? b.fare).toFixed(2)}`}
                    </span>
                  </div>

                  {/* Pickup & Dropoff */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-navy/40 text-xs">Pickup</p>
                        <p className="text-navy/70">{b.pickup}</p>
                        {b.pickupDetails && <p className="text-amber-600 text-xs italic">{b.pickupDetails}</p>}
                        {b.buildingInfo && <p className="text-amber-500 text-xs italic">🏠 {b.buildingInfo}</p>}
                      </div>
                    </div>
                    {b.stops && (() => { try { const s: string[] = JSON.parse(b.stops); return s.map((addr, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        <div><p className="text-navy/40 text-xs">Stop {i + 1}</p><p className="text-navy/70">{addr}</p></div>
                      </div>
                    )); } catch { return null; } })()}
                    <div className="flex items-start gap-2.5">
                      <Navigation className="w-4 h-4 text-crimson mt-0.5 shrink-0" />
                      <div>
                        <p className="text-navy/40 text-xs">Drop-off</p>
                        <p className="text-navy/70">{b.dropoff}</p>
                        {b.dropoffDetails && <p className="text-amber-600 text-xs italic">{b.dropoffDetails}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Bottom row: date, time, distance */}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200/60 text-xs text-navy/50">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{b.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{b.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Route className="w-3.5 h-3.5" />
                      <span>{b.distance.toFixed(1)} miles</span>
                    </div>
                  </div>
                  {b.cashCollected != null && b.status === "completed" && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-green-600"><PoundSterling className="w-3.5 h-3.5" /><span>Cash Collected: £{b.cashCollected.toFixed(2)}</span></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
