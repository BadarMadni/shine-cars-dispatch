import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/pushNotification";

export async function GET(req: NextRequest) {
  try {
    const driverId = req.nextUrl.searchParams.get("driverId");
    if (!driverId) return NextResponse.json({ error: "driverId required" }, { status: 400 });

    const messages = await prisma.chatMessage.findMany({
      where: { driverId },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    await prisma.chatMessage.updateMany({
      where: { driverId, sender: "driver", isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { driverId, message } = await req.json();
    if (!driverId || !message?.trim()) {
      return NextResponse.json({ error: "driverId and message required" }, { status: 400 });
    }

    const msg = await prisma.chatMessage.create({
      data: { driverId, message: message.trim(), sender: "dispatcher" },
    });

    // Send push notification to driver
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      select: { pushToken: true },
    });
    if (driver?.pushToken) {
      sendPushNotification(driver.pushToken, "New Message", message.trim(), { type: "chat" });
    }

    return NextResponse.json({ message: msg });
  } catch {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
