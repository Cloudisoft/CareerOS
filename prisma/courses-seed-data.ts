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
  {
    slug: "cloud-computing-fundamentals",
    title: "Cloud Computing Fundamentals",
    description: "What cloud computing actually is, the core service models, and how to reason about AWS, Azure, and GCP without vendor-specific tunnel vision.",
    category: "Cloud",
    level: "BEGINNER",
    order: 5,
    lessons: [
      {
        title: "IaaS, PaaS, and SaaS — What You're Actually Renting",
        durationMinutes: 6,
        content: `"Cloud computing" covers a wide range of what you're actually responsible for versus what the provider manages. Understanding the layers is the foundation everything else builds on.

## The three core models

- **IaaS (Infrastructure as a Service)** — you get raw compute, storage, and networking (e.g., AWS EC2, Azure VMs, GCP Compute Engine). You manage the OS, runtime, and everything above it. Maximum control, maximum responsibility.
- **PaaS (Platform as a Service)** — the provider manages the OS and runtime; you deploy code (e.g., AWS Elastic Beanstalk, Heroku, Google App Engine). Less to manage, less control over the underlying environment.
- **SaaS (Software as a Service)** — a fully managed application you just use (e.g., Salesforce, Gmail, Slack). No infrastructure decisions at all.

## Why this distinction matters day to day

The model you're operating in determines what "your problem" actually means. On IaaS, an OS-level security patch is your responsibility. On PaaS, the provider handles it, but you're constrained to their supported runtimes and versions. Picking the wrong model for a task creates either unnecessary operational burden (running raw VMs for something PaaS would handle fine) or unnecessary constraints (fighting a PaaS platform's limits when you actually need OS-level control).

## Serverless is a further step, not a separate category

Functions-as-a-Service (AWS Lambda, Azure Functions, Google Cloud Functions) takes PaaS further: you deploy individual functions, the platform handles provisioning, scaling, and teardown entirely, and you pay per invocation rather than for idle capacity. The tradeoff is cold-start latency and execution time limits — not the right fit for every workload, but often the right fit for event-driven or bursty ones.

## The practical takeaway

When evaluating a new cloud service, the first real question isn't "which provider" — it's "which layer am I operating at, and does that match how much operational responsibility I actually want to own for this workload."`,
      },
      {
        title: "Core Services Across AWS, Azure, and GCP",
        durationMinutes: 7,
        content: `Once you understand one major cloud provider's core services, the others map onto the same concepts with different names. Learning the mapping is more useful than memorizing any one provider's console.

## Compute

- **AWS:** EC2 (VMs), Lambda (serverless), ECS/EKS (containers)
- **Azure:** Virtual Machines, Azure Functions, AKS (Kubernetes)
- **GCP:** Compute Engine, Cloud Functions, GKE (Kubernetes)

## Storage

- **Object storage** (unstructured files, accessed via API): S3 (AWS), Blob Storage (Azure), Cloud Storage (GCP).
- **Block storage** (attached disks for VMs): EBS (AWS), Managed Disks (Azure), Persistent Disk (GCP).
- **File storage** (shared network filesystems): EFS (AWS), Azure Files, Filestore (GCP).

## Databases

Each provider offers managed relational databases (AWS RDS, Azure SQL Database, Cloud SQL) and managed NoSQL options (DynamoDB, Cosmos DB, Firestore/Bigtable) — the managed part is the key value: automated backups, patching, and failover without running the database software yourself.

## Networking

All three share the same core concepts under different names: a virtual private network (VPC in AWS/GCP, VNet in Azure), subnets, security groups/firewall rules, load balancers, and a managed DNS service (Route 53, Azure DNS, Cloud DNS).

## Why the mapping matters more than any single provider

Employers rarely care which specific provider you've used most — they care whether you understand what a load balancer, a managed database, and a VPC actually do. If you've worked deeply with one provider, you can usually onboard onto another within days, because the underlying architecture concepts transfer almost completely.`,
      },
      {
        title: "Reasoning About Cost",
        durationMinutes: 6,
        content: `Cloud cost surprises are one of the most common operational failures for teams new to cloud infrastructure — not because pricing is secret, but because the pay-for-what-you-use model shifts the failure mode from "we didn't provision enough" to "we didn't notice we left something running."

## The core pricing levers

- **Compute:** pay per hour/second for the size of instance running, whether or not it's doing useful work. A VM left running idle over a weekend still bills.
- **Storage:** pay per GB stored, plus often per-request charges for object storage — a large number of small API calls can cost more than the storage itself.
- **Data transfer (egress):** moving data *out* of a cloud provider's network is usually billed; moving data *in* usually isn't. This asymmetry is a common source of surprise bills, especially for data-heavy workloads.
- **Reserved vs. on-demand:** committing to a specific instance type for 1-3 years (reserved) can cut compute costs 30-70% versus on-demand pricing, at the cost of flexibility.

## Common cost traps

- **Orphaned resources.** A deleted VM's attached storage volume, or an old load balancer nobody's using, keeps billing indefinitely until someone notices.
- **Over-provisioned instances.** Defaulting to a large instance "to be safe" when a workload's actual usage would fit a much smaller (cheaper) one.
- **Cross-region or cross-AZ data transfer** inside your own architecture, which is often billed even though it feels like "internal" traffic.

## Practical habits

- Tag resources by project/team from day one — untagged spend is nearly impossible to attribute later.
- Set up billing alerts before you need them, not after an unexpected invoice.
- Review a cost breakdown by service monthly, even briefly — cost trends are far easier to catch early than to untangle after months of drift.`,
      },
      {
        title: "Security Basics: Shared Responsibility",
        durationMinutes: 5,
        content: `Every major cloud provider operates on a "shared responsibility model" — and misunderstanding where the line falls is one of the most common causes of real cloud security incidents.

## What the provider secures

The provider is responsible for the security *of* the cloud: physical data center security, the hardware, the hypervisor, and the managed services' underlying infrastructure. This is generally extremely well handled — it's not where incidents typically originate.

## What you're responsible for

You're responsible for security *in* the cloud: how you configure what you're given. This includes:
- **Identity and access management (IAM).** Who can do what. Overly broad permissions ("just give it admin access, it's easier") are one of the most common real-world causes of cloud breaches.
- **Network configuration.** Security groups, firewall rules, and whether something that should be private is accidentally exposed to the public internet.
- **Data encryption.** Whether data at rest and in transit is actually encrypted — most providers make this easy, but it's rarely on by default for everything.
- **Publicly exposed storage.** Misconfigured object storage buckets left publicly readable is one of the single most common real-world cloud data exposure incidents, and it's entirely a configuration choice, not a provider failure.

## The practical baseline

- Grant the minimum permissions a role actually needs (least privilege), not the most convenient.
- Never use root/owner-level account credentials for day-to-day work — create scoped roles.
- Enable multi-factor authentication on any account with meaningful access.
- Treat "it's just a quick test, I'll fix the permissions later" as the exact pattern that causes real incidents — fix it before deploying, not after.

Cloud security failures are overwhelmingly configuration failures, not provider failures — which is the encouraging part: they're within your control to prevent.`,
      },
    ],
  },
  {
    slug: "devops-and-ci-cd-fundamentals",
    title: "DevOps and CI/CD Fundamentals",
    description: "The practices and pipeline concepts that turn 'it works on my machine' into a reliable, repeatable path from commit to production.",
    category: "DevOps",
    level: "INTERMEDIATE",
    order: 6,
    lessons: [
      {
        title: "What DevOps Actually Means",
        durationMinutes: 5,
        content: `"DevOps" gets used loosely enough to mean almost anything. At its core, it's a specific idea: breaking down the separation between the people who write software and the people who operate it, so that the team building something is also accountable for how it runs in production.

## The cultural shift, briefly

Before DevOps became common practice, it was typical for a development team to "throw code over the wall" to a separate operations team, who then had to run it without having written it — leading to friction, slow releases, and each side blaming the other when something broke in production.

## The practical pillars

- **Automation.** Manual deployment steps are slow and error-prone; automating them (via CI/CD) makes releases fast and repeatable.
- **Shared ownership.** The team that builds a service is also on the hook for its reliability — this incentivizes writing operable, observable code rather than code that merely passes tests.
- **Fast feedback loops.** Small, frequent changes with fast feedback (does it build, does it pass tests, is it healthy in production) beat large, infrequent releases where problems surface late and are expensive to isolate.
- **Infrastructure as code.** Environments defined in version-controlled configuration rather than manually clicked together, so they're reproducible and reviewable like any other code change.

## What DevOps is not

It's not a job title alone, though "DevOps Engineer" roles exist and typically focus on building the automation and tooling that makes these practices possible. And it's not simply "using Docker" or "using Kubernetes" — those are tools that support DevOps practices, not DevOps itself. A team can use every modern tool and still not practice DevOps if deployments are still manual, infrequent, and owned by a separate team from the people who wrote the code.`,
      },
      {
        title: "CI/CD Pipelines, Step by Step",
        durationMinutes: 7,
        content: `A CI/CD pipeline automates the path from a code change to a running deployment. Understanding each stage — and what it's actually checking for — makes pipeline configuration far less mysterious.

## Continuous Integration (CI)

Triggered on every code push, typically:
1. **Build** — compile the code / install dependencies, catching anything that doesn't even build.
2. **Lint/format check** — catch style and obvious-error issues automatically, before a human reviewer has to.
3. **Automated tests** — unit tests (fast, isolated) and often integration tests (slower, exercise more of the real system).
4. **Security/dependency scanning** — checking for known vulnerabilities in dependencies, often automated as a standard gate.

The point of CI is to catch problems within minutes of a change, while the context is still fresh, rather than days later during a manual QA pass.

## Continuous Delivery vs. Continuous Deployment

These terms are often used loosely, but the distinction matters:
- **Continuous Delivery** — every change that passes CI is automatically built into a release-ready artifact, but a human still triggers the actual production deployment.
- **Continuous Deployment** — every change that passes CI deploys to production automatically, with no manual gate.

Continuous Deployment requires real confidence in your test coverage and monitoring — it's the more mature end state, not necessarily the right starting point for every team.

## Common pipeline stages after CI passes

- **Deploy to a staging environment** that mirrors production, for a final check.
- **Run smoke tests** against staging — a quick check that core functionality actually works, not just that the code compiled.
- **Deploy to production**, often using a strategy (next lesson) that limits blast radius if something's still wrong.
- **Post-deploy verification** — automated health checks confirming the new version is actually serving traffic correctly.

## Why this matters for anyone, not just "DevOps engineers"

Even as an individual contributor, understanding what each pipeline stage checks for changes how you write code and tests — you write with the pipeline's checks in mind, rather than treating CI as a mysterious gate that sometimes fails for reasons you don't understand.`,
      },
      {
        title: "Containers and Docker, Conceptually",
        durationMinutes: 6,
        content: `Containers solve a specific, real problem: "it works on my machine" — where an application behaves differently across environments because of differences in installed dependencies, OS versions, or configuration.

## What a container actually is

A container packages an application together with everything it needs to run — dependencies, runtime, system libraries, configuration — into a single, portable unit. Unlike a full virtual machine, containers share the host OS kernel, making them far lighter weight and faster to start.

## The key mental model

A **Docker image** is a snapshot — the packaged application and its dependencies, built once. A **container** is a running instance of that image. You can run many containers from the same image, each an isolated instance, the same way you can run multiple instances of a program from the same executable.

## Why this solves the "works on my machine" problem

If the image itself contains the exact runtime version, exact dependency versions, and exact configuration, then a container built from that image behaves identically whether it's running on a developer's laptop, a CI server, or production — because it's not relying on whatever happens to be installed on the host machine.

## Dockerfiles, briefly

A Dockerfile is the recipe for building an image: start from a base image (e.g., a specific OS + language runtime), copy in application code, install dependencies, specify how to start the application. Each instruction adds a layer, and Docker caches layers that haven't changed — which is why dependency installation is typically ordered before copying application code, so that code changes don't invalidate the (slower) dependency-install cache layer.

## Where this connects to orchestration

Running one container is straightforward. Running dozens of containers across multiple machines, handling failures, scaling up and down, and routing traffic between them is what container orchestration platforms like Kubernetes exist to manage — a genuinely deep topic on its own, built entirely on the container fundamentals covered here.`,
      },
      {
        title: "Deployment Strategies That Limit Blast Radius",
        durationMinutes: 6,
        content: `Deploying a new version by simply replacing the old one everywhere at once works — until the new version has a problem, at which point every user is affected simultaneously. Several strategies exist specifically to avoid that.

## Rolling deployment

Instances are updated a few at a time rather than all at once, so at any moment some instances run the old version and some run the new one. If a problem appears partway through, the rollout can be paused with only a fraction of traffic affected. The tradeoff: both versions run simultaneously during the rollout, so they need to be compatible with the same data/API contracts.

## Blue-green deployment

Two full environments exist: "blue" (currently live) and "green" (the new version). Traffic is switched from blue to green all at once, after green has been verified healthy. If something's wrong, switching back to blue is immediate. The tradeoff: running two full environments simultaneously costs more, even briefly.

## Canary deployment

A new version is released to a small percentage of real traffic first (e.g., 5%), monitored closely, and only rolled out further if it's healthy. This catches problems that only appear under real production load or with real user behavior — the kind of issue that passes every automated test but fails in practice. The tradeoff: it requires good monitoring to actually notice a problem in that small percentage before expanding further.

## Feature flags, as a complementary tool

Deploying code and *releasing* a feature don't have to be the same event. A feature flag lets new code ship to production dark (inactive), then get turned on for specific users or gradually ramped up — independent of the deployment itself. This decouples "is the code safely deployed" from "is the feature ready for users," which is a genuinely useful separation once a team's release process matures.

## The common thread

Every one of these strategies exists to answer the same question: if this deployment has a problem, how many real users find out before someone notices and can respond? The right strategy for a given team depends on how much that blast radius actually matters for the system in question.`,
      },
    ],
  },
  {
    slug: "cybersecurity-fundamentals-for-it",
    title: "Cybersecurity Fundamentals for IT Professionals",
    description: "The core security principles, common attack vectors, and practical habits that apply across almost every IT role — not just dedicated security positions.",
    category: "Security",
    level: "BEGINNER",
    order: 7,
    lessons: [
      {
        title: "The CIA Triad and Why It's the Starting Point",
        durationMinutes: 5,
        content: `Nearly every security decision can be framed against three properties: Confidentiality, Integrity, and Availability. It's a simple model, and precisely because it's simple, it's a genuinely useful lens for evaluating almost any security question.

## The three properties

- **Confidentiality** — only authorized people/systems can access the data. A data breach is a confidentiality failure.
- **Integrity** — data hasn't been tampered with, whether maliciously or accidentally. A system that lets anyone silently modify financial records has an integrity failure, even if access is otherwise well-controlled.
- **Availability** — authorized users can actually access the system when they need to. A denial-of-service attack is purely an availability failure — it doesn't steal or alter data, it just makes the system unusable.

## Why thinking in these terms is useful

Different systems weight these differently. A public read-only status page cares enormously about availability and barely about confidentiality (there's nothing secret on it). A system holding medical records cares enormously about confidentiality and integrity, and somewhat less about maximum availability (some downtime during a security incident is an acceptable tradeoff for preventing a breach). Framing a security decision as "which of these three am I protecting, and what am I trading off" clarifies decisions that otherwise feel abstract.

## A concrete example

Encrypting a database protects confidentiality (an attacker who steals the raw files can't read them) but does nothing for availability (a ransomware attack can still lock you out of your own encrypted data) — which is why a real security posture layers multiple protections rather than relying on any single measure to cover all three properties at once.`,
      },
      {
        title: "Common Attack Vectors",
        durationMinutes: 7,
        content: `Understanding how systems actually get compromised — in practice, not in theory — makes every other security practice make more sense.

## Phishing and social engineering

The overwhelming majority of real breaches start with a human, not a technical vulnerability — a convincing email that gets someone to click a malicious link, enter credentials on a fake login page, or run an attachment. No firewall stops this; it's addressed through awareness and, critically, systems designed so that one person's mistake doesn't cascade into full compromise (see least privilege, next lesson).

## Credential-based attacks

- **Credential stuffing** — attackers use username/password pairs leaked from one breach to try logging into other, unrelated services, betting on password reuse. This is why unique passwords per service (via a password manager) matters more than password complexity alone.
- **Brute force** — systematically trying passwords until one works, mitigated by rate limiting, account lockouts, and multi-factor authentication.

## Injection attacks

- **SQL injection** — untrusted input is concatenated directly into a database query, letting an attacker manipulate the query itself. Prevented reliably by using parameterized queries (never string-concatenating user input into SQL) — a solved problem technically, but still a common real-world vulnerability because the fix isn't always applied consistently.
- **Cross-site scripting (XSS)** — untrusted input is rendered as executable code in another user's browser, letting an attacker run scripts in that user's session. Prevented by properly escaping/encoding output, not just sanitizing input.

## Misconfiguration

Not an "attack" in the traditional sense, but one of the most common real causes of breaches: a publicly exposed storage bucket, an admin panel left with default credentials, an overly permissive firewall rule. These aren't sophisticated exploits — they're mistakes an attacker only has to find, not create.

## The practical implication

Most real breaches don't involve a novel, sophisticated technique — they exploit a known category of weakness (a reused password, an unpatched system, a misconfigured permission) that a fairly standard security practice would have prevented. Getting the fundamentals right closes far more real risk than chasing exotic threats.`,
      },
      {
        title: "Least Privilege and Defense in Depth",
        durationMinutes: 5,
        content: `Two principles do more real-world security work than almost any specific tool: give people and systems only the access they actually need, and never rely on a single layer of protection.

## Least privilege

Grant the minimum access required to do a job — no more. This isn't about distrust; it's about limiting the damage a mistake or a compromised account can do. If a marketing analyst's account only has read access to a reporting dashboard, a phished password there can't reach customer payment data. If it has broad admin access "just in case," the blast radius of that same phishing email is far larger.

Practical applications:
- Application service accounts get only the specific database permissions they need — not full admin access, even if it's more convenient during development.
- Temporary elevated access (for a specific task) beats permanent elevated access "in case it's needed again."
- Regularly review who has access to what — permissions tend to accumulate over time as people change roles, and rarely get revoked without a deliberate review.

## Defense in depth

No single security control is perfect, so real security posture layers multiple independent controls — if one fails, others still limit the damage.

Example layering for a web application:
1. **Network level** — firewall rules restricting what can even reach the server.
2. **Application level** — input validation, authentication, authorization checks.
3. **Data level** — encryption at rest, so even a successful breach yields unreadable data.
4. **Monitoring** — logging and alerting, so a breach is detected quickly rather than discovered months later.

If an attacker gets past the network layer, the application layer is still a real barrier. If they get past both, encrypted data is still not immediately useful to them. No individual layer needs to be perfect for the combination to meaningfully reduce real risk.

## Why both principles together matter

Least privilege limits how much any single compromised point can reach. Defense in depth ensures no single compromised point is enough on its own. Neither substitutes for the other — a tightly-scoped account behind zero other protections, or a heavily-layered system where every account has full access, both fail in the same way, just from different directions.`,
      },
      {
        title: "Practical Security Hygiene",
        durationMinutes: 5,
        content: `Most of the security value in day-to-day IT work comes from a small set of unglamorous, consistently-applied habits — not from advanced tooling.

## Patching

Unpatched software is one of the most common real causes of breaches, because known vulnerabilities are, by definition, publicly documented — an attacker doesn't need to discover anything, just check whether a system has applied a fix that's already known. A reasonable patching cadence (especially for anything internet-facing) closes more real risk than most other single practices.

## Multi-factor authentication (MFA)

A stolen or guessed password alone should not be enough to access a system. MFA — a second factor beyond the password (an authenticator app code, a hardware key) — stops the overwhelming majority of credential-based attacks even when a password is compromised. Enabling it broadly, especially on anything with meaningful access, is one of the highest-value, lowest-effort security improvements available.

## Backups, tested

A backup that's never been tested for restoration isn't a reliable backup — it's an assumption. Ransomware specifically targets backups where possible, which is why an offline or immutable backup copy (one an attacker with system access can't also encrypt or delete) matters, not just having a backup that exists somewhere on the same network.

## Logging and monitoring

A breach that isn't noticed for months does far more damage than one caught within hours. Centralized logging and basic alerting on unusual activity (a login from an unexpected location, a sudden spike in data access) turns "we found out three months later from a customer" into "we caught this within the hour."

## The unifying theme

None of this requires exotic tooling or deep specialization — it requires consistency. A sophisticated security architecture with unpatched systems and no MFA is weaker in practice than a simple architecture where these basics are actually, reliably applied.`,
      },
    ],
  },
  {
    slug: "networking-fundamentals",
    title: "Networking Fundamentals",
    description: "How data actually moves between systems — the model, the protocols, and the troubleshooting instincts that make networking issues less opaque.",
    category: "Networking",
    level: "BEGINNER",
    order: 8,
    lessons: [
      {
        title: "The OSI Model, Practically",
        durationMinutes: 6,
        content: `The seven-layer OSI model is often taught as something to memorize for an exam. It's more useful as a mental checklist for isolating where a networking problem actually lives.

## The layers, briefly (bottom to top)

1. **Physical** — actual cables, radio signals, electrical signals.
2. **Data Link** — how devices on the same local network address each other (MAC addresses, switches).
3. **Network** — how data finds its way across different networks (IP addresses, routers). This is where "the internet" mostly lives conceptually.
4. **Transport** — reliable (TCP) or fast-but-unreliable (UDP) delivery between two endpoints, including ports.
5. **Session** — managing a connection's lifecycle (less commonly a distinct troubleshooting concern in modern practice).
6. **Presentation** — data format/encoding (e.g., TLS encryption often gets discussed here).
7. **Application** — what the user-facing protocol actually is (HTTP, DNS, SMTP).

## Why this ordering is the practically useful part

When something's broken, working through the layers from bottom to top is a genuinely efficient debugging method: Is the cable/wifi actually connected (physical)? Does the device have a valid IP address (network)? Can it reach the destination port at all (transport)? Is the application-level request actually succeeding (application)? Most people jump straight to application-layer debugging ("the website's down!") when the actual problem is two layers lower ("this device has no network connectivity at all").

## A concrete example

"I can't reach this website" could mean: no physical network connection, no IP address assigned (DHCP failure), DNS isn't resolving the domain to an IP, the server's port isn't reachable (firewall or the service isn't running), or the server is reachable but returning an error. Each of these is diagnosable with a specific tool (ping, ipconfig/ifconfig, nslookup/dig, telnet/curl) — and knowing which layer you're checking tells you which tool actually answers the question.`,
      },
      {
        title: "TCP/IP and How Data Actually Travels",
        durationMinutes: 6,
        content: `Beneath every web request, every video call, and every file transfer is the same underlying model: data broken into packets, addressed, and routed across networks using TCP/IP.

## IP addresses: where something is

An IP address identifies a device on a network — IPv4 addresses (like 192.168.1.1) are the most common, though the internet is gradually transitioning to IPv6 to accommodate far more addresses than IPv4 space allows. Private IP ranges (like 192.168.x.x, 10.x.x.x) are used inside local networks and aren't directly reachable from the public internet — which is what NAT (Network Address Translation) exists to bridge.

## TCP vs. UDP: how reliably it travels

- **TCP (Transmission Control Protocol)** — establishes a connection, guarantees delivery and correct ordering, retransmits lost packets. Used where correctness matters more than raw speed: web browsing, file transfer, email.
- **UDP (User Datagram Protocol)** — no connection setup, no delivery guarantee, no retransmission. Faster and lower overhead, used where speed matters more than occasional loss: video calls, live streaming, online gaming (a dropped frame is less costly than the delay of waiting for a guaranteed retransmission).

## Ports: which service on that device

A single device can run many network services simultaneously — a port number (0-65535) identifies which one a given piece of traffic is for. Well-known ports are conventional, not enforced: 80 (HTTP), 443 (HTTPS), 22 (SSH), 53 (DNS). This is why a firewall rule often specifies both an IP range and a port — "allow traffic to this address, but only on port 443."

## Putting it together

A web request is, underneath, a TCP connection to a specific IP address on port 443, carrying an HTTP request as its payload, broken into packets that get routed independently across the internet's infrastructure and reassembled in order at the destination. Every layer discussed in the previous lesson is doing real work in that single, everyday action.`,
      },
      {
        title: "DNS: How Names Become Addresses",
        durationMinutes: 5,
        content: `DNS (Domain Name System) is the system that turns a human-readable domain name into the IP address a computer actually needs to connect to. It's also one of the most common sources of "mysterious" connectivity problems, because a DNS failure often looks like the destination itself is down.

## The resolution process, simplified

1. Your device asks a DNS resolver (often provided by your ISP or a public one like 8.8.8.8) to resolve a domain.
2. If the resolver doesn't already have the answer cached, it queries the authoritative chain: root servers → the domain's top-level-domain (TLD) servers → the domain's own authoritative nameservers.
3. The authoritative nameserver returns the actual IP address, which gets cached at various points along the way (by your resolver, sometimes by your own device) for a duration set by the DNS record's TTL (time to live).

## Common DNS record types

- **A record** — maps a domain to an IPv4 address.
- **AAAA record** — maps a domain to an IPv6 address.
- **CNAME record** — maps a domain to another domain name, rather than directly to an IP.
- **MX record** — specifies which mail servers handle email for a domain.
- **TXT record** — arbitrary text, commonly used for domain verification and email security (SPF/DKIM/DMARC records).

## Why DNS problems are so often misdiagnosed

If DNS fails to resolve, the symptom is usually "I can't reach this site at all" — which looks identical to the server actually being down, even though the server may be perfectly healthy and simply unreachable because its name isn't resolving to the right address. This is exactly why "check DNS" is one of the first real troubleshooting steps, not a last resort: running nslookup or dig against the domain quickly confirms whether the name is resolving correctly before spending time investigating the server itself.

## TTL and propagation delay

When a DNS record changes (e.g., pointing a domain at a new server), that change doesn't take effect everywhere instantly — cached copies at resolvers around the world persist until their TTL expires. This is why DNS changes can take anywhere from minutes to (rarely) a day or more to be visible everywhere, and why lowering a record's TTL in advance of a planned change is a common practice to speed up the eventual cutover.`,
      },
      {
        title: "Troubleshooting Connectivity Like a Checklist",
        durationMinutes: 5,
        content: `Networking problems feel overwhelming mostly because people try to reason about them all at once. Working through a fixed checklist, bottom to top, turns a vague "the internet is broken" into a specific, diagnosable problem.

## A practical troubleshooting order

1. **Is there a physical/link-level connection?** Cable plugged in, wifi actually connected, link light on. (ipconfig/ifconfig shows an interface as up.)
2. **Does the device have a valid IP address?** A device with no address, or a fallback "link-local" address (like 169.254.x.x), didn't get one from DHCP — the problem is here, not further up the stack.
3. **Can it reach the local gateway?** Ping the default gateway address. If this fails, the problem is local — not a general "internet is down" issue.
4. **Can it reach something outside the local network?** Ping a known, reliable public IP (like 8.8.8.8) to test general internet connectivity without involving DNS at all.
5. **Does DNS resolve?** Run nslookup or dig against the domain. If step 4 works but this fails, the problem is specifically DNS, not general connectivity.
6. **Is the specific port/service reachable?** telnet to the host on the target port, or curl -v against the URL, tests whether the actual service is responding, isolating problems at the application layer from everything below it.

## Why this order specifically

Each step assumes everything before it works — so a failure at any given step tells you precisely where to focus, instead of investigating the entire stack at once. Someone who jumps straight to "is the website's code broken?" when the real problem is "this device never got a valid IP address" wastes significant time investigating the wrong layer entirely.

## The habit worth building

Even informally, running through this order mentally before diving deep into any specific layer saves real time — most "network is broken" problems turn out to be resolved by identifying which of these six steps actually fails, not by deep expertise in any one of them.`,
      },
    ],
  },
  {
    slug: "sql-and-database-fundamentals",
    title: "SQL and Database Fundamentals",
    description: "The relational model, writing real queries, and the indexing and normalization concepts that separate a database that works from one that scales.",
    category: "Databases",
    level: "BEGINNER",
    order: 9,
    lessons: [
      {
        title: "The Relational Model and Why Tables Work",
        durationMinutes: 5,
        content: `A relational database organizes data into tables — rows and columns — connected to each other through shared keys. Understanding *why* this model works is more useful than memorizing SQL syntax in isolation.

## Tables, rows, and columns

A table represents one type of entity (e.g., "customers," "orders"). Each row is one instance of that entity; each column is one attribute of it. A "customers" table might have columns for id, name, and email, with each row being one actual customer.

## Primary keys: uniquely identifying a row

Every table typically has a primary key — a column (or combination of columns) that uniquely identifies each row. This is what lets other tables reference a specific row reliably, even if other attributes (like a name) might not be unique on their own.

## Foreign keys: connecting tables

A foreign key is a column in one table that references a primary key in another — this is how relational databases represent relationships without duplicating data. An "orders" table with a customer_id column referencing the "customers" table's primary key means each order is linked to exactly one customer, without repeating that customer's full details in every order row.

## Why normalize instead of one giant table

You could store everything — customer info, order info, product info — in a single flat table, but this creates real problems: a customer's email appears once per order they've placed, so updating it means updating potentially hundreds of rows, and any inconsistency between those copies becomes a real data integrity bug. Splitting related data into separate, linked tables (normalization) means each fact is stored once, and relationships handle the connections. The next lesson covers this in more depth.

## The mental model worth keeping

A relational database isn't just "a place to put data" — it's a structured way of representing real-world entities and the relationships between them, in a form the database can enforce consistency on (through keys and constraints) rather than trusting application code to keep everything in sync manually.`,
      },
      {
        title: "Writing Real Queries",
        durationMinutes: 7,
        content: `SQL (Structured Query Language) is how you ask a relational database for data, or tell it to change data. A small set of core statements covers the overwhelming majority of real usage.

## SELECT: reading data

\`\`\`sql
SELECT name, email FROM customers WHERE signup_date > '2026-01-01' ORDER BY signup_date DESC LIMIT 10;
\`\`\`

This reads as: get the name and email columns, from the customers table, filtered to rows where signup_date is after a given date, sorted newest first, limited to 10 rows. Each clause does one specific job, and they compose in a consistent order (SELECT → FROM → WHERE → ORDER BY → LIMIT).

## JOIN: combining data across tables

Since related data lives in separate tables (previous lesson), reading a complete picture usually means joining them:

\`\`\`sql
SELECT orders.id, customers.name
FROM orders
JOIN customers ON orders.customer_id = customers.id;
\`\`\`

This connects each order to its customer's name via the foreign key relationship. An **INNER JOIN** (the default) only returns rows that match in both tables; a **LEFT JOIN** returns all rows from the left table even if there's no match in the right one (with NULLs filling the gap) — the distinction matters a lot in practice: using INNER JOIN when you actually needed LEFT JOIN silently drops rows that should have appeared.

## INSERT, UPDATE, DELETE: changing data

\`\`\`sql
INSERT INTO customers (name, email) VALUES ('Jane Smith', 'jane@example.com');
UPDATE customers SET email = 'new@example.com' WHERE id = 42;
DELETE FROM customers WHERE id = 42;
\`\`\`

The WHERE clause in UPDATE and DELETE is doing critical work — omitting it updates or deletes *every row in the table*, which is one of the most common, most damaging real-world SQL mistakes. Always write and verify the WHERE clause (often by running the equivalent SELECT first) before running an UPDATE or DELETE in a real environment.

## Aggregation: summarizing data

\`\`\`sql
SELECT customer_id, COUNT(*) AS order_count, SUM(total) AS total_spent
FROM orders
GROUP BY customer_id
HAVING COUNT(*) > 5;
\`\`\`

GROUP BY collapses rows sharing a value into summary rows; aggregate functions (COUNT, SUM, AVG, MAX, MIN) compute over each group; HAVING filters *after* aggregation (unlike WHERE, which filters before) — a common source of confusion until the distinction clicks.`,
      },
      {
        title: "Indexing: Why Some Queries Are Slow",
        durationMinutes: 6,
        content: `A database without the right index has to scan every row to answer a query — fine for a thousand rows, genuinely painful for tens of millions. Indexing is the single highest-leverage performance concept in practical database work.

## What an index actually is

An index is a separate, ordered data structure (typically a B-tree) that lets the database find rows matching a condition without scanning the entire table — conceptually similar to a book's index letting you jump to a page instead of reading cover to cover to find a topic.

## When an index helps

- Columns frequently used in WHERE clauses.
- Columns used to JOIN tables (foreign keys especially — many databases don't index these automatically, which is a common, quietly serious performance gap).
- Columns used in ORDER BY, since a sorted index can avoid a separate sort step entirely.

## When an index doesn't help (or actively hurts)

- **Small tables.** A full scan of a few hundred rows is already fast; the index adds overhead without meaningful benefit.
- **Columns rarely queried.** An index only helps queries that actually use it — indexing every column "just in case" adds real cost without proportional benefit.
- **Write-heavy tables.** Every index must be updated on every INSERT/UPDATE/DELETE, so excessive indexing slows down writes to speed up reads that may not need it.
- **Low-cardinality columns** (few distinct values, like a boolean flag) — an index here often doesn't narrow the search space enough to be worth using.

## Reading a query plan

Most databases offer an EXPLAIN (or EXPLAIN ANALYZE) command that shows *how* a query will actually be executed — whether it's using an index or falling back to a full table scan. This is the concrete way to verify whether an index is helping, rather than assuming: a query that "should" be fast but isn't is often traceable directly to a missing or unused index visible right there in the plan.

## The practical habit

Add indexes deliberately, based on the queries a table actually needs to serve well — not reflexively on every column, and not only after a production slowdown forces the investigation. A quick EXPLAIN on a new query during development, before it ever reaches production scale, catches most of these problems early and cheaply.`,
      },
      {
        title: "Transactions and Data Integrity",
        durationMinutes: 5,
        content: `Some operations need multiple steps to complete together, or not at all — transferring money between two accounts, for instance, requires both a debit and a credit to succeed together. Transactions exist exactly for this.

## ACID, briefly

- **Atomicity** — a transaction either completes entirely or has no effect at all; there's no partial state where the debit happened but the credit didn't.
- **Consistency** — a transaction moves the database from one valid state to another, respecting all defined constraints (like foreign keys, uniqueness).
- **Isolation** — concurrent transactions don't interfere with each other's intermediate states; each transaction behaves as if it were running alone, even when others are running simultaneously.
- **Durability** — once a transaction commits, it survives even a crash immediately afterward.

## A concrete example

\`\`\`sql
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
\`\`\`

If the second UPDATE fails for any reason (a constraint violation, a crash, a connection drop), the transaction can be rolled back — undoing the first UPDATE too — so the database never ends up in a state where money vanished from one account without appearing in the other.

## Why this matters even for less dramatic examples

The money-transfer example is the classic one, but the same principle applies broadly: creating an order and decrementing inventory, registering a user and creating their default settings row, or any operation where two or more related writes need to succeed or fail as a unit. Without a transaction, a failure partway through leaves the database in an inconsistent state that's often difficult to detect and even harder to repair after the fact.

## Isolation levels, briefly

Full isolation between every concurrent transaction has a real performance cost, so most databases offer configurable isolation levels trading strict correctness for throughput (e.g., PostgreSQL's default "read committed" versus the stricter "serializable"). The right level depends on the workload — financial systems often need stricter guarantees than, say, a page-view counter — but knowing this is a deliberate, adjustable tradeoff (not a fixed constant) is the useful takeaway at this level.`,
      },
    ],
  },
];
