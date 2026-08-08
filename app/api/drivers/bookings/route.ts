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
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "assigned";

    let where: Record<string, unknown> = { driverId: decoded.id };

    if (filter === "recurring") {
      where.isRecurring = true;
      where.status = { in: ["pending", "assigned", "accepted", "arrived", "in-progress"] };
    } else if (filter === "active") {
      where.isRecurring = false;
      where.status = { in: ["assigned", "accepted", "arrived", "in-progress"] };
    } else if (filter === "completed") {
      where.isRecurring = false;
      where.status = { in: ["completed", "cancelled"] };
    } else {
      where.isRecurring = false;
      where.status = { in: ["assigned"] };
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { assignedAt: "desc" },
    });

    return NextResponse.json({ success: true, bookings });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to fetch bookings" }, { status: 500 });
  }
}
