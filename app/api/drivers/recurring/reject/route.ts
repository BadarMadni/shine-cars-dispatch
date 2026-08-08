import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(auth, process.env.JWT_SECRET!) as { id: string };
    const { recurringId } = await req.json();
    if (!recurringId) return NextResponse.json({ error: "Missing recurringId" }, { status: 400 });

    const recurring = await prisma.recurringBooking.findUnique({ where: { id: recurringId } });
    if (!recurring || recurring.driverId !== decoded.id) {
      return NextResponse.json({ error: "Not found or not assigned" }, { status: 404 });
    }

    await prisma.recurringBooking.update({
      where: { id: recurringId },
      data: { driverId: null, driverStatus: "rejected" },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
