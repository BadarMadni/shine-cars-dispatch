import {
  MapPin, Navigation, Route, PoundSterling, Phone, User,
  Calendar, Clock, Car, CreditCard,
} from "lucide-react";

interface Booking {
  name: string; phone: string; pickup: string; dropoff: string;
  date: string; time: string; distance: number; fare: number;
  vehicle?: string; paymentMethod?: string; paymentStatus?: string;
}

export default function BookingInfoRows({ booking: b }: { booking: Booking }) {
  const rows = [
    { icon: User, color: "text-blue-500", label: "Customer", value: b.name },
    { icon: Phone, color: "text-navy/40", label: "Phone", value: b.phone },
    { icon: MapPin, color: "text-green-500", label: "Pickup", value: b.pickup },
    { icon: Navigation, color: "text-crimson", label: "Drop-off", value: b.dropoff },
    { icon: Calendar, color: "text-purple-500", label: "Date", value: b.date },
    { icon: Clock, color: "text-purple-500", label: "Time", value: b.time },
    { icon: Route, color: "text-gold", label: "Distance", value: `${b.distance.toFixed(1)} miles` },
    { icon: Car, color: "text-blue-500", label: "Vehicle", value: (b.vehicle || "car").toUpperCase() },
    { icon: PoundSterling, color: "text-gold", label: "Fare", value: `£${b.fare.toFixed(2)}` },
    { icon: CreditCard, color: "text-indigo-500", label: "Payment", value: `${(b.paymentMethod || "cash").toUpperCase()} — ${(b.paymentStatus || "unpaid").toUpperCase()}` },
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
