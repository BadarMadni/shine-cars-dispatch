import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/pushNotification";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/London" }));
  const in25 = new Date(now.getTime() + 25 * 60 * 1000);
  const in40 = new Date(now.getTime() + 40 * 60 * 1000);
  const today = now.toISOString().split("T")[0];

  const bookings = await prisma.booking.findMany({
    where: {
      date: today, status: { in: ["pending", "confirmed", "assigned", "accepted"] },
      driverId: { not: null },
      driver: { pushToken: { not: null } },
    },
    include: { driver: { select: { pushToken: true, id: true } } },
  });

  let notified = 0;
  for (const b of bookings) {
    const [h, m] = b.time.split(":").map(Number);
    const bookingTime = new Date(now);
    bookingTime.setHours(h, m, 0, 0);

    if (bookingTime < in25 || bookingTime > in40) continue;
    if (!b.driver?.pushToken) continue;

    const alreadyNotified = await prisma.driverNotification.findFirst({
      where: { driverId: b.driver.id, type: "upcoming-booking", data: b.id },
    });
    if (alreadyNotified) continue;

    await sendPushNotification(
      b.driver.pushToken,
      "Upcoming Booking",
      `You have a ${b.isRecurring ? "recurring " : ""}booking at ${b.time} — ${b.pickup}`,
      { bookingId: b.id, type: "upcoming-booking" }
    );

    await prisma.driverNotification.create({
      data: {
        driverId: b.driver.id, title: "Upcoming Booking",
        body: `Booking at ${b.time} from ${b.pickup}`,
        type: "upcoming-booking", data: b.id,
      },
    });
    notified++;
  }

  return NextResponse.json({ success: true, notified });
}
