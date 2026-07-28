import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status } = await req.json();

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const driver = await prisma.driver.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      driver: { id: driver.id, name: driver.name, status: driver.status },
    });
  } catch {
    return NextResponse.json({ error: "Failed to update driver" }, { status: 500 });
  }
}
