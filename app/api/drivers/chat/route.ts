import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

function getDriverId(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const decoded = jwt.verify(auth.slice(7), process.env.JWT_SECRET || "shine-cars-secret-2024") as { id: string };
    return decoded.id;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const driverId = getDriverId(req);
  if (!driverId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const messages = await prisma.chatMessage.findMany({
      where: { driverId },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    await prisma.chatMessage.updateMany({
      where: { driverId, sender: "dispatcher", isRead: false },
      data: { isRead: true },
    });

    const unreadCount = await prisma.chatMessage.count({
      where: { driverId, sender: "dispatcher", isRead: false },
    });

    return NextResponse.json({ messages, unreadCount });
  } catch {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const driverId = getDriverId(req);
  if (!driverId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { message } = await req.json();
    if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

    const msg = await prisma.chatMessage.create({
      data: { driverId, message: message.trim(), sender: "driver" },
    });

    return NextResponse.json({ message: msg });
  } catch {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
