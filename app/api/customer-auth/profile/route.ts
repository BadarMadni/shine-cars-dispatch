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

export async function PATCH(req: NextRequest) {
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
    const body = await req.json();

    const allowed: Record<string, string> = {};
    if (body.name?.trim()) allowed.name = body.name.trim();
    if (body.phone?.trim()) allowed.phone = body.phone.trim();

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const customer = await prisma.customer.update({
      where: { id: payload.id },
      data: allowed,
      select: { id: true, name: true, email: true, phone: true, accountType: true, companyName: true },
    });

    return NextResponse.json({ customer });
  } catch (e) {
    return NextResponse.json({ error: "Update failed", details: String(e) }, { status: 500 });
  }
}
