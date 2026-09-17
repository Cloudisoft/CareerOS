/* CareerOS — geo lookup
 *
 * A bundled list of major metro-area centroids, used to turn a "radius in
 * miles" setting into a real distance check without calling out to a paid
 * geocoding API. It isn't exhaustive — a job in a small town won't resolve
 * to coordinates, and Matcher.js falls back to its previous substring
 * location match for those. Mirrors src/lib/geo/cities.ts on the CareerOS
 * server; kept as a separate copy here since the extension has no build
 * step to share it from, and the list is small enough that duplicating it
 * costs nothing worth avoiding.
 */
(function (root) {
  'use strict';

  const CITIES = [
    { city: 'new york', state: 'ny', lat: 40.7128, lng: -74.006 },
    { city: 'los angeles', state: 'ca', lat: 34.0522, lng: -118.2437 },
    { city: 'chicago', state: 'il', lat: 41.8781, lng: -87.6298 },
    { city: 'houston', state: 'tx', lat: 29.7604, lng: -95.3698 },
    { city: 'phoenix', state: 'az', lat: 33.4484, lng: -112.074 },
    { city: 'philadelphia', state: 'pa', lat: 39.9526, lng: -75.1652 },
    { city: 'san antonio', state: 'tx', lat: 29.4241, lng: -98.4936 },
    { city: 'san diego', state: 'ca', lat: 32.7157, lng: -117.1611 },
    { city: 'dallas', state: 'tx', lat: 32.7767, lng: -96.797 },
    { city: 'austin', state: 'tx', lat: 30.2672, lng: -97.7431 },
    { city: 'san jose', state: 'ca', lat: 37.3382, lng: -121.8863 },
    { city: 'fort worth', state: 'tx', lat: 32.7555, lng: -97.3308 },
    { city: 'jacksonville', state: 'fl', lat: 30.3322, lng: -81.6557 },
    { city: 'columbus', state: 'oh', lat: 39.9612, lng: -82.9988 },
    { city: 'charlotte', state: 'nc', lat: 35.2271, lng: -80.8431 },
    { city: 'san francisco', state: 'ca', lat: 37.7749, lng: -122.4194 },
    { city: 'indianapolis', state: 'in', lat: 39.7684, lng: -86.1581 },
    { city: 'seattle', state: 'wa', lat: 47.6062, lng: -122.3321 },
    { city: 'denver', state: 'co', lat: 39.7392, lng: -104.9903 },
    { city: 'washington', state: 'dc', lat: 38.9072, lng: -77.0369 },
    { city: 'boston', state: 'ma', lat: 42.3601, lng: -71.0589 },
    { city: 'nashville', state: 'tn', lat: 36.1627, lng: -86.7816 },
    { city: 'el paso', state: 'tx', lat: 31.7619, lng: -106.485 },
    { city: 'detroit', state: 'mi', lat: 42.3314, lng: -83.0458 },
    { city: 'oklahoma city', state: 'ok', lat: 35.4676, lng: -97.5164 },
    { city: 'portland', state: 'or', lat: 45.5152, lng: -122.6784 },
    { city: 'las vegas', state: 'nv', lat: 36.1699, lng: -115.1398 },
    { city: 'memphis', state: 'tn', lat: 35.1495, lng: -90.049 },
    { city: 'louisville', state: 'ky', lat: 38.2527, lng: -85.7585 },
    { city: 'baltimore', state: 'md', lat: 39.2904, lng: -76.6122 },
    { city: 'milwaukee', state: 'wi', lat: 43.0389, lng: -87.9065 },
    { city: 'albuquerque', state: 'nm', lat: 35.0844, lng: -106.6504 },
    { city: 'tucson', state: 'az', lat: 32.2226, lng: -110.9747 },
    { city: 'fresno', state: 'ca', lat: 36.7378, lng: -119.7871 },
    { city: 'sacramento', state: 'ca', lat: 38.5816, lng: -121.4944 },
    { city: 'mesa', state: 'az', lat: 33.4152, lng: -111.8315 },
    { city: 'atlanta', state: 'ga', lat: 33.749, lng: -84.388 },
    { city: 'kansas city', state: 'mo', lat: 39.0997, lng: -94.5786 },
    { city: 'colorado springs', state: 'co', lat: 38.8339, lng: -104.8214 },
    { city: 'miami', state: 'fl', lat: 25.7617, lng: -80.1918 },
    { city: 'raleigh', state: 'nc', lat: 35.7796, lng: -78.6382 },
    { city: 'omaha', state: 'ne', lat: 41.2565, lng: -95.9345 },
    { city: 'oakland', state: 'ca', lat: 37.8044, lng: -122.2712 },
    { city: 'minneapolis', state: 'mn', lat: 44.9778, lng: -93.265 },
    { city: 'tulsa', state: 'ok', lat: 36.154, lng: -95.9928 },
    { city: 'tampa', state: 'fl', lat: 27.9506, lng: -82.4572 },
    { city: 'new orleans', state: 'la', lat: 29.9511, lng: -90.0715 },
    { city: 'cleveland', state: 'oh', lat: 41.4993, lng: -81.6944 },
    { city: 'honolulu', state: 'hi', lat: 21.3069, lng: -157.8583 },
    { city: 'st. louis', state: 'mo', lat: 38.627, lng: -90.1994 },
    { city: 'pittsburgh', state: 'pa', lat: 40.4406, lng: -79.9959 },
    { city: 'cincinnati', state: 'oh', lat: 39.1031, lng: -84.512 },
    { city: 'anchorage', state: 'ak', lat: 61.2181, lng: -149.9003 },
    { city: 'orlando', state: 'fl', lat: 28.5384, lng: -81.3789 },
    { city: 'salt lake city', state: 'ut', lat: 40.7608, lng: -111.891 },
    { city: 'boise', state: 'id', lat: 43.615, lng: -116.2023 },
    { city: 'richmond', state: 'va', lat: 37.5407, lng: -77.436 },
    { city: 'des moines', state: 'ia', lat: 41.5868, lng: -93.625 },
    { city: 'baton rouge', state: 'la', lat: 30.4515, lng: -91.1871 },
    { city: 'providence', state: 'ri', lat: 41.824, lng: -71.4128 },
    { city: 'hartford', state: 'ct', lat: 41.7658, lng: -72.6734 },
    { city: 'charleston', state: 'sc', lat: 32.7765, lng: -79.9311 },
    { city: 'columbia', state: 'sc', lat: 34.0007, lng: -81.0348 },
    { city: 'albany', state: 'ny', lat: 42.6526, lng: -73.7562 },
    { city: 'buffalo', state: 'ny', lat: 42.8864, lng: -78.8784 },

    { city: 'mumbai', state: 'mh', lat: 19.076, lng: 72.8777 },
    { city: 'delhi', state: 'dl', lat: 28.7041, lng: 77.1025 },
    { city: 'bengaluru', state: 'ka', lat: 12.9716, lng: 77.5946 },
    { city: 'bangalore', state: 'ka', lat: 12.9716, lng: 77.5946 },
    { city: 'hyderabad', state: 'tg', lat: 17.385, lng: 78.4867 },
    { city: 'chennai', state: 'tn', lat: 13.0827, lng: 80.2707 },
    { city: 'kolkata', state: 'wb', lat: 22.5726, lng: 88.3639 },
    { city: 'pune', state: 'mh', lat: 18.5204, lng: 73.8567 },
    { city: 'ahmedabad', state: 'gj', lat: 23.0225, lng: 72.5714 },
    { city: 'jaipur', state: 'rj', lat: 26.9124, lng: 75.7873 },
    { city: 'surat', state: 'gj', lat: 21.1702, lng: 72.8311 },
    { city: 'lucknow', state: 'up', lat: 26.8467, lng: 80.9462 },
    { city: 'kochi', state: 'kl', lat: 9.9312, lng: 76.2673 },
    { city: 'chandigarh', state: 'ch', lat: 30.7333, lng: 76.7794 },
    { city: 'gurugram', state: 'hr', lat: 28.4595, lng: 77.0266 },
    { city: 'noida', state: 'up', lat: 28.5355, lng: 77.391 },
    { city: 'indore', state: 'mp', lat: 22.7196, lng: 75.8577 },
    { city: 'nagpur', state: 'mh', lat: 21.1458, lng: 79.0882 },
    { city: 'coimbatore', state: 'tn', lat: 11.0168, lng: 76.9558 },
    { city: 'visakhapatnam', state: 'ap', lat: 17.6868, lng: 83.2185 },

    { city: 'london', state: '', lat: 51.5072, lng: -0.1276 },
    { city: 'manchester', state: '', lat: 53.4808, lng: -2.2426 },
    { city: 'birmingham', state: '', lat: 52.4862, lng: -1.8904 },
    { city: 'leeds', state: '', lat: 53.8008, lng: -1.5491 },
    { city: 'glasgow', state: '', lat: 55.8642, lng: -4.2518 },
    { city: 'edinburgh', state: '', lat: 55.9533, lng: -3.1883 },
    { city: 'bristol', state: '', lat: 51.4545, lng: -2.5879 },

    { city: 'toronto', state: 'on', lat: 43.6532, lng: -79.3832 },
    { city: 'vancouver', state: 'bc', lat: 49.2827, lng: -123.1207 },
    { city: 'montreal', state: 'qc', lat: 45.5019, lng: -73.5674 },
    { city: 'calgary', state: 'ab', lat: 51.0447, lng: -114.0719 },
    { city: 'ottawa', state: 'on', lat: 45.4215, lng: -75.6972 },

    { city: 'sydney', state: 'nsw', lat: -33.8688, lng: 151.2093 },
    { city: 'melbourne', state: 'vic', lat: -37.8136, lng: 144.9631 },
    { city: 'brisbane', state: 'qld', lat: -27.4698, lng: 153.0251 },
    { city: 'perth', state: 'wa', lat: -31.9505, lng: 115.8605 }
  ];

  const EARTH_RADIUS_MILES = 3958.8;

  function haversineMiles(a, b) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return EARTH_RADIUS_MILES * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  /* Accepts "City", "City, ST", or "City, Country" (case-insensitive). */
  function resolveCity(text) {
    if (!text) return null;
    const parts = String(text).toLowerCase().split(',').map((p) => p.trim()).filter(Boolean);
    if (!parts.length) return null;
    const [cityPart, qualifier] = parts;
    const candidates = CITIES.filter((c) => c.city === cityPart);
    if (!candidates.length) return null;
    if (candidates.length === 1) return candidates[0];
    if (qualifier) {
      const byQualifier = candidates.find((c) => c.state === qualifier);
      if (byQualifier) return byQualifier;
    }
    return candidates[0];
  }

  function distanceMiles(fromText, toText) {
    const from = resolveCity(fromText);
    const to = resolveCity(toText);
    if (!from || !to) return null;
    return Math.round(haversineMiles(from, to));
  }

  root.CareerOS = root.CareerOS || {};
  root.CareerOS.Geo = { resolveCity, distanceMiles, haversineMiles };
})(typeof self !== 'undefined' ? self : this);
