import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const SECRET = process.env.CUSTOMER_JWT_SECRET || "shine-cars-customer-secret-2024";

function getCustomerId(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const p = jwt.verify(auth.slice(7), SECRET) as { id: string };
    return p.id;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const customerId = getCustomerId(req);
  if (!customerId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const bookings = await prisma.booking.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      include: { driver: { select: { name: true, phone: true, vehicleMake: true, vehicleColor: true } } },
    });
    return NextResponse.json({ bookings });
  } catch {
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}
