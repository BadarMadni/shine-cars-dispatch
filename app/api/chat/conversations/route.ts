import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const drivers = await prisma.driver.findMany({
      where: { status: "approved" },
      select: { id: true, name: true, phone: true, isAvailable: true },
      orderBy: { name: "asc" },
    });

    const conversations = await Promise.all(
      drivers.map(async (d) => {
        const lastMsg = await prisma.chatMessage.findFirst({
          where: { driverId: d.id },
          orderBy: { createdAt: "desc" },
        });
        const unread = await prisma.chatMessage.count({
          where: { driverId: d.id, sender: "driver", isRead: false },
        });
        return { driver: d, lastMessage: lastMsg, unreadCount: unread };
      })
    );

    const sorted = conversations.sort((a, b) => {
      if (a.unreadCount && !b.unreadCount) return -1;
      if (!a.unreadCount && b.unreadCount) return 1;
      const aTime = a.lastMessage?.createdAt?.getTime() || 0;
      const bTime = b.lastMessage?.createdAt?.getTime() || 0;
      return bTime - aTime;
    });

    return NextResponse.json({ conversations: sorted });
  } catch {
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}
