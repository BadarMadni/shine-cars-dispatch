// Office: PE13 1AU, Wisbech, Cambridgeshire
const OFFICE_LAT = 52.6646;
const OFFICE_LNG = 0.1601;
const SURCHARGE_RADIUS_MILES = 3;
const SURCHARGE_AMOUNT = 2;

export type VehicleType = "car" | "mpv";

export const VEHICLES = {
  car: { label: "Car", passengers: 4, baseFare: 5 },
  mpv: { label: "MPV", passengers: 6, baseFare: 7 },
} as const;

/**
 * Shine Cars fare calculator
 * - Car base fare: £5 | MPV base fare: £7 (covers first 1.5 miles)
 * - 1.5 to 10 miles: £2.30 per mile
 * - Over 10 miles: £1.80 per mile
 * - Extra £2 if pickup is more than 3 miles from office (PE13 1AU)
 */
export function calculateFare(distanceMiles: number, pickupLat?: number, pickupLng?: number, vehicle: VehicleType = "car"): number {
  if (distanceMiles <= 0) return 0;

  const BASE_FARE = VEHICLES[vehicle].baseFare;
  const BASE_MILES = 1.5;
  const MID_RATE = 2.3;
  const MID_LIMIT = 10;
  const HIGH_RATE = 1.8;

  let fare: number;

  if (distanceMiles <= BASE_MILES) {
    fare = BASE_FARE;
  } else if (distanceMiles <= MID_LIMIT) {
    fare = BASE_FARE + (distanceMiles - BASE_MILES) * MID_RATE;
  } else {
    const midCharge = (MID_LIMIT - BASE_MILES) * MID_RATE;
    const highCharge = (distanceMiles - MID_LIMIT) * HIGH_RATE;
    fare = BASE_FARE + midCharge + highCharge;
  }

  if (pickupLat !== undefined && pickupLng !== undefined) {
    const distFromOffice = haversineDistance(OFFICE_LAT, OFFICE_LNG, pickupLat, pickupLng);
    if (distFromOffice > SURCHARGE_RADIUS_MILES) {
      fare += SURCHARGE_AMOUNT;
    }
  }

  return fare;
}

/** Check if pickup is outside the 3-mile office radius */
export function isOutsideOfficeRadius(pickupLat: number, pickupLng: number): boolean {
  return haversineDistance(OFFICE_LAT, OFFICE_LNG, pickupLat, pickupLng) > SURCHARGE_RADIUS_MILES;
}

export const SURCHARGE = SURCHARGE_AMOUNT;

/** Haversine distance in miles between two lat/lng points */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function metersToMiles(meters: number): number {
  return meters * 0.000621371;
}
