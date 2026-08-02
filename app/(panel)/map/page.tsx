"use client";

import Script from "next/script";
import { useState, useEffect } from "react";
import DriverMap from "@/components/dispatch/DriverMap";

export default function MapPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if ((window as unknown as Record<string, unknown>).google) setReady(true);
  }, []);

  return (
    <div className="p-6 lg:p-8">
      {!ready && (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places`}
          strategy="afterInteractive"
          onLoad={() => setReady(true)}
        />
      )}
      {ready ? <DriverMap /> : (
        <div className="flex items-center justify-center h-[60vh] text-navy/30 text-sm">
          Loading map...
        </div>
      )}
    </div>
  );
}
