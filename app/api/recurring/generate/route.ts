import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
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

    await prisma.booking.create({
      data: {
        name: rb.name, phone: rb.phone, pickup: rb.pickup, dropoff: rb.dropoff,
        date: dateStr, time: rb.time, distance: rb.distance, fare: rb.fare,
        vehicle: rb.vehicle, status: "pending", source: "recurring",
        paymentMethod: "invoice", fareType: "fixed", paymentStatus: "unpaid",
        stops: rb.stops, customerId: rb.customerId,
        isRecurring: true, recurringId: rb.id,
      },
    });
    created++;
  }

  return NextResponse.json({ success: true, created, date: dateStr });
}
