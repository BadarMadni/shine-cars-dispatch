import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getR2Url, isR2Key } from "@/lib/r2";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const driver = await prisma.driver.findUnique({
      where: { id },
      include: { documents: true },
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
        createdAt: driver.createdAt, documents,
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
    });

    return NextResponse.json({
      success: true,
      driver: { id: driver.id, name: driver.name, status: driver.status, isEnabled: driver.isEnabled },
    });
  } catch {
    return NextResponse.json({ error: "Failed to update driver" }, { status: 500 });
  }
}
