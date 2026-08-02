"use client";

import { useState, useEffect } from "react";
import DriverMap from "@/components/dispatch/DriverMap";

export default function MapPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const check = () => {
      if ((window as unknown as Record<string, unknown>).google) {
        setReady(true);
        return true;
      }
      return false;
    };
    if (check()) return;
    const iv = setInterval(() => { if (check()) clearInterval(iv); }, 200);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="p-6 lg:p-8">
      {ready ? <DriverMap /> : (
        <div className="flex items-center justify-center h-[60vh] text-navy/30 text-sm">
          Loading map...
        </div>
      )}
    </div>
  );
}
