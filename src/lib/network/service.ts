import "server-only";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications/service";
import type { ReactionType } from "@prisma/client";

export class NetworkError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

export async function searchPeople(currentUserId: string, query?: string) {
  const candidates = await prisma.candidateProfile.findMany({
    where: {
      userId: { not: currentUserId },
      ...(query
        ? {
            OR: [
              { user: { firstName: { contains: query, mode: "insensitive" } } },
              { user: { lastName: { contains: query, mode: "insensitive" } } },
              { currentTitle: { contains: query, mode: "insensitive" } },
              { headline: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
    take: 30,
  });

  return candidates.map((c) => ({
    userId: c.user.id,
    firstName: c.user.firstName,
    lastName: c.user.lastName,
    avatarUrl: c.user.avatarUrl,
    headline: c.headline,
    currentTitle: c.currentTitle,
    location: c.location,
  }));
}

async function findConnection(userAId: string, userBId: string) {
  return prisma.connection.findFirst({
    where: {
      OR: [
        { requesterId: userAId, recipientId: userBId },
        { requesterId: userBId, recipientId: userAId },
      ],
    },
  });
}

export async function sendConnectionRequest(requesterId: string, recipientId: string) {
  if (requesterId === recipientId) {
    throw new NetworkError("You can't connect with yourself.", "INVALID_TARGET");
  }
  const existing = await findConnection(requesterId, recipientId);
  if (existing) {
    throw new NetworkError("A connection already exists with this person.", "ALREADY_EXISTS");
  }

  const connection = await prisma.connection.create({
    data: { requesterId, recipientId, status: "PENDING" },
  });

  const requester = await prisma.user.findUniqueOrThrow({ where: { id: requesterId } });
  await createNotification({
    userId: recipientId,
    type: "CONNECTION_REQUEST",
    title: `${requester.firstName} ${requester.lastName} wants to connect`,
    linkUrl: "/network",
  });

  return connection;
}

export async function respondToConnectionRequest(userId: string, connectionId: string, accept: boolean) {
  const connection = await prisma.connection.findUnique({ where: { id: connectionId } });
  if (!connection || connection.recipientId !== userId) {
    throw new NetworkError("This connection request could not be found.", "NOT_FOUND");
  }

  const updated = await prisma.connection.update({
    where: { id: connectionId },
    data: { status: accept ? "ACCEPTED" : "DECLINED", respondedAt: new Date() },
  });

  if (accept) {
    const recipient = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    await createNotification({
      userId: connection.requesterId,
      type: "CONNECTION_ACCEPTED",
      title: `${recipient.firstName} ${recipient.lastName} accepted your connection request`,
      linkUrl: "/network",
    });
  }

  return updated;
}

export async function listConnections(userId: string) {
  const [incoming, outgoing, accepted] = await Promise.all([
    prisma.connection.findMany({
      where: { recipientId: userId, status: "PENDING" },
      include: { requester: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.connection.findMany({
      where: { requesterId: userId, status: "PENDING" },
      include: { recipient: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.connection.findMany({
      where: { OR: [{ requesterId: userId }, { recipientId: userId }], status: "ACCEPTED" },
      include: {
        requester: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        recipient: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
      orderBy: { respondedAt: "desc" },
    }),
  ]);

  return {
    incoming,
    outgoing,
    accepted: accepted.map((c) => (c.requesterId === userId ? c.recipient : c.requester)),
  };
}

async function areConnected(userAId: string, userBId: string) {
  const connection = await findConnection(userAId, userBId);
  return connection?.status === "ACCEPTED";
}

const POST_AUTHOR_SELECT = { select: { id: true, firstName: true, lastName: true, avatarUrl: true } };

const POST_INCLUDE = {
  author: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      // For hiring announcements: the company the author posts for.
      companyMemberships: { select: { company: { select: { name: true, slug: true } } }, take: 1 },
    },
  },
  reactions: true,
  comments: {
    include: { author: POST_AUTHOR_SELECT },
    orderBy: { createdAt: "asc" as const },
  },
  circle: { select: { slug: true, name: true } },
  job: { select: { id: true, title: true, location: true, workplaceType: true, company: { select: { name: true, slug: true, logoUrl: true } } } },
  repostOf: {
    include: {
      author: POST_AUTHOR_SELECT,
      job: {
        select: { id: true, title: true, location: true, workplaceType: true, company: { select: { name: true, slug: true, logoUrl: true } } },
      },
    },
  },
  _count: { select: { reposts: true } },
};

export async function createPost(
  authorId: string,
  content: string,
  options?: { circleId?: string; jobId?: string; imageUrl?: string; videoUrl?: string; repostOfId?: string }
) {
  if (options?.circleId) {
    const membership = await prisma.circleMember.findUnique({
      where: { circleId_userId: { circleId: options.circleId, userId: authorId } },
    });
    if (!membership) throw new NetworkError("Join this circle before posting in it.", "NOT_A_MEMBER");
  }
  if (options?.repostOfId) {
    const original = await prisma.post.findUnique({ where: { id: options.repostOfId }, select: { id: true, repostOfId: true } });
    if (!original) throw new NetworkError("This post could not be found.", "NOT_FOUND");
    // Repost the original, not the repost, so a chain never nests more than one deep.
    options = { ...options, repostOfId: original.repostOfId ?? original.id };
  }
  return prisma.post.create({
    data: {
      authorId,
      content,
      circleId: options?.circleId,
      jobId: options?.jobId,
      imageUrl: options?.imageUrl,
      videoUrl: options?.videoUrl,
      repostOfId: options?.repostOfId,
    },
    include: POST_INCLUDE,
  });
}

/** A single post by ID — for permalinks (the "share a link" feature). Visible
    to the author, to anyone if it's a general-feed post, or to circle
    members if it's scoped to a circle. */
export async function getPost(userId: string, postId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId, deletedAt: null }, include: POST_INCLUDE });
  if (!post) throw new NetworkError("This post could not be found.", "NOT_FOUND");
  if (post.circleId && post.authorId !== userId) {
    const membership = await prisma.circleMember.findUnique({
      where: { circleId_userId: { circleId: post.circleId, userId } },
    });
    if (!membership) throw new NetworkError("This post isn't visible to you.", "NOT_VISIBLE");
  }
  return post;
}

type PostRow = Awaited<ReturnType<typeof prisma.post.findMany<{ include: typeof POST_INCLUDE }>>>[number];

/** Adds the company behind a hiring announcement and whether it's a paid/free boost. */
function shapePost(p: PostRow, promoted = false) {
  const { companyMemberships, ...author } = p.author;
  return {
    ...p,
    author,
    company: p.kind === "JOB_ANNOUNCEMENT" ? companyMemberships[0]?.company ?? null : null,
    promoted,
  };
}

/**
 * Feed = the user's own posts, posts from accepted connections, and hiring
 * posts from companies they follow — general feed only (no circle-scoped
 * posts; those live inside their Circle). Announcements a company boosted
 * are pinned on top for everyone, labelled Promoted.
 */
export async function getFeed(userId: string) {
  const now = new Date();
  const [connections, followedCompanies, boosts] = await Promise.all([
    listConnections(userId),
    listFollowedCompanies(userId),
    prisma.boost.findMany({
      where: { kind: "POST", postId: { not: null }, startsAt: { lte: now }, endsAt: { gt: now } },
      select: { postId: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);
  const connectionIds = connections.accepted.map((c) => c.id);
  const companyIds = followedCompanies.map((c) => c.id);
  const promotedIds = boosts.map((b) => b.postId!);

  const [promoted, regular] = await Promise.all([
    promotedIds.length ? prisma.post.findMany({ where: { id: { in: promotedIds }, deletedAt: null }, include: POST_INCLUDE }) : [],
    prisma.post.findMany({
      where: {
        deletedAt: null,
        circleId: null,
        id: { notIn: promotedIds },
        OR: [
          { authorId: { in: [userId, ...connectionIds] } },
          ...(companyIds.length
            ? [
                { job: { companyId: { in: companyIds } } },
                { kind: "JOB_ANNOUNCEMENT" as const, author: { companyMemberships: { some: { companyId: { in: companyIds } } } } },
              ]
            : []),
        ],
      },
      include: POST_INCLUDE,
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);
  promoted.sort((a, b) => promotedIds.indexOf(a.id) - promotedIds.indexOf(b.id));
  return [...promoted.map((p) => shapePost(p, true)), ...regular.map((p) => shapePost(p))];
}

/** Clicking the same reaction again removes it; clicking a different one
    switches it — mirrors how every social feed's reaction picker behaves. */
export async function toggleReaction(userId: string, postId: string, type: ReactionType = "LIKE") {
  const existing = await prisma.reaction.findUnique({ where: { postId_userId: { postId, userId } } });
  if (existing) {
    if (existing.type === type) {
      await prisma.reaction.delete({ where: { id: existing.id } });
      return null;
    }
    await prisma.reaction.update({ where: { id: existing.id }, data: { type } });
    return type;
  }
  await prisma.reaction.create({ data: { postId, userId, type } });
  return type;
}

export async function addComment(userId: string, postId: string, content: string) {
  return prisma.comment.create({
    data: { postId, authorId: userId, content },
    include: { author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
  });
}

// ============================================================
// CIRCLES — topic communities candidates can join and post in
// ============================================================

export async function listCircles(userId: string) {
  const circles = await prisma.circle.findMany({
    include: { _count: { select: { members: true } }, members: { where: { userId }, select: { userId: true } } },
    orderBy: { name: "asc" },
  });
  return circles.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    category: c.category,
    memberCount: c._count.members,
    isMember: c.members.length > 0,
  }));
}

export async function getCircle(userId: string, slug: string) {
  const circle = await prisma.circle.findUnique({ where: { slug }, include: { _count: { select: { members: true } } } });
  if (!circle) throw new NetworkError("This circle could not be found.", "NOT_FOUND");
  const membership = await prisma.circleMember.findUnique({ where: { circleId_userId: { circleId: circle.id, userId } } });

  const posts = await prisma.post.findMany({
    where: { circleId: circle.id, deletedAt: null },
    include: POST_INCLUDE,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return {
    id: circle.id,
    slug: circle.slug,
    name: circle.name,
    description: circle.description,
    category: circle.category,
    memberCount: circle._count.members,
    isMember: Boolean(membership),
    posts,
  };
}

export async function joinCircle(userId: string, slug: string) {
  const circle = await prisma.circle.findUnique({ where: { slug } });
  if (!circle) throw new NetworkError("This circle could not be found.", "NOT_FOUND");
  await prisma.circleMember.upsert({
    where: { circleId_userId: { circleId: circle.id, userId } },
    update: {},
    create: { circleId: circle.id, userId },
  });
}

export async function leaveCircle(userId: string, slug: string) {
  const circle = await prisma.circle.findUnique({ where: { slug } });
  if (!circle) throw new NetworkError("This circle could not be found.", "NOT_FOUND");
  await prisma.circleMember.deleteMany({ where: { circleId: circle.id, userId } });
}

// ============================================================
// COMPANY FOLLOWING
// ============================================================

export async function followCompany(userId: string, companyId: string) {
  await prisma.companyFollower.upsert({
    where: { companyId_userId: { companyId, userId } },
    update: {},
    create: { companyId, userId },
  });
}

export async function unfollowCompany(userId: string, companyId: string) {
  await prisma.companyFollower.deleteMany({ where: { companyId, userId } });
}

export async function listFollowedCompanies(userId: string) {
  const follows = await prisma.companyFollower.findMany({
    where: { userId },
    include: { company: { select: { id: true, slug: true, name: true, logoUrl: true, industry: true } } },
    orderBy: { createdAt: "desc" },
  });
  return follows.map((f) => f.company);
}

// ============================================================
// PUBLIC PROFILES
// ============================================================

/**
 * A candidate's profile as another candidate is allowed to see it — never
 * exposes email, applications, resumes, or anything beyond what the
 * candidate has chosen to share. PUBLIC visibility is open to any signed-in
 * user; anything more restrictive is limited to the owner or an accepted
 * connection, mirroring how Career Circles' connection model already works.
 */
export async function getPublicProfile(viewerId: string, targetUserId: string) {
  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: targetUserId },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      experiences: { orderBy: { startDate: "desc" }, take: 8 },
      education: { orderBy: { startDate: "desc" }, take: 5 },
      skills: { include: { skill: true }, take: 20 },
      certifications: { orderBy: { issueDate: "desc" }, take: 10 },
      languages: true,
    },
  });
  if (!profile) throw new NetworkError("This profile could not be found.", "NOT_FOUND");

  const isOwner = viewerId === targetUserId;
  const canView = isOwner || profile.visibility === "PUBLIC" || (await areConnected(viewerId, targetUserId));
  if (!canView) throw new NetworkError("This profile isn't visible to you.", "NOT_VISIBLE");

  const connection = isOwner ? null : await findConnection(viewerId, targetUserId);

  return {
    userId: profile.user.id,
    firstName: profile.user.firstName,
    lastName: profile.user.lastName,
    avatarUrl: profile.user.avatarUrl,
    coverUrl: profile.coverUrl,
    headline: profile.headline,
    bio: profile.bio,
    location: profile.location,
    currentTitle: profile.currentTitle,
    currentCompany: profile.currentCompany,
    careerLevel: profile.careerLevel,
    totalExperienceYears: profile.totalExperienceYears,
    experiences: profile.experiences.map((e) => ({
      title: e.title,
      company: e.company,
      location: e.location,
      startDate: e.startDate,
      endDate: e.endDate,
      isCurrent: e.isCurrent,
      description: e.description,
    })),
    education: profile.education.map((e) => ({
      school: e.school,
      degree: e.degree,
      fieldOfStudy: e.fieldOfStudy,
      endDate: e.endDate,
    })),
    skills: profile.skills.map((s) => s.skill.name),
    certifications: profile.certifications.map((c) => ({
      name: c.name,
      issuer: c.issuer,
      issueDate: c.issueDate,
      credentialUrl: c.credentialUrl,
    })),
    languages: profile.languages.map((l) => ({ language: l.language, proficiency: l.proficiency })),
    linkedinUrl: profile.linkedinUrl,
    githubUrl: profile.githubUrl,
    portfolioUrl: profile.portfolioUrl,
    isOwner,
    connectionStatus: isOwner ? null : connection?.status ?? null,
  };
}

export { areConnected };
