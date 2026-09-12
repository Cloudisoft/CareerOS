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
    {
      title: "Resumes for Career Changers and Employment Gaps",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Resumes for Career Changers and Employment Gaps",
          subheading:
            "Every rule so far assumes a clean, linear career. If yours has a gap or a pivot, the fixes are specific — not just \"be more confident.\"",
        },
        {
          kind: "bullets",
          heading: "Gaps and pivots are different problems",
          bullets: [
            "A gap is a stretch of time with no paid work on the resume — caregiving, a layoff, illness, travel, a return to school.",
            "A pivot is continuous work history that just doesn't point at the job you're applying for now.",
            "Both trigger the same silent question in a reader's head — \"why isn't this straightforward?\" — and both are best answered on the page, briefly, rather than left for the reader to guess at.",
          ],
        },
        {
          kind: "bullets",
          heading: "Handling a gap without hiding it",
          bullets: [
            "Don't switch to year-only dates (\"2021-2023\") just for the gap year — it's a pattern recruiters recognize immediately, and it reads as concealment rather than as neutral.",
            "If you did anything structured during the gap — freelance work, a certification, caregiving that involved real coordination and budget, volunteer leadership — list it as a real line item with dates, the way you would a job.",
            "For an unstructured gap, a single factual phrase is enough on the resume itself: \"Family caregiving leave, 2022-2023.\" Save the fuller story, if anyone asks, for the interview.",
            "Never fabricate a title or a company to paper over the months. It's discoverable, and it costs you more than the honest gap would have.",
          ],
        },
        {
          kind: "bullets",
          heading: "Handling a pivot: lead with the transfer, not the timeline",
          bullets: [
            "Add a 2-3 line summary that states the pivot plainly: \"Marketing coordinator moving into UX design, with two years leading user research for product launches.\" Don't make the reader infer the story from job titles alone.",
            "Reorder your skills section to foreground what transfers — user research, stakeholder interviews, data analysis — ahead of what's specific to the old track.",
            "Rewrite old-job bullets through the lens of the new target, honestly. The same project can honestly be described as \"led customer interviews that shaped a product redesign\" if that's genuinely what you did, even though your title was Marketing Coordinator.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "What undermines a pivot resume",
          body: "Keeping every bullet in the original professional voice of the old career, with none of it translated toward the new one, forces the reader to do the pivot's work for you. If you wouldn't naturally use a term in an interview for the new role, don't lean on it here either.",
        },
        {
          kind: "summary",
          heading: "The honest version reads stronger",
          bullets: [
            "A gap or pivot named briefly and factually reads as someone in control of their story.",
            "A gap disguised or a pivot left unexplained reads as something to be suspicious of — usually worse than the truth would have.",
          ],
        },
      ],
    },
    {
      title: "Practice: Rewriting Weak Bullets Into Impact",
      durationMinutes: 12,
      slides: [
        {
          kind: "title",
          heading: "Practice: Rewriting Weak Bullets Into Impact",
          subheading:
            "Three real rewrites, using the skeleton and the honest-metric moves from this course. Do them before checking the model answers.",
        },
        {
          kind: "practice",
          heading: "Rewrite a duty-only bullet",
          prompt:
            "Rewrite this bullet using the skeleton [Did X] by [doing Y], resulting in [Z]: \"Responsible for the company's social media accounts.\" Assume you actually grew a following, posted more consistently, and increased engagement, even though you don't remember the exact numbers.",
          hint: "Start with the verb: what did you actually do to the accounts — grew, redesigned, launched, restructured? Then attach scale or before/after language instead of a number you don't have.",
          solution:
            "\"Rebuilt the brand's social content calendar and posting cadence, growing Instagram followers by roughly 40% over eight months and lifting average post engagement from under 1% to consistently above 3%.\" If you truly have no numbers at all: \"Restructured the brand's social content calendar from ad hoc posting to a consistent weekly schedule, taking the account from stalled growth to the fastest-growing of the company's three platforms.\"",
        },
        {
          kind: "practice",
          heading: "Fix a bullet that buries the actual work in \"helped with\"",
          prompt:
            "Rewrite: \"Helped with the launch of a new customer onboarding process.\" You know the person actually wrote onboarding emails and ran training for new hires, but was not the project lead.",
          hint: "\"Helped with\" hides your specific piece. Name exactly what you owned, even as one contributor on a bigger project — that's still a real, specific claim.",
          solution:
            "\"Wrote the full email sequence and led training sessions for a new customer onboarding process, one of three workstreams on a cross-functional launch that cut new-customer support tickets by 25% in the first quarter.\" Notice it's honest about scope (\"one of three workstreams\") while still being specific about the individual contribution.",
        },
        {
          kind: "practice",
          heading: "Rewrite a bullet with a fabricated-sounding number",
          prompt:
            "Rewrite this bullet, which currently reads as unbelievable: \"Increased team productivity by 300% through better time management.\" The real story: you introduced a shared task board that cut the time the team spent in status meetings roughly in half.",
          hint: "An implausible percentage is worse than no percentage. Anchor the claim to something concrete and checkable — time saved, meetings cut, a process replaced — rather than an abstract \"productivity\" figure.",
          solution:
            "\"Introduced a shared task board to replace status-update meetings, cutting the team's weekly meeting time roughly in half and freeing an estimated 4 hours per person per week for direct project work.\"",
        },
        {
          kind: "summary",
          heading: "What good rewriting looks like",
          bullets: [
            "Every bullet starts with a specific verb, not \"responsible for\" or \"helped with.\"",
            "A missing number is replaced with real scale or before/after language — never an invented figure.",
            "The claim stays something you could defend in detail if an interviewer asked \"walk me through that.\"",
          ],
        },
      ],
    },
    {
      title: "Knowledge Check: Resume Writing",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Knowledge Check: Resume Writing",
          subheading:
            "Five questions across the whole course — the kind of thing a hiring manager's first 30-second scan would actually catch.",
        },
        {
          kind: "quiz",
          heading: "Structure",
          question:
            "A candidate puts a two-paragraph \"Objective\" statement at the top of their resume, above their most recent job title. What's the main problem with this, per this course?",
          options: [
            "It's outdated formatting that ATS systems can no longer parse at all",
            "It uses space a scanning reader needs for concrete signal, and vague language like \"seeking a challenging role\" tells the reader nothing",
            "Objective statements are only appropriate for candidates with a college degree",
            "It should be replaced with a two-page cover letter instead",
          ],
          correctIndex: 1,
          explanation:
            "The course's core structural argument is that a resume is scanned in 20-40 seconds, so every line has to earn its place. A generic objective burns prime top-of-page space without giving the reader anything concrete — the fix is either cutting it or replacing it with a tight, specific summary.",
        },
        {
          kind: "quiz",
          heading: "Impact vs. duty",
          question:
            "Which rewrite best follows the \"[Did X] by [doing Y], resulting in [Z]\" skeleton from this course?",
          options: [
            "\"Responsible for managing a team of engineers and various technical projects.\"",
            "\"Worked on improving the deployment process for the engineering team.\"",
            "\"Redesigned the deployment pipeline by automating manual test steps, cutting release time from two days to four hours.\"",
            "\"Passionate about engineering excellence and continuous process improvement.\"",
          ],
          correctIndex: 2,
          explanation:
            "Only the third option names a specific action (redesigned), what it was applied to (the deployment pipeline, via automating manual steps), and a concrete result (two days to four hours). The others describe presence or personality, not impact.",
        },
        {
          kind: "quiz",
          heading: "ATS formatting",
          question:
            "Which resume choice is most likely to cause an ATS to read a resume's content out of order or drop sections entirely?",
          options: [
            "Using the exact phrasing from the job posting for a skill you genuinely have",
            "Listing skills in a single grouped section near the middle of the page",
            "A two-column layout with graphics or icons next to each section",
            "Ordering sections as Contact, Summary, Experience, Skills, Education",
          ],
          correctIndex: 2,
          explanation:
            "Multi-column layouts and embedded graphics are the most common cause of an ATS misreading section order or missing content, because many parsers read left-to-right, top-to-bottom across the whole page rather than following visual columns.",
        },
        {
          kind: "quiz",
          heading: "Page length",
          question:
            "A candidate with 14 years of experience across two distinct chapters (5 years as an individual contributor, then 9 years in people management) is deciding between one and two pages. What does this course recommend?",
          options: [
            "Always stay at one page regardless of experience — two pages is never acceptable",
            "Two pages is defensible here, since cutting either chapter to fit one page would misrepresent a real, relevant part of their background",
            "Three pages, to give equal space to both chapters",
            "One page, but only if font size is reduced to fit everything",
          ],
          correctIndex: 1,
          explanation:
            "The course's one-page rule is narrower than \"always one page\" — it explicitly calls out 12+ years of experience with multiple distinct career chapters as a case where two pages is defensible, because compressing to one page would cut context a reader actually needs.",
        },
        {
          kind: "quiz",
          heading: "Career gaps and pivots",
          question:
            "Someone has an 8-month employment gap for a documented medical leave. According to this course, what's the recommended way to handle it on the resume?",
          options: [
            "Switch all dates on the resume to year-only format so the gap isn't visually obvious",
            "List a brief, factual line for the period (e.g., \"Medical leave, 2023\") rather than hiding or fabricating it",
            "Omit the most recent job entirely so the timeline looks continuous",
            "Leave it unaddressed on the resume and explain it only if asked directly in an interview",
          ],
          correctIndex: 1,
          explanation:
            "The course's guidance is to name a gap briefly and factually rather than disguise it — switching to year-only dates or omitting jobs to hide a gap reads as concealment, which usually costs more credibility than the honest, short explanation would.",
        },
        {
          kind: "summary",
          heading: "This course's core takeaways",
          bullets: [
            "Structure controls whether the content even gets read — fix the scan before the sentences.",
            "Every bullet should show impact (verb + what + result), not just describe a duty.",
            "ATS problems are almost always plain formatting and keyword-overlap issues, not a hidden algorithm to game.",
            "The one-page rule is about experience shape, not a fixed law — defend every line with the cut test.",
            "Proofread out of normal reading order, since your brain autocorrects what it expects to see.",
            "A gap or a pivot, named honestly and briefly, reads better than one hidden or left unexplained.",
          ],
        },
      ],
    },
  ],
};
