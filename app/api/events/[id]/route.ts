import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.name) data.name = body.name;
  if (body.startDate) data.startDate = body.startDate;
  if (body.startTime) data.startTime = body.startTime;
  if (body.endDate) data.endDate = body.endDate;
  if (body.endTime) data.endTime = body.endTime;
  if (body.increasePercent !== undefined) data.increasePercent = parseFloat(body.increasePercent);
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;

  const event = await prisma.eventPricing.update({ where: { id }, data });
  return NextResponse.json({ event });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.eventPricing.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
