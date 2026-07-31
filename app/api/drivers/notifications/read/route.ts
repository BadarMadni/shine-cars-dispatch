import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "shine-cars-dispatch-secret-2024";

export async function PATCH(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as { id: string };
    const body = await req.json();
    const { id } = body;

    if (id) {
      await prisma.driverNotification.updateMany({
        where: { id, driverId: decoded.id },
        data: { isRead: true },
      });
    } else {
      await prisma.driverNotification.updateMany({
        where: { driverId: decoded.id, isRead: false },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
