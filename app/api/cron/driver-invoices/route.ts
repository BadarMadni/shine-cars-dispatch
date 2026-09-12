import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/pushNotification";
import { createDriverNotification } from "@/lib/notify";

function parseDate(d: string): string {
  if (d.includes("/")) {
    const [dd, mm, yyyy] = d.split("/");
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  return d;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date(new Date().toLocaleString("en-GB", { timeZone: "Europe/London" }));
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const weekEndDate = new Date(now);
  weekEndDate.setDate(weekEndDate.getDate() - mondayOffset);
  const weekStartDate = new Date(weekEndDate);
  weekStartDate.setDate(weekStartDate.getDate() - 7);

  const weekStart = weekStartDate.toISOString().split("T")[0];
  const weekEnd = weekEndDate.toISOString().split("T")[0];

  const licenceSetting = await prisma.siteSetting.findUnique({ where: { key: "licenceFee" } });
  const licenceFee = licenceSetting ? parseFloat(licenceSetting.value) : 3;

  const drivers = await prisma.driver.findMany({
    where: { status: "approved" },
    select: { id: true, commissionRate: true, pushToken: true, name: true },
  });

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
      return d >= weekStart && d < weekEnd;
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

    const inv = await prisma.driverInvoice.create({
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

    createDriverNotification(driver.id, "Weekly Invoice",
      `Your invoice for £${totalFares.toFixed(2)} (net: £${netPayable.toFixed(2)}) is ready.`, "invoice",
      JSON.stringify({ invoiceId: inv.id }));

    if (driver.pushToken) {
      sendPushNotification(driver.pushToken, "Weekly Invoice Ready",
        `Your invoice for £${totalFares.toFixed(2)} is ready. Net payable: £${netPayable.toFixed(2)}`,
        { type: "invoice", invoiceId: inv.id });
    }

    invoicesCreated++;
  }

  return NextResponse.json({ success: true, invoicesCreated, weekStart, weekEnd });
}
