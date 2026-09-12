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
  ],
};
