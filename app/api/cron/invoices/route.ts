import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const weekEnd = now.toISOString().split("T")[0];
  const weekStartDate = new Date(now);
  weekStartDate.setDate(weekStartDate.getDate() - 7);
  const weekStart = weekStartDate.toISOString().split("T")[0];

  const companyCustomers = await prisma.customer.findMany({
    where: { accountType: "company" },
    select: { id: true },
  });

  let invoicesCreated = 0;

  for (const c of companyCustomers) {
    const bookings = await prisma.booking.findMany({
      where: {
        customerId: c.id, paymentMethod: "invoice",
        date: { gte: weekStart, lt: weekEnd },
        invoiceItems: { none: {} },
      },
    });

    if (bookings.length === 0) continue;

    const existing = await prisma.invoice.findUnique({
      where: { customerId_weekStart: { customerId: c.id, weekStart } },
    });
    if (existing) continue;

    const total = bookings.reduce((sum, b) => sum + b.fare, 0);

    await prisma.invoice.create({
      data: {
        customerId: c.id, weekStart, weekEnd, total, status: "unpaid",
        items: {
          create: bookings.map((b) => ({
            bookingId: b.id, fare: b.fare, date: b.date,
            pickup: b.pickup, dropoff: b.dropoff,
          })),
        },
      },
    });
    invoicesCreated++;
  }

  return NextResponse.json({ success: true, invoicesCreated, weekStart, weekEnd });
}
