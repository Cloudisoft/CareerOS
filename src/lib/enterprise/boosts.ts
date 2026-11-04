import "server-only";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import type { BoostKind, BoostOrder, Prisma } from "@prisma/client";
import { EnterpriseError, consumeCredit, requireFeature, type RecruiterContext } from "./account";
import { BOOST_DAYS } from "./plans";

/**
 * Job announcements (unlimited feed posts for paid firms) and boosts:
 *  - a POST boost pins one announcement to the top of every member's feed
 *    for BOOST_DAYS.POST days;
 *  - a CAMPAIGN boost promotes up to 10 of the firm's open jobs to the top
 *    of job search, labelled "Promoted", for BOOST_DAYS.CAMPAIGN days.
 * Boosts come from the plan's free allowance (credits) or a confirmed
 * PayPal payment — never anything else.
 */

const DAY = 24 * 60 * 60 * 1000;

async function firmMemberIds(companyId: string) {
  return (await prisma.companyMember.findMany({ where: { companyId }, select: { userId: true } })).map((m) => m.userId);
}

// ------------------------------------------------------------ announcements

export async function createAnnouncement(ctx: RecruiterContext, content: string) {
  requireFeature(ctx.state, "jobAnnouncements", "Job announcements");
  const limit = rateLimit(`announce:${ctx.user.id}`, 30, 60 * 60 * 1000);
  if (!limit.allowed) throw new EnterpriseError("You've posted a lot this hour. Try again shortly.", "RATE_LIMITED");
  return prisma.post.create({ data: { authorId: ctx.user.id, content, kind: "JOB_ANNOUNCEMENT" } });
}

