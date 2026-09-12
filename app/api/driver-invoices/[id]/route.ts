import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const invoice = await prisma.driverInvoice.findUnique({
    where: { id },
    include: {
      driver: { select: { name: true, email: true, phone: true } },
      items: {
        include: { booking: { select: { vehicle: true, time: true, status: true, meterFare: true, fareType: true } } },
        orderBy: { date: "asc" },
      },
    },
  });

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ invoice });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.status && ["paid", "unpaid"].includes(body.status)) {
    data.status = body.status;
    data.paidAt = body.status === "paid" ? new Date() : null;
  }

  if (body.otherCharges !== undefined) {
    const charges = parseFloat(body.otherCharges) || 0;
    data.otherCharges = charges;
    if (body.otherChargesNote !== undefined) data.otherChargesNote = body.otherChargesNote || null;

    const existing = await prisma.driverInvoice.findUnique({ where: { id } });
    if (existing) {
      data.netPayable = Math.round((existing.totalFares - existing.commissionAmount - existing.licenceFee - charges) * 100) / 100;
    }
  }

  const invoice = await prisma.driverInvoice.update({ where: { id }, data });
  return NextResponse.json({ invoice });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.driverInvoice.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
