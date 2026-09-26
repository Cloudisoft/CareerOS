import { NextRequest } from "next/server";
import { requireExtensionCandidateProfile } from "@/lib/auth/extension";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { transcribeAudioChunk } from "@/lib/interview/live";
import { extCatch, extOk } from "@/lib/extension/response";

/**
 * Live Copilot transcription — one short raw-audio chunk per call (see
 * interview-extension/offscreen/offscreen.js). No audio is stored: the
 * chunk lives only for the duration of this request, forwarded straight to
 * the configured STT provider and discarded.
 */
export async function POST(req: NextRequest) {
  try {
    const { user } = await requireExtensionCandidateProfile(req);
    // Gated on the same Interview AI entitlement as the rest of Interview AI —
    // no separate minute-metering or billing for this feature.
    await requireEntitlement(user.id, "interviewAi");

    const mimeType = req.headers.get("content-type") || "audio/webm";
    const audio = await req.arrayBuffer();
    if (audio.byteLength === 0) {
      return extOk({ transcript: "" });
    }

    const transcript = await transcribeAudioChunk(audio, mimeType);
    return extOk({ transcript });
  } catch (error) {
    return extCatch(error);
  }
}
