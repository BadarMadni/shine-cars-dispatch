import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function parseDate(d: string): string {
  if (d.includes("/")) {
    const [dd, mm, yyyy] = d.split("/");
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  return d;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { driverId, weekStart, weekEnd, regenerate } = await req.json();
  if (!weekStart || !weekEnd) {
    return NextResponse.json({ error: "weekStart and weekEnd required" }, { status: 400 });
  }

  if (regenerate) {
    const delWhere: Record<string, string> = { weekStart, weekEnd };
    if (driverId) delWhere.driverId = driverId;
    await prisma.driverInvoice.deleteMany({ where: delWhere });
  }

  const licenceSetting = await prisma.siteSetting.findUnique({ where: { key: "licenceFee" } });
  const licenceFee = licenceSetting ? parseFloat(licenceSetting.value) : 3;

  const drivers = driverId
    ? await prisma.driver.findMany({ where: { id: driverId }, select: { id: true, commissionRate: true } })
    : await prisma.driver.findMany({ where: { status: "approved", isEnabled: true }, select: { id: true, commissionRate: true } });

  let invoicesCreated = 0;

  for (const driver of drivers) {
    const allBookings = await prisma.booking.findMany({
      where: {
        driverId: driver.id, status: "completed",
        driverInvoiceItems: { none: {} },
      },
    });

    const bookings = allBookings.filter((b) => {
      const d = parseDate(b.date);
      return d >= weekStart && d <= weekEnd;
    });

    if (bookings.length === 0) continue;

    const existing = await prisma.driverInvoice.findUnique({
      where: { driverId_weekStart: { driverId: driver.id, weekStart } },
    });
    if (existing) continue;

    const totalFares = Math.round(bookings.reduce((sum, b) => sum + (b.meterFare || b.fare), 0) * 100) / 100;
    const rate = driver.commissionRate ?? 20;
    const commissionAmount = Math.round(totalFares * (rate / 100) * 100) / 100;
    const netPayable = Math.round((totalFares - commissionAmount - licenceFee) * 100) / 100;

    await prisma.driverInvoice.create({
      data: {
        driverId: driver.id, weekStart, weekEnd, totalFares,
        commissionRate: rate, commissionAmount, licenceFee, netPayable,
        items: {
          create: bookings.map((b) => ({
            bookingId: b.id, fare: Math.round((b.meterFare || b.fare) * 100) / 100,
            date: b.date, pickup: b.pickup, dropoff: b.dropoff,
          })),
        },
      },
    });
    invoicesCreated++;
  }

  return NextResponse.json({ success: true, invoicesCreated });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { weekStart, weekEnd } = await req.json();
  const where: Record<string, string> = {};
  if (weekStart) where.weekStart = weekStart;
  if (weekEnd) where.weekEnd = weekEnd;

  const deleted = await prisma.driverInvoice.deleteMany({ where });
  return NextResponse.json({ success: true, deleted: deleted.count });
}
