import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const openSetting = await prisma.siteSetting.findUnique({ where: { key: "systemOpen" } });
  const timeSetting = await prisma.siteSetting.findUnique({ where: { key: "reopeningTime" } });
  return NextResponse.json({
    open: openSetting ? openSetting.value === "true" : true,
    reopeningTime: timeSetting?.value || "08:00",
  });
}

export async function PATCH(req: Request) {
  const { open, reopeningTime } = await req.json();
  if (open !== undefined) {
    await prisma.siteSetting.upsert({
      where: { key: "systemOpen" },
      update: { value: String(open) },
      create: { key: "systemOpen", value: String(open) },
    });
  }
  if (reopeningTime !== undefined) {
    await prisma.siteSetting.upsert({
      where: { key: "reopeningTime" },
      update: { value: reopeningTime },
      create: { key: "reopeningTime", value: reopeningTime },
    });
  }
  const updated = await prisma.siteSetting.findUnique({ where: { key: "systemOpen" } });
  const updatedTime = await prisma.siteSetting.findUnique({ where: { key: "reopeningTime" } });
  return NextResponse.json({
    open: updated ? updated.value === "true" : true,
    reopeningTime: updatedTime?.value || "08:00",
  });
}
