import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/pushNotification";
import { createDriverNotification } from "@/lib/notify";
import { sendCustomerPushNotification } from "@/lib/sendCustomerNotification";

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
    const { status, notes, driverId, pickup, dropoff, stops, date, time, fare, distance, vehicle, paymentMethod, paymentStatus, fareType, meterDistance, meterFare, name, phone, buildingInfo } = body;

    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (notes !== undefined) data.notes = notes;
    if (pickup !== undefined) data.pickup = pickup;
    if (dropoff !== undefined) data.dropoff = dropoff;
    if (stops !== undefined) data.stops = stops;
    if (date !== undefined) data.date = date;
    if (time !== undefined) data.time = time;
    if (fare !== undefined) data.fare = parseFloat(fare);
    if (distance !== undefined) data.distance = parseFloat(distance);
    if (vehicle !== undefined) data.vehicle = vehicle;
    if (paymentMethod !== undefined) data.paymentMethod = paymentMethod;
    if (paymentStatus !== undefined) data.paymentStatus = paymentStatus;
    if (fareType !== undefined) data.fareType = fareType;
    if (meterDistance !== undefined) data.meterDistance = parseFloat(meterDistance);
    if (meterFare !== undefined) data.meterFare = parseFloat(meterFare);
    if (name !== undefined) data.name = name;
    if (phone !== undefined) data.phone = phone;
    if (buildingInfo !== undefined) data.buildingInfo = buildingInfo;

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

    const oldBooking = await prisma.booking.findUnique({ where: { id } });
    const booking = await prisma.booking.update({ where: { id }, data });

    // Auto-add to invoice when invoice booking is completed
    if (status === "completed" && oldBooking?.paymentMethod === "invoice" && oldBooking.customerId) {
      const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/London" }));
      const monday = new Date(now);
      monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
      const weekStart = monday.toISOString().split("T")[0];
      const endDate = new Date(monday);
      endDate.setDate(endDate.getDate() + 7);
      const weekEnd = endDate.toISOString().split("T")[0];

      const existing = await prisma.invoiceItem.findFirst({ where: { bookingId: id } });
      if (!existing) {
        const invoice = await prisma.invoice.upsert({
          where: { customerId_weekStart: { customerId: oldBooking.customerId, weekStart } },
          create: { customerId: oldBooking.customerId, weekStart, weekEnd, total: oldBooking.fare, status: "unpaid" },
          update: { total: { increment: oldBooking.fare } },
        });
        await prisma.invoiceItem.create({
          data: { invoiceId: invoice.id, bookingId: id, fare: oldBooking.fare, date: oldBooking.date, pickup: oldBooking.pickup, dropoff: oldBooking.dropoff },
        });
      }
    }

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
      createDriverNotification(
        driverId,
        "New Booking Assigned",
        `${booking.pickup} → ${booking.dropoff} | £${booking.fare.toFixed(2)}`,
        "booking",
        JSON.stringify({ bookingId: booking.id })
      );
    }

    // Send push notification to customer on status change
    if (status && oldBooking?.status !== status) {
      sendCustomerPushNotification(id, status);
    }

    // Send push notification to customer on fare update
    if (data.fare != null && oldBooking && oldBooking.fare !== booking.fare) {
      sendCustomerPushNotification(id, "fare-updated");
    }

    return NextResponse.json({ booking });
  } catch {
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
