/**
 * Who CareerOS is, in one place, so search engines and AI answer engines see
 * the same names everywhere: page titles, structured data, llms.txt, footer.
 * "CareerOS by Silver Springs Staffing" is the full name people search for.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://careeros.silverspringstaffing.com").replace(/\/$/, "");

/** The one support address, shown on /support, the Privacy Policy and the Terms. */
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@silverspringstaffing.com";

export const BRAND = {
  name: "CareerOS",
  fullName: "CareerOS by Silver Springs Staffing",
  /** Other ways people write it; listed as alternate names in structured data. */
  alternateNames: [
    "Career OS",
    "CareerOS by Silver Springs Staffing",
    "Silver Springs Staffing CareerOS",
    "Silver Spring Staffing CareerOS",
    "CareerOS Silver Springs",
  ],
  tagline: "Your career. One operating system.",
  parent: {
    name: "Silver Springs Staffing",
    alternateNames: ["Silver Spring Staffing", "SilverSpringStaffing", "silverspringstaffing.com"],
    url: "https://silverspringstaffing.com",
  },
} as const;
