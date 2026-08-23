import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const SECRET = process.env.CUSTOMER_JWT_SECRET || "shine-cars-customer-secret-2024";

function getCustomer(req: NextRequest): { id: string } | null {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try { return jwt.verify(auth.slice(7), SECRET) as { id: string }; }
  catch { return null; }
}

export async function GET(req: NextRequest) {
  const customer = getCustomer(req);
  if (!customer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const invoices = await prisma.invoice.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { items: true } } },
    });

    return NextResponse.json({
      invoices: invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.id.slice(-6).toUpperCase(),
        period: `${inv.weekStart} — ${inv.weekEnd}`,
        totalAmount: inv.total,
        status: inv.status,
        bookingCount: inv._count.items,
        createdAt: inv.createdAt,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}
