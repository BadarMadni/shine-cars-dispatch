"use client";

import { useState, useEffect, useCallback } from "react";
import { Zap } from "lucide-react";
import EventPricingForm from "@/components/dispatch/EventPricingForm";
import EventPricingList from "@/components/dispatch/EventPricingList";

interface Event {
  id: string; name: string; startDate: string; startTime: string;
  endDate: string; endTime: string; increasePercent: number;
  isActive: boolean; createdAt: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);

  const load = useCallback(() => {
    fetch("/api/events").then((r) => r.json()).then((d) => setEvents(d.events || [])).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-crimson" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-navy">Special Event Pricing</h1>
          <p className="text-navy/50 text-xs sm:text-sm">Set time-based fare increases for events and holidays.</p>
        </div>
      </div>

      <EventPricingForm onCreated={load} />
      <EventPricingList events={events} onRefresh={load} />
    </div>
  );
}
