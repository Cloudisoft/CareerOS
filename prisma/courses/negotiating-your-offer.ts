import type { CourseSeed } from "../course-types";

export const course: CourseSeed = {
  slug: "negotiating-your-offer",
  title: "Negotiating Your Offer",
  description:
    "A grounded approach to negotiating compensation and terms — what to research, what to say, and how to handle pushback.",
  category: "Negotiation",
  level: "INTERMEDIATE",
  order: 3,
  lessons: [
    {
      title: "Why Most People Leave Money on the Table",
      durationMinutes: 5,
      slides: [
        {
          kind: "title",
          heading: "Why Most People Leave Money on the Table",
          subheading:
            "Most candidates don't negotiate — not because they don't want more, but because negotiating feels uncomfortable and the downside feels scarier than the upside is exciting.",
        },
        {
          kind: "text",
          heading: "The core reframe",
          body: [
            "An offer is very rarely a company's absolute final number — it's usually the number they expect a reasonable candidate might counter. Most companies build some room into an initial offer for exactly this conversation.",
            "Not negotiating doesn't just leave money on the table once; because future raises are usually a percentage of current pay, it compounds over years.",
          ],
        },
        {
          kind: "bullets",
          heading: "What actually changes an outcome",
          bullets: [
            "Having a specific, researched number, not a vague \"I was hoping for more.\"",
            "Being willing to have the conversation at all. A large share of the gap between people who get more and people who don't is simply asking versus not asking.",
            "Framing it as a genuine question, not a demand. \"Is there flexibility on the base?\" invites a conversation; \"I need $15k more or I walk\" invites a standoff.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "What doesn't work",
          body: "Negotiating against yourself by opening with \"I know this is probably not possible, but...\"; making up a competing offer that doesn't exist (easy to get wrong in checkable ways, and a bad foundation even if it isn't caught); or negotiating everything at once in a scattered way instead of prioritizing what matters most to you.",
        },
        {
          kind: "summary",
          heading: "The goal",
          bullets: [
            "This isn't about turning negotiation into a battle.",
            "It's about making sure you ask the reasonable questions most people skip.",
          ],
        },
      ],
    },
    {
      title: "Researching Your Number Before You Need It",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Researching Your Number Before You Need It",
          subheading:
            "The strongest negotiating position is knowing your number before the offer arrives — not scrambling to find one in the 48 hours you've been given to respond.",
        },
        {
          kind: "bullets",
          heading: "Where to find real data",
          bullets: [
            "Levels.fyi, Glassdoor, and similar sites for role- and company-specific ranges, cross-checked against more than one source.",
            "Recruiters at other companies you're in process with — a competing real range is some of the most credible information you can have.",
            "Your own network in similar roles, especially at similar-sized companies — direct conversations are often more accurate than aggregated site data.",
            "Published pay bands, where companies disclose them (increasingly common, especially in jurisdictions with pay transparency laws).",
          ],
        },
        {
          kind: "bullets",
          heading: "Build a range, not a single number",
          intro: "Land on three figures:",
          bullets: [
            "Target — what you'd be glad to get, grounded in real data, not a wish.",
            "Walk-away — the number below which you'd seriously reconsider, decided before the pressure of a live conversation.",
            "Stretch — a number you could justify if pushed to explain it, used as your opening ask.",
          ],
        },
        {
          kind: "text",
          heading: "Factor in the full picture, not just base salary",
          body: [
            "Total compensation includes base, bonus target, equity (and its vesting schedule), sign-on bonus, and benefits.",
            "A lower base with strong equity can be a better deal than a higher base with none — but only if you actually understand the equity's real value and vesting terms rather than taking the headline number at face value.",
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Do this before you're in the room",
          body: "Do this research before you're in a live negotiation. Trying to figure out your number while also responding to a recruiter's email is how people end up anchoring too low.",
        },
      ],
    },
    {
      title: "The First Conversation: How to Respond to an Offer",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "The First Conversation: How to Respond to an Offer",
          subheading:
            "How you respond in the first 24-48 hours after an offer sets the tone for everything that follows. The goal is to buy real time and open the door to a counter.",
        },
        {
          kind: "example",
          heading: "Don't answer on the spot",
          body: "When an offer comes in live (phone or video), it's completely normal to say this. No reasonable employer penalizes it — it's expected.",
          code: `"Thank you, I'm excited about this. I'd like a couple of days
to look everything over properly — can I follow up by
[specific day]?"`,
        },
        {
          kind: "example",
          heading: "The counter-offer conversation",
          body: "Notice what this does: it confirms genuine interest, gives a specific number, and grounds it in something other than \"I want more.\"",
          code: `"Thank you again for the offer — I'm genuinely excited about
the role. Based on my research into the market for this
position and my experience with [specific relevant
skill/background], I was hoping we could get closer to $X on
the base. Is there flexibility there?"`,
        },
        {
          kind: "bullets",
          heading: "Handling common responses",
          bullets: [
            "\"Let me check and get back to you.\" — Normal. Don't fill the silence with a weaker follow-up while you wait.",
            "\"That's above our band for this level.\" — Ask what would move you into a higher band, or whether other levers (sign-on, equity, title, start date) have more room.",
            "A partial yes. — A move from a firm \"no\" to \"let me see what I can do\" is real progress, even before a number changes.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Get the final offer in writing",
          body: "Once terms are agreed, confirm everything in writing before resigning from a current role or declining other offers — verbal agreements in a fast-moving process are easy to misremember or lose in the noise.",
        },
      ],
    },
    {
      title: "Negotiating Beyond Salary",
      durationMinutes: 5,
      slides: [
        {
          kind: "title",
          heading: "Negotiating Beyond Salary",
          subheading:
            "Base salary is often the least flexible number in an offer, because it's usually tied to a defined pay band. Other terms frequently have more room to move.",
        },
        {
          kind: "bullets",
          heading: "Levers worth exploring",
          bullets: [
            "Sign-on bonus — often easier to approve than a base salary increase, since it's a one-time cost rather than a permanent line-item change.",
            "Equity/RSU grant size — at companies that compensate with equity, this can carry meaningfully more upside than a small base bump, especially early at a growing company.",
            "Start date — if you need more runway (relocation, notice period, a planned break), this is usually a low-friction ask.",
            "Title — can matter for both internal leveling now and how your resume reads for the next role.",
            "Remote/hybrid flexibility, or a review timeline — asking for a compensation review at 6 months instead of 12 is a real, specific ask if you're taking the role below your target.",
            "Professional development budget, or relocation support, where relevant.",
          ],
        },
        {
          kind: "text",
          heading: "How to prioritize",
          body: [
            "Before the conversation, rank what actually matters to you. If equity matters more than a sign-on bonus, lead with that — asking for everything at once, with equal weight, makes it harder for the other side to say yes to any of it.",
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "A useful framing",
          body: "\"I understand the base might be fixed at this level. Is there flexibility on [the lever you care about most] instead?\" This keeps the conversation collaborative rather than adversarial, and signals you've thought about the offer as a whole package, not just one number.",
        },
      ],
    },
    {
      title: 'Handling a "This Is Our Final Offer"',
      durationMinutes: 5,
      slides: [
        {
          kind: "title",
          heading: 'Handling a "This Is Our Final Offer"',
          subheading:
            "At some point in most negotiations, you'll hear some version of \"this is the best we can do.\" How you respond here matters — for this offer and for how the relationship starts if you accept.",
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "First, figure out if it's actually final",
          body: "Not every \"final offer\" is truly final. A useful, low-risk check: \"I understand. Is there anything else — sign-on, start date, or equity — that has more flexibility, even if the base doesn't?\" This respects the stated limit while checking for remaining room, without pushing back on the base number itself.",
        },
        {
          kind: "bullets",
          heading: "If it genuinely is final, you have three real options",
          bullets: [
            "Accept it, if it still meets your walk-away number and you want the role — a firm final offer isn't a loss if it was already a good outcome.",
            "Decline gracefully, if it's below your walk-away number, leaving the relationship intact: \"I really appreciate the offer and the process — at this point the compensation doesn't quite work for me, but I'd love to stay in touch.\" Companies remember candidates who decline professionally, and this door often reopens later.",
            "Ask for time to decide, if you're genuinely unsure — a reasonable, normal request, not a stalling tactic, as long as you give a real, specific date you'll respond by.",
          ],
        },
        {
          kind: "bullets",
          heading: "What not to do",
          bullets: [
            "Don't issue an ultimatum you're not prepared to follow through on.",
            "Don't reopen a number you already explicitly agreed to just because a new detail came up later.",
            "Don't let frustration bleed into tone. Even a \"no\" handled respectfully keeps a door open for a different role there in the future.",
          ],
        },
        {
          kind: "summary",
          heading: "The real goal of negotiating",
          bullets: [
            "Negotiation, done well, isn't about extracting the maximum possible number.",
            "It's about making sure you didn't accept less than you needed to, simply because asking felt uncomfortable.",
          ],
        },
      ],
    },
  ],
};
