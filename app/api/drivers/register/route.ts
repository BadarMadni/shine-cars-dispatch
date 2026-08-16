import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "shine-cars-dispatch-secret-2024";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, password, vehicleMake, vehicleColor, vehicleReg, passengerLicense } = await req.json();

    if (!name || !email || !phone || !password) {
      return NextResponse.json({ success: false, message: "All fields are required" }, { status: 400 });
    }

    const existing = await prisma.driver.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ success: false, message: "Email already registered" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const driver = await prisma.driver.create({
      data: { name, email, phone, password: hashed, status: "pending", vehicleMake: vehicleMake || null, vehicleColor: vehicleColor || null, vehicleReg: vehicleReg || null, passengerLicense: passengerLicense ? parseInt(passengerLicense) : null },
    });

    const token = jwt.sign({ id: driver.id, type: "driver" }, JWT_SECRET, { expiresIn: "30d" });

    return NextResponse.json({
      success: true,
      token,
      driver: { id: driver.id, name: driver.name, email: driver.email, phone: driver.phone, status: driver.status, vehicleMake: driver.vehicleMake, vehicleColor: driver.vehicleColor, vehicleReg: driver.vehicleReg, passengerLicense: driver.passengerLicense },
    });
  } catch {
    return NextResponse.json({ success: false, message: "Registration failed" }, { status: 500 });
  }
}
