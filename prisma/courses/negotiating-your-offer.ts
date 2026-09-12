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
    {
      title: "Using a Competing Offer as Leverage (Without Overplaying It)",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Using a Competing Offer as Leverage (Without Overplaying It)",
          subheading:
            "A real competing offer is some of the strongest leverage you can have — and it's also the easiest thing to mishandle in a way that damages trust on both sides.",
        },
        {
          kind: "text",
          heading: "Why a real competing offer works",
          body: [
            "A specific, real number from another company is concrete evidence a hiring manager can act on internally — it's far more persuasive than a general \"I was hoping for more,\" because it answers the question of what the market is actually paying you, right now, for the same work.",
            "It also creates real urgency: a company that wants you now has a concrete reason to move quickly rather than let the process drift.",
          ],
        },
        {
          kind: "bullets",
          heading: "How to use it without overplaying it",
          bullets: [
            "Disclose only what you're comfortable having checked — never invent a number or a company. It's frequently discoverable, and even when it isn't, the risk of getting caught in an easily-avoidable lie outweighs the leverage.",
            "Name the number and, if comfortable, the type of role, without necessarily naming the company, unless doing so helps your case: \"I have another offer at $X for a similar-scope role.\"",
            "Be genuine about preference. If you'd rather take this job, say so — \"this is honestly my first choice, I just want to understand if there's room to close the gap\" reads as collaborative, not as a bidding war.",
            "Give a real deadline, not a manufactured one, if the other offer has one: \"I need to give them an answer by Friday\" is useful information, not a pressure tactic, as long as it's true.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "The bluff that backfires",
          body: "Claiming a competing offer that doesn't exist, or inflating a real one's number, is one of the riskiest moves in a negotiation. Recruiters compare notes more than candidates expect, offer letters get requested as verification more often than people assume, and a caught bluff doesn't just lose you the extra ask — it can lose you the offer entirely.",
        },
        {
          kind: "bullets",
          heading: "When you don't have a competing offer",
          bullets: [
            "You can still negotiate — most of this course's advice (research, a specific number, prioritized asks) doesn't depend on having one.",
            "Don't manufacture urgency you don't have (\"I have other things in the works\" when you don't) — a specific, well-researched ask stands on its own without needing a fake competing process behind it.",
          ],
        },
        {
          kind: "summary",
          heading: "The honest version of leverage",
          bullets: [
            "A real competing offer, disclosed honestly and specifically, is legitimate and effective leverage.",
            "A fabricated one is a real risk for a small, recoverable gain — the math rarely favors it.",
          ],
        },
      ],
    },
    {
      title: "Practice: Calculating Your Number and Drafting the Ask",
      durationMinutes: 13,
      slides: [
        {
          kind: "title",
          heading: "Practice: Calculating Your Number and Drafting the Ask",
          subheading:
            "Work through a realistic offer scenario end to end — the number, the message, and the priority call.",
        },
        {
          kind: "practice",
          heading: "Set your target, walk-away, and stretch numbers",
          prompt:
            "Scenario: you're a marketing manager who currently earns $95,000 base. Research (comp-site data, two recruiter conversations, and your own network) shows similar roles at similar-sized companies pay $100,000-$120,000 base. You've received an offer at $102,000 base. Set your target, walk-away, and stretch numbers, and briefly justify each.",
          hint: "Walk-away should reflect the minimum you'd seriously reconsider over — often near the bottom of the researched range, not just \"more than I have now.\" Stretch should be defensible if someone asked you to explain it, not just your dream number.",
          solution:
            "Walk-away: $100,000 — at the bottom of the researched range, and barely above current pay once you account for a new-job risk premium. Target: $112,000 — solidly mid-range for the data gathered, comfortably justifiable by referencing the research directly. Stretch: $118,000 — near the top of the range, defensible by pointing to specific relevant experience (e.g., a skill or industry background above the median candidate), used as the opening ask rather than the expected outcome.",
        },
        {
          kind: "practice",
          heading: "Draft the counter-offer message",
          prompt:
            "Using the scenario above, draft the actual message (written or spoken) you'd send back on the $102,000 offer, opening with your stretch number.",
          hint: "Confirm genuine interest, name a specific number, and ground it in something other than just wanting more — your research, your relevant experience, or both.",
          solution:
            "\"Thank you again for the offer — I'm genuinely excited about the role and the team. Based on my research into the market for marketing manager roles at similarly sized companies, and my background running paid acquisition campaigns at scale, I was hoping we could get closer to $118,000 on the base. Is there flexibility there?\"",
        },
        {
          kind: "practice",
          heading: "Prioritize your asks when the base won't move",
          prompt:
            "The recruiter comes back and says the base is capped at $105,000 for this level, but there may be room elsewhere. From this course's list of other levers (sign-on bonus, equity, start date, title, review timeline, professional development budget), pick your top two asks for this scenario and explain why, in priority order.",
          hint: "Rank by what genuinely matters most to you, not by asking for everything with equal weight — the course is explicit that spreading asks evenly makes it harder for the other side to say yes to any one of them.",
          solution:
            "1) A sign-on bonus of roughly $8,000-10,000 to close most of the gap between $105,000 and target — a one-time cost is typically easier to approve than a permanent base change, and it directly compensates for the shortfall. 2) A compensation review at 6 months instead of the standard 12, tied to specific, agreed success metrics — this creates a near-term path back to base if performance is strong, rather than waiting a full year to revisit the number.",
        },
        {
          kind: "summary",
          heading: "What a well-run negotiation looks like",
          bullets: [
            "Three real numbers, decided before the pressure of a live conversation — not one wish figure.",
            "A specific counter grounded in research or experience, not just \"I was hoping for more.\"",
            "A clear priority order on non-salary levers, asked for one or two at a time, not all at once.",
          ],
        },
      ],
    },
    {
      title: "Knowledge Check: Negotiating Your Offer",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Knowledge Check: Negotiating Your Offer",
          subheading: "Five questions across the whole course.",
        },
        {
          kind: "quiz",
          heading: "The core reframe",
          question:
            "According to this course, why is an initial offer usually not a company's absolute final number?",
          options: [
            "Companies are legally required to leave room to negotiate",
            "Most initial offers are deliberately built with some room for exactly this conversation with a reasonable candidate",
            "Recruiters are instructed to always lowball every candidate by the same fixed percentage",
            "Initial offers are randomly generated and unrelated to the actual budget",
          ],
          correctIndex: 1,
          explanation:
            "The course frames the initial offer as typically anchored to expect a reasonable counter, not as a rock-bottom final number — that's the core reframe that makes asking worthwhile in the first place.",
        },
        {
          kind: "quiz",
          heading: "Researching your number",
          question:
            "What does this course recommend building before entering a negotiation conversation?",
          options: [
            "A single ideal number to ask for",
            "A target, walk-away, and stretch number, grounded in real data gathered ahead of time",
            "Only a walk-away number, since target and stretch are unnecessary",
            "A number based only on what you currently earn plus 10%",
          ],
          correctIndex: 1,
          explanation:
            "The course specifically recommends three figures — target, walk-away, and stretch — built from real research before you're under the pressure of a live conversation, not a single number decided on the spot.",
        },
        {
          kind: "quiz",
          heading: "Negotiating beyond salary",
          question:
            "Why does the course suggest a sign-on bonus is often easier for a company to approve than a base salary increase?",
          options: [
            "Sign-on bonuses are always larger in total value than a base increase",
            "It's a one-time cost rather than a permanent change to a pay band",
            "Sign-on bonuses don't require any manager approval at all",
            "Base salary can never be negotiated under any circumstances",
          ],
          correctIndex: 1,
          explanation:
            "The course's reasoning is specifically about cost structure — a sign-on bonus is a one-time expense, while a base increase is a permanent line-item change tied to a pay band, which is often more tightly controlled.",
        },
        {
          kind: "quiz",
          heading: "Using a competing offer",
          question:
            "What does this course say about disclosing a competing offer during negotiation?",
          options: [
            "Never mention a competing offer under any circumstances",
            "Inventing a competing offer is a low-risk way to strengthen your position if you're confident it won't be checked",
            "A real, honestly disclosed competing offer is legitimate leverage; fabricating one risks far more than it gains if discovered",
            "Only disclose a competing offer if it's from a direct competitor in the same industry",
          ],
          correctIndex: 2,
          explanation:
            "The course draws a sharp line: a genuine competing offer, disclosed honestly, is real and effective leverage. A fabricated one is a serious risk, since it's often checkable and a caught bluff can cost you the entire offer, not just the extra ask.",
        },
        {
          kind: "quiz",
          heading: "Handling a final offer",
          question:
            "A recruiter says \"this is our final offer,\" and the number is above your walk-away figure but below your target. What does this course suggest as a reasonable next step?",
          options: [
            "Issue an ultimatum demanding the target number or you'll decline",
            "Accept immediately without any further check, since it was declared final",
            "Ask if there's flexibility elsewhere (sign-on, equity, start date) while respecting that the base is fixed, then decide based on whether it clears your walk-away number",
            "Assume the recruiter is lying and demand to speak to their manager",
          ],
          correctIndex: 2,
          explanation:
            "The course recommends a low-risk check on remaining flexibility elsewhere, without pushing back on the stated base — and notes that if the final number is at or above your walk-away figure, accepting it isn't a loss, since a firm final offer can still be a good outcome.",
        },
        {
          kind: "summary",
          heading: "This course's core takeaways",
          bullets: [
            "Most offers have built-in room; not asking is the most common way money gets left on the table.",
            "Research your target, walk-away, and stretch numbers before you're in the conversation.",
            "Base salary is often the least flexible lever — sign-on, equity, start date, and title frequently have more room.",
            "A real competing offer is strong leverage; a fabricated one is a serious, often-discovered risk.",
            "A genuinely final offer isn't a loss if it clears your walk-away number — know that number ahead of time.",
          ],
        },
      ],
    },
  ],
};
