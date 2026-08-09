"use client";

import { useRef, useEffect } from "react";

export interface PlaceData {
  address: string;
  lat: number;
  lng: number;
}

interface Props {
  value: string;
  onChange: (address: string, place?: PlaceData) => void;
  placeholder?: string;
  label?: string;
}

export default function DispatchAddressInput({ value, onChange, placeholder, label }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!inputRef.current || !window.google?.maps?.places) return;
    if (autocompleteRef.current) return;

    const ac = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: ["gb", "pk"] },
      fields: ["formatted_address", "geometry", "name"],
    });

    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      const addr = place?.formatted_address || place?.name || "";
      const lat = place?.geometry?.location?.lat();
      const lng = place?.geometry?.location?.lng();
      if (lat !== undefined && lng !== undefined) {
        onChange(addr, { address: addr, lat, lng });
      } else {
        onChange(addr);
      }
    });

    autocompleteRef.current = ac;
  }, [onChange]);

  return (
    <div>
      {label && <p className="text-navy/40 text-xs mb-1">{label}</p>}
      <input
        ref={inputRef}
        type="text"
        defaultValue={value}
        placeholder={placeholder || "Search address..."}
        onBlur={(e) => onChange(e.target.value)}
        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-navy outline-none focus:border-crimson/50"
      />
    </div>
  );
}
