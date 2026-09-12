import { PrismaClient } from "@prisma/client";
import { COURSES } from "./courses-seed-data";

const prisma = new PrismaClient();

const SKILLS: { name: string; category: string }[] = [
  // Engineering — languages & frameworks
  { name: "JavaScript", category: "Engineering" },
  { name: "TypeScript", category: "Engineering" },
  { name: "Python", category: "Engineering" },
  { name: "Java", category: "Engineering" },
  { name: "Go", category: "Engineering" },
  { name: "Rust", category: "Engineering" },
  { name: "C#", category: "Engineering" },
  { name: "C++", category: "Engineering" },
  { name: "Ruby", category: "Engineering" },
  { name: "PHP", category: "Engineering" },
  { name: "React", category: "Engineering" },
  { name: "Next.js", category: "Engineering" },
  { name: "Vue.js", category: "Engineering" },
  { name: "Angular", category: "Engineering" },
  { name: "Node.js", category: "Engineering" },
  { name: "GraphQL", category: "Engineering" },
  { name: "REST APIs", category: "Engineering" },
  { name: "Microservices", category: "Engineering" },
  { name: "System Design", category: "Engineering" },
  // Cloud & DevOps
  { name: "AWS", category: "Cloud & DevOps" },
  { name: "Azure", category: "Cloud & DevOps" },
  { name: "Google Cloud Platform", category: "Cloud & DevOps" },
  { name: "Docker", category: "Cloud & DevOps" },
  { name: "Kubernetes", category: "Cloud & DevOps" },
  { name: "Terraform", category: "Cloud & DevOps" },
  { name: "CI/CD", category: "Cloud & DevOps" },
  { name: "Linux", category: "Cloud & DevOps" },
  // Data
  { name: "SQL", category: "Data" },
  { name: "PostgreSQL", category: "Data" },
  { name: "MongoDB", category: "Data" },
  { name: "Redis", category: "Data" },
  { name: "Data Engineering", category: "Data" },
  { name: "ETL Pipelines", category: "Data" },
  { name: "Machine Learning", category: "Data" },
  { name: "Data Analysis", category: "Data" },
  // Security
  { name: "Application Security", category: "Security" },
  { name: "Penetration Testing", category: "Security" },
  { name: "Identity & Access Management", category: "Security" },
  // Product & Business
  { name: "Product Management", category: "Business" },
  { name: "Product Strategy", category: "Business" },
  { name: "Roadmapping", category: "Business" },
  { name: "Agile / Scrum", category: "Business" },
  { name: "Project Management", category: "Business" },
  { name: "Business Analysis", category: "Business" },
  { name: "Stakeholder Management", category: "Business" },
  { name: "Digital Marketing", category: "Business" },
  { name: "SEO", category: "Business" },
  { name: "Salesforce", category: "Business" },
  // Design
  { name: "UI/UX Design", category: "Design" },
  { name: "Figma", category: "Design" },
  { name: "Design Systems", category: "Design" },
  // Tools
  { name: "Git", category: "Tools" },
  { name: "Jira", category: "Tools" },
  { name: "Confluence", category: "Tools" },
  { name: "Slack", category: "Tools" },
  { name: "Excel", category: "Tools" },
  { name: "Tableau", category: "Tools" },
  { name: "Power BI", category: "Tools" },
  // Soft skills
  { name: "Leadership", category: "Soft Skills" },
  { name: "Communication", category: "Soft Skills" },
  { name: "Cross-functional Collaboration", category: "Soft Skills" },
  { name: "Mentorship", category: "Soft Skills" },
  { name: "Public Speaking", category: "Soft Skills" },
  { name: "Negotiation", category: "Soft Skills" },
  { name: "Problem Solving", category: "Soft Skills" },
  { name: "Critical Thinking", category: "Soft Skills" },
  { name: "Time Management", category: "Soft Skills" },
  { name: "Adaptability", category: "Soft Skills" },
];

interface CompanySeed {
  slug: string;
  name: string;
  industry: string;
  size: string;
  location: string;
  description: string;
  website: string;
  jobs: JobSeed[];
}

