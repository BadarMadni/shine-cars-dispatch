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

export async function POST(req: NextRequest) {
  const customerId = getCustomerId(req);
  if (!customerId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const { pushToken } = await req.json();
    if (!pushToken) return NextResponse.json({ error: "Missing pushToken" }, { status: 400 });

    await prisma.customer.update({
      where: { id: customerId },
      data: { pushToken },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save push token" }, { status: 500 });
  }
}
