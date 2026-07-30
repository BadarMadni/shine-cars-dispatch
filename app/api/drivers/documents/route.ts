import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { uploadToR2 } from "@/lib/r2";

const JWT_SECRET = process.env.JWT_SECRET || "shine-cars-dispatch-secret-2024";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Accept token from Authorization header OR FormData body (Android OkHttp bug workaround)
    const auth = req.headers.get("authorization");
    const bodyToken = formData.get("token") as string | null;
    const rawToken = auth?.startsWith("Bearer ") ? auth.slice(7) : bodyToken;

    if (!rawToken) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(rawToken, JWT_SECRET) as { id: string };

    const type = formData.get("type") as string;
    const expiryDate = formData.get("expiryDate") as string;
    const file = formData.get("file") as File | null;

    if (!type || !expiryDate || !file) {
      return NextResponse.json({ success: false, message: "Missing fields" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name?.split(".").pop() || "jpg";
    const key = `drivers/${decoded.id}/${type}_${Date.now()}.${ext}`;
    await uploadToR2(key, buffer, file.type || "image/jpeg");

    const doc = await prisma.driverDocument.create({
      data: { driverId: decoded.id, type, fileUrl: key, expiryDate },
    });

    return NextResponse.json({ success: true, document: { id: doc.id, type: doc.type, expiryDate: doc.expiryDate } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Document upload error:", msg);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
