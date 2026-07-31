"use client";

import {
  Clock, PoundSterling, Car, CreditCard, Loader2,
} from "lucide-react";
import DispatchAddressInput, { PlaceData } from "@/components/dispatch/DispatchAddressInput";

export interface BookingEdits {
  pickup: string;
  dropoff: string;
  date: string;
  time: string;
  fare: string;
  distance: string;
  vehicle: string;
  paymentMethod: string;
  paymentStatus: string;
}

const inputClass =
  "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-navy outline-none focus:border-crimson/50";

export default function BookingEditFields({
  edits,
  onChange,
  onPlaceChange,
  calculating,
}: {
  edits: BookingEdits;
  onChange: (key: keyof BookingEdits, value: string) => void;
  onPlaceChange?: (type: "pickup" | "dropoff", place: PlaceData) => void;
  calculating?: boolean;
}) {
  return (
    <div className="space-y-3">
      <DispatchAddressInput
        value={edits.pickup}
        onChange={(v, place) => { onChange("pickup", v); if (place && onPlaceChange) onPlaceChange("pickup", place); }}
        label="Pickup" placeholder="Search pickup address..."
      />
      <DispatchAddressInput
        value={edits.dropoff}
        onChange={(v, place) => { onChange("dropoff", v); if (place && onPlaceChange) onPlaceChange("dropoff", place); }}
        label="Drop-off" placeholder="Search drop-off address..."
      />

      <div className="flex items-start gap-3">
        <Clock className="w-4 h-4 mt-3 shrink-0 text-purple-500" />
        <div className="flex-1 grid grid-cols-2 gap-2">
          <div>
            <p className="text-navy/40 text-xs mb-1">Date</p>
            <input type="date" value={edits.date} onChange={(e) => onChange("date", e.target.value)} className={inputClass} />
          </div>
          <div>
            <p className="text-navy/40 text-xs mb-1">Time</p>
            <input type="time" value={edits.time} onChange={(e) => onChange("time", e.target.value)} className={inputClass} />
          </div>
        </div>
      </div>

      {/* Fare & Distance - auto or manual */}
      <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
        {calculating ? (
          <div className="flex items-center gap-2 text-navy/40 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Recalculating fare...
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-navy/40 text-xs mb-1">Distance (mi)</p>
              <input type="number" step="0.1" value={edits.distance}
                onChange={(e) => onChange("distance", e.target.value)} className={inputClass} />
            </div>
            <div>
              <p className="text-navy/40 text-xs mb-1">Fare (£)</p>
              <input type="number" step="0.01" value={edits.fare}
                onChange={(e) => onChange("fare", e.target.value)} className={inputClass} />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="text-navy/40 text-xs mb-1"><Car className="w-3 h-3 inline" /> Vehicle</p>
          <select value={edits.vehicle} onChange={(e) => onChange("vehicle", e.target.value)} className={inputClass}>
            <option value="car">CAR</option>
            <option value="mpv">MPV</option>
          </select>
        </div>
        <div>
          <p className="text-navy/40 text-xs mb-1"><CreditCard className="w-3 h-3 inline" /> Payment</p>
          <select value={edits.paymentMethod} onChange={(e) => onChange("paymentMethod", e.target.value)} className={inputClass}>
            <option value="cash">CASH</option>
            <option value="card">CARD</option>
          </select>
        </div>
        <div>
          <p className="text-navy/40 text-xs mb-1"><PoundSterling className="w-3 h-3 inline" /> Status</p>
          <select value={edits.paymentStatus} onChange={(e) => onChange("paymentStatus", e.target.value)} className={inputClass}>
            <option value="unpaid">UNPAID</option>
            <option value="paid">PAID</option>
          </select>
        </div>
      </div>
    </div>
  );
}
