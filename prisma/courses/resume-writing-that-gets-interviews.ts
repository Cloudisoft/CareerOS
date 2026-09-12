import type { CourseSeed } from "../course-types";

export const course: CourseSeed = {
  slug: "resume-writing-that-gets-interviews",
  title: "Resume Writing That Gets Interviews",
  description:
    "The structural and content decisions that actually move a resume from the reject pile to the interview list.",
  category: "Resume",
  level: "BEGINNER",
  order: 1,
  lessons: [
    {
      title: "Structure Before Style",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Structure Before Style",
          subheading:
            "A resume gets scanned, not read — 20-40 seconds on a first pass. Structure is what makes that scan work in your favor.",
        },
        {
          kind: "bullets",
          heading: "The order that works",
          bullets: [
            "Contact info — name, email, phone, city/state (not full address), LinkedIn.",
            "Summary — 2-3 lines, only if it adds something a title alone doesn't say.",
            "Experience — reverse chronological. This is 70% of the page for most people.",
            "Skills — a scannable list, grouped if you have more than 10.",
            "Education — near the bottom unless you're a student or recent grad.",
          ],
        },
        {
          kind: "bullets",
          heading: "What breaks the scan",
          bullets: [
            "Burying the job title in a paragraph instead of a clear heading line.",
            "Objective statements like \"seeking a challenging role\" that tell the reader nothing.",
            "Inconsistent dates — \"2021-2023\" next to \"March 2021 - Present\" reads as careless.",
            "Two-column layouts with graphics — they can scramble an ATS's reading order entirely.",
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "The five-second test",
          body: "Cover the page with your hand and reveal it for five seconds. If you don't remember your most recent title, your most recent company, and one number that shows impact, the structure needs work before you touch a single sentence.",
        },
      ],
    },
    {
      title: "Turning Duties Into Impact",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Turning Duties Into Impact",
          subheading:
            "The single biggest quality gap between resumes isn't grammar — it's the gap between describing a job and describing what you did in it.",
        },
        {
          kind: "example",
          heading: "Duty vs. impact",
          body: "The second version answers the question every hiring manager actually has: if I hire this person, what changes?",
          code: `Duty: "Responsible for managing the customer support queue."

Impact: "Cleared a 200-ticket backlog in six weeks by rewriting the
triage process, cutting average response time from 18 hours to 4."`,
        },
        {
          kind: "bullets",
          heading: "A repeatable rewrite pattern",
          intro: "For each bullet, answer three things, then use this skeleton:",
          bullets: [
            "What did you actually do? (the verb — led, built, negotiated, redesigned)",
            "On what? (the specific thing — a process, a system, a budget, a team)",
            "What changed because of it? (a number, a before/after, a consequence)",
            "Skeleton: [Did X] by [doing Y], resulting in [Z].",
          ],
        },
        {
          kind: "bullets",
          heading: "When you don't have a clean number",
          intro: "A fabricated metric is worse than none — it costs credibility the moment someone asks you to walk through it.",
          bullets: [
            "Use scale instead: \"across 12 markets,\" \"for a team of 40,\" \"serving 3,000 monthly users.\"",
            "Use before/after in words: \"went from manual spreadsheet tracking to an automated weekly report.\"",
            "Use relative impact: \"the fastest-growing account on the team that quarter.\"",
          ],
        },
        {
          kind: "summary",
          heading: "The verb audit",
          bullets: [
            "Circle the first word of every bullet.",
            "\"Responsible for,\" \"helped with,\" \"worked on\" describe presence, not action — rewrite those first.",
            "Swap in the verb that actually matches what you did: owned, shipped, negotiated, cut, grew, fixed, launched.",
          ],
        },
      ],
    },
    {
      title: "Beating the ATS Without Gaming It",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Beating the ATS Without Gaming It",
          subheading:
            "Applicant tracking systems don't reject resumes with some secret algorithm — most of what trips them up is plain formatting and missing keyword overlap.",
        },
        {
          kind: "bullets",
          heading: "What actually matters",
          bullets: [
            "Use the words from the job posting, where true — the exact phrase, not a synonym only you'd recognize as equivalent.",
            "Standard section headers: \"Experience,\" \"Education,\" \"Skills.\" Creative alternatives often don't parse.",
            "Simple, single-column layout — tables and multi-column designs are the most common cause of an ATS reading a resume out of order.",
            ".docx or a text-selectable PDF — never a scanned image or a design-tool export that flattens text into shapes.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "What doesn't work (and can backfire)",
          body: "White-text keyword stuffing gets flagged by some systems and is instantly visible to any human who opens the file differently. Listing keywords you can't speak to in an interview wastes the interview you got.",
        },
        {
          kind: "text",
          heading: "The honest keyword pass",
          body: [
            "Before submitting, read the posting once for required skills and tools, then check your resume actually contains the ones you truly have — not to invent matches, but to make sure real, relevant experience isn't described in different words than the posting uses for the same thing.",
          ],
        },
      ],
    },
    {
      title: "The One-Page Rule and When to Break It",
      durationMinutes: 5,
      slides: [
        {
          kind: "title",
          heading: "The One-Page Rule and When to Break It",
          subheading:
            "\"Keep it to one page\" is good advice for most early-to-mid-career resumes and bad advice for a lot of senior ones. The real rule is narrower.",
        },
        {
          kind: "bullets",
          heading: "When one page is right",
          bullets: [
            "Under ~8-10 years of relevant experience.",
            "A single, focused career track without major pivots.",
            "Roles where depth in one or two recent jobs matters more than a full history.",
          ],
        },
        {
          kind: "bullets",
          heading: "When two pages are defensible",
          bullets: [
            "12+ years of experience where cutting older, still-relevant roles would misrepresent your background.",
            "Multiple distinct career chapters (e.g., individual contributor then people management).",
            "Executive and technical-leadership resumes, where one page forces cutting context a committee actually needs.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "The cut test",
          body: "For any bullet, ask: does removing this line lose something a reader needs to decide whether to interview me? If the honest answer is no, it's decoration — cut it, regardless of what page you're on. Almost nothing justifies a third page.",
        },
      ],
    },
    {
      title: "Proofreading Like a Recruiter Reads",
      durationMinutes: 4,
      slides: [
        {
          kind: "title",
          heading: "Proofreading Like a Recruiter Reads",
          subheading:
            "A single typo won't always sink a resume, but it changes how carefully the rest gets read — a real cost in a competitive pile.",
        },
        {
          kind: "bullets",
          heading: "Read it in the wrong order",
          intro: "Reading top to bottom, your brain autocorrects what it expects to see. Break that pattern:",
          bullets: [
            "Read bullets bottom to top, one at a time, out of context.",
            "Read it out loud — awkward phrasing that looks fine on the page usually sounds wrong immediately.",
            "Check every number separately. A resume claiming \"cut costs 140%\" undermines every other stat on the page.",
          ],
        },
        {
          kind: "bullets",
          heading: "Three passes worth doing",
          bullets: [
            "Consistency pass — tense, date format, bullet punctuation, all matching.",
            "Name pass — company, tool, and product names spelled and capitalized exactly right.",
            "Fresh-eyes pass — wait a few hours or a day before the final read.",
          ],
        },
        {
          kind: "summary",
          heading: "One more set of eyes",
          bullets: [
            "Have someone outside the process read it — not for content, just for clarity.",
            "Could they tell what you do and what you're good at from this page alone, in under a minute?",
          ],
        },
      ],
    },
  ],
};
