import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId, name, phone, email, pickup, dropoff, date, time, fare, distance, vehicle, paymentMethod, notes } = body;

    if (!name || !phone || !pickup || !dropoff || !fare) {
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
        source: "dispatch", notes: notes || null,
        customerId: resolvedCustomerId || null,
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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where = status && status !== "all" ? { status } : {};

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
