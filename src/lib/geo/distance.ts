/**
 * City-based distances, backed by the one bundled city list in cities.ts
 * (also used by Auto Apply's radius filter) so both always agree.
 */
export { haversineMiles, resolveCity, distanceMiles } from "@/lib/geo/cities";
