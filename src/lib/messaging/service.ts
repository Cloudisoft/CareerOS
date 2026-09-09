import "server-only";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications/service";
import { areConnected } from "@/lib/network/service";

export class MessagingError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

export async function listConversations(userId: string) {
  const memberships = await prisma.conversationMember.findMany({
    where: { userId },
    include: {
      conversation: {
        include: {
          members: { include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } } },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
    orderBy: { conversation: { updatedAt: "desc" } },
  });

  return memberships.map((m) => {
    const otherMembers = m.conversation.members.filter((mem) => mem.userId !== userId);
    return {
      id: m.conversation.id,
      updatedAt: m.conversation.updatedAt,
      lastMessage: m.conversation.messages[0] ?? null,
      lastReadAt: m.lastReadAt,
      participants: otherMembers.map((mem) => mem.user),
    };
  });
}

export async function getOrCreateConversation(userId: string, otherUserId: string) {
  if (userId === otherUserId) {
    throw new MessagingError("You can't message yourself.", "INVALID_TARGET");
  }
  const connected = await areConnected(userId, otherUserId);
  if (!connected) {
    throw new MessagingError("You can only message people you're connected with.", "NOT_CONNECTED");
  }

  const existing = await prisma.conversation.findFirst({
    where: {
      members: { some: { userId } },
      AND: { members: { some: { userId: otherUserId } } },
    },
    include: { members: true },
  });
  // Only reuse a conversation that is exactly these two members (no group chats yet).
  const exact = existing && existing.members.length === 2 ? existing : null;
  if (exact) return exact;

  return prisma.conversation.create({
    data: {
      members: { create: [{ userId }, { userId: otherUserId }] },
    },
    include: { members: true },
  });
}

export async function getMessages(userId: string, conversationId: string) {
  const membership = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!membership) throw new MessagingError("This conversation could not be found.", "NOT_FOUND");

  const messages = await prisma.message.findMany({
    where: { conversationId },
    include: { sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
    orderBy: { createdAt: "asc" },
  });

  await prisma.conversationMember.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { lastReadAt: new Date() },
  });

  return messages;
}

export async function sendMessage(userId: string, conversationId: string, content: string) {
  const membership = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!membership) throw new MessagingError("This conversation could not be found.", "NOT_FOUND");

  const message = await prisma.message.create({
    data: { conversationId, senderId: userId, content },
    include: { sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
  });

  await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

  const otherMembers = await prisma.conversationMember.findMany({
    where: { conversationId, userId: { not: userId } },
  });
  for (const member of otherMembers) {
    await createNotification({
      userId: member.userId,
      type: "MESSAGE",
      title: `New message from ${message.sender.firstName} ${message.sender.lastName}`,
      body: content.slice(0, 140),
      linkUrl: "/messages",
    });
  }

  return message;
}
