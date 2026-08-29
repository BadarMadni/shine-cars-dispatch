import {
  MapPin, Navigation, Route, PoundSterling, Phone, User,
  Calendar, Clock, Car, CreditCard, Gauge, Banknote, Zap, AlertTriangle,
} from "lucide-react";

interface Booking {
  name: string; phone: string; pickup: string; dropoff: string;
  stops?: string | null;
  date: string; time: string; distance: number; fare: number;
  vehicle?: string; paymentMethod?: string; paymentStatus?: string;
  fareType?: string; meterDistance?: number | null; meterFare?: number | null;
  cashCollected?: number | null; status?: string;
  isUrgent?: boolean;
  eventSurcharge?: number | null;
  pickupDetails?: string | null; dropoffDetails?: string | null;
}

export default function BookingInfoRows({ booking: b }: { booking: Booking }) {
  const parsedStops: string[] = b.stops ? (() => { try { return JSON.parse(b.stops); } catch { return []; } })() : [];
  const rows = [
    ...(b.isUrgent ? [{ icon: AlertTriangle, color: "text-red-500", label: "Priority", value: "URGENT" }] : []),
    { icon: User, color: "text-blue-500", label: "Customer", value: b.name },
    { icon: Phone, color: "text-navy/40", label: "Phone", value: b.phone },
    { icon: MapPin, color: "text-green-500", label: "Pickup", value: b.pickup },
    ...(b.pickupDetails ? [{ icon: MapPin, color: "text-green-400", label: "Pickup Details", value: b.pickupDetails }] : []),
    ...parsedStops.map((s: string, i: number) => ({ icon: MapPin, color: "text-amber-500", label: `Stop ${i + 1}`, value: s })),
    { icon: Navigation, color: "text-crimson", label: "Drop-off", value: b.dropoff },
    ...(b.dropoffDetails ? [{ icon: Navigation, color: "text-crimson/60", label: "Drop-off Details", value: b.dropoffDetails }] : []),
    { icon: Calendar, color: "text-purple-500", label: "Date", value: b.date },
    { icon: Clock, color: "text-purple-500", label: "Time", value: b.time },
    { icon: Route, color: "text-gold", label: "Distance", value: `${b.distance.toFixed(1)} miles` },
    { icon: Car, color: "text-blue-500", label: "Vehicle", value: (b.vehicle || "car").toUpperCase() },
    { icon: Gauge, color: "text-orange-500", label: "Fare Type", value: (b.fareType || "fixed").toUpperCase() },
    { icon: PoundSterling, color: "text-gold", label: b.fareType === "meter" ? "Estimated Fare" : "Fare",
      value: b.fareType === "meter" && !b.meterFare
        ? `£${(b.fare * 0.9).toFixed(2)} – £${(b.fare * 1.1).toFixed(2)}`
        : `£${b.fare.toFixed(2)}` },
    ...(b.fareType === "meter" && b.meterFare ? [
      { icon: Gauge, color: "text-green-500", label: "Meter Fare (Final)", value: `£${b.meterFare.toFixed(2)}` },
      { icon: Route, color: "text-green-500", label: "Meter Distance", value: `${b.meterDistance?.toFixed(1) || "—"} mi` },
    ] : []),
    { icon: CreditCard, color: "text-indigo-500", label: "Payment", value: `${(b.paymentMethod || "cash").toUpperCase()} — ${(b.paymentStatus || "unpaid").toUpperCase()}` },
    ...(b.eventSurcharge != null && b.eventSurcharge > 0 ? [
      { icon: Zap, color: "text-amber-500", label: "Event Surcharge", value: `+£${b.eventSurcharge.toFixed(2)}` },
    ] : []),
    ...(b.cashCollected != null && b.status === "completed" ? [
      { icon: Banknote, color: "text-green-500", label: "Cash Collected by Driver", value: `£${b.cashCollected.toFixed(2)}` },
    ] : []),
  ];

  return (
    <div className="space-y-3">
      {rows.map(({ icon: Icon, color, label, value }) => (
        <div key={label} className="flex items-start gap-3">
          <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} />
          <div>
            <p className="text-navy/40 text-xs">{label}</p>
            <p className="text-navy text-sm font-medium">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
