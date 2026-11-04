import zipcodes from "zipcodes";

export function isUsZipCode(text: string | null | undefined): boolean {
  return Boolean(text && /^\d{5}$/.test(text.trim()));
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export function resolveZip(zip: string): GeoPoint | null {
  const entry = zipcodes.lookup(zip.trim());
  if (!entry) return null;
  return { lat: entry.latitude, lng: entry.longitude };
}

/** Extracts a trailing 5-digit US zip from free text, e.g. "New York, NY 10001". */
function extractZip(text: string): string | null {
  const match = text.match(/\b(\d{5})(?:-\d{4})?\b/);
  return match ? match[1] : null;
}

/**
 * Best-effort {lat,lng} for a free-text job location string: a trailing zip
 * first, then a "City, ST" match against the zip database. Returns null for
 * anything unresolvable (a bare city with no state, "Remote", a non-US
 * location, a typo) — callers must treat that as "can't compute a distance."
 */
export function resolveLocationCoords(text: string | null | undefined): GeoPoint | null {
  if (!text) return null;

  const trailingZip = extractZip(text);
  if (trailingZip) {
    const coords = resolveZip(trailingZip);
    if (coords) return coords;
  }

  const parts = text.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const city = parts[0];
    const stateMatch = parts[1].match(/[A-Za-z]{2}/);
    if (stateMatch) {
      const matches = zipcodes.lookupByName(city, stateMatch[0].toUpperCase());
      if (matches.length) return { lat: matches[0].latitude, lng: matches[0].longitude };
    }
  }

  return null;
}
