import { prisma } from "@/lib/prisma";

export async function getActiveEventPricing(date: string, time: string) {
  const events = await prisma.eventPricing.findMany({ where: { isActive: true } });
  const bookingDT = new Date(`${date}T${time}:00`).getTime();

  for (const e of events) {
    const start = new Date(`${e.startDate}T${e.startTime}:00`).getTime();
    const end = new Date(`${e.endDate}T${e.endTime}:00`).getTime();
    if (bookingDT >= start && bookingDT <= end) {
      return e;
    }
  }
  return null;
}

export function applyEventSurcharge(fare: number, increasePercent: number) {
  return Math.round(fare * (1 + increasePercent / 100) * 100) / 100;
}
