import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, email, phone, accountType, companyName } = body;
    if (!id) return NextResponse.json({ error: "Missing customer id" }, { status: 400 });

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(accountType !== undefined && { accountType }),
        ...(companyName !== undefined && { companyName: companyName || null }),
      },
    });

    return NextResponse.json({ customer });
  } catch {
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}

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
        accountType: true, companyName: true, createdAt: true,
      },
    });

    const ids = customers.map((c) => c.id);
    const bookingCounts = await prisma.booking.groupBy({
      by: ["customerId"],
      where: { customerId: { in: ids } },
      _count: { id: true },
    });

    const countMap = new Map(bookingCounts.map((b) => [b.customerId, b._count.id]));
    const result = customers.map((c) => ({
      ...c,
      totalRides: countMap.get(c.id) || 0,
    }));

    return NextResponse.json({ customers: result });
  } catch {
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}
