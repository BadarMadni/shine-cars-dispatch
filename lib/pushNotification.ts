import { getMessaging } from "firebase-admin/messaging";
import { getApps } from "firebase-admin/app";
import "@/lib/firebase";

export async function sendPushNotification(
  deviceToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  if (!getApps().length) return;

  try {
    await getMessaging().send({
      token: deviceToken,
      notification: { title, body },
      data: data || {},
      android: {
        priority: "high",
        notification: { sound: "default", channelId: "default" },
      },
      apns: {
        payload: { aps: { sound: "default", badge: 1 } },
      },
    });
  } catch (e) {
    console.error("FCM send failed:", e);
  }
}
