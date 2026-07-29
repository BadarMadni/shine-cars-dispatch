"use client";

import { useState } from "react";
import CustomersTable from "@/components/dispatch/CustomersTable";

const tabs = [
  { key: "all", label: "All" },
  { key: "individual", label: "Individual" },
  { key: "company", label: "Company" },
];

export default function CustomersPage() {
  const [filter, setFilter] = useState("all");

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Customers</h1>
        <p className="text-navy/50 text-sm mt-1">Manage website customer accounts.</p>
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
          <CustomersTable filter={filter} />
        </div>
      </div>
    </div>
  );
}
