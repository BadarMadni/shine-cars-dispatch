import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const SECRET = process.env.CUSTOMER_JWT_SECRET || "shine-cars-customer-secret-2024";

interface CustomerPayload {
  id: string;
  email: string;
  name: string;
  accountType: string;
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ customer: null }, { status: 401 });
  }

  try {
    const payload = jwt.verify(auth.slice(7), SECRET) as CustomerPayload;
    return NextResponse.json({
      customer: {
        id: payload.id, name: payload.name,
        email: payload.email, accountType: payload.accountType,
      },
    });
  } catch {
    return NextResponse.json({ customer: null }, { status: 401 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: CustomerPayload;
  try {
    payload = jwt.verify(auth.slice(7).trim(), SECRET) as CustomerPayload;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.booking.updateMany({ where: { phone: (await prisma.customer.findUnique({ where: { id: payload.id }, select: { phone: true } }))?.phone || "" }, data: { driverId: null, status: "cancelled" } });
    await prisma.customer.delete({ where: { id: payload.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete account", details: String(e) }, { status: 500 });
  }
}
