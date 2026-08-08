"use client";

import { useState, Suspense } from "react";
import { Search } from "lucide-react";
import RecurringTable from "@/components/dispatch/RecurringTable";

const tabs = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
];

export default function RecurringPage() {
  const [filter, setFilter] = useState("active");
  const [search, setSearch] = useState("");

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-navy">Recurring Bookings</h1>
          <p className="text-navy/50 text-xs sm:text-sm mt-1">Scheduled company bookings.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/30" />
          <input type="text" placeholder="Search name, route..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-crimson/50 focus:ring-1 focus:ring-crimson/20" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-1 p-4 border-b border-gray-100">
          {tabs.map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filter === key ? "bg-crimson/10 text-crimson" : "text-navy/50 hover:bg-gray-50"
              }`}>
              {label}
            </button>
          ))}
        </div>
        <div className="p-4">
          <Suspense><RecurringTable filter={filter} search={search} /></Suspense>
        </div>
      </div>
    </div>
  );
}
