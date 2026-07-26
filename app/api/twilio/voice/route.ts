import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const from = formData.get("From") as string || "Unknown";
  const to = formData.get("To") as string || "";

  const response = new VoiceResponse();

  // If this is an incoming call, connect to the browser client
  if (to === "client:dispatch-operator" || !to.startsWith("sip:")) {
    const dial = response.dial({ callerId: from });
    dial.client("dispatch-operator");
  } else {
    // Outbound call (future use)
    const dial = response.dial({ callerId: from });
    dial.number(to);
  }

  return new NextResponse(response.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}
