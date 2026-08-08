import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/pushNotification";
import { createDriverNotification } from "@/lib/notify";

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/London" }));
  const dayName = DAY_NAMES[today.getDay()];
  const dateStr = today.toISOString().split("T")[0];

  const actives = await prisma.recurringBooking.findMany({ where: { isActive: true } });
  let created = 0;

  for (const rb of actives) {
    const days: string[] = JSON.parse(rb.days);
    if (!days.includes(dayName)) continue;

    const exists = await prisma.booking.findFirst({
      where: { recurringId: rb.id, date: dateStr },
    });
    if (exists) continue;

    const booking = await prisma.booking.create({
      data: {
        name: rb.name, phone: rb.phone, pickup: rb.pickup, dropoff: rb.dropoff,
        date: dateStr, time: rb.time, distance: rb.distance, fare: rb.fare,
        vehicle: rb.vehicle, status: rb.driverId ? "assigned" : "pending",
        source: "recurring", paymentMethod: "invoice", fareType: "fixed",
        paymentStatus: "unpaid", stops: rb.stops, customerId: rb.customerId,
        driverId: rb.driverId, assignedAt: rb.driverId ? new Date() : null,
        isRecurring: true, recurringId: rb.id,
      },
    });

    if (rb.driverId) {
      const driver = await prisma.driver.findUnique({ where: { id: rb.driverId }, select: { pushToken: true } });
      if (driver?.pushToken) {
        sendPushNotification(driver.pushToken, "Recurring Ride Today",
          `Booking at ${rb.time} — ${rb.pickup} → ${rb.dropoff} | £${rb.fare.toFixed(2)}`,
          { bookingId: booking.id, type: "upcoming-booking" });
      }
      createDriverNotification(rb.driverId, "Recurring Ride Today",
        `Booking at ${rb.time} from ${rb.pickup} | £${rb.fare.toFixed(2)}`,
        "upcoming-booking", booking.id);
    }
    created++;
  }

  return NextResponse.json({ success: true, created, date: dateStr, day: dayName });
}
