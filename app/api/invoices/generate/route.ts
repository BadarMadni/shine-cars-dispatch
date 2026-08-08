import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { customerId } = await req.json();
  const now = new Date();
  const weekEnd = now.toISOString().split("T")[0];
  const weekStartDate = new Date(now);
  weekStartDate.setDate(weekStartDate.getDate() - 7);
  const weekStart = weekStartDate.toISOString().split("T")[0];

  const where: Record<string, unknown> = {
    paymentMethod: "invoice",
    date: { gte: weekStart, lt: weekEnd },
    invoiceItems: { none: {} },
  };
  if (customerId) where.customerId = customerId;

  const customers = customerId
    ? [{ id: customerId }]
    : await prisma.customer.findMany({ where: { accountType: "company" }, select: { id: true } });

  let created = 0;
  for (const c of customers) {
    const bookings = await prisma.booking.findMany({ where: { ...where, customerId: c.id } });
    if (!bookings.length) continue;

    const existing = await prisma.invoice.findUnique({
      where: { customerId_weekStart: { customerId: c.id, weekStart } },
    });
    if (existing) continue;

    const total = bookings.reduce((s, b) => s + b.fare, 0);
    await prisma.invoice.create({
      data: {
        customerId: c.id, weekStart, weekEnd, total,
        items: {
          create: bookings.map((b) => ({
            bookingId: b.id, fare: b.fare, date: b.date,
            pickup: b.pickup, dropoff: b.dropoff,
          })),
        },
      },
    });
    created++;
  }

  return NextResponse.json({ success: true, created });
}
