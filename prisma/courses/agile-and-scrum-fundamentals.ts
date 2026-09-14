import type { CourseSeed } from "../course-types";

export const course: CourseSeed = {
  slug: "agile-and-scrum-fundamentals",
  title: "Agile and Scrum Fundamentals",
  description:
    "What the Agile Manifesto actually changed, what each Scrum ceremony and role is really for, how to write and prioritize user stories, and the anti-patterns that quietly hollow out Scrum's rituals.",
  category: "Product & Process",
  level: "BEGINNER",
  order: 25,
  lessons: [
    {
      title: "What the Agile Manifesto Actually Changed",
      durationMinutes: 5,
      slides: [
        {
          kind: "title",
          heading: "What the Agile Manifesto Actually Changed",
          subheading:
            "Agile isn't a specific process — it's a set of values written in reaction to a very specific set of problems with how software used to get built.",
        },
        {
          kind: "text",
          heading: "The waterfall problem Agile was responding to",
          body: [
            "Traditional \"waterfall\" development plans an entire project upfront — requirements, then design, then building, then testing, then release — each phase completed before the next begins. This works reasonably well when requirements are genuinely stable and well understood in advance.",
            "The problem is that for most real software, requirements aren't fully knowable upfront. By the time a year-long waterfall project reaches release, the market, the users, or the business itself has often moved — and the team discovers this only after the plan is already built, when changing course is expensive.",
          ],
        },
        {
          kind: "bullets",
          heading: "What the Agile Manifesto (2001) actually said",
          intro: "It's four short value statements, each preferring one thing over another — not rejecting the second thing entirely.",
          bullets: [
            "Individuals and interactions over processes and tools — a rigid process followed by a disengaged team produces worse outcomes than a flexible process with a genuinely engaged one.",
            "Working software over comprehensive documentation — documentation still matters, but a stack of specification documents that nobody validates against real, running software is a weak substitute for it.",
            "Customer collaboration over contract negotiation — checking in with real users throughout, not just at the start and the end, catches misunderstandings early instead of late.",
            "Responding to change over following a plan — treating a plan as a living thing that adapts as you learn, not a fixed commitment made before anyone had real information.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "The core shift, in one idea",
          body: "Waterfall bets that you can know everything upfront and plans accordingly. Agile bets that you can't — so it builds in short, frequent cycles specifically to surface what you got wrong as early and as cheaply as possible, rather than discovering it at the very end.",
        },
        {
          kind: "bullets",
          heading: "What Agile did not mean, despite how it's often used",
          bullets: [
            "It doesn't mean no planning — it means planning in shorter cycles with real feedback between them, not a single upfront plan treated as fixed.",
            "It doesn't mean no documentation, no process, or no deadlines — those exist in healthy Agile teams too, just held more lightly and adjusted based on what's learned.",
            "Scrum, which the rest of this course focuses on, is one specific, popular framework for putting Agile values into practice — it isn't the only one, and following its rituals mechanically doesn't automatically make a team Agile in spirit.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Twelve principles sit behind the four values",
          body: "The Manifesto itself is just the four short value statements, but the seventeen signatories also published twelve supporting principles alongside it — things like \"deliver working software frequently, from a couple of weeks to a couple of months\" and \"working software is the primary measure of progress.\" Most of what later became formalized as Scrum's specific ceremonies traces directly back to these principles turning the four abstract values into something concretely actionable — the sprint cadence itself is essentially principle seven, given a fixed rhythm and a name.",
        },
        {
          kind: "summary",
          heading: "Why this history matters",
          bullets: [
            "Agile is a response to a real failure mode: plans built on assumptions that turn out wrong, discovered too late to cheaply fix.",
            "Its core bet is that short cycles with real feedback beat one long cycle with none.",
            "Scrum is a specific framework for applying that idea — understanding the \"why\" behind it is what keeps its rituals from becoming empty process.",
          ],
        },
      ],
    },
    {
      title: "The Scrum Rituals and What Each Is For",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "The Scrum Rituals and What Each Is For",
          subheading:
            "Scrum has four core ceremonies, and every one of them exists to solve a specific coordination problem — not to fill a calendar slot.",
        },
        {
          kind: "bullets",
          heading: "Sprint planning: deciding what's actually achievable",
          intro: "Happens at the start of each sprint (a fixed time period, commonly one or two weeks).",
          bullets: [
            "The purpose: the team looks at the prioritized backlog (from the Product Owner) and decides, together, what they can realistically commit to finishing this sprint.",
            "This is a negotiation, not a top-down assignment — the people doing the work are the ones best positioned to judge what's actually achievable in the time available.",
            "It ends with a sprint goal: a short, clear statement of what this sprint is meant to accomplish, not just a list of ticket numbers.",
          ],
        },
        {
          kind: "bullets",
          heading: "The daily standup: a coordination check-in, not a status report",
          intro: "A short (roughly 15-minute), daily meeting for the team, traditionally structured around three questions.",
          bullets: [
            "What did I do yesterday that moves us toward the sprint goal?",
            "What am I doing today?",
            "Is anything blocking me?",
            "The actual purpose is surfacing blockers and coordinating who needs to talk to whom — not reporting progress to a manager. If it's mainly people reciting a task list to a manager in the room, it's drifted from its intent (more on this in the anti-patterns lesson).",
          ],
        },
        {
          kind: "bullets",
          heading: "Sprint review: showing real, working progress",
          intro: "Happens at the end of the sprint, typically with stakeholders present.",
          bullets: [
            "The team demonstrates what was actually completed — working software, not a slide describing it — and gets real feedback in the moment.",
            "This is where a wrong assumption from planning gets caught early: if a stakeholder sees the demo and says \"that's not quite what we needed,\" that's the review doing its job, not a failure of the sprint.",
          ],
        },
        {
          kind: "bullets",
          heading: "Sprint retrospective: improving how the team works",
          intro: "Also at the end of the sprint, but focused inward on the team's own process rather than the product.",
          bullets: [
            "The team reflects: what went well, what didn't, and what one or two concrete changes to try next sprint.",
            "The value is entirely in follow-through — a retrospective that surfaces the same complaint sprint after sprint with no actual change becomes a ritual people stop taking seriously.",
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "A useful lens for all four",
          body: "Each ceremony answers a distinct question: planning asks \"what can we do,\" the standup asks \"are we still on track and unblocked,\" the review asks \"did we build the right thing,\" and the retro asks \"how do we work better next time.\" If a meeting isn't clearly answering its question, that's worth naming directly rather than just running it out of habit.",
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "\"Done\" needs a shared, written definition — or the review has nothing solid to check against",
          body: "A Definition of Done is a short, team-agreed checklist — tests passing, code reviewed, deployed to staging, documentation updated, whatever genuinely applies — that a story has to satisfy before it counts as complete. Without one, \"done\" quietly means something different to each person: an engineer might consider a story done once the code is written, while a stakeholder in the sprint review expects it to be live and usable. That mismatch is exactly what turns a review into an argument about definitions instead of a conversation about the actual product — a Definition of Done, agreed on before it's needed, heads that off entirely.",
        },
        {
          kind: "bullets",
          heading: "Choosing a sprint length: one to four weeks, with real trade-offs either way",
          bullets: [
            "One week — tight feedback loops and fast course correction, but the planning/review/retro overhead happens four times as often relative to actual working time, and there's little room to recover from a bad week.",
            "Two weeks — the most common default, and usually a reasonable starting point: enough time to make meaningful progress on a story, short enough that a wrong direction doesn't compound for long before the next checkpoint.",
            "Four weeks — less ceremony overhead relative to working time, but feedback arrives more slowly, and a sprint that goes badly wastes a full month before the retro even gets a chance to address it.",
            "There's no universally correct length — teams commonly start at two weeks and adjust based on how much the ceremony overhead versus feedback speed trade-off actually shows up in practice for their specific work.",
          ],
        },
        {
          kind: "bullets",
          heading: "A fifth, informal ceremony worth knowing: backlog refinement",
          intro: "Not one of Scrum's four official events, but close to universal in practice — a recurring session, often weekly, distinct from sprint planning itself.",
          bullets: [
            "Purpose: clarify, size, and reorder upcoming backlog items before they're needed in a sprint, so planning itself doesn't turn into a slow discovery process for stories nobody has looked at yet.",
            "Typically shorter than the four core ceremonies and doesn't need the whole team every time — a subset with enough context to size and clarify upcoming work is usually enough.",
            "Skipping it is exactly how a backlog quietly turns into the unordered task dump described later in this course — refinement is the maintenance that keeps sprint planning fast and low-friction.",
          ],
        },
        {
          kind: "diagram",
          heading: "The sprint cycle",
          description: "The daily standup repeats throughout the sprint; review and retro close it out before the next sprint's planning begins.",
          steps: [
            { label: "Sprint planning", detail: "Set the sprint goal from the backlog" },
            { label: "Daily standup", detail: "Repeats each day of the sprint" },
            { label: "Sprint review", detail: "Demo real, working progress" },
            { label: "Sprint retrospective", detail: "Agree one or two concrete changes" },
          ],
        },
        {
          kind: "summary",
          heading: "The four ceremonies, briefly",
          bullets: [
            "Sprint planning — decide what's achievable and set a sprint goal.",
            "Daily standup — coordinate and surface blockers, briefly.",
            "Sprint review — demonstrate real progress and gather feedback.",
            "Sprint retrospective — improve how the team works, with a concrete follow-through.",
          ],
        },
      ],
    },
    {
      title: "Roles: Product Owner, Scrum Master, and the Team",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Roles: Product Owner, Scrum Master, and the Team",
          subheading:
            "Scrum defines exactly three roles, deliberately — and most of the friction teams run into traces back to one of these roles being unclear or missing.",
        },
        {
          kind: "bullets",
          heading: "The Product Owner: owns the what and the why",
          intro: "Responsible for maximizing the value of what the team builds.",
          bullets: [
            "Owns and prioritizes the product backlog — deciding what matters most and why, based on real understanding of users and business goals.",
            "Is the single point of authority on requirements — the team should have one clear person to ask \"what does done actually mean here,\" not a rotating set of stakeholders with conflicting answers.",
            "Does not manage the team or assign individual tasks — that's a common misconception. The Product Owner decides priority; the team decides how to execute it.",
          ],
        },
        {
          kind: "bullets",
          heading: "The Scrum Master: owns the process, removes friction",
          intro: "Often the most misunderstood role — it isn't a project manager and isn't the team's boss.",
          bullets: [
            "Facilitates the ceremonies and keeps them useful rather than performative — this is a process role, not an authority role over the work itself.",
            "Actively removes blockers the team can't clear on their own — a dependency stuck with another team, a tool access issue, an unclear requirement that needs escalation.",
            "Coaches the team (and often the organization around it) on Agile practices, and protects the team from disruptive interruptions and scope changes mid-sprint.",
          ],
        },
        {
          kind: "bullets",
          heading: "The Development Team: owns the how",
          intro: "The people actually doing the work — engineers, designers, QA, whoever is needed to deliver a working increment.",
          bullets: [
            "Self-organizing: the team decides how to split and execute the work, not a manager assigning individual tickets to individual people.",
            "Cross-functional: ideally has every skill needed to take a backlog item from not-started to actually done, without depending on people entirely outside the team for each piece.",
            "Collectively accountable for the sprint's outcome — Scrum deliberately avoids singling out individual output in favor of team-level commitment and delivery.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "The most common role confusion",
          body: "A Scrum Master who starts assigning tasks and evaluating individual performance has effectively become a manager wearing a different title — and a Product Owner who starts telling engineers exactly how to implement something has stepped past \"what and why\" into \"how,\" which is the team's call to make.",
        },
        {
          kind: "bullets",
          heading: "Stakeholders: influential, but not one of the three defined roles",
          intro: "Executives, customers, support teams, other product teams whose work touches this one — anyone with a real interest in the outcome, without being on the Scrum team itself.",
          bullets: [
            "Stakeholders provide input and feedback, most visibly at the sprint review, but they don't dictate the sprint's content directly — that authority sits specifically with the Product Owner, who weighs stakeholder input against everything else in the backlog.",
            "A common dysfunction: a stakeholder goes around the Product Owner directly to an engineer with a request mid-sprint. Handling this well means routing it back through the Product Owner, not quietly absorbing scope the team never agreed to and never sized.",
            "The Scrum Master's job of \"protecting the team from disruptive interruptions\" mentioned above is largely about exactly this — shielding the sprint's agreed scope from well-intentioned stakeholder requests arriving outside the normal backlog process.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Product Owner and Product Manager aren't always the same job",
          body: "Scrum defines \"Product Owner\" as a specific role on a specific team, focused on the backlog for that team's sprint. \"Product Manager\" is a broader, more common job title in most companies, often covering strategy, cross-team roadmap, and stakeholder management well beyond one team's backlog. In practice many companies have one person do both, and many use the titles loosely enough that the exact boundary varies company to company — but it's worth asking directly in an interview or onboarding what the actual scope is, rather than assuming Scrum's textbook definition matches the job as it's really practiced at a given company.",
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Team size: small enough to actually coordinate",
          body: "Scrum's guidance leans toward roughly 5 to 9 people on the Development Team — often called the \"two-pizza team\" rule of thumb (small enough that two pizzas would feed the whole team). Below that, the team may lack enough range of skills to be genuinely cross-functional; above it, the number of communication paths between people grows fast enough that coordination overhead starts eating into actual delivery, and the standup itself stops being a quick, useful sync.",
        },
        {
          kind: "summary",
          heading: "The three roles, briefly",
          bullets: [
            "Product Owner: decides what to build and in what order, and why it matters.",
            "Scrum Master: keeps the process healthy and removes what's blocking the team.",
            "Development Team: self-organizes to decide how the work actually gets done.",
          ],
        },
      ],
    },
    {
      title: "User Stories and Backlog Prioritization",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "User Stories and Backlog Prioritization",
          subheading:
            "A backlog is only useful if it's written in a way that keeps the focus on the actual user need, and ordered by what genuinely matters most right now.",
        },
        {
          kind: "text",
          heading: "Why user stories are written the way they are",
          body: [
            "A user story is a short, structured description of a feature from the perspective of the person who needs it — deliberately written to keep the focus on the underlying need, not to prescribe a specific implementation before the team has even discussed it.",
          ],
        },
        {
          kind: "example",
          heading: "The standard format",
          body: "The formula forces you to name who benefits and why, not just what to build — the \"so that\" clause is often the most important, and most skipped, part.",
          code: `As a [type of user],
I want [some capability],
so that [some benefit / underlying reason].

Example:
As a returning customer,
I want my shipping address saved from my last order,
so that I don't have to re-enter it every time I check out.`,
        },
        {
          kind: "bullets",
          heading: "What makes a story actually useful",
          intro: "A commonly used checklist (sometimes called INVEST) captures most of it.",
          bullets: [
            "Independent — it can be built and delivered without waiting on several other stories first.",
            "Negotiable — it describes a need, not a rigid spec; the team can discuss the best way to solve it.",
            "Valuable — it's tied to a real benefit for a real user, not just a technical task in disguise.",
            "Estimable — the team has enough shared understanding to roughly size how much effort it'll take.",
            "Small — it fits comfortably within a single sprint; a story that clearly can't is a sign it needs to be split.",
            "Testable — there's a clear way to check whether it's actually done, usually written as acceptance criteria alongside the story.",
          ],
        },
        {
          kind: "bullets",
          heading: "Prioritizing the backlog: value against effort, not just gut feel",
          intro: "The Product Owner leads this, usually informed by the team's input on effort.",
          bullets: [
            "High value, low effort — obvious priorities; do these first.",
            "High value, high effort — worth doing, but plan for it deliberately rather than squeezing it into a sprint alongside everything else.",
            "Low value, low effort — tempting because they're easy, but easy to over-invest in at the expense of things that actually matter more.",
            "Low value, high effort — the clearest candidates to deprioritize or cut outright.",
          ],
        },
        {
          kind: "example",
          heading: "Acceptance criteria make \"testable\" concrete",
          body: "A story states the need; acceptance criteria state exactly how the team will know it's satisfied. Given/When/Then is a common structure for writing them, borrowed from behavior-driven testing.",
          code: `Story: As a returning customer, I want my shipping address saved
from my last order, so that I don't have to re-enter it every
time I check out.

Acceptance criteria:
  Given I completed a previous order with a shipping address
  When I start a new checkout
  Then my last shipping address is pre-filled, editable before I submit

  Given I have never placed an order before
  When I start checkout
  Then the address field is empty, with no error shown`,
        },
        {
          kind: "bullets",
          heading: "Splitting a story that's too big — vertical, not horizontal",
          intro: "A story that fails INVEST's \"Small\" criteria needs splitting — but splitting it the wrong way creates a different problem.",
          bullets: [
            "Split vertically, by a thinner slice of real user value, not horizontally by technical layer. \"Build the backend API\" plus a separate \"build the frontend\" story each deliver nothing usable on their own — neither can be demoed or shipped independently.",
            "A vertical split of the saved-address story above might be: (1) save and pre-fill a single default address, ships first and is independently valuable, then (2) support multiple saved addresses with a picker, as a second story once the first is proven out.",
            "This matters beyond tidiness — a vertically split story can be demoed at the sprint review and shipped on its own, where a horizontal slice usually can't be either until every layer is finished.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Epics: when a story is really a collection of stories",
          body: "An epic is a body of work too large for one story or one sprint — \"redesign the checkout flow,\" say — that gets broken down into several individual stories over time, often across multiple sprints. Epics live above stories in the backlog's hierarchy, useful for tracking a larger initiative's overall progress, but a sprint should still only ever commit to the individual, INVEST-checked stories underneath it, not the epic as one unsplit unit of work.",
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "A story that's really a task in disguise",
          body: "\"As a developer, I want to refactor the payment module\" is a task, not a user story — there's no actual user benefit named. That doesn't mean it shouldn't happen; it means it should usually be framed by its real downstream benefit (\"so that payment failures, which currently cost us real refunds, become rare\") so its priority can be honestly compared against everything else in the backlog.",
        },
        {
          kind: "summary",
          heading: "Stories and prioritization, briefly",
          bullets: [
            "A good user story names who benefits and why, not just what to build.",
            "INVEST is a useful check for whether a story is actually ready to bring into a sprint.",
            "Prioritize by real value against real effort — not by whichever ticket is loudest or easiest.",
          ],
        },
      ],
    },
    {
      title: "Common Anti-Patterns",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Common Anti-Patterns",
          subheading:
            "Scrum's ceremonies can be followed to the letter and still fail at their actual purpose — these are the most common ways that happens.",
        },
        {
          kind: "bullets",
          heading: "Standup as a status report to a manager",
          intro: "The most common anti-pattern, and the one this course opened by naming.",
          bullets: [
            "Symptom: everyone reports their task list one by one, facing the manager rather than each other, with no real cross-talk or blocker resolution.",
            "Why it happens: it's the easiest failure mode to slip into, especially if a manager (rather than a peer) is running the meeting and using it to track individual output.",
            "The fix: redirect the conversation toward the sprint goal and blockers specifically, and move any individual status detail that isn't relevant to the group into a quick side conversation after.",
          ],
        },
        {
          kind: "bullets",
          heading: "Sprints that are really just two-week waterfalls",
          intro: "A subtler failure — the ceremonies happen, but the underlying mindset didn't actually change.",
          bullets: [
            "Symptom: the sprint plan is treated as fixed and unquestionable once set, with no real room for the mid-sprint learning that Agile is supposed to make room for.",
            "Symptom: the sprint review is a status update rather than a real demo with a chance for stakeholders to redirect course.",
            "The fix: treat the sprint boundary as a genuine checkpoint for re-evaluating direction, not just a scheduling unit for the same rigid plan.",
          ],
        },
        {
          kind: "bullets",
          heading: "A backlog that's really just a task dump",
          bullets: [
            "Symptom: hundreds of unprioritized, vaguely worded tickets accumulate with no real ordering or user-value framing — \"the backlog\" in name only.",
            "The fix: regular backlog refinement (a lighter, recurring session distinct from the four core ceremonies) where the Product Owner and team clarify, size, and reorder upcoming items before they're needed in a sprint.",
          ],
        },
        {
          kind: "bullets",
          heading: "Retrospectives with no follow-through",
          bullets: [
            "Symptom: the same issue gets raised sprint after sprint, gets nodded at, and nothing actually changes.",
            "The fix: leave every retro with one or two concrete, assigned changes to try — and open the next retro by checking whether they actually happened, not just moving on to a fresh list of complaints.",
          ],
        },
        {
          kind: "bullets",
          heading: "Scope creep mid-sprint",
          intro: "A sprint's whole value depends on the commitment made at planning staying roughly stable — this is what erodes it.",
          bullets: [
            "Symptom: new requests keep getting added to an already-committed sprint, without anything being removed or re-planned to make room, until the original sprint goal is effectively abandoned.",
            "Why it happens: it's often well-intentioned — a stakeholder request feels urgent, or a small addition seems too minor to formally re-plan around — but it quietly compounds sprint over sprint.",
            "The fix: genuinely urgent work can justify re-opening the sprint plan, but that should be a visible, deliberate trade-off (\"we're dropping X to make room for Y\"), not an invisible addition on top of an unchanged commitment.",
          ],
        },
        {
          kind: "bullets",
          heading: "Point inflation: velocity treated as a target instead of a measurement",
          intro: "Covered in more depth in the estimating lesson, but it belongs on this list too — it's a textbook case of a ceremony's form surviving while its purpose quietly disappears.",
          bullets: [
            "Symptom: the same work that used to be estimated as a 3 starts getting called a 5, then an 8, with no real change in actual complexity — just pressure to make velocity numbers look consistent or improving.",
            "The fix: treat velocity purely as an observed, historical number used for forecasting, never as a goal a team is expected to hit or grow — the instant it becomes a target, the numbers feeding it stop being trustworthy.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "The pattern underneath all of these",
          body: "In every case, the ceremony's form survived while its actual purpose quietly disappeared. That's a sign to watch for generally: when a recurring meeting or process stops producing the outcome it exists for, the fix is rarely \"run it more strictly\" — it's asking, directly, what the meeting was supposed to accomplish, and whether it still is.",
        },
        {
          kind: "summary",
          heading: "Anti-patterns, briefly",
          bullets: [
            "A standup that becomes status theater instead of coordination.",
            "A sprint that's really a small waterfall, with no real room to adapt mid-cycle.",
            "A backlog that's an unordered task dump instead of a prioritized, value-framed list.",
            "A retrospective with no real follow-through on what it surfaces.",
            "Scope silently added to an already-committed sprint, instead of a visible, deliberate trade-off.",
            "Velocity treated as a target to hit rather than a number to observe, which quietly incentivizes point inflation.",
          ],
        },
      ],
    },
    {
      title: "Making Scrum Actually Work",
      durationMinutes: 5,
      slides: [
        {
          kind: "title",
          heading: "Making Scrum Actually Work",
          subheading:
            "Scrum is a lightweight framework, not a guarantee — whether it actually delivers on Agile's original promise comes down to a handful of habits, practiced consistently.",
        },
        {
          kind: "bullets",
          heading: "What actually distinguishes a healthy Scrum team",
          intro: "Not the number of ceremonies followed correctly — the mindset underneath them.",
          bullets: [
            "The team treats each ceremony as answering a real question (see the rituals lesson), and notices — and fixes — when one stops doing that.",
            "The Product Owner is genuinely available and decisive, not a bottleneck the team routes around because decisions take too long to get.",
            "The team is honestly willing to say a sprint commitment was wrong mid-sprint, rather than quietly grinding through an unrealistic plan to avoid the appearance of failure.",
            "Retrospective action items actually show up as real changes in how the next sprint runs.",
          ],
        },
        {
          kind: "text",
          heading: "Scrum isn't the only Agile framework, and that's fine",
          body: [
            "Kanban (a continuous-flow model without fixed sprints), Scrumban (a hybrid), and various scaled frameworks for larger organizations all apply the same underlying Agile values differently. Scrum's specific ceremonies are one well-tested way to structure Agile work, not the only legitimate one — a team that's outgrown Scrum's fixed sprints for a genuinely continuous workflow isn't failing at Agile by adopting something else.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Psychological safety underlies most of the habits above",
          body: "A team can't honestly say a sprint commitment was wrong mid-sprint, or raise the same retro complaint until it's actually fixed, if doing so carries a real cost — looking incompetent, being blamed, being overruled and quietly resented for it. Most of what makes a Scrum team \"healthy\" in practice traces back to whether people feel safe surfacing bad news early, which is exactly what the ceremonies are structurally trying to enable. A team with perfect ceremony attendance and zero psychological safety will still hide problems until they're too large to hide.",
        },
        {
          kind: "bullets",
          heading: "Scaling beyond one team: a brief note",
          bullets: [
            "Scrum was designed around a single small team — larger organizations running several Scrum teams on related or dependent work often add a lightweight coordination layer, commonly called a Scrum of Scrums: a short, periodic sync where a representative from each team surfaces cross-team dependencies and blockers.",
            "Frameworks like SAFe and LeSS formalize this scaling more heavily for large organizations — worth knowing they exist, though the core habits in this lesson matter more at the level of one team than which scaling framework, if any, sits above it.",
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "\"Servant leadership\" is the concept underneath the Scrum Master role",
          body: "It's a common phrase in Agile writing, and it's a useful shorthand: the Scrum Master's authority comes from removing obstacles and enabling the team, not from directing it. A Scrum Master who measures their own effectiveness by how much friction disappeared for the team, rather than by how much control they hold over the team's day-to-day, is applying the idea correctly.",
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "A simple test for any Agile team",
          body: "Ask: if we stripped away the ceremony names entirely, would this team still be checking in frequently, still adapting based on real feedback, and still shipping working software incrementally? If yes, the substance is there regardless of exactly which framework's rituals it's wearing. If no, adding more process rigor to the existing ceremonies usually isn't the fix.",
        },
        {
          kind: "summary",
          heading: "Course recap",
          bullets: [
            "Agile is a set of values favoring adaptability and real feedback over rigid upfront planning — Scrum is one popular framework for applying them.",
            "The four ceremonies — planning, standup, review, retro — each answer a specific coordination question; treat them as tools for that purpose, not boxes to check.",
            "Product Owner, Scrum Master, and the Team have distinct, complementary responsibilities — confusion between them is a common source of dysfunction.",
            "Good user stories name real user value; a healthy backlog is prioritized by value against effort, not by volume or noise.",
            "Watch for ceremonies that keep their form but lose their purpose — that's the most common way Scrum quietly stops working.",
          ],
        },
      ],
    },
    {
      title: "Estimating Work: Story Points, Velocity, and Why Hours Mislead",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Estimating Work: Story Points, Velocity, and Why Hours Mislead",
          subheading:
            "Sprint planning needs some way to size work — most Scrum teams use story points instead of hours, and the reason isn't arbitrary.",
        },
        {
          kind: "text",
          heading: "Why not just estimate in hours?",
          body: [
            "Hour estimates on knowledge work are consistently unreliable — the same task takes different people, and even the same person on different days, meaningfully different amounts of time, and interruptions, meetings, and unrelated work eat into the hours nobody scoped for.",
            "Story points sidestep this by estimating relative size and complexity instead of absolute time — the question shifts from \"how many hours will this take\" (hard to answer accurately) to \"is this roughly twice as complex as that other story we already agreed on\" (a comparison people are actually decent at).",
          ],
        },
        {
          kind: "bullets",
          heading: "How story pointing actually works",
          bullets: [
            "Points are usually assigned from a Fibonacci-like scale (1, 2, 3, 5, 8, 13...) — the growing gaps at higher numbers reflect that estimating precisely gets harder as size and uncertainty grow, not that anyone can distinguish a true 12 from a true 13.",
            "Points measure a mix of effort, complexity, and uncertainty — not just how long something takes. A small, well-understood task and a small, but genuinely unfamiliar or risky one can reasonably get different point values even at similar \"size.\"",
            "Planning poker (each person privately selects a point value, then reveals simultaneously) is a common technique specifically to avoid anchoring — if the most senior engineer says \"3\" out loud first, everyone else tends to converge toward it whether or not it's accurate.",
            "A large spread of guesses on reveal isn't a problem to smooth over quickly — it usually means the story is genuinely ambiguous, and that gap is exactly what the follow-up discussion should resolve before committing to it.",
          ],
        },
        {
          kind: "text",
          heading: "Velocity: what it's for, and what it isn't",
          body: [
            "Velocity is the average number of story points a team completes per sprint, tracked over several sprints. Its real purpose is forecasting — if a team's velocity is stable around 30 points a sprint, that's a grounded basis for estimating when a 90-point backlog of upcoming work might realistically be done.",
            "It is a team-level planning tool, not an individual performance metric, and it isn't comparable across teams — a 40-velocity team isn't twice as productive as a 20-velocity one, because point scales are calibrated differently team to team.",
          ],
        },
        {
          kind: "chart",
          heading: "A team's velocity, tracked over sprints",
          description: "This is the kind of stability the course means by \"stable around 30 points a sprint\" — a forecasting baseline, not a target to hit exactly each time.",
          chartType: "line",
          unit: "story points completed",
          data: [
            { label: "Sprint 1", value: 28 },
            { label: "Sprint 2", value: 32 },
            { label: "Sprint 3", value: 29 },
            { label: "Sprint 4", value: 31 },
            { label: "Sprint 5", value: 30 },
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "The trap: velocity as a target",
          body: "Using velocity to pressure a team into hitting a specific number quietly incentivizes point inflation (calling everything an 8 instead of a 3) rather than more actual delivery — the metric stops being useful the moment it becomes something to hit rather than something to observe.",
        },
        {
          kind: "example",
          heading: "Using velocity to plan a sprint: \"yesterday's weather\"",
          body: "The simplest, most defensible way to decide how much to commit to in sprint planning is to look at recent actual velocity rather than debating it fresh each time — informally called \"yesterday's weather\": assume tomorrow looks roughly like the recent past unless there's a specific, named reason to expect otherwise.",
          code: `Last 3 sprints completed: 28, 32, 29 points → average ≈ 30

Sprint planning for the next sprint:
  Default commitment: ~30 points (yesterday's weather)

  Known adjustment this sprint: 2 of 6 engineers are out for
  training for 3 of the 10 working days — roughly a 10% capacity
  reduction for the sprint

  Adjusted commitment: ~27 points, not 30
  (Capacity changes are a reason to adjust the number — hoping
  the team just works harder to hit 30 anyway is not a plan.)`,
        },
        {
          kind: "bullets",
          heading: "Story points aren't the only relative-sizing option",
          bullets: [
            "T-shirt sizing (XS/S/M/L/XL) is a coarser alternative some teams use, especially earlier in a project or for rougher epic-level estimates — faster to agree on, at the cost of less precision than a numeric scale for sprint-level planning.",
            "A small but vocal #NoEstimates movement argues teams should skip formal estimation entirely and instead keep stories consistently small and let throughput (stories completed per sprint, not points) do the forecasting — worth knowing it exists, though story points remain the dominant practice most teams encounter.",
            "Whichever scale a team uses, consistency over time matters more than which scale — switching systems frequently makes historical velocity data meaningless for forecasting.",
          ],
        },
        {
          kind: "bullets",
          heading: "Spikes: when a story genuinely can't be estimated yet",
          intro: "Occasionally a story has too much real unknown to size honestly at all — forcing a number onto it doesn't fix that, it just hides it.",
          bullets: [
            "A spike is a short, timeboxed research task (\"investigate whether this third-party API supports the rate limits we need, by end of day Wednesday\") whose output is knowledge, not a shipped feature — its point value estimates the research effort itself, not the eventual work.",
            "The story that follows a spike gets estimated normally, now with real information instead of a guess — a spike's whole purpose is turning an unknown into something the team can actually size.",
            "Overusing spikes is its own anti-pattern — if a team spikes routinely instead of occasionally, it may be a sign stories are arriving in planning too vague to estimate in the first place.",
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Burndown charts make the sprint's real trajectory visible, not just its endpoint",
          body: "A burndown chart plots remaining work (in points or stories) against the days left in the sprint, day by day. A healthy sprint trends steadily toward zero; a line that stays flat for the first week and then drops sharply at the end usually means work wasn't broken down small enough to show incremental progress, or testing and integration were left until the very end — a pattern worth catching mid-sprint, while there's still time to react, rather than only noticing it in the retro after the fact.",
        },
        {
          kind: "summary",
          heading: "Estimating, briefly",
          bullets: [
            "Story points estimate relative size and complexity, because hour estimates on knowledge work are reliably inaccurate.",
            "Techniques like planning poker exist specifically to prevent anchoring on the most senior voice in the room.",
            "Velocity is a team-level forecasting tool built from historical data — not a cross-team comparison or an individual performance measure.",
          ],
        },
      ],
    },
    {
      title: "Practice: Writing and Sizing a User Story",
      durationMinutes: 12,
      slides: [
        {
          kind: "title",
          heading: "Practice: Writing and Sizing a User Story",
          subheading:
            "Turn a vague ask into a real, INVEST-checked, estimated backlog item.",
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "How to approach these",
          body: "Every exercise below is deliberately close to a real backlog moment — a vague ask that needs shaping, a story that looks fine until you actually check it, a new story that needs a defensible size. Work through the prompt in full before reading the hint; the skill being tested is judgment about what's missing, not just familiarity with the formats.",
        },
        {
          kind: "practice",
          heading: "Turn a raw request into a proper user story",
          prompt:
            "You've been handed this raw ask from a stakeholder: \"Add a way for users to export their data.\" Rewrite it as a proper user story in the As a / I want / so that format, and name the specific user type and benefit rather than leaving it generic.",
          hint: "Ask yourself who specifically wants this and why — \"a user\" is too vague. Is this for a compliance-conscious business customer, someone switching to a competing tool, someone building a personal backup? The \"so that\" clause should name a real reason, not just restate the feature.",
          solution:
            "\"As a business customer preparing for an internal audit, I want to export my account's full activity history as a CSV, so that I can hand it to our compliance team without manually copying data out of the app.\" Naming the specific user and reason makes the story's priority and scope much easier to reason about than the original vague ask.",
        },
        {
          kind: "practice",
          heading: "Run the INVEST check and flag what's missing",
          prompt:
            "Apply the INVEST checklist to this story: \"As a user, I want the entire settings page redesigned with a modern look, so that the app feels more professional.\" Identify which INVEST criteria it fails and why.",
          hint: "Check specifically for Small (does it fit in one sprint?), Testable (is there a clear way to know it's done?), and Valuable (is the benefit concrete, or just a vague feeling?).",
          solution:
            "Fails Small — \"the entire settings page redesigned\" is likely too large for a single sprint and should be split by section or component. Fails Testable — \"feels more professional\" has no clear acceptance criteria; there's no way to check objectively whether it's done. Weak on Valuable — the benefit is vague; a stronger version would tie to something concrete, like \"so that new users can find the account settings they're looking for without contacting support,\" which can actually be measured.",
        },
        {
          kind: "practice",
          heading: "Estimate two stories relative to each other",
          prompt:
            "Your team already agreed a past story — \"add a CSV export button to the reports page\" — was a 3. Now estimate this new story using the same point scale: \"add a scheduled weekly CSV export that emails the report automatically, including handling failed email deliveries and a user-facing settings toggle to turn it on or off.\" Give a point value and justify it relative to the 3-point story.",
          hint: "Compare complexity and unknowns, not just \"does it look like more work.\" What's genuinely new here that the 3-point story didn't have to deal with — a scheduler, email delivery, failure handling, a new settings surface?",
          solution:
            "8 points. It reuses the underlying CSV generation from the 3-point story, but adds several genuinely new pieces of complexity: a scheduling mechanism, email delivery integration, failure/retry handling, and a new settings UI — each a real source of uncertainty the original story didn't touch. It's clearly bigger than a 5 (which would suggest one added dimension of complexity) but not so novel it warrants a 13, since none of the individual pieces are unprecedented for the team.",
        },
        {
          kind: "practice",
          heading: "Split an oversized story vertically",
          prompt:
            "This story failed the Small check in refinement: \"As a user, I want a complete notifications system so that I always know what's happening in my account.\" Split it into two or three smaller stories that could each be built, demoed, and shipped independently — order them so the smallest, most valuable one ships first.",
          hint:
            "Vertical splitting means each piece is a thinner slice of the same end-to-end capability, not one layer of the tech stack. What's the smallest version of \"notified about something\" that's still genuinely useful on its own, before any settings, channels, or preferences exist?",
          solution:
            "1. \"As a user, I want to receive an in-app notification when someone comments on my post, so that I don't have to keep checking back manually.\" — ships first: one event type, one channel, no configuration, but already real, demoable value.\n2. \"As a user, I want to see a badge count of my unread notifications, so that I know at a glance whether anything needs my attention.\" — builds directly on story 1, adds a small but distinct piece of value.\n3. \"As a user, I want to choose which types of activity notify me and through which channel (in-app vs. email), so that I can control how much I hear from the app.\" — the preferences layer, reasonably deferred until the underlying notification mechanism from stories 1 and 2 already exists and is proven useful.\nEach story is independently shippable and demoable — none of them requires the others to already exist to deliver real value, which is exactly what distinguishes a vertical split from slicing by technical layer (\"build the notification backend\" / \"build the notification UI\"), where neither piece alone is useful to an actual user.",
        },
        {
          kind: "practice",
          heading: "Write acceptance criteria that cover the edge case, not just the happy path",
          prompt:
            "Given the story \"As a shopper, I want to apply a promo code at checkout, so that I get the discount I was promised,\" write acceptance criteria in Given/When/Then format that cover both the successful case and at least one realistic failure case.",
          hint:
            "The happy path (valid code, discount applied) is the easy half. What actually happens with an expired code, or one that's already been used? A story isn't really testable until the failure cases are specified as clearly as the success case.",
          solution: `Given a shopper has items in their cart
When they enter a valid, unexpired promo code and apply it
Then the discount is reflected in the order total before payment

Given a shopper enters a promo code that has expired
When they apply it
Then they see a clear message that the code has expired, and the
  order total is unchanged — the checkout is not blocked

Given a shopper enters a promo code that doesn't exist
When they apply it
Then they see a message that the code is invalid, and can still
  proceed to checkout without a discount

Writing the failure cases explicitly is what actually makes this story
testable — "apply a promo code" alone leaves what happens on bad input
completely undefined, and undefined behavior is exactly what QA (or a
real customer) finds first.`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "A common mistake across all three exercises above",
          body: "It's tempting to treat \"who is the user\" and \"what's the acceptance criteria\" as boilerplate to fill in after the real decision (what to build) is already made. In practice, naming the specific user and writing the failure-case criteria often changes the decision itself — the promo-code story above reads differently once you've actually had to specify what happens with an expired code, and the notifications split reads differently once you've had to name which piece ships alone. Treat these as thinking tools, not paperwork that happens after the thinking is done.",
        },
        {
          kind: "chart",
          heading: "Sizing the new story against the reference story",
          description: "Not a claim that it's literally 2.67x the effort — story points are relative buckets on a Fibonacci-like scale, and the gap here reflects real added complexity, not a precise ratio.",
          chartType: "bar",
          unit: "story points",
          data: [
            { label: "CSV export button (reference)", value: 3 },
            { label: "Scheduled email export (new)", value: 8 },
          ],
        },
        {
          kind: "summary",
          heading: "What a ready-to-estimate story looks like",
          bullets: [
            "Named user, real capability, and a genuine \"so that\" — not a restated feature request.",
            "Small and testable enough that the team could realistically finish and demo it within a sprint, split vertically rather than by technical layer if it isn't yet.",
            "Acceptance criteria that cover realistic failure cases, not just the happy path.",
            "Estimated relative to a known reference point, based on complexity and uncertainty — not a guess at raw hours.",
          ],
        },
      ],
    },
    {
      title: "Knowledge Check: Agile and Scrum Fundamentals",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Knowledge Check: Agile and Scrum Fundamentals",
          subheading: "Five questions across the whole course.",
        },
        {
          kind: "quiz",
          heading: "The Agile Manifesto",
          question:
            "Per the Agile Manifesto's actual value statements, which of these best reflects what \"responding to change over following a plan\" means?",
          options: [
            "Plans and deadlines should never be used at all",
            "A plan is treated as a living thing that adapts as the team learns, not a fixed commitment made before real information existed",
            "Every plan should be replaced weekly regardless of whether anything has changed",
            "Only the Scrum Master is allowed to change a sprint plan",
          ],
          correctIndex: 1,
          explanation:
            "The course is explicit that Agile values are preferences, not rejections — this value doesn't mean no planning, it means holding a plan more lightly and adjusting it based on real feedback, rather than treating an upfront plan as fixed.",
        },
        {
          kind: "quiz",
          heading: "Scrum ceremonies",
          question:
            "A team's daily standup consists of each person reporting their task list one by one directly to a manager, with little cross-talk. What does this course call this?",
          options: [
            "A healthy, well-run standup",
            "A sprint retrospective, incorrectly scheduled daily",
            "The most common anti-pattern — standup as a status report instead of a peer coordination check-in",
            "Sprint planning, mislabeled",
          ],
          correctIndex: 2,
          explanation:
            "The course names this specifically as the most common anti-pattern: the standup's actual purpose is surfacing blockers and coordinating who needs to talk to whom, not reporting individual progress up to a manager.",
        },
        {
          kind: "quiz",
          heading: "Roles",
          question:
            "A Scrum Master starts assigning individual tasks to team members and evaluating their individual performance. What does this course say about that?",
          options: [
            "This is exactly what a Scrum Master is supposed to do",
            "It's a sign the Scrum Master has effectively become a manager wearing a different title — outside the role's actual scope",
            "It's fine as long as the Product Owner approves it first",
            "This is the Development Team's job, so the Scrum Master is simply helping out",
          ],
          correctIndex: 1,
          explanation:
            "The course specifically flags this as the most common role confusion: the Scrum Master's job is facilitating process and removing blockers, not assigning tasks or evaluating individuals — that crosses into a management role the framework doesn't define for this position.",
        },
        {
          kind: "quiz",
          heading: "User stories and estimation",
          question:
            "A team disagrees widely on planning poker point values for a story — some say 2, others say 13. What does this course say this spread usually means?",
          options: [
            "Someone on the team is estimating incorrectly and should be overruled by the most senior voice",
            "The story is genuinely ambiguous, and the gap is exactly what the follow-up discussion should resolve before committing to it",
            "The team should just average the numbers and move on immediately",
            "Planning poker has failed and the team should switch to hour-based estimates instead",
          ],
          correctIndex: 1,
          explanation:
            "A wide spread on reveal is treated as useful signal, not noise — it usually means people are seeing different scope, risk, or unknowns in the story, and that's precisely the disagreement the discussion after the reveal is meant to surface and resolve.",
        },
        {
          kind: "quiz",
          heading: "Anti-patterns and follow-through",
          question:
            "A team's retrospectives raise the same complaint sprint after sprint with no real change. Per this course, what's the actual problem?",
          options: [
            "Retrospectives are inherently useless and should be dropped",
            "The team isn't spending enough time in the retrospective meeting itself",
            "The retro's value is in follow-through, and the pattern shows action items aren't actually being carried out",
            "The Product Owner should be running retrospectives instead of the Scrum Master",
          ],
          correctIndex: 2,
          explanation:
            "The course is explicit that a retrospective's entire value is in follow-through — surfacing the same issue repeatedly with no real change is the classic sign that action items are being nodded at but not actually implemented, not that the ceremony itself is worthless.",
        },
        {
          kind: "quiz",
          heading: "Splitting stories",
          question:
            "A story fails the Small check, so the team splits it into \"build the backend API\" and \"build the frontend UI\" as two separate stories. What's wrong with this split, per this course?",
          options: [
            "Nothing — any split that produces two smaller stories is a valid fix",
            "It's a horizontal split by technical layer, and neither resulting story is independently demoable or shippable on its own — a vertical split by user value is the correct approach",
            "The split is fine, but the two stories should have been combined back into one instead",
            "This is only a problem if the backend story is estimated higher than the frontend story",
          ],
          correctIndex: 1,
          explanation:
            "The course draws this distinction directly: a vertical split, by a thinner slice of real user value, keeps each resulting story independently valuable and demoable. A horizontal split by technical layer produces pieces where neither one delivers anything usable until both are finished — which defeats the actual purpose of splitting a story in the first place.",
        },
        {
          kind: "summary",
          heading: "This course's core takeaways",
          bullets: [
            "Agile is a set of values favoring adaptability and real feedback over rigid upfront planning.",
            "Each Scrum ceremony answers a distinct coordination question — treat them as tools, not boxes to check.",
            "Product Owner, Scrum Master, and the Team have distinct responsibilities; confusing them is a common source of dysfunction.",
            "Good user stories name real value and pass an honest INVEST check; story points estimate relative complexity, not hours.",
            "Velocity forecasts a team's own pace over time — it isn't a cross-team comparison or a target to hit.",
            "Watch for ceremonies and metrics that keep their form but quietly lose their actual purpose.",
          ],
        },
      ],
    },
  ],
};
