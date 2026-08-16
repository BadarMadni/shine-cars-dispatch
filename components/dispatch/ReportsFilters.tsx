"use client";

import { Search, Calendar, Users, Download } from "lucide-react";

interface Driver { id: string; name: string }

interface Props {
  search: string; onSearch: (v: string) => void;
  startDate: string; onStartDate: (v: string) => void;
  endDate: string; onEndDate: (v: string) => void;
  driverId: string; onDriverId: (v: string) => void;
  drivers: Driver[];
  onExport: () => void;
}

export default function ReportsFilters({
  search, onSearch, startDate, onStartDate, endDate, onEndDate,
  driverId, onDriverId, drivers, onExport,
}: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-navy/30" />
          <input type="text" value={search} onChange={(e) => onSearch(e.target.value)}
            placeholder="Search name, phone, location..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm text-navy placeholder:text-navy/30 focus:outline-none focus:border-crimson/40" />
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-navy/30 shrink-0" />
          <input type="date" value={startDate} onChange={(e) => onStartDate(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-navy focus:outline-none focus:border-crimson/40" />
          <span className="text-navy/30 text-xs">to</span>
          <input type="date" value={endDate} onChange={(e) => onEndDate(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-navy focus:outline-none focus:border-crimson/40" />
        </div>

        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-navy/30 shrink-0" />
          <select value={driverId} onChange={(e) => onDriverId(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-navy focus:outline-none focus:border-crimson/40 min-w-[140px]">
            <option value="">All Drivers</option>
            {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        <button onClick={onExport}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors cursor-pointer shrink-0">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>
    </div>
  );
}