interface JobSeed {
  title: string;
  description: string;
  location: string | null;
  workplaceType: "ONSITE" | "HYBRID" | "REMOTE";
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "TEMPORARY";
  careerLevel: "ENTRY" | "ASSOCIATE" | "MID" | "SENIOR" | "LEAD" | "MANAGER" | "DIRECTOR" | "EXECUTIVE";
  salaryMin: number;
  salaryMax: number;
  requiredSkills: string[];
  niceToHaveSkills?: string[];
}

const COMPANIES: CompanySeed[] = [
  {
    slug: "northwind-analytics",
    name: "Northwind Analytics",
    industry: "Data & AI",
    size: "201-500",
    location: "Seattle, WA",
    website: "https://northwindanalytics.example",
    description:
      "Northwind Analytics builds forecasting and anomaly-detection tools for logistics and retail operators, processing billions of events a day.",
    jobs: [
      {
        title: "Senior Backend Engineer",
        description:
          "Own the event-ingestion pipeline that processes billions of records daily. You'll design schemas, tune query performance, and mentor two mid-level engineers.",
        location: "Seattle, WA",
        workplaceType: "HYBRID",
        employmentType: "FULL_TIME",
        careerLevel: "SENIOR",
        salaryMin: 160000,
        salaryMax: 200000,
        requiredSkills: ["Go", "PostgreSQL", "System Design", "AWS"],
        niceToHaveSkills: ["Kubernetes", "Redis"],
      },
      {
        title: "Data Engineer",
        description:
          "Build and maintain ETL pipelines feeding our forecasting models. You'll work closely with data science to make sure training data is clean, timely, and well-documented.",
        location: "Seattle, WA",
        workplaceType: "HYBRID",
        employmentType: "FULL_TIME",
        careerLevel: "MID",
        salaryMin: 130000,
        salaryMax: 160000,
        requiredSkills: ["Python", "SQL", "ETL Pipelines", "AWS"],
      },
      {
        title: "Machine Learning Engineer",
        description:
          "Take forecasting models from notebook to production. You'll own the training pipeline, model monitoring, and rollout process for models that directly drive customer-facing forecasts.",
        location: "Remote",
        workplaceType: "REMOTE",
        employmentType: "FULL_TIME",
        careerLevel: "SENIOR",
        salaryMin: 170000,
        salaryMax: 210000,
        requiredSkills: ["Python", "Machine Learning", "Data Engineering"],
      },
    ],
  },
  {
    slug: "brightwell-health",
    name: "Brightwell Health",
    industry: "Healthcare Technology",
    size: "501-1000",
    location: "Boston, MA",
    website: "https://brightwellhealth.example",
    description:
      "Brightwell Health builds care-coordination software used by clinics to manage patient scheduling, referrals, and follow-up care.",
    jobs: [
      {
        title: "Full Stack Engineer",
        description:
          "Ship features across our patient-scheduling product end to end — from the React frontend to the Rails API. HIPAA-aware engineering practices are part of the job, not an afterthought.",
        location: "Boston, MA",
        workplaceType: "HYBRID",
        employmentType: "FULL_TIME",
        careerLevel: "MID",
        salaryMin: 125000,
        salaryMax: 155000,
        requiredSkills: ["React", "Ruby", "SQL", "REST APIs"],
      },
      {
        title: "Product Manager, Clinical Workflows",
        description:
          "Own the roadmap for our referral-management product. You'll spend real time in clinics observing workflows, then translate what you see into a roadmap engineering can execute.",
        location: "Boston, MA",
        workplaceType: "HYBRID",
        employmentType: "FULL_TIME",
        careerLevel: "SENIOR",
        salaryMin: 140000,
        salaryMax: 175000,
        requiredSkills: ["Product Management", "Roadmapping", "Stakeholder Management"],
      },
      {
        title: "QA Engineer",
        description:
          "Build and maintain the automated test suite for our clinical scheduling product, where a shipped bug means a missed patient appointment.",
        location: "Boston, MA",
        workplaceType: "ONSITE",
        employmentType: "FULL_TIME",
        careerLevel: "ASSOCIATE",
        salaryMin: 85000,
        salaryMax: 105000,
        requiredSkills: ["JavaScript", "Communication"],
      },
    ],
  },
  {
    slug: "ledgerline-financial",
    name: "Ledgerline Financial",
    industry: "Fintech",
    size: "1001-5000",
    location: "New York, NY",
    website: "https://ledgerlinefinancial.example",
    description:
      "Ledgerline Financial provides embedded lending infrastructure that banks and marketplaces use to underwrite and service loans in real time.",
    jobs: [
      {
        title: "Staff Software Engineer",
        description:
          "Lead the design of our real-time underwriting engine, which makes lending decisions in under 200ms at load. You'll set technical direction across three teams.",
        location: "New York, NY",
        workplaceType: "HYBRID",
        employmentType: "FULL_TIME",
        careerLevel: "LEAD",
        salaryMin: 210000,
        salaryMax: 260000,
        requiredSkills: ["Java", "System Design", "Microservices", "PostgreSQL"],
      },
      {
        title: "Backend Engineer",
        description:
          "Build the APIs our banking partners integrate against. Correctness and auditability matter as much as speed here — every decision needs a paper trail.",
        location: "New York, NY",
        workplaceType: "ONSITE",
        employmentType: "FULL_TIME",
        careerLevel: "MID",
        salaryMin: 145000,
        salaryMax: 175000,
        requiredSkills: ["Java", "SQL", "REST APIs"],
      },
      {
        title: "Application Security Engineer",
        description:
          "Own our application security program: threat modeling new features, running penetration tests before major releases, and hardening our identity infrastructure.",
        location: "New York, NY",
        workplaceType: "HYBRID",
        employmentType: "FULL_TIME",
        careerLevel: "SENIOR",
        salaryMin: 165000,
        salaryMax: 200000,
        requiredSkills: ["Application Security", "Penetration Testing", "Identity & Access Management"],
      },
      {
        title: "Business Analyst",
        description:
          "Translate lending-partner requirements into specs engineering can build against, and own the reporting that shows leadership how each partner integration is performing.",
        location: "New York, NY",
        workplaceType: "ONSITE",
        employmentType: "FULL_TIME",
        careerLevel: "ASSOCIATE",
        salaryMin: 90000,
        salaryMax: 115000,
        requiredSkills: ["Business Analysis", "Excel", "SQL"],
      },
    ],
  },
  {
    slug: "skyforge-robotics",
    name: "Skyforge Robotics",
    industry: "Robotics",
    size: "51-200",
    location: "Austin, TX",
    website: "https://skyforgerobotics.example",
    description:
      "Skyforge Robotics designs autonomous inspection drones for utility and infrastructure companies.",
    jobs: [
      {
        title: "Robotics Software Engineer",
        description:
          "Write the flight-control and obstacle-avoidance software running on our inspection drones. You'll work close to the hardware, in C++ and Python both.",
        location: "Austin, TX",
        workplaceType: "ONSITE",
        employmentType: "FULL_TIME",
        careerLevel: "MID",
        salaryMin: 135000,
        salaryMax: 165000,
        requiredSkills: ["C++", "Python", "Problem Solving"],
      },
      {
        title: "Site Reliability Engineer",
        description:
          "Keep our fleet-management platform up as we scale from hundreds to thousands of drones in the field. You'll own on-call, incident response, and infrastructure-as-code.",
        location: "Austin, TX",
        workplaceType: "HYBRID",
        employmentType: "FULL_TIME",
        careerLevel: "SENIOR",
        salaryMin: 155000,
        salaryMax: 190000,
        requiredSkills: ["Kubernetes", "Terraform", "AWS", "CI/CD"],
      },
    ],
  },
  {
    slug: "verdant-energy",
    name: "Verdant Energy Systems",
    industry: "Clean Energy",
    size: "201-500",
    location: "Denver, CO",
    website: "https://verdantenergy.example",
    description:
      "Verdant Energy Systems builds the software layer that lets utilities balance solar and battery storage in real time across residential grids.",
    jobs: [
      {
        title: "Software Engineer, Grid Systems",
        description:
          "Build the control software that decides, every few seconds, how much stored solar energy to release back to the grid. Reliability here has real-world consequences.",
        location: "Denver, CO",
        workplaceType: "HYBRID",
        employmentType: "FULL_TIME",
        careerLevel: "MID",
        salaryMin: 125000,
        salaryMax: 155000,
        requiredSkills: ["Python", "System Design", "Problem Solving"],
      },
      {
        title: "Data Analyst, Energy Markets",
        description:
          "Analyze grid and pricing data to help our team decide when storage should charge versus discharge. Your models directly influence millions of dollars in energy trades.",
        location: "Denver, CO",
        workplaceType: "HYBRID",
        employmentType: "FULL_TIME",
        careerLevel: "ASSOCIATE",
        salaryMin: 85000,
        salaryMax: 110000,
        requiredSkills: ["Data Analysis", "SQL", "Excel"],
      },
    ],
  },
  {
    slug: "loomstack",
    name: "Loomstack",
    industry: "Developer Tools",
    size: "51-200",
    location: "Remote",
    website: "https://loomstack.example",
    description:
      "Loomstack makes a CI/CD platform built for monorepos, used by engineering teams who've outgrown their existing pipeline.",
    jobs: [
      {
        title: "Founding Frontend Engineer",
        description:
          "You'll be the first dedicated frontend hire, shaping both the product and the team's frontend conventions from day one. Strong opinions about developer-tool UX are a plus.",
        location: null,
        workplaceType: "REMOTE",
        employmentType: "FULL_TIME",
        careerLevel: "SENIOR",
        salaryMin: 165000,
        salaryMax: 205000,
        requiredSkills: ["React", "TypeScript", "Next.js", "Design Systems"],
      },
      {
        title: "Developer Advocate",
        description:
          "Write documentation, sample repos, and conference talks that help engineering teams get value from Loomstack in their first week, not their first quarter.",
        location: null,
        workplaceType: "REMOTE",
        employmentType: "FULL_TIME",
        careerLevel: "MID",
        salaryMin: 110000,
        salaryMax: 140000,
        requiredSkills: ["Communication", "Public Speaking", "Git"],
      },
      {
        title: "Backend Engineer, Build Infrastructure",
        description:
          "Work on the job scheduler that orchestrates millions of CI runs a month. Correctness under concurrency is the whole job.",
        location: null,
        workplaceType: "REMOTE",
        employmentType: "FULL_TIME",
        careerLevel: "SENIOR",
        salaryMin: 160000,
        salaryMax: 195000,
        requiredSkills: ["Go", "Kubernetes", "System Design"],
      },
    ],
  },
  {
    slug: "harborlight-media",
    name: "Harborlight Media",
    industry: "Streaming Media",
    size: "1001-5000",
    location: "Los Angeles, CA",
    website: "https://harborlightmedia.example",
    description:
      "Harborlight Media operates a video streaming platform serving several million monthly viewers across mobile, web, and connected TV.",
    jobs: [
      {
        title: "Engineering Manager, Playback",
        description:
          "Lead a team of six engineers responsible for video playback quality across every device we support. You'll set priorities, run the roadmap, and still review the occasional PR.",
        location: "Los Angeles, CA",
        workplaceType: "HYBRID",
        employmentType: "FULL_TIME",
        careerLevel: "MANAGER",
        salaryMin: 190000,
        salaryMax: 230000,
        requiredSkills: ["Leadership", "System Design", "Mentorship"],
      },
      {
        title: "Growth Marketing Manager",
        description:
          "Own paid acquisition and lifecycle campaigns for our streaming app. You'll run the experiments that decide where the next marketing dollar goes.",
        location: "Los Angeles, CA",
        workplaceType: "HYBRID",
        employmentType: "FULL_TIME",
        careerLevel: "MID",
        salaryMin: 105000,
        salaryMax: 135000,
        requiredSkills: ["Digital Marketing", "SEO", "Data Analysis"],
      },
      {
        title: "UI/UX Designer",
        description:
          "Design the browse and playback experience for our connected-TV apps, where remote-control navigation and a living-room viewing distance change every rule you know from mobile design.",
        location: "Los Angeles, CA",
        workplaceType: "HYBRID",
        employmentType: "FULL_TIME",
        careerLevel: "MID",
        salaryMin: 110000,
        salaryMax: 140000,
        requiredSkills: ["UI/UX Design", "Figma", "Design Systems"],
      },
    ],
  },
  {
    slug: "pinegate-logistics",
    name: "Pinegate Logistics",
    industry: "Logistics & Supply Chain",
    size: "501-1000",
    location: "Chicago, IL",
    website: "https://pinegatelogistics.example",
    description:
      "Pinegate Logistics runs route-optimization and warehouse-management software for mid-size freight carriers.",
    jobs: [
      {
        title: "Project Manager, Implementation",
        description:
          "Run the rollout of our warehouse-management system at new customer sites, coordinating between our engineers and the customer's ops team through go-live.",
        location: "Chicago, IL",
        workplaceType: "ONSITE",
        employmentType: "FULL_TIME",
        careerLevel: "MID",
        salaryMin: 95000,
        salaryMax: 120000,
        requiredSkills: ["Project Management", "Stakeholder Management", "Agile / Scrum"],
      },
      {
        title: "Software Engineer, Routing",
        description:
          "Improve the route-optimization algorithms that decide delivery order for thousands of trucks a day. A few percent of efficiency gain here is real fuel savings at scale.",
        location: "Chicago, IL",
        workplaceType: "HYBRID",
        employmentType: "FULL_TIME",
        careerLevel: "MID",
        salaryMin: 120000,
        salaryMax: 150000,
        requiredSkills: ["Python", "Problem Solving", "SQL"],
      },
    ],
  },
  {
    slug: "cobalt-security",
    name: "Cobalt Security",
    industry: "Cybersecurity",
    size: "201-500",
    location: "Washington, DC",
    website: "https://cobaltsecurity.example",
    description:
      "Cobalt Security provides managed detection and response services to mid-market companies without an in-house security team.",
    jobs: [
      {
        title: "Security Operations Analyst",
        description:
          "Triage alerts from our detection platform around the clock (on a rotating shift), and escalate real incidents to our response team within minutes, not hours.",
        location: "Washington, DC",
        workplaceType: "ONSITE",
        employmentType: "FULL_TIME",
        careerLevel: "ASSOCIATE",
        salaryMin: 80000,
        salaryMax: 100000,
        requiredSkills: ["Application Security", "Critical Thinking"],
      },
      {
        title: "Penetration Tester",
        description:
          "Run scoped penetration tests for client environments and write reports a non-technical stakeholder can act on, not just a CVE list.",
        location: "Washington, DC",
        workplaceType: "HYBRID",
        employmentType: "FULL_TIME",
        careerLevel: "SENIOR",
        salaryMin: 145000,
        salaryMax: 180000,
        requiredSkills: ["Penetration Testing", "Application Security", "Linux"],
      },
    ],
  },
  {
    slug: "wavecrest-retail",
    name: "Wavecrest Retail",
    industry: "E-commerce",
    size: "1001-5000",
    location: "San Francisco, CA",
    website: "https://wavecrestretail.example",
    description:
      "Wavecrest Retail runs a direct-to-consumer marketplace for independent home-goods brands, handling both the storefront and fulfillment.",
    jobs: [
      {
        title: "Senior Product Manager, Checkout",
        description:
          "Own checkout conversion across web and mobile. You'll run the experimentation program that has shipped a 2-point conversion lift in each of the last two years.",
        location: "San Francisco, CA",
        workplaceType: "HYBRID",
        employmentType: "FULL_TIME",
        careerLevel: "SENIOR",
        salaryMin: 165000,
        salaryMax: 200000,
        requiredSkills: ["Product Management", "Data Analysis", "Stakeholder Management"],
      },
      {
        title: "Frontend Engineer",
        description:
          "Build storefront features used by millions of shoppers a month. Performance budgets are enforced in CI here, not just talked about.",
        location: "San Francisco, CA",
        workplaceType: "HYBRID",
        employmentType: "FULL_TIME",
        careerLevel: "MID",
        salaryMin: 135000,
        salaryMax: 165000,
        requiredSkills: ["React", "TypeScript", "JavaScript"],
      },
      {
        title: "Data Scientist, Recommendations",
        description:
          "Improve the recommendation models that drive a meaningful share of our GMV. You'll own everything from feature engineering to the A/B test that ships it.",
        location: "San Francisco, CA",
        workplaceType: "REMOTE",
        employmentType: "FULL_TIME",
        careerLevel: "SENIOR",
        salaryMin: 170000,
        salaryMax: 210000,
        requiredSkills: ["Machine Learning", "Python", "Data Analysis"],
      },
      {
        title: "Customer Support Lead",
        description:
          "Lead a team of eight support agents handling order and fulfillment issues, and own the metrics that tell us whether support is actually solving problems or just closing tickets.",
        location: "San Francisco, CA",
        workplaceType: "ONSITE",
        employmentType: "FULL_TIME",
        careerLevel: "MANAGER",
        salaryMin: 90000,
        salaryMax: 115000,
        requiredSkills: ["Leadership", "Communication", "Time Management"],
      },
    ],
  },
];

