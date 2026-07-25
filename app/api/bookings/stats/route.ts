import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, pending, confirmed, completed, todayCount, revenue] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({ where: { status: "pending" } }),
      prisma.booking.count({ where: { status: "confirmed" } }),
      prisma.booking.count({ where: { status: "completed" } }),
      prisma.booking.count({ where: { createdAt: { gte: today } } }),
      prisma.booking.aggregate({
        _sum: { fare: true },
        where: { status: { in: ["confirmed", "completed"] } },
      }),
    ]);

    return NextResponse.json({
      total, pending, confirmed, completed, todayCount,
      revenue: revenue._sum.fare || 0,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
