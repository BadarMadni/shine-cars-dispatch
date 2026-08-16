"use client";

import { motion } from "framer-motion";
import { Calendar, Clock, Percent, Trash2, Power } from "lucide-react";
import { useState } from "react";

interface Event {
  id: string; name: string; startDate: string; startTime: string;
  endDate: string; endTime: string; increasePercent: number;
  isActive: boolean; createdAt: string;
}

function isCurrentlyActive(e: Event) {
  if (!e.isActive) return false;
  const now = Date.now();
  const start = new Date(`${e.startDate}T${e.startTime}:00`).getTime();
  const end = new Date(`${e.endDate}T${e.endTime}:00`).getTime();
  return now >= start && now <= end;
}

function isExpired(e: Event) {
  return Date.now() > new Date(`${e.endDate}T${e.endTime}:00`).getTime();
}

export default function EventPricingList({ events, onRefresh }: { events: Event[]; onRefresh: () => void }) {
  const [updating, setUpdating] = useState<string | null>(null);

  const toggle = async (id: string, isActive: boolean) => {
    setUpdating(id);
    await fetch(`/api/events/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    onRefresh(); setUpdating(null);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    setUpdating(id);
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    onRefresh(); setUpdating(null);
  };

  if (!events.length) return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
      <p className="text-navy/30 text-sm">No event pricing rules yet.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {events.map((e, i) => {
        const live = isCurrentlyActive(e);
        const expired = isExpired(e);
        return (
          <motion.div key={e.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`bg-white rounded-2xl border shadow-sm p-4 sm:p-5 ${live ? "border-green-300 ring-1 ring-green-200" : expired ? "border-gray-200 opacity-60" : "border-gray-100"}`}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h4 className="text-sm font-bold text-navy">{e.name}</h4>
                  {live && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-600 animate-pulse">LIVE NOW</span>}
                  {expired ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500">EXPIRED</span>
                  ) : (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${e.isActive ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                      {e.isActive ? "Active" : "Inactive"}
                    </span>
                  )}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-crimson/10 text-crimson flex items-center gap-0.5">
                    <Percent className="w-2.5 h-2.5" /> +{e.increasePercent}%
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-navy/50 flex-wrap">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {e.startDate}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {e.startTime}</span>
                  <span className="text-navy/30">→</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {e.endDate}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {e.endTime}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggle(e.id, !e.isActive)} disabled={updating === e.id}
                  className={`p-2 rounded-lg cursor-pointer transition-colors disabled:opacity-50 ${e.isActive ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}>
                  <Power className="w-4 h-4" />
                </button>
                <button onClick={() => remove(e.id)} disabled={updating === e.id}
                  className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 cursor-pointer transition-colors disabled:opacity-50">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
