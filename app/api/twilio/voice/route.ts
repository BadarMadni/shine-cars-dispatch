import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

const VoiceResponse = twilio.twiml.VoiceResponse;
const TWILIO_NUMBER = "+441945660700";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const from = formData.get("From") as string || "";
  const to = formData.get("To") as string || "";

  const response = new VoiceResponse();

  if (to && to !== "client:dispatch-operator") {
    // Outbound call from dispatcher to customer/driver
    const dial = response.dial({ callerId: TWILIO_NUMBER });
    dial.number(to);
  } else {
    // Incoming call — connect to browser client
    const dial = response.dial({ callerId: from });
    dial.client("dispatch-operator");
  }

  return new NextResponse(response.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}
