import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/brand";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Signed-in app areas, APIs and the Careers redirect aren't useful search results.
        disallow: ["/api/", "/dashboard", "/employer", "/admin", "/settings", "/messages", "/onboarding", "/careers/apply/", "/careers/manage", "/extension-connect", "/checkout"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
