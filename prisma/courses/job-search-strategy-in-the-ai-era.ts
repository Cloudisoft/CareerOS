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
    {
      title: "Building a LinkedIn Presence That Actually Helps Your Search",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Building a LinkedIn Presence That Actually Helps Your Search",
          subheading:
            "Your target list gets you to the right companies. A weak or invisible profile is what quietly costs you once a recruiter or hiring manager actually looks you up.",
        },
        {
          kind: "bullets",
          heading: "The profile audit that matters most",
          bullets: [
            "Headline — not just your current title. Use the line to say what you actually do and, if job searching openly, what you're looking for: \"Product Manager | B2B SaaS | Open to Senior PM roles\" tells a recruiter more in one line than a bare title does.",
            "About section — 3-4 sentences on your focus and what you're good at, written like a person, not a résumé restated in the third person.",
            "Experience — doesn't need to duplicate your resume word for word, but every recent role should have at least one real, specific line, not just a title and dates.",
            "Skills — keep the list to what's genuinely true and current; a bloated list of decade-old, unused skills dilutes the ones that actually matter now.",
          ],
        },
        {
          kind: "bullets",
          heading: "Visibility without performing",
          bullets: [
            "Turning on \"Open to Work\" (visible to recruiters only, if you're employed and don't want your employer to see it) meaningfully increases recruiter outreach — it's a low-effort, high-signal switch most people skip out of hesitation.",
            "Commenting thoughtfully on posts in your field does more for visibility than posting original content you feel obligated to produce — it's lower pressure and still puts your name in front of the right people.",
            "Engaging with content from people at your target companies is a soft, low-friction way to be visible to them before you ever apply or reach out cold.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "What reads as noise, not signal",
          body: "Generic motivational posts, engagement-bait (\"agree?\"), and reposting without any real comment tend to blend into the feed rather than building real recognition. A recruiter skimming a profile responds much more to specific, substantive detail than to volume of activity.",
        },
        {
          kind: "text",
          heading: "How this connects to the rest of your search",
          body: [
            "A strong profile doesn't replace targeting, networking, or a tailored resume — it's what a recruiter finds when your name comes up through any of those other channels, including an internal referral or a cold search. Treat it as a support system for the rest of the strategy, not a search method on its own.",
          ],
        },
        {
          kind: "summary",
          heading: "The profile checklist",
          bullets: [
            "A headline that says what you do and, if useful, what you want next.",
            "An About section and recent experience with real, specific substance, not just titles.",
            "Visibility settings turned on deliberately, not left at whatever the default happened to be.",
          ],
        },
      ],
    },
    {
      title: "Practice: Turning a Posting Into Outreach and Tracking",
      durationMinutes: 12,
      slides: [
        {
          kind: "title",
          heading: "Practice: Turning a Posting Into Outreach and Tracking",
          subheading:
            "A realistic scenario, worked end to end — from spotting the role to the message that gets a real response.",
        },
        {
          kind: "practice",
          heading: "Decide if a company belongs on your target list",
          prompt:
            "You're a mid-level data analyst. You come across a Series B logistics-tech company that just posted a Senior Data Analyst role. Write the one-line \"why\" you'd log for this company on your target list, and note which of the 2-4 title variations from your own search this role maps to.",
          hint: "The \"why\" should be specific enough to shape a cover letter later — not just \"seems interesting.\" Think about what's genuinely notable: growth stage, the specific problem space, team structure, or something concrete you can point to.",
          solution:
            "Why: \"Series B, scaling fast post-funding, and the JD's emphasis on building analytics from scratch for a new ops team matches my strongest experience — standing up reporting at an early-stage company rather than maintaining an existing one.\" Title mapping: matches \"Senior Data Analyst\" and \"Analytics Lead\" — two of the 3 titles on this candidate's list; doesn't map to \"Data Scientist,\" which is a different track they'd decided not to pursue.",
        },
        {
          kind: "practice",
          heading: "Draft a cold outreach message to someone at the company",
          prompt:
            "You find someone on LinkedIn who made a similar move (analyst to senior analyst) at this same company about a year ago. Draft the cold message you'd send them, following this course's guidance to be specific and ask for something small.",
          hint: "Reference something specific about their actual path, not a generic \"can we connect,\" and ask for a short call — not a job, and not a referral, on the first message.",
          solution:
            "\"Hi Jordan — I saw you moved into a Senior Data Analyst role at [Company] about a year ago after a similar analyst background to mine. I'm exploring senior analyst roles right now and really admire what the team's building in the logistics space. Would you be open to a quick 15-minute call sometime about how that move went? No agenda beyond hearing your take — happy to work around your schedule.\"",
        },
        {
          kind: "practice",
          heading: "Set up the pipeline entry and follow-up cadence",
          prompt:
            "You apply to the role on Tuesday through a warm intro from the person above, who agreed to forward your resume. Write the pipeline entry you'd log (company, role, stage, last action, next action + date) and the specific follow-up cadence you'd plan, per this course's guidance.",
          hint: "Use the fields this course recommends, and set a real date for the next action rather than a vague \"follow up soon.\"",
          solution:
            "Entry: Company: [Logistics Co] | Role: Senior Data Analyst | Stage: Applied (warm intro) | Last action: Applied Tue 9/9, forwarded by Jordan | Next action: Follow up with recruiter if no response by Tue 9/16 (one week out, per the course's default cadence for a role with a real contact). If an interview happens, next follow-up would be set for roughly two weeks after that round if no word.",
        },
        {
          kind: "summary",
          heading: "What a well-run application actually looks like",
          bullets: [
            "A specific, logged reason the company is on the list — not just a title match.",
            "Outreach that names something real about the other person, asking for something small.",
            "A pipeline entry with a concrete next action and date, not a mental note to \"follow up sometime.\"",
          ],
        },
      ],
    },
    {
      title: "Knowledge Check: Job Search Strategy",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Knowledge Check: Job Search Strategy",
          subheading: "Five questions across the whole course.",
        },
        {
          kind: "quiz",
          heading: "Volume vs. targeting",
          question:
            "Per this course, why does high-volume, identical-resume applying tend to get weaker results as automation makes applying easier for everyone?",
          options: [
            "Job boards actively penalize candidates who apply to many roles",
            "As untargeted volume rises market-wide, per-application response rates tend to fall, since everyone is competing against more similarly untargeted submissions",
            "ATS systems have a hard cap on total applications per candidate per month",
            "Recruiters can see exactly how many other jobs a candidate has applied to",
          ],
          correctIndex: 1,
          explanation:
            "The course's argument is about market-wide dynamics, not a rule enforced against any one candidate: as frictionless applying pushes volume up broadly, the average response rate per generic application tends to drop, because the competition is also mostly untargeted.",
        },
        {
          kind: "quiz",
          heading: "Target lists",
          question:
            "According to this course, what should a target list be built from first?",
          options: [
            "A scraped list of every open posting matching a keyword",
            "Roles and what you actually want to be doing day-to-day, translated into a small number of specific titles",
            "Only companies with active job board postings right now",
            "A list generated automatically with no manual review",
          ],
          correctIndex: 1,
          explanation:
            "The course recommends starting from what you actually want to be doing, then translating that into 2-4 specific titles — not from whatever happens to be currently posted, which is a much narrower and more reactive way to build the list.",
        },
        {
          kind: "quiz",
          heading: "Automation and AI tools",
          question:
            "Which use of AI/automation tools does this course flag as needing a human check before it goes out?",
          options: [
            "Auto-filling repeated identity fields across ATS platforms",
            "A first-draft AI-tailored cover letter you'll edit yourself",
            "A free-text answer to a nuanced screening question generated by AI and submitted without review",
            "Using automation to apply faster to roles you've already decided genuinely fit",
          ],
          correctIndex: 2,
          explanation:
            "The course is explicit that AI-generated answers to nuanced free-text questions are a reasonable starting draft, not a final version — submitting them unreviewed risks saying something you can't actually stand behind in an interview.",
        },
        {
          kind: "quiz",
          heading: "Networking",
          question:
            "What does this course recommend as the first move before reaching out to people you don't know?",
          options: [
            "Send a generic \"let's connect\" message to as many people as possible at target companies",
            "Go through your existing network first, reopening dormant connections with a low-pressure message",
            "Only ever network with people you don't know, since existing contacts already know your situation",
            "Ask everyone you contact directly for a referral in the first message",
          ],
          correctIndex: 1,
          explanation:
            "The course's ordering is explicit: start with people you already know, using a low-pressure reopening message, before moving to cold outreach — existing relationships are both easier to reactivate and generally more receptive.",
        },
        {
          kind: "quiz",
          heading: "Pipeline tracking",
          question:
            "A candidate has ten applications stuck at \"applied\" with no response after three weeks. What does this course say that pattern usually signals?",
          options: [
            "Nothing — it's normal and doesn't warrant any action",
            "A targeting or resume-quality signal worth investigating, not just bad luck",
            "That the candidate should immediately stop applying to any new roles",
            "That all ten companies have filled the roles internally",
          ],
          correctIndex: 1,
          explanation:
            "The course frames pipeline tracking specifically as a tool for surfacing patterns like this — a cluster of stalled applications is treated as a signal to examine targeting or resume quality, not dismissed as random chance.",
        },
        {
          kind: "summary",
          heading: "This course's core takeaways",
          bullets: [
            "Targeted, tailored applications beat high-volume generic ones as market-wide volume rises.",
            "Build a real target list from what you want to be doing, not just what's currently posted.",
            "Use automation to remove friction, never to remove your judgment from what goes out.",
            "Networking works best started with people you already know, and specific with people you don't.",
            "Track your pipeline like a sales process — it surfaces stalls and prevents dropped follow-ups.",
            "A strong LinkedIn presence supports every other channel; it isn't a search method on its own.",
          ],
        },
      ],
    },
  ],
};
