import type { ResumeContent } from "@/lib/validations/resume";

/* The interview plan's shape and the parts that need no AI: a plan built straight from the resume, picking
   what to ask next, and a fallback question when the AI can't write one. Kept free of server imports so it
   can be tested on its own. */

export type FocusKind = "project" | "claim" | "skill" | "gap" | "motivation" | "role" | "behavioral";

export interface FocusArea {
  id: string;
  topic: string;
  kind: FocusKind;
  why: string;
  evidence: string;
  angles: string[];
}

export interface InterviewPlan {
  /** "ai" when an AI read the resume; "resume" when the plan was built from the resume directly. */
  source: "ai" | "resume";
  summary: string;
  focusAreas: FocusArea[];
  strengths: string[];
  watchOuts: string[];
}

const NUMBER = /\d|%|\$|percent|million|thousand|\bk\b/i;

function monthsBetween(a: string, b: string): number | null {
  const pa = Date.parse(/^\d{4}$/.test(a) ? `${a}-01` : a);
  const pb = Date.parse(/^\d{4}$/.test(b) ? `${b}-01` : b);
  if (Number.isNaN(pa) || Number.isNaN(pb)) return null;
  return Math.round((pb - pa) / (1000 * 60 * 60 * 24 * 30.4));
}

/** Words from a job description that look like requirements ("React", "SQL", "stakeholder management"). */
function jobSkills(jobContext: string | null, resume: ResumeContent | null): string[] {
  if (!jobContext) return [];
  const have = new Set((resume?.skills ?? []).map((s) => s.toLowerCase()));
  const found = new Set<string>();
  const re = /\b(?:experience (?:with|in)|proficien\w* (?:with|in)|knowledge of|familiar\w* with|expertise in)\s+([A-Za-z0-9+#./ -]{2,40})/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(jobContext))) {
    const s = m[1].split(/,| and | or |\./)[0].trim();
    if (s && !have.has(s.toLowerCase())) found.add(s);
  }
  return Array.from(found).slice(0, 2);
}

/** A plan built from the resume alone, used when the AI can't read it. Still specific to this person. */
export function fallbackPlan(resume: ResumeContent | null, jobContext: string | null): InterviewPlan {
  const areas: Omit<FocusArea, "id">[] = [];
  const jobTitle = jobContext ? jobContext.split("\n")[0].trim().slice(0, 80) : "";
  areas.push({
    topic: jobTitle ? `Why ${jobTitle}` : "Your background and what you want next",
    kind: "motivation",
    why: "Opens the interview and shows how you tell your own story.",
    evidence: resume?.summary?.slice(0, 200) ?? "",
    angles: ["Walk me through your background", "Why this role, and why now?"],
  });
  const exps = resume?.experience ?? [];
  const recent = exps[0];
  if (recent && (recent.title || recent.company)) {
    areas.push({
      topic: `${recent.title || "Your role"} at ${recent.company || "your current company"}`,
      kind: "project",
      why: "Your most recent role is what interviewers dig into first.",
      evidence: recent.bullets[0] ?? "",
      angles: ["What you owned end to end", "A hard decision you made there"],
    });
  }
  const claim = exps.flatMap((e) => e.bullets.map((b) => ({ b, e }))).find(({ b }) => NUMBER.test(b));
  if (claim) {
    areas.push({
      topic: claim.b.length > 70 ? `${claim.b.slice(0, 67)}…` : claim.b,
      kind: "claim",
      why: "A number on a resume gets checked: how it was measured and what you personally did.",
      evidence: claim.b,
      angles: ["How was that measured?", "What was your part, versus the team's?"],
    });
  }
  const older = exps.find((e, i) => i > 0 && e.bullets.length);
  if (older) {
    areas.push({
      topic: `${older.title || "Earlier role"} at ${older.company || "an earlier company"}`,
      kind: "project",
      why: "Shows how you've grown from role to role.",
      evidence: older.bullets[0] ?? "",
      angles: ["What you'd do differently now"],
    });
  }
  for (const skill of jobSkills(jobContext, resume)) {
    areas.push({ topic: skill, kind: "skill", why: "The job asks for it and your resume shows little of it.", evidence: "", angles: [`How you'd get productive with ${skill}`] });
  }
  for (let i = 0; i + 1 < exps.length && areas.length < 7; i++) {
    const gap = exps[i + 1].endDate && exps[i].startDate ? monthsBetween(exps[i + 1].endDate, exps[i].startDate) : null;
    if (gap != null && gap >= 6) {
      areas.push({ topic: `The ${gap}-month gap before ${exps[i].company || "your next role"}`, kind: "gap", why: "Interviewers often ask about gaps; a calm, honest answer helps.", evidence: "", angles: ["What you did in that time"] });
      break;
    }
  }
  areas.push({
    topic: "Working with others under pressure",
    kind: "behavioral",
    why: "Almost every interview asks for a real example of conflict, a setback or a tight deadline.",
    evidence: "",
    angles: ["A disagreement you resolved", "A time something went wrong"],
  });
  if (jobContext) {
    areas.push({ topic: "The first 90 days in this role", kind: "role", why: "Shows you understand what the job needs.", evidence: "", angles: ["What you'd focus on first"] });
  }
  const skills = resume?.skills ?? [];
  return {
    source: "resume",
    summary: recent ? `${recent.title || "Professional"}${recent.company ? ` at ${recent.company}` : ""}${skills.length ? `, with ${skills.slice(0, 3).join(", ")}` : ""}.` : "",
    strengths: skills.slice(0, 3),
    watchOuts: claim ? ["Be ready to explain how your numbers were measured"] : [],
    focusAreas: areas.slice(0, 7).map((a, i) => ({ id: `f${i + 1}`, ...a })),
  };
}

/** The next area to ask about: the first one not asked yet, in plan order; once all are covered, the
    project and claim areas again (they reward a second, deeper question). */
export function nextFocus(plan: InterviewPlan, askedIds: string[]): FocusArea | null {
  if (!plan.focusAreas.length) return null;
  const fresh = plan.focusAreas.find((f) => !askedIds.includes(f.id));
  if (fresh) return fresh;
  const deep = plan.focusAreas.filter((f) => f.kind === "project" || f.kind === "claim");
  const pool = deep.length ? deep : plan.focusAreas;
  return pool[askedIds.length % pool.length];
}

/** A real question for an area, written without AI. Used when the AI can't answer, so a session never stalls. */
export function fallbackQuestion(focus: FocusArea | null, questionNumber: number): { category: string; question: string } {
  if (!focus) {
    return questionNumber === 1
      ? { category: "Introduction", question: "Walk me through your background and what brings you to this interview." }
      : { category: "Behavioral", question: "Tell me about a time a project didn't go to plan. What happened, what did you do, and what did you learn?" };
  }
  const t = focus.topic;
  const q: Record<FocusKind, string> = {
    motivation: questionNumber === 1 ? "Walk me through your background, and what you're looking for in your next role." : `What draws you to this, and why now? (${t})`,
    project: `Tell me about your work ${/ at /.test(t) ? `as ${t}` : `on ${t}`}. What were you responsible for, what was the hardest part, and how did it turn out?`,
    claim: `Your resume says "${focus.evidence || t}". How was that measured, and what exactly did you do to make it happen?`,
    skill: `This role needs ${t}. Tell me about your experience with it, or how you'd get up to speed quickly.`,
    gap: `I see ${t.charAt(0).toLowerCase()}${t.slice(1)}. Can you tell me about that time?`,
    role: `If you joined, how would you approach ${t.charAt(0).toLowerCase()}${t.slice(1)}?`,
    behavioral: "Tell me about a time you disagreed with a colleague or a decision. What did you do, and how did it end?",
  };
  return { category: categoryFor(focus), question: q[focus.kind] };
}

export function categoryFor(focus: FocusArea): string {
  const label: Record<FocusKind, string> = {
    project: "Project deep-dive",
    claim: "Resume claim",
    skill: "Skill check",
    gap: "Career history",
    motivation: "Motivation",
    role: "Role fit",
    behavioral: "Behavioral",
  };
  return `${label[focus.kind]} · ${focus.topic}`.slice(0, 120);
}

/** The plan as a short brief for prompts. */
export function planBrief(plan: InterviewPlan): string {
  return [
    plan.summary ? `Candidate in brief: ${plan.summary}` : "",
    "Interview plan (focus areas, most important first):",
    ...plan.focusAreas.map(
      (f) => `- [${f.id}] (${f.kind}) ${f.topic}${f.why ? ` — why: ${f.why}` : ""}${f.evidence ? ` — resume: "${f.evidence}"` : ""}${f.angles.length ? ` — angles: ${f.angles.join("; ")}` : ""}`
    ),
  ]
    .filter(Boolean)
    .join("\n");
}
