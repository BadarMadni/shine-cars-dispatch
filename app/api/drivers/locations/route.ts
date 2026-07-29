import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const drivers = await prisma.driver.findMany({
      where: { status: "approved", isEnabled: true, NOT: { latitude: null } },
      select: {
        id: true, name: true, isAvailable: true,
        latitude: true, longitude: true, locationUpdatedAt: true,
      },
    });

    return NextResponse.json({ drivers });
  } catch (e) {
    console.error("locations error:", e);
    return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 });
  }
}
