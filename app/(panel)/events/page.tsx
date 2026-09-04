"use client";

import { useState, useEffect, useCallback } from "react";
import { Zap, AlertTriangle } from "lucide-react";
import EventPricingForm from "@/components/dispatch/EventPricingForm";
import EventPricingList from "@/components/dispatch/EventPricingList";

interface Event {
  id: string; name: string; startDate: string; startTime: string;
  endDate: string; endTime: string; increasePercent: number;
  isActive: boolean; createdAt: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [priorityEnabled, setPriorityEnabled] = useState(true);
  const [priorityLoading, setPriorityLoading] = useState(false);

  const load = useCallback(() => {
    fetch("/api/events").then((r) => r.json()).then((d) => setEvents(d.events || [])).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch("/api/settings/priority").then((r) => r.json()).then((d) => setPriorityEnabled(d.enabled)).catch(() => {});
  }, []);

  const togglePriority = async () => {
    setPriorityLoading(true);
    const res = await fetch("/api/settings/priority", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !priorityEnabled }),
    });
    const d = await res.json();
    setPriorityEnabled(d.enabled);
    setPriorityLoading(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-crimson" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-navy">Special Event Pricing</h1>
          <p className="text-navy/50 text-xs sm:text-sm">Set time-based fare increases for events and holidays.</p>
        </div>
      </div>

      {/* Priority Booking Toggle */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h3 className="text-navy font-bold text-sm">Priority Booking</h3>
            <p className="text-navy/50 text-xs">Extra £5 (≤3 miles) or £10 (&gt;3 miles) for priority rides</p>
          </div>
        </div>
        <button onClick={togglePriority} disabled={priorityLoading}
          className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${priorityEnabled ? "bg-orange-500" : "bg-gray-300"}`}>
          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${priorityEnabled ? "translate-x-6.5" : "translate-x-0.5"}`} />
        </button>
      </div>

      <EventPricingForm onCreated={load} />
      <EventPricingList events={events} onRefresh={load} />
    </div>
  );
}
