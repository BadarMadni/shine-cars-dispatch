import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
