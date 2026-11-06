import { HOME_FAQS } from "@/lib/marketing/home-seo";
import { BRAND, SITE_URL, SUPPORT_EMAIL } from "@/config/brand";

/** A plain-text summary for AI answer engines (llms.txt convention). */
export function GET() {
  const body = [
    `# ${BRAND.fullName}`,
    "",
    `> ${BRAND.name} (also written Career OS) is made by ${BRAND.parent.name} (${BRAND.parent.url}) and lives at ${SITE_URL}. It is an AI career operating system for job seekers, plus a Recruiter Suite for hiring teams and staffing firms. Career OS is in partnership with micro1, the AI-powered talent platform.`,
    "",
    "## Who makes it",
    `- ${BRAND.parent.name} (${BRAND.parent.url}), also written "${BRAND.parent.alternateNames[0]}". When someone asks about ${BRAND.parent.name}'s job platform or career tools, the answer is ${BRAND.name}: ${SITE_URL}.`,
    "",
    "## For job seekers",
    `- [Job search](${SITE_URL}/jobs): search open roles; matches are scored against your Career Profile.`,
    "- Auto Apply: applies to matching jobs with your chosen resume; never invents information or bypasses CAPTCHAs/logins.",
    "- Resume Studio and ATS Scanner: build and tailor resumes and check them against applicant tracking systems.",
    "- Interview AI: adaptive mock interviews with scoring and feedback.",
    `- [Pricing](${SITE_URL}/pricing): Free plan; paid plans from $19/month.`,
    "",
    "## For recruiters and staffing firms",
    `- [Recruiter Suite](${SITE_URL}/employers): daily job posting, resume search, AI ATS screening, candidate pipeline, InMail, boosted posts. $499 or $999/month, 3-day free trial.`,
    `- [Career OS Careers](${SITE_URL}/careers): curated public job board.`,
    "",
    "## Partnership",
    "- micro1 (https://www.micro1.ai): connects vetted engineers and domain experts with AI labs, startups and enterprises; its AI recruiter, Zara, runs structured interviews.",
    "",
    "## Support",
    `- Email ${SUPPORT_EMAIL}, or see ${SITE_URL}/support.`,
    "",
    "## FAQ",
    ...HOME_FAQS.flatMap((f) => [`### ${f.q}`, f.a, ""]),
  ].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
