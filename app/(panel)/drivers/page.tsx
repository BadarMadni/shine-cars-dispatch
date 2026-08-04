"use client";

import { useState } from "react";
import DriversTable from "@/components/dispatch/DriversTable";

const tabs = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export default function DriversPage() {
  const [filter, setFilter] = useState("all");

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-navy">Drivers</h1>
        <p className="text-navy/50 text-xs sm:text-sm mt-1">Manage driver registrations and approvals.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-1 p-4 border-b border-gray-100 overflow-x-auto">
          {tabs.map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filter === key
                  ? "bg-crimson/10 text-crimson"
                  : "text-navy/50 hover:bg-gray-50"
              }`}>
              {label}
            </button>
          ))}
        </div>
        <div className="p-4">
          <DriversTable filter={filter} />
        </div>
      </div>
    </div>
  );
}
