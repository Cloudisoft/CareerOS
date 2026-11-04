import { NextRequest } from "next/server";
import { requireExtensionCandidateProfile } from "@/lib/auth/extension";
import { candidateResumePdf, resumePlainText } from "@/lib/resume/candidate-document";
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
    const { bytes, fileName, doc, updatedAt, source } = await candidateResumePdf(user, profile.id, profile.location);
    return extOk({
      name: fileName,
      mime: "application/pdf",
      base64: Buffer.from(bytes).toString("base64"),
      text: resumePlainText(doc),
      updatedAt: updatedAt.toISOString(),
      source,
    });
  } catch (error) {
    return extCatch(error);
  }
}
