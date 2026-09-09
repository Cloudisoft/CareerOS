import { NextRequest } from "next/server";
import { z } from "zod";
import { requireCandidate } from "@/lib/auth/guards";
import { listConnections, sendConnectionRequest } from "@/lib/network/service";
import { apiCatch, apiOk } from "@/lib/api-response";

const schema = z.object({ recipientId: z.string().min(1) });

export async function GET() {
  try {
    const { user } = await requireCandidate();
    const connections = await listConnections(user.id);
    return apiOk(connections);
  } catch (error) {
    return apiCatch(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireCandidate();
    const { recipientId } = schema.parse(await req.json());
    const connection = await sendConnectionRequest(user.id, recipientId);
    return apiOk({ connection });
  } catch (error) {
    return apiCatch(error);
  }
}
