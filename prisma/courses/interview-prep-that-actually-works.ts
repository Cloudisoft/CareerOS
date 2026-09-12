import type { CourseSeed } from "../course-types";

export const course: CourseSeed = {
  slug: "interview-prep-that-actually-works",
  title: "Interview Prep That Actually Works",
  description:
    "A practical approach to behavioral, technical, and conversational interview rounds — grounded in what interviewers are actually evaluating.",
  category: "Interviewing",
  level: "INTERMEDIATE",
  order: 2,
  lessons: [
    {
      title: "The STAR Method, Done Right",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "The STAR Method, Done Right",
          subheading:
            "STAR (Situation, Task, Action, Result) is well known — and most people still use it badly, because they treat it as a script instead of a shape.",
        },
        {
          kind: "bullets",
          heading: "The shape, briefly",
          bullets: [
            "Situation — one or two sentences of real context. Not a full backstory.",
            "Task — what you specifically were responsible for, not what the team was doing.",
            "Action — the largest share of the answer. What you did, step by step.",
            "Result — what happened, ideally with a number, and what you'd do differently if relevant.",
          ],
        },
        {
          kind: "bullets",
          heading: "Where people go wrong",
          bullets: [
            "Spending 80% of the answer on Situation. Interviewers need just enough context to understand the stakes, then want to hear about you.",
            "Using \"we\" for the whole Action section. If you were part of a team, say so once, then be explicit about your individual contribution: \"I proposed X, then led the rollout while [teammate] handled Y.\"",
            "Skipping Result entirely. An answer that ends on an action with no outcome leaves the interviewer to guess whether it worked.",
            "Picking a story that's actually about someone else. If your best example of \"handling conflict\" is really a story where your manager resolved it, it doesn't answer the question that was asked.",
          ],
        },
        {
          kind: "text",
          heading: "Building your story bank ahead of time",
          body: [
            "Don't improvise STAR answers live for the first time in the interview. Before you start applying, write out 6-8 real situations that cover: a conflict, a failure or mistake, a time you influenced without authority, a time you managed ambiguity, a time you went beyond your role, and your proudest piece of work.",
            "Most behavioral questions map onto one of these — you're not memorizing scripts, you're making sure you don't have to invent an example under pressure.",
          ],
        },
      ],
    },
    {
      title: 'Answering "Tell Me About Yourself" Without Rambling',
      durationMinutes: 5,
      slides: [
        {
          kind: "title",
          heading: 'Answering "Tell Me About Yourself" Without Rambling',
          subheading:
            "This is usually the first question and the one most people prepare least for, because it feels informal. Treat it as the most structured answer you'll give.",
        },
        {
          kind: "bullets",
          heading: "The three-part shape",
          intro: "Aim for 60-90 seconds. Longer and you're narrating a resume the interviewer already has in front of them.",
          bullets: [
            "Where you are now — current role, in one sentence, focused on what's relevant to this job.",
            "How you got here — the through-line, not the full history. Pick the 1-2 moves that explain your trajectory, skip the rest.",
            "Why this role — connect your current direction to what you're applying for, specifically.",
          ],
        },
        {
          kind: "bullets",
          heading: "What to leave out",
          bullets: [
            "Personal life details unrelated to the role (this isn't the moment for them, even framed positively).",
            "A full chronological work history — that's what the resume is for.",
            "Self-deprecating framing (\"I don't know, I guess I just kind of fell into this\") that undercuts an otherwise strong background.",
          ],
        },
        {
          kind: "example",
          heading: "A structure you can adapt every time",
          body: "Practice this out loud, not just in your head — the gap between what sounds fine internally and what sounds fine spoken is usually bigger than people expect.",
          code: `"I'm currently a [role] at [company], focused on [the part of
the job most relevant here]. Before that, I [the 1-2 sentence
version of how you got there]. What's drawing me to this role
specifically is [genuine, specific reason tied to the job or
company]."`,
        },
      ],
    },
    {
      title: "Behavioral Questions: What They're Really Testing",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Behavioral Questions: What They're Really Testing",
          subheading:
            "\"Tell me about a time...\" isn't really asking for a story — it's using the story as evidence for a trait the interviewer has already decided to evaluate.",
        },
        {
          kind: "bullets",
          heading: "Common questions and what's actually being measured",
          bullets: [
            "\"Tell me about a conflict with a coworker.\" → Not whether you avoid conflict, but whether you handle it professionally and reach a resolution rather than escalating or going quiet.",
            "\"Tell me about a failure.\" → Self-awareness and whether you extracted a real lesson, not whether the failure itself was severe. A small, honest failure with a clear lesson beats a vague, deflected big one.",
            "\"Tell me about a time you disagreed with your manager.\" → Whether you can push back constructively without either capitulating silently or being insubordinate.",
            "\"Tell me about a time you had to learn something quickly.\" → Adaptability and how you approach the unfamiliar, not the specific subject matter.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "The trap: the answer that avoids the question",
          body: "A common failure mode is answering \"tell me about a failure\" with a humble-brag disguised as a weakness (\"I just work too hard and forget to take breaks\"). Interviewers hear this often enough to recognize it immediately, and it reads as evasive rather than self-aware.",
        },
        {
          kind: "text",
          heading: "Preparing without sounding rehearsed",
          body: [
            "Know your story bank, but don't memorize word-for-word scripts — you'll sound stiff, and a follow-up question will throw you off.",
            "Instead, know the shape of each story well enough that you could tell it starting from any point, because interviewers often ask a targeted follow-up like \"what would you do differently?\" that a memorized script doesn't cover.",
          ],
        },
      ],
    },
    {
      title: "Technical and Case Interviews: Thinking Out Loud",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Technical and Case Interviews: Thinking Out Loud",
          subheading:
            "The single most common feedback from interviewers on these rounds is some version of \"I couldn't tell what they were thinking.\" The evaluation is on your process as much as your answer.",
        },
        {
          kind: "bullets",
          heading: "Narrate your reasoning",
          bullets: [
            "State your understanding of the problem before solving it: \"So if I'm understanding this right, you want me to...\" This catches misunderstandings early.",
            "Say what you're about to try and why, before you try it: \"I'll start with a brute-force approach to make sure I understand the problem, then optimize.\"",
            "When you hit a wrong turn, say so out loud rather than silently backtracking: \"That's not going to work because of X — let me reconsider.\"",
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Ask clarifying questions early",
          body: "Jumping straight to a solution on an underspecified problem is a common mistake. A question like \"what's the expected scale here?\" or \"should I assume the data is already cleaned?\" often matters more to the evaluation than the eventual answer, because it shows you don't assume — you check.",
        },
        {
          kind: "text",
          heading: "When you're stuck",
          body: [
            "Silence is the worst option. Say what you know, what you've ruled out, and what direction you're considering next: \"I know this isn't quite right yet. My instinct is the issue is in how I'm handling the edge case where the list is empty — let me look there.\"",
            "An interviewer who sees a structured approach to being stuck often comes away more confident than one who watches a smooth answer to an easy question.",
          ],
        },
        {
          kind: "summary",
          heading: "After you land on an answer",
          bullets: [
            "Don't stop at \"it works.\" Briefly note the tradeoffs.",
            "What's the time/space complexity? What would break at 10x the scale? What did you deliberately simplify?",
            "This is usually worth more than perfecting the first solution to a shine.",
          ],
        },
      ],
    },
    {
      title: "Questions to Ask Them (and Why It Matters)",
      durationMinutes: 5,
      slides: [
        {
          kind: "title",
          heading: "Questions to Ask Them (and Why It Matters)",
          subheading:
            "\"Do you have any questions for us?\" is not a formality — it's still part of the evaluation, and it's your best chance to find out whether the role is actually right for you.",
        },
        {
          kind: "bullets",
          heading: "Questions that signal real engagement",
          bullets: [
            "\"What does success look like in this role at 6 months and at a year?\" — shows you're thinking about impact, not just getting hired.",
            "\"What's the biggest challenge someone in this role would be dealing with in the first few months?\" — surfaces real information you need, and shows you're evaluating fit both ways.",
            "\"How has this role changed since it was created, if at all?\" — reveals whether the job is stable or still being defined.",
            "Something specific to that interviewer's own experience: \"What's kept you here?\" or \"What's something that surprised you after joining?\"",
          ],
        },
        {
          kind: "bullets",
          heading: "Questions to avoid in most first rounds",
          bullets: [
            "Anything answerable from the company's website or the job posting — it signals you didn't prepare.",
            "Compensation and benefits specifics, unless the interviewer raises it first.",
            "Yes/no questions that don't open a real conversation.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Always have at least three ready",
          body: "Have more prepared than you'll need, because earlier questions often get answered along the way. Running out of questions, or asking one that was already covered, is a small but avoidable miss. If a question naturally came up during the conversation, say so — \"you actually covered my question about X earlier\" reads as attentive, not as having nothing to ask.",
        },
      ],
    },
    {
      title: "Following Up After the Interview (and Reading the Signals)",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Following Up After the Interview (and Reading the Signals)",
          subheading:
            "The interview doesn't end when you leave the room. What you do in the next 24 hours, and how you read what happens after, is still part of the process.",
        },
        {
          kind: "bullets",
          heading: "The thank-you note that actually helps",
          bullets: [
            "Send it within 24 hours, to each individual interviewer if you have their emails, not one generic note to the recruiter to forward.",
            "Reference something specific from your conversation with that person — a question they asked, a detail about their team's work — not a templated paragraph that could apply to any interview.",
            "Use it to add one thing you didn't get to say, if there's a genuine gap, rather than just repeating your interest in the role.",
            "Keep it short. A thank-you note is a courtesy and a small signal, not a second interview answer.",
          ],
        },
        {
          kind: "example",
          heading: "A structure that works",
          body: "Notice it's specific to the conversation, not just \"thank you for your time\" — that's what makes it read as genuine rather than procedural.",
          code: `"Thanks for taking the time to talk through the data
migration project today — I've been thinking more about
the phased rollout approach you mentioned, and it's a big
part of why I'm excited about the role. One thing I didn't
get to mention: I led a similar migration at [company] and
would be glad to talk through it more if useful."`,
        },
        {
          kind: "bullets",
          heading: "Reading the signals while you wait",
          bullets: [
            "A fast next-round scheduling request is a genuinely good sign — it usually means no internal debate about whether to move you forward.",
            "A generic \"we'll be in touch\" with no timeline isn't necessarily bad news — ask directly: \"Do you have a sense of timeline for next steps?\" rather than trying to read tone in an email.",
            "A long silence past the timeline you were given is worth one polite check-in, not several. If a recruiter said \"early next week\" and it's now the following Friday, a single follow-up is reasonable; a daily one reads as pressure, not interest.",
            "Radio silence after a promised date, with no response to a follow-up either, is itself information — treat the process as likely stalled and keep moving on other opportunities rather than pausing your whole search to wait.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "The asymmetry worth remembering",
          body: "A thoughtful follow-up rarely costs you anything, even in a process that was already going to end in a rejection. Skipping it costs you nothing when things go well, but occasionally costs you a genuine edge when a decision is close. It's a small, low-risk action with only upside.",
        },
        {
          kind: "summary",
          heading: "Following up, briefly",
          bullets: [
            "A specific, personal thank-you note within 24 hours to each interviewer.",
            "Ask directly about timeline instead of guessing from tone or silence.",
            "One polite check-in past a missed date is reasonable; repeated ones aren't.",
            "Treat unexplained silence as real information and keep your other options moving.",
          ],
        },
      ],
    },
    {
      title: "Practice: Building Your STAR Story Bank",
      durationMinutes: 13,
      slides: [
        {
          kind: "title",
          heading: "Practice: Building Your STAR Story Bank",
          subheading:
            "Draft three real answers now, before an interview forces you to improvise them live.",
        },
        {
          kind: "practice",
          heading: "Draft your \"tell me about a failure\" answer",
          prompt:
            "Using the STAR shape, draft your answer to \"Tell me about a time you failed.\" Pick a real, specific failure — not a disguised humble-brag (\"I work too hard\") — where you can honestly name what went wrong and what you actually changed afterward. Write the full answer, aiming for 60-90 seconds spoken.",
          hint: "Spend one sentence on Situation, one on Task, most of the answer on Action (what you did and specifically what you got wrong), and make sure Result includes the lesson, not just the outcome.",
          solution:
            "\"On a product launch I owned, I assumed our existing analytics setup would capture the new feature's usage automatically — it didn't, because the events needed custom tagging I hadn't scoped in. [Situation/Task] Two weeks after launch, I realized we had almost no usage data to show whether the feature was working. [Action] I owned the mistake directly with my manager rather than downplaying it, then worked with an engineer to backfill instrumentation and built a lightweight weekly report so it wouldn't happen again on the next launch. [Result] We recovered three weeks of partial data through log analysis, and every launch since has had an instrumentation checklist item before go-live — a step that's now standard for the team.\"",
        },
        {
          kind: "practice",
          heading: "Draft your \"time you disagreed with your manager\" answer",
          prompt:
            "Draft a STAR answer to \"Tell me about a time you disagreed with your manager.\" Choose a real disagreement where you pushed back constructively and it led to a genuine resolution — not one where you simply complied, and not one where you were simply right and they were simply wrong.",
          hint: "This question is testing whether you can push back without either going silent or being insubordinate. Show the actual conversation — what you said, not just that you \"raised concerns.\"",
          solution:
            "\"My manager wanted to ship a feature two weeks early by cutting the QA pass to one round instead of two. [Situation/Task] I disagreed, but instead of just saying no, I laid out the specific risk — a similar cut on a past project had caused a production bug that cost us a week of hotfixes — and proposed a middle ground: keep both QA rounds but cut scope on a lower-priority part of the feature to hit the earlier date. [Action] My manager agreed to the trade-off once it was framed as a specific alternative rather than just pushback. [Result] We shipped on the revised date with both QA passes intact, and no regressions — and my manager started looping me into scope-timeline tradeoffs earlier on later projects.\"",
        },
        {
          kind: "practice",
          heading: "Draft your strongest \"proudest work\" answer",
          prompt:
            "Draft a STAR answer to \"What's a piece of work you're most proud of?\" Choose something where your individual contribution is genuinely clear — practice separating \"I\" from \"we\" explicitly, the way the course recommends.",
          hint: "If it was a team effort, say so once, then be explicit about your specific piece: \"the team did X; I specifically owned Y and drove Z.\"",
          solution:
            "\"Our team was tasked with cutting customer churn, which was trending up quarter over quarter. [Situation/Task] The team ran several workstreams — I specifically owned the onboarding-email analysis, and proposed and built a revised email sequence with clearer setup guidance after finding that most churned customers had never completed a key setup step. [Action] I ran it as an A/B test against the old sequence before rolling it out fully. [Result] The new sequence lifted setup completion by 22% for new customers, and churn in that segment dropped by roughly a third over the following two quarters — a change that's still the default onboarding flow today.\"",
        },
        {
          kind: "summary",
          heading: "What a strong story bank has in common",
          bullets: [
            "Real, specific situations — not composites or exaggerations you'd struggle to defend under a follow-up question.",
            "\"I\" clearly separated from \"we\" in every Action section.",
            "A Result that names what changed, and ideally what you'd still improve — not just \"and it worked out.\"",
            "Answers you could start from any point in, not a memorized script you'd lose your place in.",
          ],
        },
      ],
    },
    {
      title: "Knowledge Check: Interview Prep",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Knowledge Check: Interview Prep",
          subheading: "Five questions across the whole course.",
        },
        {
          kind: "quiz",
          heading: "STAR method",
          question:
            "In a strong STAR answer, which part should typically take up the largest share of the response?",
          options: ["Situation", "Task", "Action", "Result"],
          correctIndex: 2,
          explanation:
            "Action is where you show what you actually did, step by step — it's the part interviewers are most evaluating. A common mistake is spending most of the answer on Situation context and rushing or skipping the rest.",
        },
        {
          kind: "quiz",
          heading: "Behavioral questions",
          question:
            "An interviewer asks, \"Tell me about a time you failed.\" What is this question primarily evaluating, according to this course?",
          options: [
            "How severe the failure was, since bigger failures show more resilience",
            "Whether you can find an example where the failure wasn't really your fault",
            "Self-awareness and whether you extracted a real, applied lesson from it",
            "Whether you've ever failed at all, since some candidates will claim they haven't",
          ],
          correctIndex: 2,
          explanation:
            "The course is explicit that severity isn't the point — a small, honest failure with a clear lesson beats a vague or deflected big one. The evaluation is on self-awareness and follow-through, not on how dramatic the failure was.",
        },
        {
          kind: "quiz",
          heading: "Technical and case interviews",
          question:
            "A candidate in a technical interview goes silent for two minutes while stuck, then presents a full working solution. What does this course say about that approach?",
          options: [
            "It's ideal — interviewers only care about the final answer being correct",
            "Silence while stuck is the worst option; narrating what you know, what you've ruled out, and your next direction is stronger even before you land on an answer",
            "It's fine as long as the solution is optimal on the first attempt",
            "Interviewers expect total silence during problem-solving and interpret talking as a lack of confidence",
          ],
          correctIndex: 1,
          explanation:
            "The course's core point about technical/case rounds is that the evaluation is on process as much as outcome — an interviewer who sees a structured approach to being stuck often comes away more confident than one who only watches a smooth answer to an easy problem.",
        },
        {
          kind: "quiz",
          heading: "Questions to ask",
          question:
            "Which of these is the strongest question to ask an interviewer near the end of a first-round interview, per this course?",
          options: [
            "\"What does your company do?\"",
            "\"What's the salary range for this role?\"",
            "\"What does success look like in this role at 6 months and a year?\"",
            "\"Do you have any concerns about my background?\" as a yes/no check",
          ],
          correctIndex: 2,
          explanation:
            "Questions answerable from the company website (like what the company does) signal a lack of preparation, and compensation specifics are generally better left until the interviewer raises them. The success-metrics question shows you're thinking about impact and evaluating fit both ways.",
        },
        {
          kind: "quiz",
          heading: "After the interview",
          question:
            "A candidate was told by a recruiter \"we'll follow up early next week\" and it's now the following Friday with no word. What does this course recommend?",
          options: [
            "Send one polite check-in asking for a status update",
            "Email daily until you get a response, since persistence signals interest",
            "Assume the process is dead and never follow up at all",
            "Call the interviewer's personal cell phone if you can find it",
          ],
          correctIndex: 0,
          explanation:
            "The course's guidance is one polite follow-up past a missed timeline, not repeated ones — a single check-in reads as reasonable interest, while daily follow-ups read as pressure rather than genuine engagement.",
        },
        {
          kind: "summary",
          heading: "This course's core takeaways",
          bullets: [
            "STAR works when Action carries the weight and Result is never skipped.",
            "Behavioral questions test the trait behind the story, not the story's drama — pick honest, specific examples.",
            "In technical and case rounds, narrate your reasoning; process is evaluated as much as the answer.",
            "Prepare real, specific questions for them — it's still part of the evaluation, both ways.",
            "Follow up specifically and promptly, then read silence as real information without escalating pressure.",
          ],
        },
      ],
    },
  ],
};
