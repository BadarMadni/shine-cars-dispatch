import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, phone, newPassword } = await req.json();

    if (!email || !phone || !newPassword) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const driver = await prisma.driver.findUnique({ where: { email: email.trim().toLowerCase() } });

    if (!driver) {
      return NextResponse.json({ error: "No account found with this email" }, { status: 404 });
    }

    const cleanPhone = phone.replace(/[^0-9+]/g, "");
    const driverPhone = driver.phone.replace(/[^0-9+]/g, "");

    if (!driverPhone.includes(cleanPhone.slice(-10)) && !cleanPhone.includes(driverPhone.slice(-10))) {
      return NextResponse.json({ error: "Phone number does not match this account" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.driver.update({ where: { id: driver.id }, data: { password: hashed } });

    return NextResponse.json({ success: true, message: "Password reset successfully" });
  } catch {
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