async function seedCompaniesAndJobs() {
  const skillCache = new Map<string, string>();
  async function skillId(name: string) {
    const cached = skillCache.get(name);
    if (cached) return cached;
    const skill = await prisma.skill.upsert({ where: { name }, update: {}, create: { name } });
    skillCache.set(name, skill.id);
    return skill.id;
  }

  let jobCount = 0;
  for (const company of COMPANIES) {
    const companyRecord = await prisma.company.upsert({
      where: { slug: company.slug },
      update: {
        name: company.name,
        industry: company.industry,
        size: company.size,
        location: company.location,
        description: company.description,
        website: company.website,
      },
      create: {
        slug: company.slug,
        name: company.name,
        industry: company.industry,
        size: company.size,
        location: company.location,
        description: company.description,
        website: company.website,
      },
    });

    for (const job of company.jobs) {
      const existing = await prisma.job.findFirst({ where: { companyId: companyRecord.id, title: job.title } });
      const jobRecord = existing
        ? await prisma.job.update({
            where: { id: existing.id },
            data: {
              description: job.description,
              location: job.location,
              workplaceType: job.workplaceType,
              employmentType: job.employmentType,
              careerLevel: job.careerLevel,
              salaryMin: job.salaryMin,
              salaryMax: job.salaryMax,
            },
          })
        : await prisma.job.create({
            data: {
              companyId: companyRecord.id,
              title: job.title,
              description: job.description,
              location: job.location,
              workplaceType: job.workplaceType,
              employmentType: job.employmentType,
              careerLevel: job.careerLevel,
              salaryMin: job.salaryMin,
              salaryMax: job.salaryMax,
              status: "OPEN",
            },
          });

      const allSkills = [
        ...job.requiredSkills.map((name) => ({ name, required: true })),
        ...(job.niceToHaveSkills ?? []).map((name) => ({ name, required: false })),
      ];
      for (const s of allSkills) {
        const sid = await skillId(s.name);
        await prisma.jobSkill.upsert({
          where: { jobId_skillId: { jobId: jobRecord.id, skillId: sid } },
          update: { required: s.required },
          create: { jobId: jobRecord.id, skillId: sid, required: s.required },
        });
      }
      jobCount += 1;
    }
  }

  console.log(`Seeded ${COMPANIES.length} companies and ${jobCount} jobs.`);
}

