"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, Search, Navigation, Clock, MapPin } from "lucide-react";

interface DriverLocation {
  id: string; name: string; isAvailable: boolean;
  latitude: number; longitude: number;
  locationUpdatedAt: string | null;
}

interface NearbyDriver extends DriverLocation { dist: number }

const NEARBY_RADIUS = 15; // miles

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function DriverMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObj = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const searchMarkerRef = useRef<google.maps.Marker | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [drivers, setDrivers] = useState<DriverLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoc, setSearchLoc] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [nearbyList, setNearbyList] = useState<NearbyDriver[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/drivers/locations");
      const data = await res.json();
      setDrivers(data.drivers || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); const i = setInterval(load, 15000); return () => clearInterval(i); }, [load]);

  useEffect(() => {
    if (!mapRef.current || mapObj.current) return;
    mapObj.current = new google.maps.Map(mapRef.current, {
      center: { lat: 52.6646, lng: 0.1601 }, zoom: 10,
      zoomControl: true, streetViewControl: false, mapTypeControl: false,
    });
  }, []);

  useEffect(() => {
    if (!inputRef.current || !mapObj.current) return;
    const ac = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "gb" }, fields: ["geometry", "formatted_address"],
    });
    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (!place.geometry?.location) return;
      setSearchLoc({
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        address: place.formatted_address || "",
      });
    });
  }, []);

  // Compute nearby list when search changes
  useEffect(() => {
    if (!searchLoc) { setNearbyList([]); return; }
    const sorted = drivers
      .map((d) => ({ ...d, dist: haversine(searchLoc.lat, searchLoc.lng, d.latitude, d.longitude) }))
      .sort((a, b) => a.dist - b.dist)
      .filter((d) => d.dist <= NEARBY_RADIUS);
    setNearbyList(sorted);
  }, [searchLoc, drivers]);

  // Render markers
  useEffect(() => {
    if (!mapObj.current) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (searchMarkerRef.current) searchMarkerRef.current.setMap(null);

    const visible = searchLoc ? nearbyList : drivers;
    const bounds = new google.maps.LatLngBounds();

    visible.forEach((d) => {
      const marker = new google.maps.Marker({
        map: mapObj.current!, position: { lat: d.latitude, lng: d.longitude },
        title: d.name,
        label: { text: d.name.charAt(0).toUpperCase(), color: "#fff", fontWeight: "bold", fontSize: "12px" },
        icon: {
          path: google.maps.SymbolPath.CIRCLE, scale: 18,
          fillColor: d.isAvailable ? "#22c55e" : "#f97316",
          fillOpacity: 1, strokeColor: "#fff", strokeWeight: 3,
        },
      });
      const distText = "dist" in d ? ` — ${(d as NearbyDriver).dist.toFixed(1)} mi` : "";
      const info = new google.maps.InfoWindow({
        content: `<div style="font-family:sans-serif;padding:4px"><strong>${d.name}</strong><br/><span style="color:${d.isAvailable ? "green" : "orange"}">${d.isAvailable ? "Available" : "Busy"}</span>${distText}</div>`,
      });
      marker.addListener("click", () => info.open({ anchor: marker, map: mapObj.current }));
      markersRef.current.push(marker);
      bounds.extend({ lat: d.latitude, lng: d.longitude });
    });

    if (searchLoc) {
      searchMarkerRef.current = new google.maps.Marker({
        map: mapObj.current, position: { lat: searchLoc.lat, lng: searchLoc.lng },
        title: "Search Location",
        icon: {
          path: google.maps.SymbolPath.CIRCLE, scale: 10,
          fillColor: "#CC2229", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 3,
        },
      });
      bounds.extend({ lat: searchLoc.lat, lng: searchLoc.lng });
    }

    if (visible.length > 0 || searchLoc) {
      mapObj.current.fitBounds(bounds, 60);
      const listener = google.maps.event.addListener(mapObj.current, "idle", () => {
        const zoom = mapObj.current?.getZoom();
        if (zoom && zoom > 14) mapObj.current?.setZoom(14);
        google.maps.event.removeListener(listener);
      });
    } else {
      mapObj.current.setCenter({ lat: 52.6646, lng: 0.1601 });
      mapObj.current.setZoom(10);
    }
  }, [drivers, searchLoc, nearbyList]);

  const clearSearch = () => {
    setSearchLoc(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-navy">Driver Map</h2>
          <p className="text-navy/40 text-xs mt-0.5">
            {searchLoc ? `${nearbyList.length} nearby` : drivers.length} driver{(searchLoc ? nearbyList.length : drivers.length) !== 1 ? "s" : ""} — refreshes every 15s
          </p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 px-4 py-2 bg-navy/5 hover:bg-navy/10 rounded-xl text-sm text-navy font-medium transition-colors cursor-pointer shrink-0">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 p-3 flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100 flex-1">
          <Search className="w-4 h-4 text-navy/30 shrink-0" />
          <input ref={inputRef} type="text" placeholder="Search location to find nearby drivers..."
            className="bg-transparent text-navy text-sm outline-none w-full placeholder:text-navy/30" />
        </div>
        {searchLoc && (
          <button onClick={clearSearch}
            className="px-4 py-2 text-xs text-crimson font-medium hover:bg-crimson/5 rounded-xl cursor-pointer transition-colors">
            Clear
          </button>
        )}
      </div>

      {/* Map */}
      <div ref={mapRef} className="w-full h-[60vh] rounded-2xl border border-gray-100 shadow-sm" />

      {/* Nearby drivers list */}
      {searchLoc && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-navy font-semibold text-sm">
              Nearby Drivers <span className="text-navy/30 font-normal">({nearbyList.length} within {NEARBY_RADIUS} miles)</span>
            </h3>
          </div>
          {nearbyList.length === 0 ? (
            <p className="text-navy/30 text-sm text-center py-6">No drivers within {NEARBY_RADIUS} miles</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {nearbyList.map((d, i) => (
                <div key={d.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    d.isAvailable ? "bg-green-500" : "bg-orange-400"}`}>
                    {d.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-navy font-medium text-sm">{d.name}</span>
                      {i === 0 && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Nearest</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        d.isAvailable ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"}`}>
                        {d.isAvailable ? "Available" : "Busy"}
                      </span>
                    </div>
                    <p className="text-navy/40 text-xs mt-0.5">{d.dist.toFixed(1)} miles away</p>
                  </div>
                  <a href={`https://www.google.com/maps/dir/${d.latitude},${d.longitude}/${searchLoc.lat},${searchLoc.lng}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 bg-navy/5 hover:bg-navy/10 rounded-lg text-xs text-navy font-medium transition-colors">
                    <Navigation className="w-3 h-3" /> Route
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
