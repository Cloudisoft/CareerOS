import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { getEntitlements } from "@/lib/billing/entitlements";
import { createResume } from "@/lib/resume/service";
import { extractResumeText, ResumeExtractError } from "@/lib/resume/extract";
import { parseResumeToContent, ResumeParseError } from "@/lib/resume/ai";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const { user, profile } = await requireCandidate();
    const entitlements = await getEntitlements(user.id);

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return apiError("Attach a resume file.", 422, "VALIDATION_ERROR");
    }

    let text: string;
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      text = await extractResumeText(buffer, file.type, file.name);
    } catch (error) {
      if (error instanceof ResumeExtractError) return apiError(error.message, 422, error.code);
      throw error;
    }

    if (!text.trim()) {
      return apiError("That file doesn't seem to have any readable text in it.", 422, "EMPTY_FILE");
    }

    let content;
    try {
      content = await parseResumeToContent(text);
    } catch (error) {
      if (error instanceof ResumeParseError) return apiError(error.message, 422, "PARSE_FAILED");
      throw error;
    }

    const name = file.name.replace(/\.(pdf|docx?|txt)$/i, "") || "Uploaded Resume";
    const resume = await createResume(profile.id, name, false, entitlements.resumeImportLimit, content);
    return apiOk({ resume });
  } catch (error) {
    return apiCatch(error);
  }
}
