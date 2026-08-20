import { prisma } from "./prisma";

const STATUS_MESSAGES: Record<string, { title: string; body: string }> = {
  confirmed: { title: "Booking Confirmed", body: "Your ride has been confirmed by dispatch." },
  assigned: { title: "Driver Assigned", body: "A driver has been assigned to your ride." },
  accepted: { title: "Driver Accepted", body: "Your driver has accepted the trip and is on the way." },
  arrived: { title: "Driver Arrived", body: "Your driver has arrived at the pickup location." },
  "in-progress": { title: "Trip Started", body: "Your trip is now in progress. Enjoy the ride!" },
  completed: { title: "Trip Completed", body: "Your trip has been completed. Thank you for riding with Shine Cars!" },
  cancelled: { title: "Booking Cancelled", body: "Your booking has been cancelled." },
};

export async function sendCustomerPushNotification(bookingId: string, newStatus: string) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { customerId: true, pickup: true, dropoff: true },
    });

    if (!booking?.customerId) return;

    const customer = await prisma.customer.findUnique({
      where: { id: booking.customerId },
      select: { pushToken: true },
    });

    if (!customer?.pushToken) return;

    const msg = STATUS_MESSAGES[newStatus];
    if (!msg) return;

    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify({
        to: customer.pushToken,
        title: msg.title,
        body: msg.body,
        data: { bookingId, status: newStatus },
        sound: "default",
        badge: 1,
      }),
    });
  } catch (e) {
    console.error("Push notification error:", e);
  }
}
