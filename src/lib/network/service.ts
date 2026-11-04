import "server-only";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications/service";

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

export async function createPost(authorId: string, content: string) {
  return prisma.post.create({ data: { authorId, content } });
}

const POST_INCLUDE = {
  author: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      companyMemberships: { select: { company: { select: { name: true, slug: true } } }, take: 1 },
    },
  },
  reactions: true,
  comments: {
    include: { author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
    orderBy: { createdAt: "asc" as const },
  },
};

/**
 * Feed = the author's own posts plus posts from their accepted connections,
 * plus job announcements from companies they follow. Announcements a
 * company paid to boost are pinned on top for everyone, labelled Promoted.
 */
export async function getFeed(userId: string) {
  const connections = await listConnections(userId);
  const connectionIds = connections.accepted.map((c) => c.id);
  const now = new Date();

  const [boosts, followed] = await Promise.all([
    prisma.boost.findMany({
      where: { kind: "POST", postId: { not: null }, startsAt: { lte: now }, endsAt: { gt: now } },
      select: { postId: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.companyFollower.findMany({ where: { userId }, select: { companyId: true } }),
  ]);
  const promotedIds = boosts.map((b) => b.postId!);

  const [promoted, regular] = await Promise.all([
    promotedIds.length
      ? prisma.post.findMany({ where: { id: { in: promotedIds }, deletedAt: null }, include: POST_INCLUDE })
      : [],
    prisma.post.findMany({
      where: {
        deletedAt: null,
        id: { notIn: promotedIds },
        OR: [
          { authorId: { in: [userId, ...connectionIds] } },
          ...(followed.length
            ? [{ kind: "JOB_ANNOUNCEMENT" as const, author: { companyMemberships: { some: { companyId: { in: followed.map((f) => f.companyId) } } } } }]
            : []),
        ],
      },
      include: POST_INCLUDE,
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const shape = (p: (typeof regular)[number], isPromoted: boolean) => {
    const { companyMemberships, ...author } = p.author;
    return {
      ...p,
      author,
      company: p.kind === "JOB_ANNOUNCEMENT" ? companyMemberships[0]?.company ?? null : null,
      promoted: isPromoted,
    };
  };
  promoted.sort((a, b) => promotedIds.indexOf(a.id) - promotedIds.indexOf(b.id));
  return [...promoted.map((p) => shape(p, true)), ...regular.map((p) => shape(p, false))];
}

export async function toggleReaction(userId: string, postId: string) {
  const existing = await prisma.reaction.findUnique({ where: { postId_userId: { postId, userId } } });
  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
    return false;
  }
  await prisma.reaction.create({ data: { postId, userId } });
  return true;
}

export async function addComment(userId: string, postId: string, content: string) {
  return prisma.comment.create({
    data: { postId, authorId: userId, content },
    include: { author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
  });
}

export { areConnected };
