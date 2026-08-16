import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const search = searchParams.get("search")?.trim();
  const driverId = searchParams.get("driverId");

  const where: Record<string, unknown> = { status: "completed" };

  if (startDate || endDate) {
    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.gte = new Date(startDate + "T00:00:00Z");
    if (endDate) dateFilter.lte = new Date(endDate + "T23:59:59Z");
    where.createdAt = dateFilter;
  }
  if (driverId) where.driverId = driverId;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { pickup: { contains: search, mode: "insensitive" } },
      { dropoff: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
    ];
  }

  try {
    const bookings = await prisma.booking.findMany({
      where,
      select: {
        id: true, name: true, phone: true, pickup: true, dropoff: true,
        date: true, time: true, fare: true, meterFare: true, fareType: true,
        vehicle: true, paymentMethod: true, paymentStatus: true, cashCollected: true,
        isRecurring: true, createdAt: true,
        driver: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true, companyName: true, accountType: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalRevenue = bookings.reduce((s, b) => s + (b.meterFare || b.fare || 0), 0);
    const platformRevenue = Math.round(totalRevenue * 0.15 * 100) / 100;

    // Per-driver summary
    const driverMap = new Map<string, { name: string; rides: number; earnings: number }>();
    for (const b of bookings) {
      if (!b.driver) continue;
      const d = driverMap.get(b.driver.id) || { name: b.driver.name, rides: 0, earnings: 0 };
      d.rides++;
      d.earnings += b.meterFare || b.fare || 0;
      driverMap.set(b.driver.id, d);
    }
    const driverSummary = Array.from(driverMap.entries()).map(([id, d]) => ({
      id, name: d.name, rides: d.rides, earnings: Math.round(d.earnings * 100) / 100,
    })).sort((a, b) => b.earnings - a.earnings);

    // All drivers for filter dropdown
    const drivers = await prisma.driver.findMany({
      where: { status: "approved" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      bookings, totalRevenue: Math.round(totalRevenue * 100) / 100,
      platformRevenue, totalRides: bookings.length, driverSummary, drivers,
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
