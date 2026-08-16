"use client";

import {
  Clock, PoundSterling, Car, CreditCard, Loader2, Plus, X, Gauge,
} from "lucide-react";
import DispatchAddressInput, { PlaceData } from "@/components/dispatch/DispatchAddressInput";

export interface BookingEdits {
  pickup: string;
  dropoff: string;
  stops: string[];
  date: string;
  time: string;
  fare: string;
  distance: string;
  vehicle: string;
  fareType: string;
  paymentMethod: string;
  paymentStatus: string;
}

const inputClass =
  "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-navy outline-none focus:border-crimson/50";

export default function BookingEditFields({
  edits,
  onChange,
  onStopsChange,
  onPlaceChange,
  calculating,
}: {
  edits: BookingEdits;
  onChange: (key: keyof BookingEdits, value: string) => void;
  onStopsChange?: (stops: string[]) => void;
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
      {edits.stops.map((stop, i) => (
        <div key={i} className="relative">
          <DispatchAddressInput
            value={stop}
            onChange={(v) => {
              const next = [...edits.stops];
              next[i] = v;
              onStopsChange?.(next);
            }}
            label={`Stop ${i + 1}`} placeholder={`Search stop ${i + 1} address...`}
          />
          <button type="button" onClick={() => onStopsChange?.(edits.stops.filter((_, j) => j !== i))}
            className="absolute top-0 right-0 p-1 text-navy/30 hover:text-crimson cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      {edits.stops.length < 5 && (
        <button type="button" onClick={() => onStopsChange?.([...edits.stops, ""])}
          className="flex items-center gap-1.5 text-xs text-crimson/70 hover:text-crimson font-medium cursor-pointer py-0.5">
          <Plus className="w-3.5 h-3.5" /> Add a stop
        </button>
      )}
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
      <button type="button" onClick={() => { const now = new Date(); const y = now.getFullYear(), m = String(now.getMonth()+1).padStart(2,"0"), d = String(now.getDate()).padStart(2,"0"); onChange("date", `${y}-${m}-${d}`); onChange("time", now.toTimeString().slice(0, 5)); }}
        className="text-xs text-crimson/70 hover:text-crimson font-medium cursor-pointer -mt-1 ml-7">Set to Now</button>

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

      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-navy/40 text-xs mb-1"><Car className="w-3 h-3 inline" /> Vehicle</p>
          <select value={edits.vehicle} onChange={(e) => onChange("vehicle", e.target.value)} className={inputClass}>
            <option value="car">CAR</option>
            <option value="mpv">MPV</option>
          </select>
        </div>
        <div>
          <p className="text-navy/40 text-xs mb-1"><Gauge className="w-3 h-3 inline" /> Fare Type</p>
          <select value={edits.fareType} onChange={(e) => { onChange("fareType", e.target.value); if (e.target.value === "meter") onChange("paymentMethod", "cash"); }} className={inputClass}>
            <option value="fixed">FIXED</option>
            <option value="meter">METER</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-navy/40 text-xs mb-1"><CreditCard className="w-3 h-3 inline" /> Payment</p>
          <select value={edits.paymentMethod} onChange={(e) => onChange("paymentMethod", e.target.value)} disabled={edits.fareType === "meter"} className={`${inputClass} disabled:opacity-50`}>
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