async function seedCourses() {
  let lessonCount = 0;
  for (const course of COURSES) {
    const record = await prisma.course.upsert({
      where: { slug: course.slug },
      update: {
        title: course.title,
        description: course.description,
        category: course.category,
        level: course.level,
        order: course.order,
      },
      create: {
        slug: course.slug,
        title: course.title,
        description: course.description,
        category: course.category,
        level: course.level,
        order: course.order,
      },
    });

    for (let index = 0; index < course.lessons.length; index++) {
      const lesson = course.lessons[index];
      await prisma.courseLesson.upsert({
        where: { courseId_order: { courseId: record.id, order: index } },
        update: {
          title: lesson.title,
          slides: lesson.slides,
          durationMinutes: lesson.durationMinutes,
        },
        create: {
          courseId: record.id,
          title: lesson.title,
          slides: lesson.slides,
          order: index,
          durationMinutes: lesson.durationMinutes,
        },
      });
      lessonCount += 1;
    }
  }
  console.log(`Seeded ${COURSES.length} courses with ${lessonCount} lessons.`);
}

async function main() {
  for (const skill of SKILLS) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: { category: skill.category },
      create: skill,
    });
  }
  console.log(`Seeded ${SKILLS.length} skills.`);

  await seedCompaniesAndJobs();
  await seedCourses();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
