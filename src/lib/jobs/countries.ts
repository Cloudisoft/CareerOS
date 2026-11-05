/**
 * Country filter for job search. Job locations are free text from many
 * boards, so each country matches on its common names and biggest cities.
 */
export const COUNTRIES = {
  US: { label: "United States", match: ["united states", "usa", "u.s.", ", us", "new york", "san francisco", "seattle", "austin", "chicago", "boston", "los angeles", "denver", "atlanta", "washington, dc", ", ny", ", tx", ", ma", ", il", ", ga", ", fl", ", nj", ", va", ", md", ", pa", ", nc", ", az", ", oh", ", mi", ", mn", ", or"] },
  UK: { label: "United Kingdom", match: ["united kingdom", ", uk", "england", "scotland", "wales", "london", "manchester", "edinburgh", "birmingham", "bristol", "leeds", "glasgow", "cambridge, uk", "oxford"] },
  AU: { label: "Australia", match: ["australia", "sydney", "melbourne", "brisbane", "perth", "adelaide", "canberra", ", nsw", ", vic", ", qld"] },
  NZ: { label: "New Zealand", match: ["new zealand", "auckland", "wellington", "christchurch"] },
  IN: { label: "India", match: ["india", "bengaluru", "bangalore", "mumbai", "delhi", "gurgaon", "gurugram", "noida", "hyderabad", "pune", "chennai", "kolkata", "ahmedabad"] },
  AE: { label: "United Arab Emirates", match: ["united arab emirates", "uae", "dubai", "abu dhabi", "sharjah"] },
  CA: { label: "Canada", match: ["canada", "toronto", "vancouver", "montreal", "calgary", "ottawa", "edmonton", ", on", ", bc", ", qc", ", ab"] },
  EMEA: {
    label: "Europe, Middle East & Africa",
    match: ["germany", "berlin", "munich", "france", "paris", "netherlands", "amsterdam", "ireland", "dublin", "spain", "madrid", "barcelona", "italy", "milan", "sweden", "stockholm", "switzerland", "zurich", "poland", "warsaw", "portugal", "lisbon", "belgium", "denmark", "norway", "finland", "austria", "saudi", "riyadh", "qatar", "doha", "israel", "tel aviv", "egypt", "south africa", "nigeria", "kenya", "europe", "emea"],
  },
} as const;

export type CountryCode = keyof typeof COUNTRIES;

export function isCountryCode(v: string | null | undefined): v is CountryCode {
  return Boolean(v && v in COUNTRIES);
}
