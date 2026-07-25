import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST() {
  try {
    const existing = await prisma.operator.findUnique({
      where: { email: "admin@shinecars.co.uk" },
    });

    if (existing) {
      return NextResponse.json({ message: "Operator already exists" });
    }

    const hashed = await hashPassword("shine2024");

    const operator = await prisma.operator.create({
      data: {
        name: "Dispatch Operator",
        email: "admin@shinecars.co.uk",
        password: hashed,
        role: "operator",
      },
    });

    return NextResponse.json({ message: "Operator created", email: operator.email });
  } catch {
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
