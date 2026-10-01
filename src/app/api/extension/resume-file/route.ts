import { NextRequest } from "next/server";
import { requireExtensionCandidateProfile } from "@/lib/auth/extension";
import { prisma } from "@/lib/prisma";
import { resumeContentSchema } from "@/lib/validations/resume";
import { getProfileForExtensionSync, buildExtensionProfile } from "@/lib/autoapply/adapter";
import { documentFromProfile, documentFromResumeContent, renderResumePdf, type ResumeDocument } from "@/lib/resume/pdf";
import { extCatch, extOk } from "@/lib/extension/response";

/**
 * The person's resume as an actual PDF file, so Auto Apply can attach it to
 * every application's upload field. CareerOS stores resumes as structured
 * content, not files — without this the extension only ever had a file if
 * the person separately uploaded one inside the extension.
 *
 * Uses the primary Resume Studio resume when there is one, otherwise builds
 * it from the Career Profile so everyone gets a file.
 */
export async function GET(req: NextRequest) {
  try {
    const { user, profile } = await requireExtensionCandidateProfile(req);

    const resume = await prisma.resume.findFirst({
      where: { profileId: profile.id },
      orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
    });

    let doc: ResumeDocument;
    let updatedAt: Date;
    const parsed = resume ? resumeContentSchema.safeParse(resume.content) : null;

    if (resume && parsed && parsed.success) {
      doc = documentFromResumeContent(
        {
          name: [user.firstName, user.lastName].filter(Boolean).join(" "),
          email: user.email,
          phone: user.phone ?? "",
          location: profile.location ?? "",
        },
        parsed.data
      );
      updatedAt = resume.updatedAt;
    } else {
      const full = await getProfileForExtensionSync(profile.id);
      doc = documentFromProfile(buildExtensionProfile(user, full));
      updatedAt = full.updatedAt;
    }

    const bytes = await renderResumePdf(doc);
    const baseName = [user.firstName, user.lastName].filter(Boolean).join("_").replace(/[^A-Za-z0-9_]/g, "") || "Resume";

    return extOk({
      name: `${baseName}_Resume.pdf`,
      mime: "application/pdf",
      base64: Buffer.from(bytes).toString("base64"),
      text: plainText(doc),
      updatedAt: updatedAt.toISOString(),
      source: resume && parsed && parsed.success ? "resume-studio" : "career-profile",
    });
  } catch (error) {
    return extCatch(error);
  }
}

function plainText(doc: ResumeDocument) {
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
  return lines.join("\n");
}
