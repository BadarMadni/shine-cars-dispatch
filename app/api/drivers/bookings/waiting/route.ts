import { NextResponse, NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "shine-cars-secret-2024";

export async function PATCH(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  try {
    jwt.verify(auth.slice(7), JWT_SECRET);
  } catch {
    return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
  }

  const { bookingId, waitingSeconds, waitingCharge } = await req.json();
  if (!bookingId) {
    return NextResponse.json({ success: false, message: "Missing bookingId" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (waitingSeconds != null) data.waitingSeconds = Math.round(waitingSeconds);
  if (waitingCharge != null) data.waitingCharge = parseFloat(waitingCharge);

  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data,
    select: { id: true, waitingSeconds: true, waitingCharge: true },
  });

  return NextResponse.json({ success: true, booking });
}
