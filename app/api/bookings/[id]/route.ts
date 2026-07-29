import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/pushNotification";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { driver: { select: { id: true, name: true, phone: true } } },
    });
    if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ booking });
  } catch {
    return NextResponse.json({ error: "Failed to fetch booking" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, notes, driverId } = body;

    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (notes !== undefined) data.notes = notes;

    if (driverId !== undefined) {
      if (driverId === null) {
        data.driverId = null;
        data.assignedAt = null;
        if (!status) data.status = "confirmed";
      } else {
        data.driverId = driverId;
        data.assignedAt = new Date();
        if (!status) data.status = "assigned";
      }
    }

    const booking = await prisma.booking.update({ where: { id }, data });

    if (driverId && driverId !== null) {
      const driver = await prisma.driver.findUnique({
        where: { id: driverId },
        select: { pushToken: true },
      });
      if (driver?.pushToken) {
        sendPushNotification(
          driver.pushToken,
          "New Booking Assigned",
          `Pickup: ${booking.pickup} → ${booking.dropoff}`,
          { bookingId: booking.id }
        );
      }
    }

    return NextResponse.json({ booking });
  } catch {
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
