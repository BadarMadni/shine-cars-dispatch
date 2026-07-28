import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "shine-cars-dispatch-secret-2024";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email and password required" }, { status: 400 });
    }

    const driver = await prisma.driver.findUnique({ where: { email } });
    if (!driver) {
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, driver.password);
    if (!valid) {
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
    }

    if (driver.status === "rejected") {
      return NextResponse.json({ success: false, message: "Your account has been rejected" }, { status: 403 });
    }

    const token = jwt.sign({ id: driver.id, type: "driver" }, JWT_SECRET, { expiresIn: "30d" });

    return NextResponse.json({
      success: true,
      token,
      driver: { id: driver.id, name: driver.name, email: driver.email, phone: driver.phone, status: driver.status },
    });
  } catch {
    return NextResponse.json({ success: false, message: "Login failed" }, { status: 500 });
  }
}
