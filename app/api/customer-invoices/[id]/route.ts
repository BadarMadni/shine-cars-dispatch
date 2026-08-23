import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const SECRET = process.env.CUSTOMER_JWT_SECRET || "shine-cars-customer-secret-2024";

function getCustomer(req: NextRequest): { id: string } | null {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try { return jwt.verify(auth.slice(7), SECRET) as { id: string }; }
  catch { return null; }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const customer = getCustomer(req);
  if (!customer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id, customerId: customer.id },
    include: {
      customer: { select: { name: true, companyName: true, email: true, phone: true } },
      items: {
        include: {
          booking: {
            select: {
              vehicle: true, time: true, status: true, pickup: true, dropoff: true,
              isRecurring: true, recurringId: true,
            },
          },
        },
        orderBy: { date: "asc" },
      },
    },
  });

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Get recurring info if any booking is recurring
  const recurringIds = [...new Set(invoice.items.map((i) => i.booking?.recurringId).filter(Boolean))] as string[];
  let recurringInfo: Record<string, { frequency: string; days: string }> = {};
  if (recurringIds.length) {
    const recs = await prisma.recurringBooking.findMany({
      where: { id: { in: recurringIds } },
      select: { id: true, frequency: true, days: true },
    });
    recurringInfo = Object.fromEntries(recs.map((r) => [r.id, { frequency: r.frequency, days: r.days }]));
  }

  return NextResponse.json({
    invoice: {
      id: invoice.id,
      invoiceNumber: invoice.id.slice(-6).toUpperCase(),
      weekStart: invoice.weekStart,
      weekEnd: invoice.weekEnd,
      total: invoice.total,
      status: invoice.status,
      paidAt: invoice.paidAt,
      createdAt: invoice.createdAt,
      customer: invoice.customer,
      items: invoice.items.map((item) => ({
        id: item.id, date: item.date, fare: item.fare,
        pickup: item.pickup || item.booking?.pickup || "",
        dropoff: item.dropoff || item.booking?.dropoff || "",
        vehicle: item.booking?.vehicle || "car",
        time: item.booking?.time || "",
        status: item.booking?.status || "",
        isRecurring: item.booking?.isRecurring || false,
        recurring: item.booking?.recurringId ? recurringInfo[item.booking.recurringId] || null : null,
      })),
    },
  });
}
