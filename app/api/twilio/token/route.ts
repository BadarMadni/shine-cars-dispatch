import { NextResponse } from "next/server";
import twilio from "twilio";

export async function GET() {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID!.trim();
    const apiKeySid = process.env.TWILIO_API_KEY_SID!.trim();
    const apiKeySecret = process.env.TWILIO_API_KEY_SECRET!.trim();
    const twimlAppSid = process.env.TWILIO_TWIML_APP_SID!.trim();

    const AccessToken = twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;

    const token = new AccessToken(accountSid, apiKeySid, apiKeySecret, {
      identity: "dispatch-operator",
      ttl: 3600,
    });

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true,
    });

    token.addGrant(voiceGrant);

    return NextResponse.json({ token: token.toJwt() });
  } catch {
    return NextResponse.json({ error: "Failed to generate token" }, { status: 500 });
  }
}
