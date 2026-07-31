import { prisma } from "@/lib/prisma";

export async function createDriverNotification(
  driverId: string,
  title: string,
  body: string,
  type = "info",
  data?: string,
) {
  return prisma.driverNotification.create({
    data: { driverId, title, body, type, data },
  });
}
