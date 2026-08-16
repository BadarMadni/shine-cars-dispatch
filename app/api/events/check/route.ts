import { NextRequest, NextResponse } from "next/server";
import { getActiveEventPricing } from "@/lib/eventPricing";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const time = searchParams.get("time");

  if (!date || !time) {
    return NextResponse.json({ event: null });
  }

  const event = await getActiveEventPricing(date, time);
  if (!event) return NextResponse.json({ event: null });

  return NextResponse.json({
    event: { id: event.id, name: event.name, increasePercent: event.increasePercent },
  });
}
