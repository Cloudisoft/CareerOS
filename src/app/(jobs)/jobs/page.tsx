"use client";

import { Suspense } from "react";
import { JobSearchExperience } from "@/components/jobs/job-search";

export default function JobsPage() {
  return (
    <Suspense>
      <JobSearchExperience brandName="Jobs" />
    </Suspense>
  );
}
