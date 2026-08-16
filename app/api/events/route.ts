import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const events = await prisma.eventPricing.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ events });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, startDate, startTime, endDate, endTime, increasePercent } = await req.json();
  if (!name || !startDate || !startTime || !endDate || !endTime || !increasePercent) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  // Check for overlapping active events
  const existing = await prisma.eventPricing.findMany({ where: { isActive: true } });
  const newStart = new Date(`${startDate}T${startTime}:00`).getTime();
  const newEnd = new Date(`${endDate}T${endTime}:00`).getTime();
  for (const e of existing) {
    const eStart = new Date(`${e.startDate}T${e.startTime}:00`).getTime();
    const eEnd = new Date(`${e.endDate}T${e.endTime}:00`).getTime();
    if (newStart < eEnd && newEnd > eStart) {
      return NextResponse.json({ error: `Overlaps with "${e.name}"` }, { status: 400 });
    }
  }

  const event = await prisma.eventPricing.create({
    data: { name, startDate, startTime, endDate, endTime, increasePercent: parseFloat(increasePercent) },
  });
  return NextResponse.json({ event });
}
