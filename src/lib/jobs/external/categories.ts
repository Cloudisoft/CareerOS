/**
 * A broad spread of job titles across industries, used to keep the
 * marketplace populated with real listings beyond whatever a single
 * candidate's resume happens to mention (see extension/jobs/route.ts,
 * which only ever syncs 1-2 titles per candidate on demand). Nationwide
 * keyword searches against Adzuna/JSearch already return geographically
 * diverse results without needing a location per query.
 */
export const DEFAULT_JOB_CATEGORIES: string[] = [
  // Tech
  "Software Engineer",
  "Data Analyst",
  "Product Manager",
  "IT Support Specialist",
  "DevOps Engineer",
  "UX Designer",
  // Healthcare
  "Registered Nurse",
  "Medical Assistant",
  "Pharmacy Technician",
  "Physical Therapist",
  // Sales & marketing
  "Sales Representative",
  "Marketing Manager",
  "Account Executive",
  "Social Media Manager",
  // Admin & operations
  "Administrative Assistant",
  "Executive Assistant",
  "Operations Manager",
  "Project Manager",
  "Bookkeeper",
  // Customer service & retail
  "Customer Service Representative",
  "Retail Associate",
  "Store Manager",
  // Hospitality & food service
  "Restaurant Manager",
  "Chef",
  "Hotel Front Desk Agent",
  // Skilled trades & logistics
  "Electrician",
  "HVAC Technician",
  "Warehouse Associate",
  "Truck Driver",
  "Construction Worker",
  // Education & social services
  "Teacher",
  "Social Worker",
  // Finance & legal
  "Accountant",
  "Financial Analyst",
  "Paralegal",
  // HR & recruiting
  "Human Resources Manager",
  "Recruiter",
];
