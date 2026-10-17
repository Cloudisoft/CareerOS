import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Builds the CareerContext Job GPT reasons over: everything it's allowed to
 * know about one candidate, and nothing more. Only summarized facts are
 * sent to the AI provider — never raw DB rows, and never other candidates'
 * data.
 */
export async function buildCareerContext(
  userId: string,
  opts: {
    /** For text that goes to an employer (application answers, cover letters): leave out the candidate's
        other applications and internal scores, so no other employer's name can end up in it. */
    forApplication?: boolean;
  } = {}
): Promise<string> {
  const profile = await prisma.candidateProfile.findUnique({
    where: { userId },
    include: {
      experiences: { orderBy: { startDate: "desc" }, take: 8 },
      education: { orderBy: { startDate: "desc" }, take: 4 },
      certifications: { take: 10 },
      languages: true,
      skills: { include: { skill: true } },
      resumes: { select: { name: true, isPrimary: true } },
      applications: {
        include: { job: { include: { company: true } } },
        orderBy: { appliedAt: "desc" },
        take: 10,
      },
    },
  });

  if (!profile) return "This candidate has not started their Career Profile yet.";

  const lines: string[] = [];
  lines.push(`Location: ${profile.location ?? "unspecified"}`);
  lines.push(`Headline: ${profile.headline ?? "unspecified"}`);
  lines.push(
    `Current role: ${profile.currentTitle ?? "unspecified"} at ${profile.currentCompany ?? "unspecified"} (${profile.totalExperienceYears ?? "unknown"} years total experience, level: ${profile.careerLevel ?? "unspecified"})`
  );
  if (profile.bio) lines.push(`Summary: ${profile.bio}`);

  const ym = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 7) : "?");
  if (profile.experiences.length) {
    lines.push("Experience:");
    for (const exp of profile.experiences) {
      lines.push(
        `- ${exp.title} at ${exp.company}${exp.location ? `, ${exp.location}` : ""} (${ym(exp.startDate)} to ${exp.isCurrent ? "present" : ym(exp.endDate)})`
      );
      if (exp.description) lines.push(`  ${exp.description.replace(/\s+/g, " ").slice(0, 600)}`);
      for (const a of exp.achievements.slice(0, 5)) lines.push(`  • ${a.slice(0, 300)}`);
    }
  }
  if (profile.education.length) {
    lines.push("Education:");
    for (const ed of profile.education) {
      lines.push(`- ${[ed.degree, ed.fieldOfStudy].filter(Boolean).join(" in ") || "Studied"} at ${ed.school} (${ed.isCurrent ? "in progress" : ym(ed.endDate)})`);
    }
  }
  if (profile.certifications.length) {
    lines.push(`Certifications: ${profile.certifications.map((c) => `${c.name}${c.issuer ? ` (${c.issuer})` : ""}`).join(", ")}`);
  }
  if (profile.languages.length) {
    lines.push(`Languages: ${profile.languages.map((l) => `${l.language} (${l.proficiency.toLowerCase()})`).join(", ")}`);
  }

  if (profile.skills.length) {
    lines.push(`Skills: ${profile.skills.map((s) => s.skill.name).join(", ")}`);
  }

  lines.push(
    `Job preferences: titles [${profile.desiredTitles.join(", ") || "none set"}], locations [${profile.desiredLocations.join(", ") || "none set"}], workplace [${profile.workplaceTypes.join(", ") || "none set"}], salary ${profile.desiredSalaryMin ?? "?"}-${profile.desiredSalaryMax ?? "?"} ${profile.salaryCurrency}`
  );
  lines.push(`Work authorization: ${profile.workAuthorization ?? "unspecified"}, sponsorship: ${profile.sponsorshipStatus}`);
  if (profile.careerGoals) lines.push(`Career goals: ${profile.careerGoals}`);

  if (opts.forApplication) return lines.join("\n");

  lines.push(`Resumes on file: ${profile.resumes.map((r) => `${r.name}${r.isPrimary ? " (primary)" : ""}`).join(", ") || "none yet"}`);

  lines.push(
    `Career Readiness: ${profile.careerReadinessScore}% (resume ${profile.resumeScore}, profile ${profile.profileScore}, skills ${profile.skillsScore}, interview ${profile.interviewScore}, job match ${profile.jobMatchScore})`
  );

  if (profile.applications.length) {
    lines.push("Recent applications:");
    for (const app of profile.applications) {
      lines.push(`- ${app.job.title} at ${app.job.company.name}: status ${app.status}, matched ${app.matchScoreAtApply ?? "?"}% at apply`);
    }
  } else {
    lines.push("No applications submitted yet.");
  }

  return lines.join("\n");
}
