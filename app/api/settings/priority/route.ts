import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const setting = await prisma.siteSetting.findUnique({ where: { key: "priorityEnabled" } });
  return NextResponse.json({ enabled: setting ? setting.value === "true" : true });
}

export async function PATCH(req: Request) {
  const { enabled } = await req.json();
  await prisma.siteSetting.upsert({
    where: { key: "priorityEnabled" },
    update: { value: String(enabled) },
    create: { key: "priorityEnabled", value: String(enabled) },
  });
  return NextResponse.json({ enabled });
}
