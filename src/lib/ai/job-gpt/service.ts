import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateChatStream, type ChatMessage } from "@/lib/ai/gateway";
import { buildCareerContext } from "@/lib/ai/job-gpt/context";

const SYSTEM_PROMPT = `You are Job GPT, the career copilot inside Career OS.
You help one candidate with their job search: matching, resumes, applications, interview prep, and career strategy.

Rules you never break:
- Never invent employers, dates, degrees, certifications, applications, or numbers that aren't in the CareerContext you're given. If you don't know, say so and ask.
- Ground every answer in the candidate's actual CareerContext (below), not generic advice.
- Be direct and specific. No filler openings, no "I'd be happy to help" — just help.
- Keep answers focused; use short paragraphs or a few bullets, not long essays, unless the candidate asks for depth.`;

/** Elite's "Executive Career Coaching" — same real Job GPT, an executive-level coaching frame. */
const EXECUTIVE_COACHING_PROMPT =
  "\n\nThis candidate is on Career OS Elite: frame advice as executive career coaching — organizational impact, board/investor narrative, and executive positioning, not entry-level job-search tactics.";

export class JobGptError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

export async function listConversations(userId: string, take?: number) {
  return prisma.aiConversation.findMany({
    where: { userId, kind: "JOB_GPT" },
    orderBy: { updatedAt: "desc" },
    ...(take ? { take } : {}),
  });
}

function startOfMonthUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** For enforcing jobGptMonthlyMessageLimit — counts this user's own messages, not the AI's replies. */
export async function countMonthlyUserMessages(userId: string) {
  return prisma.aiMessage.count({
    where: {
      role: "USER",
      conversation: { userId, kind: "JOB_GPT" },
      createdAt: { gte: startOfMonthUtc() },
    },
  });
}

export async function createConversation(userId: string) {
  return prisma.aiConversation.create({ data: { userId, kind: "JOB_GPT" } });
}

export async function getConversation(userId: string, conversationId: string) {
  const conversation = await prisma.aiConversation.findUnique({
    where: { id: conversationId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation || conversation.userId !== userId) {
    throw new JobGptError("This conversation could not be found.", "NOT_FOUND");
  }
  return conversation;
}

export async function deleteConversation(userId: string, conversationId: string) {
  const conversation = await prisma.aiConversation.findUnique({ where: { id: conversationId } });
  if (!conversation || conversation.userId !== userId) {
    throw new JobGptError("This conversation could not be found.", "NOT_FOUND");
  }
  await prisma.aiConversation.delete({ where: { id: conversationId } });
}

/**
 * Streams the assistant's reply back as Server-Sent Events instead of
 * waiting for the full response — reasoning models can take a while to
 * generate a complete answer, and showing it appear incrementally is both
 * faster to the first visible word and doesn't feel stuck the way a long
 * silent wait does. The SSE payloads are `{delta}` per chunk, then either
 * `{done: true, id}` or `{error}` as the terminal event.
 */
export async function sendMessageStream(
  userId: string,
  conversationId: string,
  text: string,
  executiveMode = false
): Promise<ReadableStream<Uint8Array>> {
  const conversation = await getConversation(userId, conversationId);
  const careerContext = await buildCareerContext(userId);

  await prisma.aiMessage.create({ data: { conversationId, role: "USER", content: text } });

  const history: ChatMessage[] = [
    ...conversation.messages.map((m) => ({
      role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    })),
    { role: "user" as const, content: text },
  ];

  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      function send(event: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      }

      let replyText: string;
      let provider: string;
      try {
        ({ text: replyText, provider } = await generateChatStream(
          {
            system: `${SYSTEM_PROMPT}${executiveMode ? EXECUTIVE_COACHING_PROMPT : ""}\n\nCareerContext for this candidate:\n${careerContext}`,
            messages: history,
            maxTokens: 1024,
          },
          (chunk) => send({ delta: chunk })
        ));
      } catch (error) {
        send({ error: error instanceof Error ? error.message : "Something went wrong. Please try again." });
        controller.close();
        return;
      }

      // The AI call above can take a while, and in that window the user may
      // delete this conversation from the sidebar. Without this guard,
      // saving the reply then fails an unhandled foreign-key error — this
      // turns that into a clear, expected "it was deleted" outcome instead.
      try {
        const assistantMessage = await prisma.aiMessage.create({
          data: { conversationId, role: "ASSISTANT", content: replyText },
        });

        await prisma.aiConversation.update({
          where: { id: conversationId },
          data: {
            updatedAt: new Date(),
            ...(conversation.title ? {} : { title: text.slice(0, 60) }),
          },
        });

        await prisma.aiUsage.create({ data: { userId, feature: "job_gpt", provider } });

        send({ done: true, id: assistantMessage.id });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2003" || error.code === "P2025")) {
          send({ error: "This conversation was deleted before the reply could be saved." });
        } else {
          send({ error: "Something went wrong saving the reply. Please try again." });
        }
      } finally {
        controller.close();
      }
    },
  });
}
