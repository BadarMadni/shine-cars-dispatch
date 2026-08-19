import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

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
