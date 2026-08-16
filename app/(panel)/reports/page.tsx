"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart3 } from "lucide-react";
import ReportsSummary from "@/components/dispatch/ReportsSummary";
import ReportsFilters from "@/components/dispatch/ReportsFilters";
import ReportsTable from "@/components/dispatch/ReportsTable";
import DriverEarnings from "@/components/dispatch/DriverEarnings";

interface Booking {
  id: string; name: string; phone: string; pickup: string; dropoff: string;
  date: string; time: string; fare: number; meterFare?: number; fareType?: string;
  vehicle?: string; paymentMethod?: string; paymentStatus?: string; isRecurring?: boolean;
  driver?: { id: string; name: string } | null;
  customer?: { id: string; name: string; companyName?: string; accountType?: string } | null;
}

interface DriverSummary { id: string; name: string; rides: number; earnings: number }
interface DriverOption { id: string; name: string }

export default function ReportsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [driverSummary, setDriverSummary] = useState<DriverSummary[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [platformRevenue, setPlatformRevenue] = useState(0);
  const [totalRides, setTotalRides] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [driverId, setDriverId] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (driverId) params.set("driverId", driverId);
    try {
      const r = await fetch(`/api/reports?${params}`);
      const d = await r.json();
      setBookings(d.bookings || []);
      setDriverSummary(d.driverSummary || []);
      setDrivers(d.drivers || []);
      setTotalRevenue(d.totalRevenue || 0);
      setPlatformRevenue(d.platformRevenue || 0);
      setTotalRides(d.totalRides || 0);
    } catch {}
    setLoading(false);
  }, [search, startDate, endDate, driverId]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const exportCSV = () => {
    const headers = ["Date", "Time", "Customer", "Phone", "Driver", "Pickup", "Dropoff", "Vehicle", "Fare", "Payment", "Type"];
    const rows = bookings.map((b) => [
      b.date, b.time, b.customer?.companyName || b.name, b.phone,
      b.driver?.name || "", b.pickup, b.dropoff, b.vehicle || "Car",
      `£${(b.meterFare || b.fare || 0).toFixed(2)}`, b.paymentMethod || "", b.isRecurring ? "Recurring" : "Regular",
    ]);
    const totals = ["", "", "", "", "", "", "", "TOTAL", `£${totalRevenue.toFixed(2)}`, "", ""];
    const platform = ["", "", "", "", "", "", "", "PLATFORM 15%", `£${platformRevenue.toFixed(2)}`, "", ""];
    const csv = [headers, ...rows, totals, platform].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shine-cars-report-${startDate || "all"}-${endDate || "all"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="p-4 sm:p-6 lg:p-8 flex justify-center py-20">
      <div className="w-8 h-8 border-3 border-crimson/30 border-t-crimson rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-crimson" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-navy">Reports</h1>
          <p className="text-navy/50 text-xs sm:text-sm">Revenue, driver earnings & booking analytics.</p>
        </div>
      </div>

      <ReportsSummary totalRides={totalRides} totalRevenue={totalRevenue}
        platformRevenue={platformRevenue} driverCount={driverSummary.length} />

      <ReportsFilters search={search} onSearch={setSearch} startDate={startDate}
        onStartDate={setStartDate} endDate={endDate} onEndDate={setEndDate}
        driverId={driverId} onDriverId={setDriverId} drivers={drivers} onExport={exportCSV}
        onClear={() => { setSearch(""); setStartDate(""); setEndDate(""); setDriverId(""); }} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <ReportsTable bookings={bookings} />
        </div>
        <div>
          <DriverEarnings drivers={driverSummary} />
        </div>
      </div>
    </div>
  );
}
