import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { sendCustomerPushNotification } from "@/lib/sendCustomerNotification";
import { sendPushNotification } from "@/lib/pushNotification";

const JWT_SECRET = process.env.JWT_SECRET || "shine-cars-dispatch-secret-2024";
const VALID = ["accepted", "arrived", "in-progress", "completed", "cancelled"];

export async function PATCH(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as { id: string };
    const { bookingId, status, cashCollected, meterDistance, meterFare } = await req.json();

    if (!bookingId || !VALID.includes(status)) {
      return NextResponse.json({ success: false, message: "Invalid data" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.driverId !== decoded.id) {
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = { status };
    if (meterDistance != null) data.meterDistance = parseFloat(meterDistance);
    if (meterFare != null) data.meterFare = parseFloat(meterFare);
    if (status === "completed" && booking.paymentMethod === "cash" && cashCollected != null) {
      data.cashCollected = parseFloat(cashCollected);
      data.paymentStatus = "paid";
    }
    if (status === "completed" && booking.paymentMethod === "card") {
      data.paymentStatus = "paid";
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data,
    });

    // Auto-add to invoice when invoice booking is completed
    if (status === "completed" && booking.paymentMethod === "invoice" && booking.customerId) {
      const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/London" }));
      const monday = new Date(now);
      monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
      const weekStart = monday.toISOString().split("T")[0];
      const endDate = new Date(monday);
      endDate.setDate(endDate.getDate() + 7);
      const weekEnd = endDate.toISOString().split("T")[0];

      const existing = await prisma.invoiceItem.findFirst({ where: { bookingId } });
      if (!existing) {
        const invoice = await prisma.invoice.upsert({
          where: { customerId_weekStart: { customerId: booking.customerId, weekStart } },
          create: { customerId: booking.customerId, weekStart, weekEnd, total: booking.fare, status: "unpaid" },
          update: { total: { increment: booking.fare } },
        });
        await prisma.invoiceItem.create({
          data: { invoiceId: invoice.id, bookingId, fare: booking.fare, date: booking.date, pickup: booking.pickup, dropoff: booking.dropoff },
        });

        // Check if all recurring bookings are now completed → notify customer to pay
        if (booking.recurringId) {
          const remaining = await prisma.booking.count({ where: { recurringId: booking.recurringId, status: { not: "completed" } } });
          if (remaining === 0) {
            const cust = await prisma.customer.findUnique({ where: { id: booking.customerId! }, select: { pushToken: true } });
            if (cust?.pushToken) {
              sendPushNotification(cust.pushToken, "Invoice Ready to Pay",
                `All rides completed! Your invoice #${invoice.id.slice(-6).toUpperCase()} is ready. Tap to pay.`,
                { type: "invoice-pay", invoiceId: invoice.id });
            }
          }
        }
      }
    }

    // Send push notification to customer on status change
    if (booking.status !== status) {
      sendCustomerPushNotification(bookingId, status);
    }

    return NextResponse.json({ success: true, booking: updated });
  } catch {
    return NextResponse.json({ success: false, message: "Failed" }, { status: 500 });
  }
}
