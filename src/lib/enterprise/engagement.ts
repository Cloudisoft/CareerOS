import "server-only";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getOrCreateConversation, sendMessage } from "@/lib/messaging/service";
import { updateApplicationStatusForCompany } from "@/lib/employer/applications";
import type { ApplicationStatus } from "@prisma/client";
import { EnterpriseError, requireFeature, type RecruiterContext } from "./account";
import { discoverableProfile, hasFullAccess } from "./candidates";

/**
 * Candidate engagement: message, shortlist, reject and move candidates
 * through stages. A recruiter can only message someone who applied to
 * their firm or whom they unlocked — never arbitrary users. Messages use
 * the existing in-app messaging, so the candidate reads and replies in
 * their normal Messages inbox.
 */

export type EngagementStatus = "NOT_CONTACTED" | "CONTACTED" | "REPLIED";
const RANK: Record<EngagementStatus, number> = { NOT_CONTACTED: 0, CONTACTED: 1, REPLIED: 2 };

/** The pipeline stages a recruiter can move an application to. */
export const PIPELINE_STAGES: ApplicationStatus[] = ["APPLIED", "VIEWED", "SCREENING", "INTERVIEW", "OFFER", "REJECTED"];

export async function messageCandidate(ctx: RecruiterContext, profileId: string, content: string) {
  requireFeature(ctx.state, "candidateEngagement", "Candidate engagement");
  const limit = rateLimit(`engage:${ctx.user.id}`, 60, 60 * 60 * 1000);
  if (!limit.allowed) throw new EnterpriseError("You've sent a lot of messages this hour. Try again shortly.", "RATE_LIMITED");

  const profile = await discoverableProfile(ctx, profileId);
  if (!(await hasFullAccess(ctx, profileId))) {
    throw new EnterpriseError("You can message candidates who applied to your jobs or whom you've unlocked.", "LOCKED");
  }
  const conversation = await getOrCreateConversation(ctx.user.id, profile.user.id, { allowUnconnected: true });
  const message = await sendMessage(ctx.user.id, conversation.id, content);
  return { conversationId: conversation.id, message };
}

/**
 * Engagement status per candidate user, from real messages between any of
 * this firm's members and the candidate.
 */
export async function engagementStatuses(companyId: string, candidateUserIds: string[]) {
  const result = new Map<string, EngagementStatus>();
  if (!candidateUserIds.length) return result;
  const memberIds = (await prisma.companyMember.findMany({ where: { companyId }, select: { userId: true } })).map((m) => m.userId);

  const conversations = await prisma.conversation.findMany({
    where: {
      AND: [
        { members: { some: { userId: { in: memberIds } } } },
        { members: { some: { userId: { in: candidateUserIds } } } },
      ],
    },
    select: {
      members: { select: { userId: true } },
      messages: { select: { senderId: true } },
    },
  });

  for (const c of conversations) {
    const candidate = c.members.find((m) => candidateUserIds.includes(m.userId))?.userId;
    if (!candidate) continue;
    const fromFirm = c.messages.some((m) => memberIds.includes(m.senderId));
    const fromCandidate = c.messages.some((m) => m.senderId === candidate);
    const status: EngagementStatus = fromCandidate && fromFirm ? "REPLIED" : fromFirm ? "CONTACTED" : "NOT_CONTACTED";
    const prev = result.get(candidate);
    if (!prev || RANK[status] > RANK[prev]) result.set(candidate, status);
  }
  return result;
}

/** Applicants to one job (or all the firm's jobs), with their latest AI screening and engagement status. */
export async function pipeline(ctx: RecruiterContext, filters: { jobId?: string; status?: ApplicationStatus }) {
  requireFeature(ctx.state, "candidateEngagement", "Candidate engagement");
  const applications = await prisma.application.findMany({
    where: {
      job: { companyId: ctx.company.id },
      status: filters.status ? filters.status : { notIn: ["SAVED", "WITHDRAWN"] },
      ...(filters.jobId ? { jobId: filters.jobId } : {}),
    },
    include: {
      job: { select: { id: true, title: true } },
      profile: {
        select: {
          id: true,
          currentTitle: true,
          location: true,
          totalExperienceYears: true,
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      },
    },
    orderBy: { appliedAt: "desc" },
    take: 300,
  });

  const accountId = ctx.state.account?.id;
  const screenings = accountId
    ? await prisma.atsScreening.findMany({
        where: {
          accountId,
          candidateProfileId: { in: applications.map((a) => a.profileId) },
          jobId: { in: Array.from(new Set(applications.map((a) => a.jobId))) },
        },
        orderBy: { createdAt: "desc" },
        select: { candidateProfileId: true, jobId: true, score: true, category: true, id: true },
      })
    : [];
  const latest = new Map<string, (typeof screenings)[number]>();
  for (const s of screenings) {
    const key = `${s.candidateProfileId}:${s.jobId}`;
    if (!latest.has(key)) latest.set(key, s);
  }
  const engagement = await engagementStatuses(ctx.company.id, applications.map((a) => a.profile.user.id));

  return applications.map((a) => ({
    applicationId: a.id,
    status: a.status,
    appliedAt: a.appliedAt,
    job: a.job,
    candidate: {
      profileId: a.profile.id,
      userId: a.profile.user.id,
      name: `${a.profile.user.firstName} ${a.profile.user.lastName}`,
      avatarUrl: a.profile.user.avatarUrl,
      currentTitle: a.profile.currentTitle,
      location: a.profile.location,
      totalExperienceYears: a.profile.totalExperienceYears,
    },
    screening: latest.get(`${a.profileId}:${a.jobId}`) ?? null,
    engagement: engagement.get(a.profile.user.id) ?? "NOT_CONTACTED",
  }));
}

export async function moveCandidate(ctx: RecruiterContext, applicationId: string, status: ApplicationStatus, note?: string) {
  requireFeature(ctx.state, "candidateEngagement", "Candidate engagement");
  if (!PIPELINE_STAGES.includes(status)) throw new EnterpriseError("That isn't a stage you can move a candidate to.", "VALIDATION_ERROR");
  return updateApplicationStatusForCompany(ctx.company.id, applicationId, status, note);
}
