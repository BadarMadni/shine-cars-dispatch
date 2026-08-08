import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "shine-cars-dispatch-secret-2024";

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as { id: string };

    const templates = await prisma.recurringBooking.findMany({
      where: { driverId: decoded.id, isActive: true },
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { companyName: true } },
        bookings: { orderBy: { date: "desc" }, take: 14, select: { id: true, status: true, date: true, time: true, fare: true } },
      },
    });

    return NextResponse.json({ success: true, templates });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to fetch recurring" }, { status: 500 });
  }
}
