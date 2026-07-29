import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "shine-cars-dispatch-secret-2024";
const VALID = ["accepted", "arrived", "in-progress", "completed", "cancelled"];

export async function PATCH(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as { id: string };
    const { bookingId, status } = await req.json();

    if (!bookingId || !VALID.includes(status)) {
      return NextResponse.json({ success: false, message: "Invalid data" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.driverId !== decoded.id) {
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch {
    return NextResponse.json({ success: false, message: "Failed" }, { status: 500 });
  }
}
