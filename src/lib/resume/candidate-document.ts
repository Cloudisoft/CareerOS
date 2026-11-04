import "server-only";
import { prisma } from "@/lib/prisma";
import { resumeContentSchema } from "@/lib/validations/resume";
import { getProfileForExtensionSync, buildExtensionProfile } from "@/lib/autoapply/adapter";
import { documentFromProfile, documentFromResumeContent, renderResumePdf, type ResumeDocument } from "@/lib/resume/pdf";
import type { User } from "@prisma/client";

/**
 * A candidate's resume as one normalized document: their primary Resume
 * Studio resume when it parses, otherwise built from the Career Profile.
 * Shared by Auto Apply's resume attachment and recruiters' unlocked
 * resume downloads, so both always render the same thing.
 */
export async function candidateResumeDocument(user: User, profileId: string, location: string | null) {
  const resume = await prisma.resume.findFirst({
    where: { profileId },
    orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
  });
  const parsed = resume ? resumeContentSchema.safeParse(resume.content) : null;

  if (resume && parsed?.success) {
    const doc = documentFromResumeContent(
      {
        name: [user.firstName, user.lastName].filter(Boolean).join(" "),
        email: user.email,
        phone: user.phone ?? "",
        location: location ?? "",
      },
      parsed.data
    );
    return { doc, updatedAt: resume.updatedAt, source: "resume-studio" as const };
  }
  const full = await getProfileForExtensionSync(profileId);
  return { doc: documentFromProfile(buildExtensionProfile(user, full)), updatedAt: full.updatedAt, source: "career-profile" as const };
}

export async function candidateResumePdf(user: User, profileId: string, location: string | null) {
  const { doc, updatedAt, source } = await candidateResumeDocument(user, profileId, location);
  const bytes = await renderResumePdf(doc);
  const baseName = [user.firstName, user.lastName].filter(Boolean).join("_").replace(/[^A-Za-z0-9_]/g, "") || "Resume";
  return { bytes, fileName: `${baseName}_Resume.pdf`, doc, updatedAt, source };
}

export function resumePlainText(doc: ResumeDocument) {
  const lines = [doc.name, [doc.email, doc.phone, doc.location].filter(Boolean).join(" | "), ""];
  if (doc.summary) lines.push("SUMMARY", doc.summary, "");
  if (doc.experience.length) {
    lines.push("EXPERIENCE");
    doc.experience.forEach((e) => {
      lines.push(`${e.title} - ${e.company} ${e.dates ? `(${e.dates})` : ""}`.trim());
      e.bullets.forEach((b) => lines.push(`- ${b}`));
    });
    lines.push("");
  }
  if (doc.education.length) {
    lines.push("EDUCATION");
    doc.education.forEach((e) => lines.push(`${e.school}${e.degree ? `, ${e.degree}` : ""} ${e.dates}`.trim()));
    lines.push("");
  }
  if (doc.skills.length) lines.push("SKILLS", doc.skills.join(", "));
  if (doc.certifications.length) lines.push("", "CERTIFICATIONS", ...doc.certifications);
  return lines.join("\n");
}
