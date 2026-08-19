import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const SECRET = process.env.CUSTOMER_JWT_SECRET || "shine-cars-customer-secret-2024";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, customer.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = jwt.sign(
      { id: customer.id, email: customer.email, name: customer.name, accountType: customer.accountType },
      SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      token,
      customer: {
        id: customer.id, name: customer.name, email: customer.email,
        phone: customer.phone, accountType: customer.accountType,
        companyName: customer.companyName,
      },
    });
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
