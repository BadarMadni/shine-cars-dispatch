import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const setting = await prisma.siteSetting.findUnique({ where: { key: "licenceFee" } });
  return NextResponse.json({ fee: setting ? parseFloat(setting.value) : 3 });
}

export async function PATCH(req: Request) {
  const { fee } = await req.json();
  const value = parseFloat(fee);
  if (isNaN(value) || value < 0 || value > 100) {
    return NextResponse.json({ error: "Invalid fee" }, { status: 400 });
  }
  await prisma.siteSetting.upsert({
    where: { key: "licenceFee" },
    update: { value: String(value) },
    create: { key: "licenceFee", value: String(value) },
  });
  return NextResponse.json({ fee: value });
}
