import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return new NextResponse(page("Error", "Missing session ID."), { headers: { "Content-Type": "text/html" } });
  }

  try {
    const key = process.env.STRIPE_SECRET_KEY!;
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    const session = await res.json();

    if (session.payment_status !== "paid") {
      return new NextResponse(page("Payment Incomplete", "Your payment was not completed. Please try again."), {
        headers: { "Content-Type": "text/html" },
      });
    }

    const existing = await prisma.booking.findFirst({ where: { notes: `stripe:${sessionId}` } });
    if (!existing) {
      const m = session.metadata!;
      await prisma.booking.create({
        data: {
          name: m.name!, phone: m.phone!, pickup: m.pickup!, dropoff: m.dropoff!,
          date: m.date!, time: m.time!,
          distance: parseFloat(m.distance!) || 0, fare: parseFloat(m.fare!) || 0,
          vehicle: m.vehicle || "car", source: "app",
          status: "pending", paymentMethod: "card", paymentStatus: "paid",
          fareType: "fixed",
          stops: m.stops || null,
          customerId: m.customerId || undefined,
          notes: `stripe:${sessionId}`,
        },
      });
    }

    return new NextResponse(page("Payment Successful", "Your ride has been booked. You can close this page and return to the app."), {
      headers: { "Content-Type": "text/html" },
    });
  } catch {
    return new NextResponse(page("Error", "Something went wrong. Please contact support."), {
      headers: { "Content-Type": "text/html" },
    });
  }
}

function page(title: string, message: string) {
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
  background:#0F1629;font-family:-apple-system,system-ui,sans-serif;color:#fff;text-align:center;padding:20px}
  .card{background:#1B2138;border-radius:20px;padding:40px 30px;max-width:400px;border:1px solid rgba(255,255,255,0.08)}
  h1{font-size:24px;margin:0 0 12px;color:${title==="Payment Successful"?"#22C55E":"#CC2229"}}
  p{color:#9CA3AF;font-size:15px;line-height:1.5;margin:0}
</style></head><body><div class="card">
<h1>${title === "Payment Successful" ? "&#10003; " : ""}${title}</h1>
<p>${message}</p>
</div></body></html>`;
}
