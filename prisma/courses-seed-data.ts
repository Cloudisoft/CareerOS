export interface CourseSeed {
  slug: string;
  title: string;
  description: string;
  category: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  order: number;
  lessons: { title: string; content: string; durationMinutes: number }[];
}

export const COURSES: CourseSeed[] = [
  {
    slug: "resume-writing-that-gets-interviews",
    title: "Resume Writing That Gets Interviews",
    description: "The structural and content decisions that actually move a resume from the reject pile to the interview list.",
    category: "Resume",
    level: "BEGINNER",
    order: 1,
    lessons: [
      {
        title: "Structure Before Style",
        durationMinutes: 6,
        content: `A resume gets scanned, not read — by a person spending 20-40 seconds on a first pass, and often by an applicant tracking system before that. Structure is what makes that scan work in your favor.

## The order that works

1. **Contact info** — name, email, phone, city/state (not full address), LinkedIn.
2. **Summary** — 2-3 lines, only if it adds something a title alone doesn't say.
3. **Experience** — reverse chronological. This is 70% of the page for most people.
4. **Skills** — a scannable list, grouped if you have more than 10.
5. **Education** — near the bottom unless you're a student or recent grad.

## What breaks the scan

- **Burying the job title.** Recruiters look for your most recent title and company first. If it's in a paragraph instead of a clear heading line, you've made them work for it.
- **Objective statements.** "Seeking a challenging role where I can grow" tells the reader nothing about what you'd do for them. Cut it.
- **Inconsistent dates.** If one entry says "2021-2023" and another says "March 2021 - Present," it reads as careless before anyone reads a word of content.
- **Two-column layouts with graphics.** They look modern to a human eye and are frequently unreadable to an ATS, which can scramble the text order entirely.

## The test

Cover the page with your hand and reveal it for five seconds. What do you remember? If it isn't your most recent title, your most recent company, and one number that shows impact, the structure needs work — before you touch a single sentence.`,
      },
      {
        title: "Turning Duties Into Impact",
        durationMinutes: 7,
        content: `The single biggest quality gap between resumes isn't grammar — it's the gap between describing a job and describing what you did in it.

## Duty vs. impact

- Duty: "Responsible for managing the customer support queue."
- Impact: "Cleared a 200-ticket backlog in six weeks by rewriting the triage process, cutting average response time from 18 hours to 4."

The second version answers the question every hiring manager actually has: *if I hire this person, what changes?*

## A repeatable rewrite pattern

For each bullet, answer three things:
1. **What did you actually do?** (the verb — led, built, negotiated, redesigned)
2. **On what?** (the specific thing — a process, a system, a budget, a team)
3. **What changed because of it?** (a number, a before/after, a consequence)

Bullet skeleton: *[Did X] by [doing Y], resulting in [Z].*

## When you don't have a clean number

Not every achievement has a tidy percentage attached, and inventing one is worse than not having it — a fabricated metric is the fastest way to lose credibility in an interview when someone asks you to walk through it. When there's no real number:
- Use scale instead: "across 12 markets," "for a team of 40," "serving 3,000 monthly users."
- Use before/after in words: "went from manual spreadsheet tracking to an automated weekly report."
- Use relative impact: "the fastest-growing account on the team that quarter."

## The verb audit

Read your bullets and circle the first word of each. If you see "responsible for," "helped with," or "worked on" more than once, rewrite those first — they describe presence, not action. Swap in the verb that actually matches what you did: owned, shipped, negotiated, cut, grew, fixed, launched.`,
      },
      {
        title: "Beating the ATS Without Gaming It",
        durationMinutes: 6,
        content: `Applicant tracking systems don't reject resumes with some secret algorithm — most of what trips them up is plain formatting and missing, honest keyword overlap with the posting.

## What actually matters

- **Use the words from the job posting, where true.** If the posting says "stakeholder management" and that's genuinely what you did, use that exact phrase somewhere — not a synonym only you would recognize as equivalent.
- **Standard section headers.** "Experience," "Education," "Skills" parse correctly. Creative alternatives like "Where I've Been" often don't.
- **Simple, single-column layout.** Tables, text boxes, and multi-column designs are the most common cause of an ATS reading your resume out of order or dropping sections entirely.
- **.docx or a text-selectable PDF.** Never submit a resume as a scanned image or a PDF exported from a design tool that flattens text into shapes.

## What doesn't work (and can backfire)

- **White text keyword stuffing.** Some systems flag this as manipulation, and any human reviewer who opens the file in a different viewer sees it instantly.
- **Repeating a skill five times to boost a match score.** It reads as padding to a person, even if a machine doesn't penalize it.
- **Listing every keyword from every posting you've ever seen.** If you can't speak to it in an interview, it shouldn't be on the resume — an ATS match that gets you an interview you can't back up wastes everyone's time, yours included.

## The honest keyword pass

Before submitting, read the posting once for required skills and tools, then check your resume actually contains the ones you truly have — not to invent matches, but to make sure real, relevant experience isn't described in different words than the posting uses for the same thing.`,
      },
      {
        title: "The One-Page Rule and When to Break It",
        durationMinutes: 5,
        content: `"Keep it to one page" is useful advice for most early-to-mid-career resumes and bad advice for a lot of senior ones. The real rule is narrower: every line should be earning its place.

## When one page is right

- Under ~8-10 years of relevant experience.
- A single, focused career track without major pivots.
- Applying to roles where depth in one or two recent jobs matters more than a full history.

## When two pages are defensible

- 12+ years of experience where cutting older, still-relevant roles would misrepresent your background.
- Multiple distinct career chapters (e.g., an individual contributor track followed by people management) that each need real space.
- Executive and technical-leadership resumes, where a one-page constraint forces you to cut context a hiring committee actually needs.

## What never justifies a third page

Almost nothing. If you're at three pages, the problem usually isn't length — it's that early-career roles are getting the same bullet-count as recent ones. A job from 12 years ago earns one line, not five.

## The cut test

For any bullet, ask: does removing this line lose something a reader needs to decide whether to interview me? If the honest answer is no, it's decoration, not content — cut it, regardless of what page you're on.`,
      },
      {
        title: "Proofreading Like a Recruiter Reads",
        durationMinutes: 4,
        content: `A single typo won't always sink a resume, but it changes how carefully the rest gets read — and in a competitive pile, that's a real cost.

## Read it in the wrong order

Reading top to bottom, your brain autocorrects what it expects to see. Break that pattern:
- **Read bullets bottom to top**, one at a time, out of context. It's much harder to skim past an error this way.
- **Read it out loud.** Awkward phrasing that looks fine on the page usually sounds wrong immediately.
- **Check numbers separately.** Do the math in every stat you cite. A resume claiming "cut costs 140%" undermines every other number on the page.

## The three passes worth doing

1. **Consistency pass** — tense (past roles in past tense, current role can be either but pick one and stick with it), date format, bullet punctuation (either all periods or none).
2. **Name pass** — company names, tool names, and product names spelled and capitalized exactly right. Getting your own former employer's name wrong is a quiet but real red flag.
3. **Fresh-eyes pass** — after writing, wait a few hours or a day before the final read. Errors hide in text you just wrote and reveal themselves in text you're seeing again.

## One more set of eyes

If you can, have someone outside the process read it — not for content, just for clarity: could they tell what you do and what you're good at from this page alone, in under a minute?`,
      },
    ],
  },
  {
    slug: "interview-prep-that-actually-works",
    title: "Interview Prep That Actually Works",
    description: "A practical approach to behavioral, technical, and conversational interview rounds — grounded in what interviewers are actually evaluating.",
    category: "Interviewing",
    level: "INTERMEDIATE",
    order: 2,
    lessons: [
      {
        title: "The STAR Method, Done Right",
        durationMinutes: 6,
        content: `STAR (Situation, Task, Action, Result) is well known — and most people still use it badly, because they treat it as a script instead of a shape.

## The shape, briefly

- **Situation** — one or two sentences of real context. Not a full backstory.
- **Task** — what you specifically were responsible for, not what the team was doing.
- **Action** — the largest share of the answer. What *you* did, step by step.
- **Result** — what happened, ideally with a number, and what you'd do differently if relevant.

## Where people go wrong

- **Spending 80% of the answer on Situation.** Interviewers need just enough context to understand the stakes, then want to hear about you.
- **Using "we" for the whole Action section.** If you were part of a team, say so once, then be explicit about your individual contribution: "I proposed X, then led the rollout while [teammate] handled Y."
- **Skipping Result entirely.** An answer that ends on an action with no outcome leaves the interviewer to guess whether it worked.
- **Picking a story that's actually about someone else.** If your best example of "handling conflict" is really a story where your manager resolved it, it doesn't answer the question that was asked.

## Building your story bank ahead of time

Don't improvise STAR answers live for the first time in the interview. Before you start applying, write out 6-8 real situations that cover: a conflict, a failure or mistake, a time you influenced without authority, a time you managed ambiguity, a time you went beyond your role, and your proudest piece of work. Most behavioral questions map onto one of these — you're not memorizing scripts, you're making sure you don't have to invent an example under pressure.`,
      },
      {
        title: `Answering "Tell Me About Yourself" Without Rambling`,
        durationMinutes: 5,
        content: `This is usually the first question and the one most people prepare least for, because it feels informal. Treat it as the most structured answer you'll give — it sets the frame for everything after it.

## The three-part shape

1. **Where you are now** — current role, in one sentence, focused on what's relevant to this job.
2. **How you got here** — the through-line, not the full history. Pick the 1-2 moves that explain your trajectory, skip the rest.
3. **Why this role** — connect your current direction to what you're applying for, specifically.

Aim for 60-90 seconds. Longer and you're narrating a resume the interviewer already has in front of them.

## What to leave out

- Personal life details unrelated to the role (this isn't the moment for them, even framed positively).
- A full chronological work history — that's what the resume is for.
- Self-deprecating framing ("I don't know, I guess I just kind of fell into this") that undercuts an otherwise strong background.

## A structure you can adapt every time

"I'm currently a [role] at [company], focused on [the part of the job most relevant here]. Before that, I [the 1-2 sentence version of how you got there — the pivot or theme, not every job]. What's drawing me to this role specifically is [genuine, specific reason tied to the job or company]."

Practice this out loud, not just in your head — the gap between what sounds fine internally and what sounds fine spoken is usually bigger than people expect.`,
      },
      {
        title: "Behavioral Questions: What They're Really Testing",
        durationMinutes: 6,
        content: `Behavioral questions ("tell me about a time...") aren't really asking for a story — they're using the story as evidence for a trait or skill the interviewer has already decided to evaluate. Knowing what's being tested changes how you answer.

## Common questions and what's actually being measured

- **"Tell me about a conflict with a coworker."** → Not whether you avoid conflict, but whether you handle it professionally and reach a resolution rather than escalating or going quiet.
- **"Tell me about a failure."** → Self-awareness and whether you extracted a real lesson, not whether the failure itself was severe. A small, honest failure with a clear lesson beats a vague, deflected big one.
- **"Tell me about a time you disagreed with your manager."** → Whether you can push back constructively without either capitulating silently or being insubordinate.
- **"Tell me about a time you had to learn something quickly."** → Adaptability and how you approach the unfamiliar, not the specific subject matter.

## The trap: the answer that avoids the question

A common failure mode is answering "tell me about a failure" with a humble-brag disguised as a weakness ("I just work too hard and forget to take breaks"). Interviewers hear this often enough to recognize it immediately, and it reads as evasive rather than self-aware.

## Preparing without sounding rehearsed

Know your story bank (from the STAR lesson), but don't memorize word-for-word scripts — you'll sound stiff, and a follow-up question will throw you off. Instead, know the shape of each story well enough that you could tell it starting from any point, because interviewers often ask a targeted follow-up like "what would you do differently?" that a memorized script doesn't cover.`,
      },
      {
        title: "Technical and Case Interviews: Thinking Out Loud",
        durationMinutes: 7,
        content: `Whether it's a coding problem, a system design question, or a business case, the single most common feedback from interviewers on these rounds is some version of "I couldn't tell what they were thinking." The evaluation is on your process as much as your answer.

## Narrate your reasoning

- State your understanding of the problem before solving it: "So if I'm understanding this right, you want me to..." This catches misunderstandings early and shows the interviewer how you interpret ambiguity.
- Say what you're about to try and why, before you try it: "I'll start with a brute-force approach to make sure I understand the problem, then optimize."
- When you hit a wrong turn, say so out loud rather than silently backtracking: "That's not going to work because of X — let me reconsider."

## Ask clarifying questions early

Jumping straight to a solution on an underspecified problem is a common mistake. A question like "what's the expected scale here?" or "should I assume the data is already cleaned?" often matters more to the evaluation than the eventual answer, because it shows you don't assume — you check.

## When you're stuck

Silence is the worst option. Say what you know, what you've ruled out, and what direction you're considering next: "I know this isn't quite right yet. My instinct is the issue is in how I'm handling the edge case where the list is empty — let me look there." An interviewer who sees a structured approach to being stuck often comes away more confident than one who watches a smooth answer to an easy question.

## After you land on an answer

Don't stop at "it works." Briefly note the tradeoffs: what's the time/space complexity, what would break at 10x the scale, what did you deliberately simplify. This is usually worth more than perfecting the first solution to a shine.`,
      },
      {
        title: "Questions to Ask Them (and Why It Matters)",
        durationMinutes: 5,
        content: `"Do you have any questions for us?" is not a formality — it's still part of the evaluation, and it's also your best chance to find out whether the role is actually right for you.

## Questions that signal real engagement

- "What does success look like in this role at 6 months and at a year?" — shows you're thinking about impact, not just getting hired.
- "What's the biggest challenge someone in this role would be dealing with in the first few months?" — surfaces real information you need, and demonstrates you're evaluating fit both ways.
- "How has this role changed since it was created, if at all?" — reveals whether the job is stable or still being defined.
- Something specific to that interviewer's own experience: "What's kept you here?" or "What's something that surprised you after joining?"

## Questions to avoid in most first rounds

- Anything answerable from the company's website or the job posting — it signals you didn't prepare.
- Compensation and benefits specifics, unless the interviewer raises it first — that's a conversation for a recruiter or a later stage.
- Yes/no questions that don't open a real conversation.

## Always have at least three ready

Have more prepared than you'll need, because earlier questions in the interview often get answered along the way. Running out of questions, or asking one that was already covered, is a small but avoidable miss. And if a question naturally came up and got answered during the conversation, say so — "you actually covered my question about X earlier" reads as attentive, not as having nothing to ask.`,
      },
    ],
  },
  {
    slug: "negotiating-your-offer",
    title: "Negotiating Your Offer",
    description: "A grounded approach to negotiating compensation and terms — what to research, what to say, and how to handle pushback.",
    category: "Negotiation",
    level: "INTERMEDIATE",
    order: 3,
    lessons: [
      {
        title: "Why Most People Leave Money on the Table",
        durationMinutes: 5,
        content: `Most candidates don't negotiate — not because they don't want more, but because negotiating feels uncomfortable and the downside (a rescinded offer) feels scarier than the upside is exciting. In practice, a reasonable, professional counter almost never costs someone an offer.

## The core reframe

An offer is very rarely a company's absolute final number — it's usually the number they expect a reasonable candidate might counter. Most companies build some room into an initial offer for exactly this conversation. Not negotiating doesn't just leave money on the table once; because future raises are usually a percentage of current pay, it compounds over years.

## What actually changes an outcome

- **Having a specific, researched number**, not a vague "I was hoping for more."
- **Being willing to have the conversation at all.** A large share of the gap between people who get more and people who don't is simply asking versus not asking.
- **Framing it as a genuine question, not a demand.** "Is there flexibility on the base?" invites a conversation; "I need $15k more or I walk" invites a standoff.

## What doesn't work

- Negotiating against yourself by opening with "I know this is probably not possible, but..."
- Making up a competing offer that doesn't exist — this is easy to get wrong in ways that are checkable, and even when it isn't caught, it's a bad foundation for a new working relationship.
- Negotiating everything at once in a scattered way instead of prioritizing what matters most to you.

The goal of this course isn't to turn negotiation into a battle — it's to make sure you ask the reasonable questions most people skip.`,
      },
      {
        title: "Researching Your Number Before You Need It",
        durationMinutes: 6,
        content: `The strongest negotiating position is knowing your number before the offer arrives — not scrambling to find one in the 48 hours you've been given to respond.

## Where to find real data

- **Levels.fyi, Glassdoor, and similar sites** for role- and company-specific ranges, cross-checked against more than one source since individual data points can be noisy.
- **Recruiters at other companies** you're in process with — a competing real range is some of the most credible information you can have.
- **Your own network** in similar roles, especially at similar-sized companies — direct conversations are often more accurate than aggregated site data.
- **Published pay bands**, where companies disclose them (increasingly common, especially in jurisdictions with pay transparency laws).

## Build a range, not a single number

Land on three figures:
- **Target** — what you'd be glad to get, grounded in real data, not a wish.
- **Walk-away** — the number below which you'd seriously reconsider, decided before the pressure of a live conversation.
- **Stretch** — a number you could justify if pushed to explain it, used as your opening ask.

## Factor in the full picture, not just base salary

Total compensation includes base, bonus target, equity (and its vesting schedule), sign-on bonus, and benefits. A lower base with strong equity can be a better deal than a higher base with none — but only if you actually understand the equity's real value and vesting terms rather than taking the headline number at face value.

Do this research before you're in a live negotiation. Trying to figure out your number while also responding to a recruiter's email is how people end up anchoring too low.`,
      },
      {
        title: "The First Conversation: How to Respond to an Offer",
        durationMinutes: 6,
        content: `How you respond in the first 24-48 hours after an offer sets the tone for everything that follows. The goal is to buy real time and open the door to a counter — without sounding evasive.

## Don't answer on the spot

When an offer comes in live (phone or video), it's completely normal to say: "Thank you, I'm excited about this. I'd like a couple of days to look everything over properly — can I follow up by [specific day]?" No reasonable employer penalizes this. It's expected.

## The counter-offer conversation

Once you've done your research (previous lesson), the ask can be simple and direct:

"Thank you again for the offer — I'm genuinely excited about the role. Based on my research into the market for this position and my experience with [specific relevant skill/background], I was hoping we could get closer to $X on the base. Is there flexibility there?"

Notice what this does: it confirms genuine interest (reduces the risk the company reads this as you shopping the offer elsewhere), gives a specific number, and grounds it in something other than "I want more."

## Handling common responses

- **"Let me check and get back to you."** — Normal. Don't fill the silence with a weaker follow-up while you wait.
- **"That's above our band for this level."** — Ask what would move you into a higher band, or whether other levers (sign-on, equity, title, start date) have more room.
- **A partial yes.** — A move from a firm "no" to "let me see what I can do" is real progress, even before a number changes.

## Get the final offer in writing

Once terms are agreed, confirm everything in writing before resigning from a current role or declining other offers — verbal agreements in a fast-moving process are easy to misremember or lose in the noise.`,
      },
      {
        title: "Negotiating Beyond Salary",
        durationMinutes: 5,
        content: `Base salary is often the least flexible number in an offer, because it's usually tied to a defined pay band. Other terms frequently have more room to move.

## Levers worth exploring

- **Sign-on bonus.** Often easier to approve than a base salary increase, since it's a one-time cost rather than a permanent line-item change.
- **Equity/RSU grant size.** At companies that compensate with equity, this can carry meaningfully more upside than a small base bump, especially early at a growing company.
- **Start date.** If you need more runway (relocation, notice period, a planned break), this is usually a low-friction ask.
- **Title.** Can matter for both internal leveling now and how your resume reads for the next role.
- **Remote/hybrid flexibility, or a review timeline.** Asking for a compensation review at 6 months instead of the standard 12 is a real, specific ask if you're taking the role at a number below your target.
- **Professional development budget, or relocation support**, where relevant.

## How to prioritize

Before the conversation, rank what actually matters to you. If equity matters more than a sign-on bonus, lead with that — asking for everything at once, with equal weight, makes it harder for the other side to say yes to any of it.

## A useful framing

"I understand the base might be fixed at this level. Is there flexibility on [the lever you care about most] instead?" This keeps the conversation collaborative rather than adversarial, and it signals you've thought about the offer as a whole package, not just one number.`,
      },
      {
        title: `Handling a "This Is Our Final Offer"`,
        durationMinutes: 5,
        content: `At some point in most negotiations, you'll hear some version of "this is the best we can do." How you respond here matters — both for this offer and for how the relationship starts if you accept.

## First, figure out if it's actually final

Not every "final offer" is truly final — sometimes it's a normal part of the process. A useful, low-risk way to check: "I understand. Is there anything else — sign-on, start date, or equity — that has more flexibility, even if the base doesn't?" This respects the stated limit while checking for any remaining room, without pushing back on the base number itself.

## If it genuinely is final

You have three real options:
1. **Accept it**, if it still meets your walk-away number and you want the role — a firm final offer isn't a loss if it was already a good outcome.
2. **Decline gracefully**, if it's below your walk-away number, leaving the relationship intact: "I really appreciate the offer and the process — at this point the compensation doesn't quite work for me, but I'd love to stay in touch." Companies remember candidates who decline professionally, and this door often reopens later.
3. **Ask for time to decide**, if you're genuinely unsure — this is a reasonable, normal request, not a stalling tactic, as long as you give a real, specific date you'll respond by.

## What not to do

- Don't issue an ultimatum you're not prepared to follow through on — bluffing that you'll walk, when you won't, damages your credibility if it's called.
- Don't reopen a number you already explicitly agreed to just because a new detail came up later — that reads as bad faith rather than a negotiation.
- Don't let frustration bleed into tone. Even a "no" from a company handled respectfully keeps a door open for a different role there in the future.

Negotiation, done well, isn't about extracting the maximum possible number — it's about making sure you didn't accept less than you needed to, simply because asking felt uncomfortable.`,
      },
    ],
  },
  {
    slug: "job-search-strategy-in-the-ai-era",
    title: "Job Search Strategy in the AI Era",
    description: "How to run a focused, high-signal job search instead of an exhausting high-volume one — and how to use tools like Career OS well within it.",
    category: "Job Search",
    level: "BEGINNER",
    order: 4,
    lessons: [
      {
        title: "Why Spray-and-Pray Doesn't Work Anymore",
        durationMinutes: 5,
        content: `Applying to hundreds of jobs with the same resume feels productive — it's activity you can point to — but it's usually a weaker strategy than applying to far fewer roles with real targeting.

## The math working against volume

When application volume goes up across the market broadly (automation makes applying nearly frictionless for everyone), the per-application response rate for generic applications tends to go down, not up — you're competing against more submissions for the same roles, most of them similarly untargeted. Volume alone doesn't overcome that; targeting does.

## What targeting actually buys you

- A resume and cover letter genuinely tailored to the role scores better with both an ATS and a human reader, because the overlap with the posting is real, not superficial.
- Fewer, better-matched applications means more energy per application for the parts that matter — a thoughtful cover letter, a warm introduction, real preparation if you get a screen.
- It's more sustainable. A search built on quantity alone burns people out well before it produces results.

## This doesn't mean apply to fewer total roles

It means being deliberate about where the volume goes. Automation (like Auto Apply) is genuinely useful for well-matched roles where the marginal cost of applying is low and the fit is real — it's a poor substitute for targeting, but a strong complement to it. The next lesson covers building the target list that automation should be working from.`,
      },
      {
        title: "Building a Target List Instead of a Job Board Habit",
        durationMinutes: 6,
        content: `Scrolling a job board daily feels like searching. A target list turns that scrolling into a plan.

## Building the list

1. **Start with roles, not just titles.** Write down what you actually want to be doing day-to-day, then translate that into the 2-4 titles that map to it (titles for the same work vary a lot company to company).
2. **List 20-40 companies**, not just roles — companies you'd genuinely want to work at, sized realistically against your experience level. Mix a few reaches, a solid core, and a few safer bets.
3. **For each company, note why it's on the list.** "Growing team in my space" is different from "known for strong mentorship" — knowing why helps you tailor a cover letter later without starting from scratch each time.

## Working the list

- Check target companies' career pages directly, not just aggregators — some roles are posted there first or only.
- Set up alerts for your target companies specifically, not just generic keyword alerts across every board.
- Revisit and prune the list every few weeks. Companies get removed (hiring freeze, role no longer exists) and added (something new comes up) — a target list is a living document, not a one-time exercise.

## Where this connects to matching tools

A tool that scores job-fit against your profile (like Career OS's match scoring) works best against a target list you've already curated with judgment — it's very good at telling you how well you match a role you've identified as worth applying to, and much less useful as your only method of discovering what to apply to in the first place. Use the tools to sharpen targeting, not replace it.`,
      },
      {
        title: "Using Auto Apply and AI Tools Without Losing Your Voice",
        durationMinutes: 6,
        content: `Automation and AI-assisted tailoring can meaningfully speed up a job search — and used carelessly, they can also produce a version of you that doesn't sound like you, right at the moment a real conversation with a human is most likely to happen.

## Where automation genuinely helps

- **Form-filling.** Retyping the same identity and work-history fields across dozens of ATS platforms is pure friction with no signal value — automating it is a clear win.
- **First-draft generation.** Having an AI-tailored cover letter or bullet rewrite as a starting point, that you then edit into your own voice, is faster than a blank page.
- **Volume on well-matched roles.** For roles that genuinely fit and have a low bar to apply, automation lets you cover more of your target list without every application being manual data entry.

## Where it needs a human check

- **Anything you'll be asked about in an interview.** If a tailored bullet or a generated screening answer describes something you can't actually speak to confidently, fix it before it goes out — not after someone asks a follow-up question you weren't expecting.
- **Free-text answers to nuanced screening questions.** AI-generated answers are a reasonable starting draft; they shouldn't be the final version without a read-through.
- **Anything that determines whether you'd actually take the role.** Don't let automation apply you into processes for jobs you wouldn't accept — that wastes an interview slot both for you and for the employer.

## The practical rule

Use automation to remove friction from the process, not to remove your judgment from it. A fast, tailored, honest application beats both a slow manual one and a fast generic one — automation should be getting you closer to the first, not settling for the third.`,
      },
      {
        title: "Networking That Doesn't Feel Like Networking",
        durationMinutes: 6,
        content: `"Networking" often conjures cold outreach that feels transactional on both ends. The version that actually works looks less like that and more like genuine, low-pressure conversation.

## Start with people you already know

Before reaching out cold, go through your existing network — former colleagues, classmates, people you've worked with adjacent to, even loosely. A message like "I'm exploring new roles in X — would love to hear how things are going for you, and happy to share what I'm looking at if useful" reopens a connection without asking for anything specific yet.

## Reaching out to people you don't know

- **Be specific about why you're reaching out to *them*.** "I saw you made a similar move from X to Y a couple years ago — would love to hear how that went" gets a real response far more often than "Can we connect?"
- **Ask for something small.** A 15-minute call, not a job. Most people are far more willing to talk about their own experience than to advocate for a stranger.
- **Lead with genuine curiosity, not an ask.** If the conversation goes well and there's a real opportunity to ask about openings or a referral, it usually comes up naturally near the end — forcing it early undercuts the conversation.

## After the conversation

Follow up with a short thank-you that references something specific from the conversation, not a generic "thanks for your time." If they offered to introduce you to someone or mentioned a role, give them an easy way to do it — a short forwardable blurb about what you're looking for, rather than putting the work back on them to figure out how to describe you.

## The long game

The best networking often isn't done while actively job searching at all — it's staying genuinely in touch with people over time, so that when you do need to reach out, it doesn't feel like the first contact in years. Since that's not always possible, the next best thing is being upfront and specific when you do reach out cold — people respond better to a clear, honest ask than a vague one.`,
      },
      {
        title: "Tracking Your Pipeline Like a Salesperson",
        durationMinutes: 5,
        content: `A job search is, functionally, a sales pipeline — you're moving a set of opportunities through stages, and most people manage it worse than they'd manage a work project with the same complexity.

## What to actually track

For every role past the "just applied" stage, track: company, role, stage (applied / screening / interview / offer / closed), the date of the last action, and the next action due. That's it — resist the urge to build something elaborate you won't maintain.

## Why this matters more than it seems

- **It surfaces where things are actually stalling.** If ten roles are stuck at "applied" with no response after three weeks, that's a targeting or resume-quality signal, not just bad luck.
- **It prevents dropped follow-ups.** "I'll follow up in a week" said to yourself with no tracking is how a promising lead quietly goes cold.
- **It reduces the emotional volatility of a search.** A visible pipeline with several things in motion is calmer to sit with than a mental tally that only registers the most recent rejection.

## Setting a follow-up cadence

A reasonable default: follow up around one week after applying if there's a real contact to follow up with, and again about two weeks after an interview if you haven't heard back, before assuming silence means no. Adjust to what the recruiter or posting actually says about timeline where they give you one.

## Reviewing the pipeline weekly

Once a week, look at the whole list: what moved, what's stalled, what needs a follow-up, what should be marked closed. This is also the natural moment to prune your target list (from an earlier lesson) and decide where to spend the next week's effort — on your strongest live opportunities, or on adding new ones to replace what's fallen through.`,
      },
    ],
  },
];
