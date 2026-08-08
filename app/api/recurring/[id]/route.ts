import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const recurring = await prisma.recurringBooking.findUnique({
    where: { id },
    include: {
      customer: { select: { companyName: true, email: true, accountType: true } },
      bookings: { orderBy: { createdAt: "desc" }, take: 20 },
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
  const { isActive, pickup, dropoff, stops, time, vehicle, fare, distance, days, name, phone, driverId } = body;

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
  if (driverId !== undefined) data.driverId = driverId || null;

  const recurring = await prisma.recurringBooking.update({ where: { id }, data });
  return NextResponse.json({ recurring });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.recurringBooking.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
