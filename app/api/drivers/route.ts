import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where = status && status !== "all" ? { status } : {};

    const drivers = await prisma.driver.findMany({
      where,
      include: {
        documents: { select: { id: true, type: true, expiryDate: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      drivers: drivers.map((d) => ({
        id: d.id, name: d.name, email: d.email, phone: d.phone,
        status: d.status, isAvailable: d.isAvailable, isEnabled: d.isEnabled,
        createdAt: d.createdAt, documents: d.documents,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch drivers" }, { status: 500 });
  }
}
