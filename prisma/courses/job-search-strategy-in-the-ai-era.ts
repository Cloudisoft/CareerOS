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
          kind: "chart",
          heading: "Illustrative response rates: generic vs. targeted",
          description: "The gap isn't about working harder — it's the difference between a resume that overlaps a posting for real and one that's a generic mass-send.",
          chartType: "bar",
          unit: "% response rate",
          data: [
            { label: "High-volume, generic", value: 3 },
            { label: "Targeted, tailored", value: 14 },
          ],
        },
        {
          kind: "text",
          heading: "The employer side of the same shift",
          body: [
            "It isn't just candidates who have new AI tools — employers increasingly use AI-assisted screening to handle the flood of applications the same automation makes possible. Some of these tools are explicitly built to detect generic, templated applications and to score genuine overlap between a resume and the specific posting.",
            "The practical effect is that a resume tailored with real, specific language from the posting doesn't just read better to a human — it increasingly scores better to the automated first pass too. The old advice (\"tailor your resume\") and the new reality (AI screening on both sides) point in the same direction, not opposite ones.",
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
          kind: "text",
          heading: "The hidden cost most people don't count",
          body: [
            "Low response rate is the visible cost. The hidden one is worse: a spray-and-pray search leaves you unable to prepare meaningfully for the interviews you do land, because you applied to so many different kinds of roles that you can't hold a coherent story for any single one of them. Recruiters and hiring managers notice this — a candidate who can't explain why they want this specific role, at this specific company, reads as someone applying everywhere, which is exactly what's happening.",
            "It also compounds emotionally. A hundred rejections feel like a hundred separate personal failures when the applications were generic and the odds were always long. Twenty rejections against a real target list are much easier to read as data about targeting or timing, not as a verdict on you.",
          ],
        },
        {
          kind: "bullets",
          heading: "Signs your search has quietly become spray-and-pray",
          intro: "None of these mean you're a bad candidate — they mean the process has drifted, and it's worth resetting before burning more energy on it.",
          bullets: [
            "You can't name, without looking it up, why a specific application you sent last week was a good fit for you.",
            "Your resume hasn't changed in weeks despite applying to roles with meaningfully different requirements or seniority.",
            "You're tracking a raw count of applications sent as your main measure of progress, rather than response rate or pipeline movement.",
            "A recruiter calls you back and you need a second to remember which role you actually applied for.",
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Targeting doesn't mean maximal customization on every application",
          body: "There's a point of diminishing return — rewriting a resume from scratch for every single role burns the same energy spray-and-pray was wasting, just differently. A strong default resume for each of your 2-4 target titles, adjusted with the specific language a given posting uses, gets most of the benefit of full customization at a fraction of the time cost.",
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
          kind: "example",
          heading: "What one real target-list entry looks like",
          body: "Not just a company name — enough detail that revisiting the list in a month still tells you why it was there.",
          code: `Company: Northwind Logistics
Tier: Core (realistic match)
Why: Series C, scaling ops team fast per recent funding news;
posting patterns show 3 relevant roles opened in the last
quarter — genuine hiring momentum, not a single stale posting.
Titles this maps to: Senior Ops Analyst, Analytics Lead
Contact: Priya (LinkedIn, 2nd-degree via Jordan) — not yet
reached out
Status: Watching career page; no live posting fits yet`,
        },
        {
          kind: "bullets",
          heading: "What to actually check before adding a company",
          intro: "A name on a list is only useful if you know something real about it — a few minutes of research per company pays off later.",
          bullets: [
            "Recent funding, layoffs, or leadership changes — a company that just raised a large round or just had a round of layoffs tells you very different things about how much real hiring room exists right now.",
            "Whether the team you'd join is actually growing — a company's LinkedIn page often shows recent hires in a function, which is a better live signal than a single job posting.",
            "What current and former employees say in aggregate on sites like Glassdoor — not to over-weight any one review, but a consistent theme across many reviews (chronic overtime, high turnover in a specific team) is worth knowing before you invest time in a company.",
            "Whether the company is actually hiring for your level, not just adjacent ones — a company with no mid-level postings in the last six months for a track that's otherwise active may simply not be hiring at that level right now.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "An all-reach or all-safe list defeats the purpose",
          body: "A list of 30 companies that are all a stretch produces a search that's mostly rejection, with too little real signal to calibrate against. A list that's all safe bets under-shoots what you could actually get. A rough split — a few genuine reaches, a solid core of realistic matches, a few safer bets you'd still be glad to land — keeps both your options and your morale in better shape over a multi-month search.",
        },
        {
          kind: "text",
          heading: "Sizing the list to your actual timeline",
          body: [
            "20-40 companies is a reasonable range for most searches, but the right number depends on urgency and how niche your target roles are. A search with real runway (still employed, no hard deadline) can run leaner and go deeper on fewer companies. A search with a firm deadline (end of severance, a visa clock, a hard financial runway) generally needs the wider end of the range, simply to keep enough live opportunities moving in parallel that a single stalled process doesn't leave you with nothing in motion.",
            "A very niche target (a specific, rare specialization, or a small set of companies that do exactly the thing you want) may legitimately have fewer than 20 realistic entries — in that case, depth of relationship at each one matters more than list size.",
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
          kind: "example",
          heading: "An AI first draft, edited into your own voice",
          body: "The AI draft isn't wrong, exactly — it's generic in a way that's easy to spot once you know what to look for. The edit adds the one detail only you actually have.",
          code: `AI first draft: "Led cross-functional initiatives to drive
operational efficiency and enhance team collaboration, resulting
in measurable improvements to key performance indicators."

Edited into your voice: "Restructured how our support and
engineering teams triaged bugs together, cutting the average
time from bug report to fix from nine days to three."`,
        },
        {
          kind: "bullets",
          heading: "Sanity-checking the specific tool, not just \"AI\" in general",
          intro: "\"AI tools\" covers a wide range of things with different real risk levels — worth evaluating each on its own terms.",
          bullets: [
            "Resume-tailoring tools that reword existing bullets to match a posting: generally low-risk, as long as you verify every fact and number it touched is still true after the rewrite.",
            "Auto-apply browser extensions that submit applications on your behalf: useful for volume on roles you've already vetted, risky if left unsupervised on roles you haven't — set them loose only on your pre-approved target list, not an unfiltered search.",
            "AI interview-prep tools that generate practice questions or mock feedback: a reasonable way to rehearse, but treat the feedback as a starting opinion to sanity-check against a real person's read, not a verdict.",
            "Fully AI-written cover letters with no edit pass: the highest-risk category — these are the ones most likely to sound generic to an attentive reader, and the ones most worth the extra ten minutes to personalize.",
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
          kind: "example",
          heading: "What an unreviewed answer can actually cost you",
          body: "This is the failure mode that matters most — not a slightly generic cover letter line, but a factual answer that contradicts what's on your resume or what you'd honestly say on a call two weeks later.",
          code: `Screening question: "Are you open to relocating?"

Unreviewed AI answer (submitted automatically by an auto-apply
tool): "Yes, I am open to relocation for the right opportunity."

Reality: this candidate is not open to relocating, and said so
plainly on a recruiter call two weeks later. The recruiter
flagged the inconsistency immediately, and the process ended
there — not because of the honest answer, but because the
earlier one was never actually true.`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "The most common way auto-apply actually backfires",
          body: "It's rarely the tool submitting an obviously wrong application — it's the filter criteria being set too loosely at the start, so the tool applies to a wider band of roles than you'd have chosen by hand, some of which you'd never actually accept. Weeks later you're fielding recruiter calls and even interview invitations for jobs that don't fit, which wastes your time, wastes the recruiter's time, and burns goodwill with companies that might have been a real fit for a different role later. The fix isn't avoiding automation — it's setting the filter as tightly as your actual target list, not as loosely as the tool allows by default.",
        },
        {
          kind: "bullets",
          heading: "Questions worth asking before turning on any automation tool",
          intro: "A quick filter for whether a specific tool or feature is worth the risk for your search.",
          bullets: [
            "If this submits something wrong, how hard is it to notice and fix before it matters? A typo in a cover letter is recoverable; a wrong answer to \"desired salary\" already quoted to a recruiter is not.",
            "Is it operating only within a target list I've already vetted, or against an open-ended search I haven't reviewed?",
            "Would I be comfortable explaining, out loud in an interview, exactly what this tool generated on my behalf?",
            "Does using it save real time, or does the review-and-fix step end up costing about as long as just doing it myself?",
          ],
        },
        {
          kind: "diagram",
          heading: "Where automation should actually sit in the process",
          description: "The tools stay useful as long as they operate inside judgment you've already applied, not instead of it.",
          steps: [
            { label: "You build the target list", detail: "Judgment: which companies and roles are real fits" },
            { label: "Automation works inside that list", detail: "Form-filling, first drafts, volume on vetted roles" },
            { label: "You review anything with real stakes", detail: "Screening answers, facts, anything you'd defend live" },
            { label: "You decide what goes out", detail: "Automation removes friction — never the final judgment call" },
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
          kind: "example",
          heading: "What a reopened-connection message actually looks like",
          body: "The point isn't cleverness — it's low pressure and specific enough that it doesn't read as a form letter blasted to fifty contacts at once.",
          code: `"Hey Marcus — it's been a while! I'm exploring new roles in
product analytics right now and thought of you since I know
you made a similar move a couple years back. Would love to
hear how things are going on your end generally, and happy to
share what I'm looking at if it's ever useful. No pressure at
all either way."`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "The outreach mistakes that quietly kill response rate",
          body: "A generic connection request with no note gets ignored at a far higher rate than one with even a single sentence of context — LinkedIn's own data has shown this repeatedly. Leading with a job ask in the very first message, before any real conversation, reads as transactional and makes the easiest response \"no,\" or more often, silence. A message that's three paragraphs long asks a busy person for more effort to read than most will give a stranger. And a subject line or opener with zero specific detail — \"Quick question\" or \"Reaching out\" — gives someone no reason to prioritize opening it over the dozen other messages in their inbox that day.",
        },
        {
          kind: "bullets",
          heading: "What makes a small ask easy to say yes to",
          intro: "The goal of the first message is a yes, not a full conversation — everything about it should lower the effort of saying yes.",
          bullets: [
            "Name a specific, short amount of time — \"15 minutes\" is concrete and clearly bounded; \"pick your brain sometime\" is open-ended and easy to put off indefinitely.",
            "Offer options instead of asking them to do the scheduling work — \"happy to work around your schedule, or if it's easier I can send a couple times that work for me\" removes a step.",
            "Make it clear there's no obligation — \"no pressure either way\" isn't just politeness, it genuinely makes people more likely to say yes, since it removes the guilt of a potential no.",
            "Keep the ask singular — one call, not a call plus a resume review plus a referral request all bundled into the first message.",
          ],
        },
        {
          kind: "text",
          heading: "Handling silence or a no gracefully",
          body: [
            "Most cold outreach gets no response at all, and that's normal, not a sign you did something wrong — people are busy, and a message can fall through the cracks for reasons that have nothing to do with you. One polite follow-up after a week or two is reasonable; a second and third follow-up starts to cost more goodwill than it's likely to recover.",
            "If someone explicitly declines, thank them for responding at all (most people who decline still took the time to reply, which is worth acknowledging) and leave the door open for later — \"Totally understand, and I appreciate you letting me know. If your situation changes, I'd still love to connect down the line.\" People remember how a request was handled, and a graceful no today is often a warmer yes to a different ask months later.",
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
          kind: "diagram",
          heading: "The cold outreach flow",
          description: "Each step earns the next one — skipping to the ask too early is the most common way this goes wrong.",
          steps: [
            { label: "Find a specific reason", detail: "A real detail about their path, not \"can we connect\"" },
            { label: "Ask for something small", detail: "A 15-minute call, not a job" },
            { label: "Lead with curiosity", detail: "Genuine conversation, no agenda upfront" },
            { label: "Natural ask", detail: "Openings or a referral usually surface near the end" },
            { label: "Specific follow-up", detail: "Thank-you referencing something from the conversation" },
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
          kind: "diagram",
          heading: "The pipeline stages worth tracking",
          description: "Every role in your search sits at exactly one of these stages at any time — the value is in seeing all of them at once, not just the most recent one.",
          steps: [
            { label: "Applied", detail: "Submitted, logged with a date" },
            { label: "Screening", detail: "Recruiter or initial-round contact" },
            { label: "Interview", detail: "One or more real interview rounds" },
            { label: "Offer", detail: "Terms on the table" },
            { label: "Closed", detail: "Accepted, declined, or rejected" },
          ],
        },
        {
          kind: "example",
          heading: "What a real pipeline entry looks like, not just a field list",
          body: "The fields matter less than actually filling them in consistently — this is what one honest entry looks like mid-search, not a hypothetical template.",
          code: `Company: Meridian Health | Role: Senior Financial Analyst
Stage: Interview (round 2 scheduled)
Last action: Completed round 1, Fri 9/5
Next action: Follow up if no word by Fri 9/12
Notes: Hiring manager mentioned a decision timeline of
"2-3 weeks" — logged so a Friday follow-up doesn't read
as premature or impatient`,
        },
        {
          kind: "chart",
          heading: "What a stalled pipeline looks like at a glance",
          description: "A count at each stage, seen all at once, is far more useful than remembering individual roles one at a time — this shape (heavy at Applied, thin everywhere after) is exactly the pattern that should prompt a hard look at targeting.",
          chartType: "bar",
          unit: "roles",
          data: [
            { label: "Applied", value: 14 },
            { label: "Screening", value: 3 },
            { label: "Interview", value: 1 },
            { label: "Offer", value: 0 },
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
          kind: "callout",
          tone: "warning",
          heading: "Overbuilding the tracker defeats the purpose",
          body: "A spreadsheet with twenty columns — salary band, interviewer names, culture notes, a color-coded priority score — feels thorough the day you build it and gets abandoned within two weeks, because updating it is its own small chore every time something moves. The five fields this course recommends (company, role, stage, last action, next action) are close to the minimum that's still actually useful, and the entire point of choosing a minimum is that it's the version you'll actually keep updating three weeks into a search, not just on day one when everything still feels novel.",
        },
        {
          kind: "bullets",
          heading: "What to actually do when the pipeline reveals a stall",
          intro: "Seeing the pattern is only useful if it changes what you do next.",
          bullets: [
            "A cluster stuck at \"applied\" for several weeks: revisit whether the resume is genuinely tailored to those specific roles, not just sent as a strong general version.",
            "Response rate well below the illustrative targeted-search benchmark from earlier in this course: check whether the roles are actually a realistic level match, not just an aspirational one.",
            "Interviews happening but no offers: that's a different problem than a resume problem — it usually points to interview preparation, not targeting, and calls for a different fix.",
            "Nothing moving anywhere for over a month: it's worth asking a peer or mentor to review a sample application cold, since it's hard to see your own blind spots after weeks in the same search.",
          ],
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
          kind: "example",
          heading: "A headline rewrite, before and after",
          body: "The \"before\" version isn't wrong, exactly — it's just a title, which tells a recruiter nothing they couldn't already see from your current employer field. The \"after\" version does three jobs in one line: what you do, a specific result, and what you want next.",
          code: `Before: "Product Manager at Acme Corp"

After: "Product Manager | B2B SaaS Analytics | Scaled a
self-serve signup funnel from 2% to 9% conversion | Open to
Senior PM roles"`,
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Recommendations do more work than most people expect",
          body: "A line you write about yourself in the About section reads as a claim. The same line, written by a former manager or a peer who worked with you directly, reads as evidence — it's third-party validation in a way self-description can't replicate. Two or three specific, recent recommendations (not five generic ones from a decade ago) meaningfully change how a profile reads to someone skimming it for thirty seconds. Ask people you worked with closely and recently, and make the ask easy by reminding them of a specific project — most people are glad to write one but go blank without a concrete starting point.",
        },
        {
          kind: "bullets",
          heading: "A few smaller details worth checking that people routinely skip",
          intro: "None of these alone will make or break a search, but together they're the difference between a profile that looks maintained and one that looks abandoned.",
          bullets: [
            "A custom URL (linkedin.com/in/yourname rather than a string of numbers) — small, but it's what goes on a resume or business card, and the default version looks unfinished.",
            "A banner image that isn't the default gray — even a simple, on-brand graphic signals more care than the placeholder every unedited profile shares.",
            "The Featured section, used to pin one or two strong artifacts — a writing sample, a project, a talk — rather than left empty, which is its default state for most profiles.",
            "Visible, correct contact information — a surprising number of profiles bury or omit an email a recruiter would otherwise use to reach out directly instead of through an in-app message that can go unnoticed.",
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
