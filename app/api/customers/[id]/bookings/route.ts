import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookings = await prisma.booking.findMany({
      where: { customerId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, pickup: true, dropoff: true, stops: true, date: true,
        time: true, distance: true, fare: true, vehicle: true,
        status: true, paymentMethod: true, paymentStatus: true,
        fareType: true, meterFare: true, cashCollected: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ bookings });
  } catch {
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}
