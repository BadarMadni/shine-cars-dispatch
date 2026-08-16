import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getR2Url, isR2Key } from "@/lib/r2";
import { createDriverNotification } from "@/lib/notify";
import { sendPushNotification } from "@/lib/pushNotification";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const driver = await prisma.driver.findUnique({
      where: { id },
      include: {
        documents: true,
        bookings: {
          select: { id: true, pickup: true, dropoff: true, pickupDetails: true, dropoffDetails: true, date: true, time: true, status: true, fare: true, vehicle: true, isRecurring: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }
    const documents = await Promise.all(
      driver.documents.map(async (doc) => ({
        id: doc.id, type: doc.type, expiryDate: doc.expiryDate,
        fileUrl: isR2Key(doc.fileUrl) ? await getR2Url(doc.fileUrl) : doc.fileUrl,
      })),
    );
    return NextResponse.json({
      driver: {
        id: driver.id, name: driver.name, email: driver.email, phone: driver.phone,
        status: driver.status, isAvailable: driver.isAvailable, isEnabled: driver.isEnabled,
        vehicleMake: driver.vehicleMake, vehicleColor: driver.vehicleColor, vehicleReg: driver.vehicleReg, passengerLicense: driver.passengerLicense,
        createdAt: driver.createdAt, documents, bookings: driver.bookings,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch driver" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const data: Record<string, unknown> = {};

    if (body.status && ["approved", "rejected"].includes(body.status)) {
      data.status = body.status;
      if (body.status === "rejected") {
        await prisma.driverDocument.deleteMany({ where: { driverId: id } });
      }
    }
    if (typeof body.isEnabled === "boolean") {
      data.isEnabled = body.isEnabled;
    }

    if (!Object.keys(data).length) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const driver = await prisma.driver.update({
      where: { id },
      data,
      select: { id: true, name: true, status: true, isEnabled: true, pushToken: true },
    });

    if (body.status === "approved") {
      createDriverNotification(id, "Account Approved", "Your account has been approved. You can now receive bookings!", "approval");
      if (driver.pushToken) sendPushNotification(driver.pushToken, "Account Approved", "Your account has been approved. You can now receive bookings!", { type: "approval" });
    } else if (body.status === "rejected") {
      createDriverNotification(id, "Account Rejected", "Your account was not approved. Please resubmit your documents.", "rejection");
      if (driver.pushToken) sendPushNotification(driver.pushToken, "Account Rejected", "Your account was not approved. Please resubmit your documents.", { type: "rejection" });
    }

    return NextResponse.json({
      success: true,
      driver: { id: driver.id, name: driver.name, status: driver.status, isEnabled: driver.isEnabled },
    });
  } catch {
    return NextResponse.json({ error: "Failed to update driver" }, { status: 500 });
  }
}
