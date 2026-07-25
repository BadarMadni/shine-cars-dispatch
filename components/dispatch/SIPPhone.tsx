"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { UserAgent, Registerer, Invitation, SessionState } from "sip.js";
import { SIP_CONFIG } from "@/lib/sip-config";
import IncomingCall from "@/components/dispatch/IncomingCall";
import ActiveCall from "@/components/dispatch/ActiveCall";

interface CallerInfo {
  number: string;
  name?: string;
  lastPickup?: string;
  totalTrips?: number;
}

export default function SIPPhone() {
  const uaRef = useRef<UserAgent | null>(null);
  const sessionRef = useRef<Invitation | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
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
        return {
          number: clean,
          name: match.name,
          lastPickup: match.pickup,
          totalTrips: data.bookings.filter((b: { phone: string }) =>
            b.phone.replace(/[^0-9+]/g, "").includes(clean.slice(-10))
          ).length,
        };
      }
      return { number: clean };
    } catch {
      return { number };
    }
  }, []);

  useEffect(() => {
    if (!SIP_CONFIG.password) return;

    const uri = UserAgent.makeURI(`sip:${SIP_CONFIG.username}@${SIP_CONFIG.domain}`);
    if (!uri) return;

    const ua = new UserAgent({
      uri,
      transportOptions: { server: SIP_CONFIG.server },
      authorizationUsername: SIP_CONFIG.username,
      authorizationPassword: SIP_CONFIG.password,
      displayName: SIP_CONFIG.displayName,
      logLevel: "warn",
    });

    uaRef.current = ua;

    ua.delegate = {
      onInvite: async (invitation: Invitation) => {
        sessionRef.current = invitation;
        const callerUri = invitation.remoteIdentity.uri.user || "Unknown";
        const info = await lookupCaller(callerUri);
        setIncoming(info);

        invitation.stateChange.addListener((state: SessionState) => {
          if (state === SessionState.Terminated) {
            setIncoming(null);
            setActiveCall(null);
            sessionRef.current = null;
          }
        });
      },
    };

    setStatus("connecting");

    ua.start().then(() => {
      const registerer = new Registerer(ua);
      registerer.register().then(() => {
        setStatus("registered");
      }).catch(() => setStatus("error"));
    }).catch(() => setStatus("error"));

    return () => {
      ua.stop().catch(() => {});
    };
  }, [lookupCaller]);

  const acceptCall = async () => {
    if (!sessionRef.current) return;
    try {
      await sessionRef.current.accept({
        sessionDescriptionHandlerOptions: {
          constraints: { audio: true, video: false },
        },
      });

      const sdh = sessionRef.current.sessionDescriptionHandler;
      if (sdh && "peerConnection" in sdh) {
        const pc = (sdh as unknown as { peerConnection: RTCPeerConnection }).peerConnection;
        const remote = new MediaStream();
        pc.getReceivers().forEach((r) => {
          if (r.track) remote.addTrack(r.track);
        });
        if (!audioRef.current) {
          audioRef.current = new Audio();
        }
        audioRef.current.srcObject = remote;
        audioRef.current.play().catch(() => {});
      }

      setActiveCall(incoming);
      setIncoming(null);
    } catch {
      setIncoming(null);
    }
  };

  const rejectCall = () => {
    sessionRef.current?.reject().catch(() => {});
    setIncoming(null);
    sessionRef.current = null;
  };

  const hangup = () => {
    try {
      const session = sessionRef.current;
      if (session?.state === SessionState.Established) {
        session.bye().catch(() => {});
      }
    } catch {}
    setActiveCall(null);
    sessionRef.current = null;
    if (audioRef.current) {
      audioRef.current.srcObject = null;
    }
  };

  return (
    <>
      {/* SIP Status indicator */}
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
