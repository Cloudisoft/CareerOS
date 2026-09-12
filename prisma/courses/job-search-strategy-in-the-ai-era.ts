import type { CourseSeed } from "../course-types";

export const course: CourseSeed = {
  slug: "job-search-strategy-in-the-ai-era",
  title: "Job Search Strategy in the AI Era",
  description:
    "How to run a focused, high-signal job search instead of an exhausting high-volume one — and how to use tools like Career OS well within it.",
  category: "Job Search",
  level: "BEGINNER",
  order: 4,
  lessons: [
    {
      title: "Why Spray-and-Pray Doesn't Work Anymore",
      durationMinutes: 5,
      slides: [
        {
          kind: "title",
          heading: "Why Spray-and-Pray Doesn't Work Anymore",
          subheading:
            "Applying to hundreds of jobs with the same resume feels productive — it's activity you can point to — but it's usually a weaker strategy than applying to far fewer roles with real targeting.",
        },
        {
          kind: "text",
          heading: "The math working against volume",
          body: [
            "When application volume goes up across the market broadly (automation makes applying nearly frictionless for everyone), the per-application response rate for generic applications tends to go down, not up — you're competing against more submissions for the same roles, most of them similarly untargeted.",
            "Volume alone doesn't overcome that; targeting does.",
          ],
        },
        {
          kind: "bullets",
          heading: "What targeting actually buys you",
          bullets: [
            "A resume and cover letter genuinely tailored to the role scores better with both an ATS and a human reader, because the overlap with the posting is real, not superficial.",
            "Fewer, better-matched applications means more energy per application for the parts that matter — a thoughtful cover letter, a warm introduction, real preparation if you get a screen.",
            "It's more sustainable. A search built on quantity alone burns people out well before it produces results.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "This doesn't mean apply to fewer total roles",
          body: "It means being deliberate about where the volume goes. Automation (like Auto Apply) is genuinely useful for well-matched roles where the marginal cost of applying is low and the fit is real — it's a poor substitute for targeting, but a strong complement to it.",
        },
      ],
    },
    {
      title: "Building a Target List Instead of a Job Board Habit",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Building a Target List Instead of a Job Board Habit",
          subheading:
            "Scrolling a job board daily feels like searching. A target list turns that scrolling into a plan.",
        },
        {
          kind: "bullets",
          heading: "Building the list",
          bullets: [
            "Start with roles, not just titles. Write down what you actually want to be doing day-to-day, then translate that into the 2-4 titles that map to it.",
            "List 20-40 companies, not just roles — sized realistically against your experience level. Mix a few reaches, a solid core, and a few safer bets.",
            "For each company, note why it's on the list. \"Growing team in my space\" is different from \"known for strong mentorship\" — knowing why helps you tailor a cover letter later.",
          ],
        },
        {
          kind: "bullets",
          heading: "Working the list",
          bullets: [
            "Check target companies' career pages directly, not just aggregators.",
            "Set up alerts for your target companies specifically, not just generic keyword alerts.",
            "Revisit and prune the list every few weeks. A target list is a living document, not a one-time exercise.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Where this connects to matching tools",
          body: "A tool that scores job-fit against your profile (like Career OS's match scoring) works best against a target list you've already curated with judgment — it's very good at telling you how well you match a role you've identified as worth applying to, and much less useful as your only method of discovering what to apply to.",
        },
      ],
    },
    {
      title: "Using Auto Apply and AI Tools Without Losing Your Voice",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Using Auto Apply and AI Tools Without Losing Your Voice",
          subheading:
            "Automation and AI-assisted tailoring can meaningfully speed up a job search — and used carelessly, they can also produce a version of you that doesn't sound like you.",
        },
        {
          kind: "bullets",
          heading: "Where automation genuinely helps",
          bullets: [
            "Form-filling. Retyping the same identity and work-history fields across dozens of ATS platforms is pure friction with no signal value.",
            "First-draft generation. Having an AI-tailored cover letter or bullet rewrite as a starting point, that you then edit into your own voice, is faster than a blank page.",
            "Volume on well-matched roles. For roles that genuinely fit, automation lets you cover more of your target list without every application being manual data entry.",
          ],
        },
        {
          kind: "bullets",
          heading: "Where it needs a human check",
          bullets: [
            "Anything you'll be asked about in an interview. If a tailored bullet describes something you can't speak to confidently, fix it before it goes out.",
            "Free-text answers to nuanced screening questions. AI-generated answers are a reasonable starting draft, not a final version.",
            "Anything that determines whether you'd actually take the role. Don't let automation apply you into processes for jobs you wouldn't accept.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "The practical rule",
          body: "Use automation to remove friction from the process, not to remove your judgment from it. A fast, tailored, honest application beats both a slow manual one and a fast generic one.",
        },
      ],
    },
    {
      title: "Networking That Doesn't Feel Like Networking",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Networking That Doesn't Feel Like Networking",
          subheading:
            "\"Networking\" often conjures cold outreach that feels transactional on both ends. The version that actually works looks less like that and more like genuine, low-pressure conversation.",
        },
        {
          kind: "text",
          heading: "Start with people you already know",
          body: [
            "Before reaching out cold, go through your existing network. A message like \"I'm exploring new roles in X — would love to hear how things are going for you, and happy to share what I'm looking at if useful\" reopens a connection without asking for anything specific yet.",
          ],
        },
        {
          kind: "bullets",
          heading: "Reaching out to people you don't know",
          bullets: [
            "Be specific about why you're reaching out to them. \"I saw you made a similar move from X to Y a couple years ago — would love to hear how that went\" gets a real response far more often than \"Can we connect?\"",
            "Ask for something small. A 15-minute call, not a job.",
            "Lead with genuine curiosity, not an ask. If the conversation goes well, an ask about openings or a referral usually comes up naturally near the end.",
          ],
        },
        {
          kind: "bullets",
          heading: "After the conversation",
          bullets: [
            "Follow up with a short thank-you that references something specific from the conversation.",
            "If they offered to introduce you to someone, give them an easy way to do it — a short forwardable blurb about what you're looking for.",
          ],
        },
        {
          kind: "summary",
          heading: "The long game",
          bullets: [
            "The best networking often isn't done while actively job searching at all — it's staying genuinely in touch with people over time.",
            "The next best thing is being upfront and specific when you do reach out cold.",
          ],
        },
      ],
    },
    {
      title: "Tracking Your Pipeline Like a Salesperson",
      durationMinutes: 5,
      slides: [
        {
          kind: "title",
          heading: "Tracking Your Pipeline Like a Salesperson",
          subheading:
            "A job search is, functionally, a sales pipeline — you're moving a set of opportunities through stages, and most people manage it worse than they'd manage a work project with the same complexity.",
        },
        {
          kind: "text",
          heading: "What to actually track",
          body: [
            "For every role past the \"just applied\" stage, track: company, role, stage (applied / screening / interview / offer / closed), the date of the last action, and the next action due. Resist the urge to build something elaborate you won't maintain.",
          ],
        },
        {
          kind: "bullets",
          heading: "Why this matters more than it seems",
          bullets: [
            "It surfaces where things are actually stalling. If ten roles are stuck at \"applied\" with no response after three weeks, that's a targeting or resume-quality signal, not just bad luck.",
            "It prevents dropped follow-ups. \"I'll follow up in a week\" said to yourself with no tracking is how a promising lead quietly goes cold.",
            "It reduces the emotional volatility of a search. A visible pipeline with several things in motion is calmer to sit with than a mental tally that only registers the most recent rejection.",
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Setting a follow-up cadence",
          body: "A reasonable default: follow up around one week after applying if there's a real contact, and again about two weeks after an interview if you haven't heard back. Adjust to what the recruiter or posting says about timeline where they give you one.",
        },
        {
          kind: "summary",
          heading: "Reviewing the pipeline weekly",
          bullets: [
            "Once a week, look at the whole list: what moved, what's stalled, what needs a follow-up, what should be marked closed.",
            "This is also the natural moment to prune your target list and decide where to spend the next week's effort.",
          ],
        },
      ],
    },
  ],
};
