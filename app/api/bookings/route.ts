import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId, name, phone, email, pickup, dropoff, stops, date, time, fare, distance, vehicle, paymentMethod, fareType, notes, eventPricingId, eventSurcharge, pickupDetails, dropoffDetails, buildingInfo, source, isPriority, priorityCharge } = body;

    if (!name || !phone || !pickup || !dropoff || fare == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let resolvedCustomerId = customerId;

    if (!resolvedCustomerId && email) {
      const existing = await prisma.customer.findUnique({ where: { email } });
      if (existing) {
        resolvedCustomerId = existing.id;
      } else {
        const customer = await prisma.customer.create({
          data: { name, email, phone, password: await bcrypt.hash(phone, 10), accountType: "individual" },
        });
        resolvedCustomerId = customer.id;
      }
    }

    const booking = await prisma.booking.create({
      data: {
        name, phone, pickup, dropoff, date, time,
        fare: parseFloat(fare), distance: parseFloat(distance) || 0,
        vehicle: vehicle || "car", paymentMethod: paymentMethod || "cash",
        fareType: fareType || "fixed",
        source: source || "dispatch", notes: notes || null,
        pickupDetails: pickupDetails || null,
        dropoffDetails: dropoffDetails || null,
        buildingInfo: buildingInfo || null,
        stops: stops?.length ? JSON.stringify(stops) : null,
        customerId: resolvedCustomerId || null,
        eventPricingId: eventPricingId || null,
        eventSurcharge: eventSurcharge ? parseFloat(eventSurcharge) : null,
        isPriority: isPriority === true,
        priorityCharge: priorityCharge ? parseFloat(priorityCharge) : null,
      },
    });

    return NextResponse.json({ booking });
  } catch {
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim();
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status && status !== "all") where.status = status;
    const recurring = searchParams.get("recurring");
    if (recurring === "true") where.isRecurring = true;
    else where.isRecurring = false;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { pickup: { contains: search, mode: "insensitive" } },
        { dropoff: { contains: search, mode: "insensitive" } },
      ];
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    return NextResponse.json({ bookings, total, page, pages: Math.ceil(total / limit) });
  } catch {
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}
