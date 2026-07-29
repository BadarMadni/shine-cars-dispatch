import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (type && type !== "all") where.accountType = type;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, phone: true,
        accountType: true, createdAt: true,
      },
    });

    const phones = customers.map((c) => c.phone);
    const bookingCounts = await prisma.booking.groupBy({
      by: ["phone"],
      where: { phone: { in: phones } },
      _count: { id: true },
    });

    const countMap = new Map(bookingCounts.map((b) => [b.phone, b._count.id]));
    const result = customers.map((c) => ({
      ...c,
      totalRides: countMap.get(c.phone) || 0,
    }));

    return NextResponse.json({ customers: result });
  } catch {
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}
