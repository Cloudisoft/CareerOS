export interface NormalizedExternalJob {
  source: "adzuna" | "jsearch";
  externalId: string;
  title: string;
  description: string;
  companyName: string;
  location: string | null;
  workplaceType: "ONSITE" | "HYBRID" | "REMOTE";
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "TEMPORARY";
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  externalUrl: string;
}
