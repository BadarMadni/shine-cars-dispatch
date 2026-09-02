import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId) return NextResponse.json({ error: "Missing session ID" }, { status: 400 });

    const key = process.env.STRIPE_SECRET_KEY!;
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    const session = await res.json();

    if (session.payment_status !== "paid") {
      return NextResponse.json({ success: false, status: session.payment_status });
    }

    const existing = await prisma.booking.findFirst({ where: { notes: `stripe:${sessionId}` } });
    if (existing) return NextResponse.json({ success: true, status: "paid" });

    const m = session.metadata!;
    await prisma.booking.create({
      data: {
        name: m.name!, phone: m.phone!, pickup: m.pickup!, dropoff: m.dropoff!,
        date: m.date!, time: m.time!,
        distance: parseFloat(m.distance!) || 0, fare: parseFloat(m.fare!) || 0,
        vehicle: m.vehicle || "car", source: "app",
        status: "pending", paymentMethod: "card", paymentStatus: "paid",
        stops: m.stops || null,
        customerId: m.customerId || undefined,
        pickupDetails: m.pickupDetails || null,
        dropoffDetails: m.dropoffDetails || null,
        buildingInfo: m.buildingInfo || null,
        notes: `stripe:${sessionId}`,
      },
    });

    return NextResponse.json({ success: true, status: "paid" });
  } catch {
    return NextResponse.json({ error: "Failed to confirm payment" }, { status: 500 });
  }
}
