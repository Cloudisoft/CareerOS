"use client";

import { Suspense } from "react";
import { JobSearchExperience } from "@/components/jobs/job-search";

export default function SilverCareersPage() {
  return (
    <Suspense>
      <JobSearchExperience
        brandName="SilverCareers"
        tagline="Search live openings across CareerOS and our job board partners."
      />
    </Suspense>
  );
}
