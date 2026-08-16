import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim();

    const where: Record<string, unknown> = {};
    if (status && status !== "all") where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    const drivers = await prisma.driver.findMany({
      where,
      include: {
        documents: { select: { id: true, type: true, expiryDate: true } },
        bookings: { where: { status: { in: ["accepted", "arrived", "in-progress"] } }, select: { id: true }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      drivers: drivers.map((d) => ({
        id: d.id, name: d.name, email: d.email, phone: d.phone,
        status: d.status, isAvailable: d.isAvailable, isEnabled: d.isEnabled,
        hasActiveRide: d.bookings.length > 0,
        vehicleMake: d.vehicleMake, vehicleColor: d.vehicleColor, vehicleReg: d.vehicleReg, passengerLicense: d.passengerLicense,
        createdAt: d.createdAt, documents: d.documents,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch drivers" }, { status: 500 });
  }
}
