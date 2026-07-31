import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "shine-cars-dispatch-secret-2024";

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as { id: string };
    const driver = await prisma.driver.findUnique({
      where: { id: decoded.id },
      include: { documents: true },
    });

    if (!driver) {
      return NextResponse.json({ success: false, message: "Driver not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      driver: {
        id: driver.id, name: driver.name, email: driver.email,
        phone: driver.phone, status: driver.status, isAvailable: driver.isAvailable,
        documents: driver.documents,
      },
    });
  } catch {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as { id: string };

    await prisma.driverNotification.deleteMany({ where: { driverId: decoded.id } });
    await prisma.driverDocument.deleteMany({ where: { driverId: decoded.id } });
    await prisma.booking.updateMany({ where: { driverId: decoded.id }, data: { driverId: null, status: "pending" } });
    await prisma.driver.delete({ where: { id: decoded.id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to delete account" }, { status: 500 });
  }
}
