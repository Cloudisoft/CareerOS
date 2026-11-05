import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BadgeCheck, Bot, Globe2, Rocket, Wallet } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { AI_WORK_CATEGORIES, MICRO1_OPPORTUNITIES_URL, applyUrlFor, getReferralUrl, listRoles, skillMatch } from "@/lib/ai-work/service";
import { payLabel } from "@/lib/jobs/display";
import { Micro1Logo } from "@/components/marketing/micro1-logo";
import { RoleBoard, type BoardRole } from "@/components/ai-work/role-board";

export const metadata: Metadata = { title: "AI Work" };

const STEPS = [
  { icon: Rocket, title: "Pick a role", body: "Choose work that matches what you already know: code, finance, medicine, law, languages and more." },
  { icon: Bot, title: "Take the AI interview", body: "micro1's AI interviewer talks with you for 20–40 minutes about your field. Practise here first." },
  { icon: BadgeCheck, title: "Get onboarded", body: "Pass, finish onboarding and you're matched to projects. Some roles add a short skills test." },
  { icon: Wallet, title: "Get paid by micro1", body: "Work remotely on your own schedule at the hourly rate shown. micro1 pays you directly." },
];

// micro1's published list of places it can't hire from (micro1.ai/experts FAQ).
const NOT_ELIGIBLE =
  "Afghanistan, Belarus, China, Cuba, Democratic Republic of the Congo, Ethiopia, Hong Kong, Iran, Iraq, Libya, Macao, Myanmar, North Korea, Russia, Somalia, South Sudan, Sudan, Syria, Ukraine, Venezuela and Yemen";

const FAQ = [
  {
    q: "What is AI training work?",
    a: "AI labs need people with real expertise to write, check and rate answers so their models get better. You use what you already know; no AI background is needed.",
  },
  {
    q: "Who pays me?",
    a: "micro1 hires and pays you directly at the hourly rate on the role. Career OS lists the roles and helps you prepare; no money moves through Career OS.",
  },
  {
    q: "Can I do this alongside a job or studies?",
    a: "Yes. The work is remote with flexible hours. Students and people on work visas should check their visa terms allow freelance or contract work before taking a role.",
  },
  {
    q: "Does passing the interview guarantee work?",
    a: "No. Passing makes you eligible for projects; micro1 assigns work as projects open in your field.",
  },
];

export default async function AiWorkPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/ai-work");

  const [roles, referralUrl, mySkills] = await Promise.all([
    listRoles(),
    getReferralUrl(),
    user.role === "CANDIDATE"
      ? prisma.candidateSkill.findMany({ where: { profile: { userId: user.id } }, select: { skill: { select: { name: true } } } })
      : Promise.resolve([]),
  ]);
  const skillNames = mySkills.map((s) => s.skill.name);
  const board: BoardRole[] = roles.map((r) => {
    const { matched, score } = skillMatch(r.skills, skillNames);
    const pay = payLabel(r.payMin, r.payMax, r.payCurrency);
    return {
      id: r.id,
      title: r.title,
      category: r.category,
      description: r.description,
      skills: r.skills,
      matched,
      score: skillNames.length ? score : null,
      minYears: r.minYears,
      pay: pay ? pay.replace("/yr", "/h") : null,
      applyUrl: applyUrlFor(r, referralUrl),
      postedAt: r.createdAt.toISOString(),
    };
  });
  const categories = AI_WORK_CATEGORIES.filter((c) => roles.some((r) => r.category === c));

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full opacity-60 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(239,134,45,0.3), transparent 70%)" }}
        />
        <p className="relative inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs text-muted-foreground">
          In partnership with <Micro1Logo className="h-3.5 w-auto text-foreground" />
        </p>
        <h1 className="relative mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Get paid to train AI with what you already know.</h1>
        <p className="relative mt-3 max-w-2xl text-muted-foreground">
          Remote, flexible, hourly work for professionals, students and experts in almost any field. Roles are listed by micro1, and micro1 pays you directly.
        </p>
        <ol className="relative mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-xl border border-border bg-background/60 p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
                <s.icon className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-2 font-semibold text-foreground">{s.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="ai-roles">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="ai-roles" className="text-xl font-semibold text-foreground">
              Open AI roles
            </h2>
            <p className="text-sm text-muted-foreground">
              {skillNames.length ? "Your fit is based on the skills on your Career Profile." : "Add skills to your Career Profile to see how well each role fits you."}
            </p>
          </div>
        </div>
        {board.length ? (
          <RoleBoard roles={board} categories={categories} canPractise={user.role === "CANDIDATE"} />
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
            <p className="font-medium text-foreground">New AI roles are being added.</p>
            <p className="mt-1 text-sm text-muted-foreground">Meanwhile, you can browse every opening on micro1.</p>
            <a
              href={referralUrl || MICRO1_OPPORTUNITIES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex h-10 items-center rounded-lg bg-foreground px-4 text-sm font-semibold text-background hover:opacity-90"
            >
              See roles on micro1
            </a>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Questions</h2>
          <div className="mt-3 divide-y divide-border rounded-xl border border-border bg-surface">
            {FAQ.map((f) => (
              <details key={f.q} className="group px-5 py-4">
                <summary className="cursor-pointer list-none font-medium text-foreground marker:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {f.q}
                    <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
        <aside className="h-fit rounded-xl border border-border bg-surface p-5">
          <p className="flex items-center gap-2 font-semibold text-foreground">
            <Globe2 className="h-4 w-4 text-primary" /> Who can apply
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            micro1 hires from around the world: citizens, permanent residents, visa holders and students, from early-career professionals to PhDs.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Due to legal and security rules, micro1 can&apos;t hire people living in {NOT_ELIGIBLE}.
          </p>
        </aside>
      </section>
    </div>
  );
}