export async function listAnnouncements(ctx: RecruiterContext) {
  const members = await firmMemberIds(ctx.company.id);
  const now = new Date();
  const posts = await prisma.post.findMany({
    where: { authorId: { in: members }, kind: "JOB_ANNOUNCEMENT", deletedAt: null },
    include: {
      author: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { reactions: true, comments: true } },
      boosts: { where: { endsAt: { gt: now } }, select: { id: true, endsAt: true, source: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return posts.map((p) => ({
    id: p.id,
    content: p.content,
    createdAt: p.createdAt,
    author: `${p.author.firstName} ${p.author.lastName}`,
    reactions: p._count.reactions,
    comments: p._count.comments,
    activeBoost: p.boosts[0] ?? null,
  }));
}

export async function deleteAnnouncement(ctx: RecruiterContext, postId: string) {
  const members = await firmMemberIds(ctx.company.id);
  const res = await prisma.post.updateMany({
    where: { id: postId, authorId: { in: members }, kind: "JOB_ANNOUNCEMENT", deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (!res.count) throw new EnterpriseError("This announcement could not be found.", "NOT_FOUND");
}

// ------------------------------------------------------------ boost targets

export type BoostPayload = { postId: string } | { name: string; jobIds: string[] };

/** Validates what a boost will promote. Shared by free boosts and paid checkout, so both enforce the same rules. */
export async function validateBoostTarget(
  db: Prisma.TransactionClient | typeof prisma,
  companyId: string,
  kind: BoostKind,
  payload: BoostPayload
): Promise<BoostPayload> {
  if (kind === "POST") {
    if (!("postId" in payload) || !payload.postId) throw new EnterpriseError("Choose an announcement to boost.", "VALIDATION_ERROR");
    const members = await firmMemberIds(companyId);
    const post = await db.post.findFirst({
      where: { id: payload.postId, authorId: { in: members }, kind: "JOB_ANNOUNCEMENT", deletedAt: null },
    });
    if (!post) throw new EnterpriseError("This announcement could not be found.", "NOT_FOUND");
    const active = await db.boost.count({ where: { postId: post.id, endsAt: { gt: new Date() } } });
    if (active) throw new EnterpriseError("This announcement is already boosted.", "CONFLICT");
    return { postId: post.id };
  }
  if (!("jobIds" in payload)) throw new EnterpriseError("Choose the jobs for this campaign.", "VALIDATION_ERROR");
  const name = payload.name.trim().slice(0, 80);
  if (!name) throw new EnterpriseError("Give the campaign a name.", "VALIDATION_ERROR");
  const ids = Array.from(new Set(payload.jobIds)).slice(0, 10);
  if (!ids.length) throw new EnterpriseError("Choose at least one open job for this campaign.", "VALIDATION_ERROR");
  const jobs = await db.job.findMany({ where: { id: { in: ids }, companyId, status: "OPEN", deletedAt: null }, select: { id: true } });
  if (jobs.length !== ids.length) throw new EnterpriseError("Campaigns can only include your company's open jobs.", "VALIDATION_ERROR");
  return { name, jobIds: ids };
}

async function insertBoost(
  tx: Prisma.TransactionClient,
  accountId: string,
  kind: BoostKind,
  source: "FREE" | "PAID",
  payload: BoostPayload,
  createdById: string
) {
  const now = new Date();
  return tx.boost.create({
    data: {
      accountId,
      kind,
      source,
      createdById,
      startsAt: now,
      endsAt: new Date(now.getTime() + BOOST_DAYS[kind] * DAY),
      ...("postId" in payload ? { postId: payload.postId } : { name: payload.name, jobIds: payload.jobIds }),
    },
  });
}

/** Uses one of the plan's free boosts. Idempotent per requestId. */
export async function createFreeBoost(ctx: RecruiterContext, kind: BoostKind, payload: BoostPayload, requestId: string) {
  requireFeature(ctx.state, kind === "POST" ? "freePostBoosts" : "freeCampaignBoosts", kind === "POST" ? "Free post boosts" : "Free campaign boosts");
  const target = await validateBoostTarget(prisma, ctx.company.id, kind, payload);
  const { result } = await consumeCredit(
    ctx.state,
    kind === "POST" ? "POST_BOOST" : "CAMPAIGN_BOOST",
    `boost:${requestId}`,
    { actorUserId: ctx.user.id, note: kind === "POST" ? "Free post boost" : "Free campaign boost" },
    async (tx) => {
      const existing = await tx.creditTransaction.findFirst({
        where: { accountId: ctx.state.account!.id, refKey: `${ctx.state.periodKey}:boost:${requestId}`, boostId: { not: null } },
      });
      if (existing?.boostId) return tx.boost.findUniqueOrThrow({ where: { id: existing.boostId } });
      // Re-validated under the account lock: two clicks can't boost one post twice.
      await validateBoostTarget(tx, ctx.company.id, kind, target);
      const boost = await insertBoost(tx, ctx.state.account!.id, kind, "FREE", target, ctx.user.id);
      await tx.creditTransaction.updateMany({
        where: { accountId: ctx.state.account!.id, refKey: `${ctx.state.periodKey}:boost:${requestId}` },
        data: { boostId: boost.id },
      });
      return boost;
    }
  );
  return result!;
}

/** Creates the boost a captured PayPal order paid for. Called once, inside the capture transaction. */
export async function createPaidBoost(tx: Prisma.TransactionClient, order: BoostOrder) {
  const account = await tx.enterpriseAccount.findUniqueOrThrow({ where: { id: order.accountId } });
  const payload = order.payload as unknown as BoostPayload;
  // If the post was deleted or already boosted in the meantime, the payment still
  // buys a boost: extend an active one rather than lose what was paid for.
  if (order.kind === "POST" && "postId" in payload) {
    const active = await tx.boost.findFirst({ where: { postId: payload.postId, endsAt: { gt: new Date() } }, orderBy: { endsAt: "desc" } });
    if (active) {
      return tx.boost.update({ where: { id: active.id }, data: { endsAt: new Date(active.endsAt.getTime() + BOOST_DAYS.POST * DAY) } });
    }
  }
  return insertBoost(tx, account.id, order.kind, "PAID", payload, order.createdById);
}

export async function listBoosts(ctx: RecruiterContext) {
  if (!ctx.state.account) return [];
  const boosts = await prisma.boost.findMany({
    where: { accountId: ctx.state.account.id },
    include: { post: { select: { id: true, content: true } }, order: { select: { amountCents: true, status: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const jobIds = Array.from(new Set(boosts.flatMap((b) => b.jobIds)));
  const jobs = await prisma.job.findMany({ where: { id: { in: jobIds } }, select: { id: true, title: true } });
  const now = new Date();
  return boosts.map((b) => ({
    id: b.id,
    kind: b.kind,
    source: b.source,
    name: b.name,
    post: b.post ? { id: b.post.id, excerpt: b.post.content.slice(0, 140) } : null,
    jobs: b.jobIds.map((id) => jobs.find((j) => j.id === id) ?? { id, title: "Removed job" }),
    startsAt: b.startsAt,
    endsAt: b.endsAt,
    active: b.endsAt > now,
    amountCents: b.order?.amountCents ?? null,
  }));
}

// ------------------------------------------------------------ public reads

export async function activeBoostedPostIds() {
  const boosts = await prisma.boost.findMany({
    where: { kind: "POST", postId: { not: null }, startsAt: { lte: new Date() }, endsAt: { gt: new Date() } },
    select: { postId: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return boosts.map((b) => b.postId!);
}

export async function activeCampaignJobIds() {
  const boosts = await prisma.boost.findMany({
    where: { kind: "CAMPAIGN", startsAt: { lte: new Date() }, endsAt: { gt: new Date() } },
    select: { jobIds: true },
    orderBy: { createdAt: "desc" },
  });
  return Array.from(new Set(boosts.flatMap((b) => b.jobIds)));
}
