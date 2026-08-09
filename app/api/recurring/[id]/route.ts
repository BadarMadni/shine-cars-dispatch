import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendPushNotification } from "@/lib/pushNotification";
import { createDriverNotification } from "@/lib/notify";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const recurring = await prisma.recurringBooking.findUnique({
    where: { id },
    include: {
      customer: { select: { companyName: true, email: true, accountType: true } },
      bookings: { orderBy: { date: "desc" }, take: 30, select: { id: true, status: true, date: true, time: true, fare: true, driverId: true } },
    },
  });

  if (!recurring) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ recurring });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { isActive, pickup, dropoff, stops, time, vehicle, fare, distance, days, name, phone, driverId, frequency, startDate, endDate } = body;

  const data: Record<string, unknown> = {};
  if (typeof isActive === "boolean") data.isActive = isActive;
  if (pickup) data.pickup = pickup;
  if (dropoff) data.dropoff = dropoff;
  if (time) data.time = time;
  if (vehicle) data.vehicle = vehicle;
  if (fare !== undefined) data.fare = parseFloat(fare);
  if (distance !== undefined) data.distance = parseFloat(distance);
  if (days) data.days = JSON.stringify(days);
  if (name) data.name = name;
  if (phone) data.phone = phone;
  if (stops !== undefined) data.stops = stops?.length ? JSON.stringify(stops) : null;
  if (frequency) data.frequency = frequency;
  if (startDate !== undefined) data.startDate = startDate || null;
  if (endDate !== undefined) data.endDate = endDate || null;
  if (driverId !== undefined) {
    data.driverId = driverId || null;
    data.driverStatus = null;
  }

  const oldRecurring = await prisma.recurringBooking.findUnique({ where: { id }, select: { driverId: true } });
  const recurring = await prisma.recurringBooking.update({ where: { id }, data });

  // Send notification + create today's booking when driver is newly assigned
  if (driverId && driverId !== oldRecurring?.driverId) {
    const driver = await prisma.driver.findUnique({ where: { id: driverId }, select: { pushToken: true } });
    if (driver?.pushToken) {
      sendPushNotification(driver.pushToken, "Recurring Booking Assigned",
        `${recurring.pickup} → ${recurring.dropoff} | £${recurring.fare.toFixed(2)}`,
        { recurringId: recurring.id, type: "recurring" });
    }
    createDriverNotification(driverId, "Recurring Booking Assigned",
      `${recurring.name} | ${recurring.pickup} → ${recurring.dropoff} | £${recurring.fare.toFixed(2)}`,
      "recurring", JSON.stringify({ recurringId: recurring.id }));

    // Auto-create today's booking if today is a scheduled day
    const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/London" }));
    const dayName = DAY_NAMES[now.getDay()];
    const dateStr = now.toISOString().split("T")[0];
    const scheduledDays: string[] = JSON.parse(recurring.days);

    if (scheduledDays.includes(dayName)) {
      const exists = await prisma.booking.findFirst({ where: { recurringId: id, date: dateStr } });
      if (!exists) {
        await prisma.booking.create({
          data: {
            name: recurring.name, phone: recurring.phone, pickup: recurring.pickup, dropoff: recurring.dropoff,
            date: dateStr, time: recurring.time, distance: recurring.distance, fare: recurring.fare,
            vehicle: recurring.vehicle, status: "assigned", source: "recurring", paymentMethod: "invoice",
            fareType: "fixed", paymentStatus: "unpaid", stops: recurring.stops,
            customerId: recurring.customerId, driverId, assignedAt: new Date(),
            isRecurring: true, recurringId: id,
          },
        });
      }
    }
  }

  return NextResponse.json({ recurring });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.recurringBooking.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
