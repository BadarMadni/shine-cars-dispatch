import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search")?.trim();
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: Record<string, unknown> = {};
  if (status === "active") where.isActive = true;
  else if (status === "inactive") where.isActive = false;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
      { pickup: { contains: search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.recurringBooking.findMany({
      where, orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit, take: limit,
      include: {
        customer: { select: { companyName: true, accountType: true } },
        driver: { select: { id: true, name: true } },
        bookings: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true, status: true, date: true, time: true, fare: true } },
      },
    }),
    prisma.recurringBooking.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { customerId, pickup, dropoff, stops, time, vehicle, fare, distance, days, name, phone } = body;

    if (!customerId || !pickup || !dropoff || !time || !fare || !days || !name || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer || customer.accountType !== "company") {
      return NextResponse.json({ error: "Only company accounts can have recurring bookings" }, { status: 400 });
    }

    const recurring = await prisma.recurringBooking.create({
      data: {
        customerId, pickup, dropoff, time, vehicle: vehicle || "car",
        fare: parseFloat(fare), distance: parseFloat(distance) || 0,
        days: JSON.stringify(days), name, phone,
        stops: stops?.length ? JSON.stringify(stops) : null,
      },
    });

    return NextResponse.json({ recurring }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create recurring booking" }, { status: 500 });
  }
}
