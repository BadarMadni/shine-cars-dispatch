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
    const { isAvailable } = await req.json();

    const driver = await prisma.driver.update({
      where: { id: decoded.id },
      data: { isAvailable: Boolean(isAvailable) },
    });

    return NextResponse.json({
      success: true,
      isAvailable: driver.isAvailable,
    });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to update availability" }, { status: 500 });
  }
}
