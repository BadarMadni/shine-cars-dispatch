import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(auth, process.env.JWT_SECRET!) as { id: string };
    const { recurringId } = await req.json();
    if (!recurringId) return NextResponse.json({ error: "Missing recurringId" }, { status: 400 });

    const recurring = await prisma.recurringBooking.findUnique({ where: { id: recurringId } });
    if (!recurring || recurring.driverId !== decoded.id) {
      return NextResponse.json({ error: "Not found or not assigned" }, { status: 404 });
    }

    await prisma.recurringBooking.update({ where: { id: recurringId }, data: { driverStatus: "accepted" } });

    // Auto-create today's booking if today is a scheduled day
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/London" }));
    const dayName = DAY_NAMES[now.getDay()];
    const dateStr = now.toISOString().split("T")[0];
    const scheduledDays: string[] = JSON.parse(recurring.days);
    const inRange = (!recurring.startDate || dateStr >= recurring.startDate) && (!recurring.endDate || dateStr <= recurring.endDate);

    if (scheduledDays.includes(dayName) && inRange) {
      const exists = await prisma.booking.findFirst({ where: { recurringId, date: dateStr } });
      if (!exists) {
        await prisma.booking.create({
          data: {
            name: recurring.name, phone: recurring.phone, pickup: recurring.pickup, dropoff: recurring.dropoff,
            date: dateStr, time: recurring.time, distance: recurring.distance, fare: recurring.fare,
            vehicle: recurring.vehicle, status: "assigned", source: "recurring", paymentMethod: "invoice",
            fareType: "fixed", paymentStatus: "unpaid", stops: recurring.stops,
            customerId: recurring.customerId, driverId: decoded.id, assignedAt: new Date(),
            isRecurring: true, recurringId,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
