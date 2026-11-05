import { NextRequest } from "next/server";
import { z } from "zod";
import { requireEmployerCompany } from "@/lib/auth/guards";
import { getJobForCompany } from "@/lib/employer/jobs";
import { createPost } from "@/lib/network/service";
import { apiCatch, apiOk } from "@/lib/api-response";

const schema = z.object({ content: z.string().trim().min(1).max(2000).optional() });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, company } = await requireEmployerCompany();
    const job = await getJobForCompany(company.id, params.id);
    const { content } = schema.parse(await req.json().catch(() => ({})));
    const post = await createPost(
      user.id,
      content?.trim() || `${company.name} is hiring: ${job.title}${job.location ? ` (${job.location})` : ""}. Check it out!`,
      { jobId: job.id },
    );
    return apiOk({ post });
  } catch (error) {
    return apiCatch(error);
  }
}
