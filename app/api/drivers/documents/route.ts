import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "shine-cars-dispatch-secret-2024";

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as { id: string };

    const formData = await req.formData();
    const type = formData.get("type") as string;
    const expiryDate = formData.get("expiryDate") as string;
    const file = formData.get("file") as File | null;

    if (!type || !expiryDate || !file) {
      return NextResponse.json({ success: false, message: "Missing fields" }, { status: 400 });
    }

    // Store as base64 data URL for now (production would use S3/R2)
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const fileUrl = `data:${file.type};base64,${base64}`;

    const doc = await prisma.driverDocument.create({
      data: { driverId: decoded.id, type, fileUrl, expiryDate },
    });

    return NextResponse.json({ success: true, document: { id: doc.id, type: doc.type, expiryDate: doc.expiryDate } });
  } catch {
    return NextResponse.json({ success: false, message: "Upload failed" }, { status: 500 });
  }
}
