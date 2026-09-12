import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, pending, confirmed, completed, todayCount, revenueAgg, completedBookings, drivers] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({ where: { status: "pending" } }),
      prisma.booking.count({ where: { status: "confirmed" } }),
      prisma.booking.count({ where: { status: "completed" } }),
      prisma.booking.count({ where: { createdAt: { gte: today } } }),
      prisma.booking.aggregate({
        _sum: { fare: true },
        where: { status: { in: ["confirmed", "completed"] } },
      }),
      prisma.booking.findMany({
        where: { status: "completed" },
        select: { fare: true, meterFare: true, driverId: true },
      }),
      prisma.driver.findMany({ select: { id: true, commissionRate: true } }),
    ]);

    const rateMap = new Map(drivers.map((d) => [d.id, d.commissionRate ?? 20]));
    let platformRevenue = 0;
    for (const b of completedBookings) {
      if (!b.driverId) continue;
      const rate = rateMap.get(b.driverId) ?? 20;
      platformRevenue += (b.meterFare || b.fare || 0) * (rate / 100);
    }
    platformRevenue = Math.round(platformRevenue * 100) / 100;

    return NextResponse.json({
      total, pending, confirmed, completed, todayCount,
      revenue: revenueAgg._sum.fare || 0, platformRevenue,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
