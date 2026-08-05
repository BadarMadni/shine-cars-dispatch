import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { uploadToR2, getR2Url, isR2Key } from "@/lib/r2";

const JWT_SECRET = process.env.JWT_SECRET || "shine-cars-dispatch-secret-2024";

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    const rawToken = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!rawToken) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const decoded = jwt.verify(rawToken, JWT_SECRET) as { id: string };
    const docs = await prisma.driverDocument.findMany({
      where: { driverId: decoded.id },
      orderBy: { createdAt: "desc" },
    });
    const unique = new Map<string, typeof docs[0]>();
    for (const d of docs) {
      if (!unique.has(d.type)) unique.set(d.type, d);
    }
    const documents = await Promise.all(
      Array.from(unique.values()).map(async (doc) => ({
        id: doc.id,
        type: doc.type,
        fileUrl: isR2Key(doc.fileUrl) ? await getR2Url(doc.fileUrl) : doc.fileUrl,
        expiryDate: doc.expiryDate,
      }))
    );
    return NextResponse.json({ success: true, documents });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

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

    // Set driver status back to "pending" when uploading docs (handles resubmit after rejection)
    await prisma.driver.update({
      where: { id: decoded.id },
      data: { status: "pending" },
    });

    return NextResponse.json({ success: true, document: { id: doc.id, type: doc.type, expiryDate: doc.expiryDate } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Document upload error:", msg);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
