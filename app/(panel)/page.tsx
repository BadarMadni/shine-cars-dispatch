"use client";

import { Suspense } from "react";
import StatsCards from "@/components/dispatch/StatsCards";
import BookingTable from "@/components/dispatch/BookingTable";

export default function DashboardPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-5 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-navy">Dashboard</h1>
        <p className="text-navy/50 text-xs sm:text-sm mt-1">Overview of all bookings and activity.</p>
      </div>

      <div className="mb-5 sm:mb-8">
        <StatsCards />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
        <h2 className="text-lg font-bold text-navy mb-4">Recent Bookings</h2>
        <Suspense><BookingTable filter="all" /></Suspense>
      </div>
    </div>
  );
}
