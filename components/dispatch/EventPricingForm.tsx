"use client";

import { useState } from "react";
import { Calendar, Clock, Percent, Tag, Loader2 } from "lucide-react";

interface Props {
  onCreated: () => void;
}

export default function EventPricingForm({ onCreated }: Props) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [percent, setPercent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name || !startDate || !startTime || !endDate || !endTime || !percent) {
      setError("All fields are required"); return;
    }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, startDate, startTime, endDate, endTime, increasePercent: percent }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setSaving(false); return; }
      setName(""); setStartDate(""); setStartTime(""); setEndDate(""); setEndTime(""); setPercent("");
      onCreated();
    } catch { setError("Failed to create"); }
    setSaving(false);
  };

  const fields = [
    { icon: Tag, label: "Event Name", value: name, set: setName, type: "text", placeholder: "e.g. New Year's Eve" },
    { icon: Calendar, label: "Start Date", value: startDate, set: setStartDate, type: "date" },
    { icon: Clock, label: "Start Time", value: startTime, set: setStartTime, type: "time" },
    { icon: Calendar, label: "End Date", value: endDate, set: setEndDate, type: "date" },
    { icon: Clock, label: "End Time", value: endTime, set: setEndTime, type: "time" },
    { icon: Percent, label: "Price Increase %", value: percent, set: setPercent, type: "number", placeholder: "e.g. 25" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
      <h3 className="text-sm font-bold text-navy mb-4">Create Event Pricing</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {fields.map(({ icon: Icon, label, value, set, type, placeholder }) => (
          <div key={label}>
            <label className="text-[11px] text-navy/40 font-medium mb-1 flex items-center gap-1">
              <Icon className="w-3 h-3" /> {label}
            </label>
            <input type={type} value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-navy focus:outline-none focus:border-crimson/40" />
          </div>
        ))}
      </div>
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      <button onClick={handleSubmit} disabled={saving}
        className="mt-4 px-6 py-2.5 rounded-xl bg-crimson text-white text-sm font-semibold hover:bg-crimson-dark transition-colors cursor-pointer disabled:opacity-50">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Event"}
      </button>
    </div>
  );
}
