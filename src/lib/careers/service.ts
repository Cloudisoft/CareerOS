import "server-only";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

/**
 * Career OS Careers — the centralized public job board.
 *
 * Only users listed in CareersPublisher may create, edit or remove
 * listings. That list is managed by platform admins (Admin → Careers
 * publishers); no user id is hard-coded anywhere.
 *
 * A listing's apply URL never leaves the server: public reads select only
 * id/title/description/date, and "Apply Now" goes through
 * /careers/apply/[id], which looks the URL up and redirects.
 */

export class CareersError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

/** Returns a normalized http(s) URL or throws. Rejects javascript:, data:, credentials and non-web schemes. */
export function validateApplyUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new CareersError("Enter a full job link starting with https://", "VALIDATION_ERROR");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new CareersError("Job links must start with https:// or http://", "VALIDATION_ERROR");
  }
  if (url.username || url.password) throw new CareersError("Job links can't contain a username or password.", "VALIDATION_ERROR");
  if (!url.hostname.includes(".")) throw new CareersError("Enter a public job link.", "VALIDATION_ERROR");
  return url.toString();
}

export async function isCareersPublisher(userId: string) {
  return Boolean(await prisma.careersPublisher.findUnique({ where: { userId } }));
}

export async function requireCareersPublisher() {
  const user = await getSessionUser();
  if (!user) throw new CareersError("Not authenticated", "UNAUTHENTICATED");
  if (!(await isCareersPublisher(user.id))) {
    throw new CareersError("Only authorized Career OS Careers publishers can manage these listings.", "FORBIDDEN");
  }
  return user;
}

const PUBLIC_SELECT = { id: true, title: true, description: true, createdAt: true } as const;

export async function listPublicListings(q?: string) {
  return prisma.careersListing.findMany({
    where: {
      published: true,
      deletedAt: null,
      ...(q
        ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] }
        : {}),
    },
    select: PUBLIC_SELECT,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function getPublicListing(id: string) {
  return prisma.careersListing.findFirst({ where: { id, published: true, deletedAt: null }, select: PUBLIC_SELECT });
}

/** Server-side only: the destination for the Apply Now redirect. */
export async function applyUrlFor(id: string) {
  const listing = await prisma.careersListing.findFirst({ where: { id, published: true, deletedAt: null }, select: { applyUrl: true } });
  return listing?.applyUrl ?? null;
}

/** Publisher view — includes the apply URL, which only publishers ever see. */
export async function listAllListings() {
  return prisma.careersListing.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 500 });
}

export async function createListing(userId: string, input: { title: string; description: string; applyUrl: string; published?: boolean }) {
  return prisma.careersListing.create({
    data: {
      title: input.title,
      description: input.description,
      applyUrl: validateApplyUrl(input.applyUrl),
      published: input.published ?? true,
      createdById: userId,
    },
  });
}

export async function updateListing(id: string, input: { title?: string; description?: string; applyUrl?: string; published?: boolean }) {
  const existing = await prisma.careersListing.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new CareersError("This listing could not be found.", "NOT_FOUND");
  return prisma.careersListing.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.applyUrl !== undefined ? { applyUrl: validateApplyUrl(input.applyUrl) } : {}),
      ...(input.published !== undefined ? { published: input.published } : {}),
    },
  });
}

export async function deleteListing(id: string) {
  const res = await prisma.careersListing.updateMany({ where: { id, deletedAt: null }, data: { deletedAt: new Date(), published: false } });
  if (!res.count) throw new CareersError("This listing could not be found.", "NOT_FOUND");
}

// ---------------------------------------------------------------- admin

export async function listPublishers() {
  return prisma.careersPublisher.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          companyMemberships: { select: { role: true, company: { select: { name: true } } }, take: 1 },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function grantPublisher(adminId: string, email: string) {
  const user = await prisma.user.findFirst({ where: { email: { equals: email.trim(), mode: "insensitive" }, deletedAt: null } });
  if (!user) throw new CareersError("No Career OS account uses that email.", "NOT_FOUND");
  return prisma.careersPublisher.upsert({
    where: { userId: user.id },
    create: { userId: user.id, grantedById: adminId },
    update: {},
    include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
  });
}

export async function revokePublisher(userId: string) {
  await prisma.careersPublisher.deleteMany({ where: { userId } });
}
