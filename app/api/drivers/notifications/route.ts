import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "shine-cars-dispatch-secret-2024";

function getDriverId(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as { id: string };
    return decoded.id;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const driverId = getDriverId(req);
  if (!driverId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await prisma.driverNotification.findMany({
    where: { driverId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = await prisma.driverNotification.count({
    where: { driverId, isRead: false },
  });

  return NextResponse.json({ notifications, unreadCount });
}

export async function DELETE(req: NextRequest) {
  const driverId = getDriverId(req);
  if (!driverId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.driverNotification.deleteMany({ where: { driverId } });
  return NextResponse.json({ success: true });
}
