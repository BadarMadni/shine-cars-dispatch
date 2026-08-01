"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { Device, Call } from "@twilio/voice-sdk";
import IncomingCall from "@/components/dispatch/IncomingCall";
import ActiveCall from "@/components/dispatch/ActiveCall";

interface BookingSummary {
  id: string; pickup: string; dropoff: string; date: string; time: string; status: string; fare: number;
}

interface CallerInfo {
  number: string;
  name?: string;
  lastPickup?: string;
  totalTrips?: number;
  activeBookings?: BookingSummary[];
  customerId?: string;
  accountType?: string;
}

export default function SIPPhone() {
  const deviceRef = useRef<Device | null>(null);
  const callRef = useRef<Call | null>(null);
  const [status, setStatus] = useState<"disconnected" | "connecting" | "registered" | "error">("disconnected");
  const [incoming, setIncoming] = useState<CallerInfo | null>(null);
  const [activeCall, setActiveCall] = useState<CallerInfo | null>(null);

  const lookupCaller = useCallback(async (number: string): Promise<CallerInfo> => {
    try {
      const clean = number.replace(/[^0-9+]/g, "");
      const res = await fetch(`/api/bookings?limit=100`);
      const data = await res.json();
      const match = data.bookings?.find((b: { phone: string }) =>
        b.phone.replace(/[^0-9+]/g, "").includes(clean.slice(-10)) ||
        clean.includes(b.phone.replace(/[^0-9+]/g, "").slice(-10))
      );
      if (match) {
        const customerBookings = data.bookings.filter((b: { phone: string }) =>
          b.phone.replace(/[^0-9+]/g, "").includes(clean.slice(-10))
        );
        const activeStatuses = ["pending", "confirmed", "assigned", "accepted", "arrived", "in-progress"];
        const actives = customerBookings
          .filter((b: { status: string }) => activeStatuses.includes(b.status))
          .map((b: { id: string; pickup: string; dropoff: string; date: string; time: string; status: string; fare: number }) => ({
            id: b.id, pickup: b.pickup, dropoff: b.dropoff, date: b.date, time: b.time, status: b.status, fare: b.fare,
          }));
        let customerId: string | undefined;
        let accountType: string | undefined;
        try {
          const custRes = await fetch(`/api/customers?search=${encodeURIComponent(clean.slice(-10))}`);
          const custData = await custRes.json();
          const cust = custData.customers?.[0];
          if (cust) { customerId = cust.id; accountType = cust.accountType; }
        } catch {}
        return {
          number: clean, name: match.name, lastPickup: match.pickup,
          totalTrips: customerBookings.length, activeBookings: actives.length ? actives : undefined,
          customerId, accountType,
        };
      }
      return { number: clean };
    } catch {
      return { number };
    }
  }, []);

  const setupDevice = useCallback(async () => {
    try {
      setStatus("connecting");
      const res = await fetch("/api/twilio/token");
      const data = await res.json();

      if (!data.token) {
        setStatus("error");
        return;
      }

      const device = new Device(data.token, {
        logLevel: 1,
        codecPreferences: [Call.Codec.Opus, Call.Codec.PCMU],
      });

      device.on("registered", () => setStatus("registered"));
      device.on("error", () => setStatus("error"));
      device.on("unregistered", () => setStatus("disconnected"));

      device.on("incoming", async (call: Call) => {
        callRef.current = call;
        const callerNumber = call.parameters.From || "Unknown";
        const info = await lookupCaller(callerNumber);
        setIncoming(info);

        call.on("cancel", () => {
          setIncoming(null);
          callRef.current = null;
        });

        call.on("disconnect", () => {
          setIncoming(null);
          setActiveCall(null);
          callRef.current = null;
        });
      });

      device.on("tokenWillExpire", async () => {
        const refreshRes = await fetch("/api/twilio/token");
        const refreshData = await refreshRes.json();
        if (refreshData.token) {
          device.updateToken(refreshData.token);
        }
      });

      await device.register();
      deviceRef.current = device;
    } catch {
      setStatus("error");
    }
  }, [lookupCaller]);

  useEffect(() => {
    setupDevice();
    return () => {
      deviceRef.current?.destroy();
    };
  }, [setupDevice]);

  const acceptCall = () => {
    if (!callRef.current) return;
    callRef.current.accept();
    setActiveCall(incoming);
    setIncoming(null);
  };

  const rejectCall = () => {
    callRef.current?.reject();
    setIncoming(null);
    callRef.current = null;
  };

  const hangup = () => {
    callRef.current?.disconnect();
    setActiveCall(null);
    callRef.current = null;
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
          status === "registered" ? "bg-green-500/20 text-green-400" :
          status === "connecting" ? "bg-amber-500/20 text-amber-400" :
          status === "error" ? "bg-red-500/20 text-red-400" :
          "bg-white/10 text-white/40"
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            status === "registered" ? "bg-green-400" :
            status === "connecting" ? "bg-amber-400 animate-pulse" :
            status === "error" ? "bg-red-400" :
            "bg-white/30"
          }`} />
          {status === "registered" ? "Phone Online" :
           status === "connecting" ? "Connecting..." :
           status === "error" ? "Phone Offline" :
           "Disconnected"}
        </div>
      </div>

      <AnimatePresence>
        {incoming && (
          <IncomingCall
            caller={incoming}
            onAccept={acceptCall}
            onReject={rejectCall}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeCall && (
          <ActiveCall
            callerName={activeCall.name || "Unknown"}
            callerNumber={activeCall.number}
            onHangup={hangup}
          />
        )}
      </AnimatePresence>
    </>
  );
}
