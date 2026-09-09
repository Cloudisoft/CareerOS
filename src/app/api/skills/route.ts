import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return apiError("Not authenticated", 401, "UNAUTHENTICATED");

    const query = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    const skills = await prisma.skill.findMany({
      where: query ? { name: { contains: query, mode: "insensitive" } } : undefined,
      orderBy: { name: "asc" },
      take: 20,
    });

    return apiOk({ skills: skills.map((s) => ({ id: s.id, name: s.name })) });
  } catch (error) {
    return apiCatch(error);
  }
}
