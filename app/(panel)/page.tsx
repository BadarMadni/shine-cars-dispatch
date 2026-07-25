"use client";

import StatsCards from "@/components/dispatch/StatsCards";
import BookingTable from "@/components/dispatch/BookingTable";

export default function DashboardPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
        <p className="text-navy/50 text-sm mt-1">Overview of all bookings and activity.</p>
      </div>

      <div className="mb-8">
        <StatsCards />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-navy mb-4">Recent Bookings</h2>
        <BookingTable filter="all" />
      </div>
    </div>
  );
}
