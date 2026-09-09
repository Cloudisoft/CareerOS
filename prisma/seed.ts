import { PrismaClient } from "@prisma/client";

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

async function main() {
  for (const skill of SKILLS) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: { category: skill.category },
      create: skill,
    });
  }
  console.log(`Seeded ${SKILLS.length} skills.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
