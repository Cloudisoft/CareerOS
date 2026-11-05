import type { Metadata } from "next";
import { BRAND } from "@/config/brand";

const SUFFIX = ` | ${BRAND.name} by ${BRAND.parent.name}`;

export const metadata: Metadata = {
  // A title here would stop the site-wide template from reaching job pages, so it carries the template on.
  title: { absolute: `Jobs for visa holders, OPT, PR, USC & GC — search open roles${SUFFIX}`, template: `%s${SUFFIX}` },
  description:
    "Search open jobs on CareerOS by Silver Springs Staffing: roles for visa holders, OPT/CPT students, permanent residents, US citizens and green card holders across the US, UK, Australia, New Zealand, India, UAE, Canada and EMEA. Filter by date posted, visa sponsorship and remote work.",
  alternates: { canonical: "/jobs" },
};

export default function JobsSectionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
