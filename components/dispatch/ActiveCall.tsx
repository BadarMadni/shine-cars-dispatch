"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PhoneOff, Mic, MicOff, Volume2 } from "lucide-react";

interface Props {
  callerName: string;
  callerNumber: string;
  onHangup: () => void;
}

export default function ActiveCall({ callerName, callerNumber, onHangup }: Props) {
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const mins = Math.floor(duration / 60).toString().padStart(2, "0");
  const secs = (duration % 60).toString().padStart(2, "0");

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className="fixed top-4 right-4 z-[200] bg-navy border border-white/10 rounded-2xl p-4 shadow-2xl w-72"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
          <Volume2 className="w-5 h-5 text-green-400" />
        </div>
        <div className="flex-1">
          <p className="text-white font-semibold text-sm">{callerName}</p>
          <p className="text-white/40 text-xs">{callerNumber}</p>
        </div>
        <span className="text-green-400 font-mono text-sm">{mins}:{secs}</span>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setMuted(!muted)}
          className={`flex-1 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
            muted ? "bg-amber-500/20 text-amber-400" : "bg-white/10 text-white/60 hover:bg-white/15"
          }`}>
          {muted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          {muted ? "Unmute" : "Mute"}
        </button>
        <motion.button whileTap={{ scale: 0.95 }} onClick={onHangup}
          className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
          <PhoneOff className="w-3.5 h-3.5" /> End
        </motion.button>
      </div>
    </motion.div>
  );
}
