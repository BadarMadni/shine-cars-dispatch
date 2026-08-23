import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const SECRET = process.env.CUSTOMER_JWT_SECRET || "shine-cars-customer-secret-2024";

function getCustomer(req: NextRequest): { id: string; accountType: string } | null {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(auth.slice(7), SECRET) as { id: string; accountType: string };
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const customer = getCustomer(req);
  if (!customer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const recs = await prisma.recurringBooking.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
      include: {
        driver: { select: { name: true, phone: true } },
        bookings: { orderBy: { createdAt: "desc" }, select: { status: true, date: true } },
      },
    });
    const dayMap: Record<string, number> = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
    const items = recs.map((r) => {
      const days: string[] = JSON.parse(r.days || "[]");
      const completed = r.bookings.filter((b) => b.status === "completed").length;
      let totalDays = days.length;
      if (r.startDate && r.endDate) {
        let count = 0;
        const cur = new Date(r.startDate + "T00:00:00");
        const end = new Date(r.endDate + "T00:00:00");
        const dayNums = days.map((d) => dayMap[d]);
        while (cur <= end) { if (dayNums.includes(cur.getDay())) count++; cur.setDate(cur.getDate() + 1); }
        totalDays = count;
      }
      return { ...r, totalDays, completedDays: completed, remainingDays: Math.max(0, totalDays - completed) };
    });
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const customer = getCustomer(req);
  if (!customer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (customer.accountType !== "company") {
    return NextResponse.json({ error: "Only company accounts can create recurring bookings" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { pickup, dropoff, stops, time, vehicle, fare, distance, days, name, phone, frequency, startDate, endDate } = body;

    if (!pickup || !dropoff || !time || !fare || !days?.length || !name || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const recurring = await prisma.recurringBooking.create({
      data: {
        customerId: customer.id, pickup, dropoff, time,
        vehicle: vehicle || "car",
        fare: parseFloat(fare), distance: parseFloat(distance) || 0,
        days: JSON.stringify(days), name, phone,
        frequency: frequency || "weekly",
        startDate: startDate || null, endDate: endDate || null,
        stops: stops?.length ? JSON.stringify(stops) : null,
      },
    });

    return NextResponse.json({ recurring }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create recurring booking" }, { status: 500 });
  }
}
