import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const SECRET = process.env.CUSTOMER_JWT_SECRET || "shine-cars-customer-secret-2024";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, password, accountType, companyName } = await req.json();

    if (!name || !email || !phone || !password || !accountType) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (!["company", "individual"].includes(accountType)) {
      return NextResponse.json({ error: "Invalid account type" }, { status: 400 });
    }

    const existing = await prisma.customer.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const customer = await prisma.customer.create({
      data: {
        name, email, phone, password: hashed,
        accountType, companyName: accountType === "company" ? companyName : null,
      },
    });

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
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}
