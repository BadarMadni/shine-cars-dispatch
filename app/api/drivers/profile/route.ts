import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "shine-cars-dispatch-secret-2024";

export async function PATCH(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as { id: string };
    const { name, phone, vehicleMake, vehicleColor, vehicleReg, passengerLicense } = await req.json();

    const data: Record<string, unknown> = {};
    if (name?.trim()) data.name = name.trim();
    if (phone?.trim()) data.phone = phone.trim();
    if (vehicleMake !== undefined) data.vehicleMake = vehicleMake?.trim() || "";
    if (vehicleColor !== undefined) data.vehicleColor = vehicleColor?.trim() || "";
    if (vehicleReg !== undefined) data.vehicleReg = vehicleReg?.trim() || "";
    if (passengerLicense !== undefined) data.passengerLicense = passengerLicense ? parseInt(String(passengerLicense)) : null;

    if (!Object.keys(data).length) {
      return NextResponse.json({ success: false, message: "No changes" }, { status: 400 });
    }

    const driver = await prisma.driver.update({
      where: { id: decoded.id },
      data,
      select: { id: true, name: true, email: true, phone: true, status: true, isAvailable: true, vehicleMake: true, vehicleColor: true, vehicleReg: true, passengerLicense: true },
    });

    return NextResponse.json({ success: true, driver });
  } catch {
    return NextResponse.json({ success: false, message: "Failed" }, { status: 500 });
  }
}
