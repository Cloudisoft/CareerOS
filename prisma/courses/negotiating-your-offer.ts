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
          kind: "text",
          heading: "The fear that stops most people: will they pull the offer?",
          body: [
            "This is the single biggest reason people don't ask. In reality, a professional, reasonable counter — asking a genuine question rather than issuing an ultimatum — essentially never causes a company to withdraw an offer. Rescinding an offer over a polite counter would be an unusual, reputation-damaging move a company has little reason to make.",
            "The exception is when the ask itself is unreasonable in tone or scale — a demand rather than a question, or a number wildly outside any researched range. That's a real risk, but it's a risk created by how you ask, not by the act of asking at all.",
          ],
        },
        {
          kind: "bullets",
          heading: "What actually changes an outcome",
          bullets: [
            "Having a specific, researched number, not a vague \"I was hoping for more.\"",
            "Being willing to have the conversation at all. A large share of the gap between people who get more and people who don't is simply asking versus not asking.",
            "Framing it as a genuine question, not a demand. \"Is there flexibility on the base?\" invites a conversation; \"I need $15k more or I walk\" invites a standoff.",
            "Understanding which employers have real room and which don't — publicly funded roles and some large companies with strict, published pay bands genuinely have less flexibility than a venture-backed startup setting an offer case-by-case; calibrate your expectation, not your decision to ask, accordingly.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Giving a range instead of a number",
          body: "\"I was hoping for something in the $95k-$110k range\" feels safer than naming one figure, but a reasonable counterpart will simply anchor to the bottom of it — you've effectively asked for $95k. If you want to signal some flexibility, give your specific number and let the conversation, not your opening ask, introduce the range.",
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
          heading: "Adjusting for factors that shift the range",
          bullets: [
            "Location: a role posted as \"remote\" doesn't always mean location-agnostic pay — some companies band by your location, others by a single national or role-based band regardless of where you sit. Ask directly if it's unclear before anchoring your number to the wrong data.",
            "Company stage and funding: a well-funded, later-stage company can often pay closer to the top of a range than an early-stage startup with more equity and less cash — factor this in when a single source's range feels too generic to be useful.",
            "Your own leverage relative to the role: a role that's hard for the company to fill (niche skill, urgent need) generally has more real room than a role with a deep, easy-to-fill candidate pool, even at the same nominal level.",
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
          kind: "chart",
          heading: "Example: three numbers built from real research",
          description: "For a role where researched offers cluster between $90k and $120k, the three figures might land like this — grounded in data, not a wish.",
          chartType: "bar",
          unit: "base salary ($)",
          data: [
            { label: "Walk-away", value: 92000 },
            { label: "Target", value: 108000 },
            { label: "Stretch", value: 120000 },
          ],
        },
        {
          kind: "text",
          heading: "When your sources disagree",
          body: [
            "Comp-site data, recruiter conversations, and your network won't always line up — a comp site might show $90k-$115k while a recruiter mentions $105k-$130k for the same rough role. When that happens, weight direct, role-specific conversations (a recruiter naming an actual band, a real acquaintance's real offer) above aggregated site data, since site data often blends job titles that don't map perfectly onto the specific role and level you're targeting.",
            "If sources genuinely conflict and you can't resolve it with more research, it's reasonable to set your walk-away number toward the more conservative end and let your stretch number reflect the more optimistic one — the range itself becomes useful information, not a problem to eliminate before you can act.",
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
          kind: "example",
          heading: "Comparing two offers that split base and equity differently",
          body: "Neither number tells the whole story alone — the comparison only works once you've translated equity into a real, if imperfect, annualized estimate.",
          code: `Offer A: $130k base, minimal equity.
Offer B: $115k base, equity estimated at roughly $20k/year
value over a 4-year vest, at a company you believe in.

Rough total comp: A ≈ $130k/year. B ≈ $135k/year, if the
equity estimate holds — but B's number carries real
uncertainty (vesting cliffs, valuation risk) that A's doesn't.
The right choice depends on how much of that uncertainty
you're willing to hold, not just which total is bigger on paper.`,
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
          kind: "bullets",
          heading: "Written vs. spoken: same content, different care",
          bullets: [
            "A phone or video counter can be slightly more casual in delivery, but should still hit the same three beats: gratitude, a specific number, a genuine question about flexibility.",
            "A written counter (email) is worth drafting and re-reading before sending — tone is harder to read in text, and a message that feels natural spoken can read as blunt or presumptuous in writing if it's not phrased carefully.",
            "Keep it to the recruiter or the person who actually extended the offer, not a wider group — negotiating compensation isn't a conversation to loop in a future manager or team members on, even if they're cc'd on other threads.",
            "If the conversation started on the phone, a brief written follow-up confirming what was discussed protects both sides and avoids relying on memory for numbers.",
          ],
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
          kind: "example",
          heading: "A written counter-offer",
          body: "Same three beats as the spoken version — gratitude, a specific ask, a genuine question — just formatted for an email a recruiter can forward internally if needed.",
          code: `Subject: Re: Offer — [Your Name]

Hi [Recruiter],

Thank you again for the offer — I'm genuinely excited about
the team and the role. After looking over the details and
comparing against my research into the market for this
position, I was hoping we could get closer to $X on the base.
Is there flexibility there?

Happy to hop on a call if that's easier to discuss.

Best,
[Your Name]`,
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
          heading: "The recruiter is usually a messenger, not the decision-maker",
          body: "A recruiter relaying \"let me check\" isn't stalling — they're genuinely taking your ask to a hiring manager or a comp team who sets the real limits. Getting frustrated at a recruiter for not having an immediate answer misreads their role in the process; they're often more useful as an ally who wants the deal to close than as an obstacle.",
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Get the final offer in writing",
          body: "Once terms are agreed, confirm everything in writing before resigning from a current role or declining other offers — verbal agreements in a fast-moving process are easy to misremember or lose in the noise.",
        },
        {
          kind: "text",
          heading: "When offers land on different timelines",
          body: [
            "It's common for offers to arrive days or weeks apart rather than all at once, which puts real pressure on the first one to decide before you've heard back from others. It's reasonable to ask the first company for a short, specific extension: \"I'm finishing up final conversations with a couple of other opportunities — could I have until [date] to make sure I'm making the right decision?\" Most companies would rather wait a few extra days for a candidate who commits fully than rush one into an answer they later walk back.",
          ],
        },
        {
          kind: "bullets",
          heading: "What to actually do during the days you asked for",
          bullets: [
            "Finish the research from the previous lesson if you haven't already — this is the window it's for, not a formality to get through before the real work starts.",
            "If you have other processes in flight, this is the moment to nudge them for a timeline update — knowing where things stand elsewhere changes what you can reasonably ask for here.",
            "Talk to people who'd be affected by the decision before you're mid-conversation with the recruiter, not during it — a rushed decision made live on a call is much harder to walk back than one made with a clear head beforehand.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Silence for a day or two is normal, not a bad sign",
          body: "A recruiter not responding within a few hours doesn't mean the ask was received badly — compensation conversations usually route through more than one person internally, and a short gap is often just that process working as expected, not a signal the answer is no. If more than a few business days pass with total silence, a brief, polite check-in — \"wanted to check in on timing, still very interested\" — is completely normal and doesn't read as pushy.",
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
          heading: "Putting a rough number on a non-salary ask",
          body: [
            "Before asking for something beyond salary, translate it into a number in your own head, even roughly — it sharpens the ask and helps you actually compare offers later. An extra week of PTO is worth something close to 1/52 of your salary. A professional development budget of $2,000/year is worth exactly that, literally.",
            "This isn't about turning everything into a spreadsheet during the conversation itself — it's about knowing, privately, whether a non-salary concession the company offers actually closes the gap you cared about, or just sounds like it does.",
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
          tone: "warning",
          heading: "Not every lever is a fair trade for cash",
          body: "A company offering extra PTO or a title bump in place of the base increase you asked for isn't automatically an equal trade — PTO you may not use has less real value than cash, and a title alone doesn't pay rent. It's a fine outcome if it's genuinely what you value most, but don't accept a substitute lever just because it was offered instead of the one you actually asked for.",
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "A useful framing",
          body: "\"I understand the base might be fixed at this level. Is there flexibility on [the lever you care about most] instead?\" This keeps the conversation collaborative rather than adversarial, and signals you've thought about the offer as a whole package, not just one number.",
        },
        {
          kind: "text",
          heading: "Which levers actually have room varies by company type",
          body: [
            "A large company with strict, published pay bands often has almost no room on base but real flexibility on sign-on bonus, since a one-time payment doesn't touch the band system at all. An early-stage startup can be the mirror image — genuinely tight on cash for sign-on bonuses, but able to move meaningfully on equity, where the real cost to the company is dilution rather than cash today. Knowing which category a company falls into changes which lever is actually worth leading with, rather than asking for the same thing regardless of who you're negotiating with. Asking a recruiter directly which category applies — rather than guessing from a job posting or company size alone — is a completely reasonable question, and one that saves everyone time.",
          ],
        },
        {
          kind: "example",
          heading: "Asking about a specific lever, directly",
          body: "A direct, specific ask about one lever, after learning the base is fixed, rather than a vague \"is there anything else you can do.\"",
          code: `"Understood on the base. Given that, is there room to move
on the sign-on bonus, or to revisit compensation again at
the 6-month mark instead of the standard year?"`,
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
          kind: "diagram",
          heading: "Working through a genuinely final offer",
          description: "The check for remaining flexibility comes before the accept/decline decision — and that decision itself runs off your walk-away number, decided in advance.",
          steps: [
            { label: "\"This is final\"", detail: "Stated limit on the number itself" },
            { label: "Check other levers", detail: "Sign-on, start date, equity — without reopening base" },
            { label: "Compare to walk-away", detail: "Does it clear the number you set beforehand?" },
            { label: "Accept, decline, or ask for time", detail: "Each is a real, respectable option" },
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
          kind: "text",
          heading: "Why companies say \"final\" even when there's a little room",
          body: [
            "Sometimes \"final offer\" is a literal, hard constraint — a published pay band with no exceptions, or a hiring manager who has genuinely exhausted their approved budget. Other times it's a negotiating posture in itself, said to close out a back-and-forth that's gone on longer than the company wanted. Neither is dishonest exactly — but they call for slightly different responses, and there's often no way to know for certain which one you're dealing with from the words alone.",
          ],
        },
        {
          kind: "bullets",
          heading: "Signals worth reading in how it's said, not just what's said",
          bullets: [
            "A quick, specific explanation for the limit (\"this is capped by our published band for this level\") tends to be genuinely firm — there's a concrete constraint behind it, not just a negotiating stance.",
            "A vaguer \"we've really stretched to get here\" with no specific reason given sometimes has a little more room than it sounds like, especially on a non-base lever.",
            "Tone matters too — a recruiter who sounds apologetic about the limit is often more likely to actually go back and check on a smaller ask than one who sounds simply done with the conversation.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "One more ask is fine; a second round rarely is",
          body: "Going back a second time after already hearing \"this is final\" once, without new information to justify it, risks reading as not taking the company's answer seriously — the single check for other flexibility described earlier is the reasonable move, not a repeated push on the same number.",
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
          kind: "text",
          heading: "Timing the disclosure",
          body: [
            "Bringing up a competing offer too early — before the company has even made its own offer — can read as posturing rather than useful information, since there's nothing yet for it to be leverage against. The natural moment is after you have a real offer in hand and are already in a counter conversation, where a specific competing number directly answers the question the conversation is already asking: is there room to move.",
            "If a competing process is moving faster than your preferred one, it's reasonable to let the slower company know you have a decision deadline elsewhere, even before you've decided what you'll do — this isn't the same as bluffing about the offer's existence, and companies generally respect a candidate being upfront about timing rather than disappearing until a deadline forces an answer.",
          ],
        },
        {
          kind: "example",
          heading: "A full disclosure conversation, start to finish",
          body: "Notice the order: genuine preference first, the number second, the question last — not leading with the number as a threat.",
          code: `"I want to be upfront that I have another offer at $X for a
similar-scope role, and their timeline means I need to give
them an answer by [date]. Honestly, this role is my first
choice — I just wanted to see if there's room to close some
of the gap before I make a final call."`,
        },
        {
          kind: "bullets",
          heading: "When you have more than one competing offer",
          bullets: [
            "Lead with the strongest, most comparable one rather than listing every offer you have — a pile of numbers reads as scattered, while one clear, relevant comparison reads as focused.",
            "If two offers are close in value, it's fine to mention both exist without detailing every number — \"I have two other offers in a similar range\" is honest and still useful information, without turning the conversation into an auction.",
            "Keep track of every deadline separately — juggling multiple real processes is a good problem to have, and a genuinely difficult one to manage well if you're not tracking dates carefully.",
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
            "Work through a realistic offer scenario end to end — the number, the message, the priority call, and a few standalone scenarios that stress-test the same instincts.",
        },
        {
          kind: "text",
          heading: "Before you start",
          body: [
            "The first three exercises follow one scenario from start to finish, the same way a real negotiation actually unfolds — a number, a message, then a priority call once the first ask hits a limit. The remaining exercises are standalone scenarios that test the same judgment calls in situations you're likely to actually hit: comparing offers that split base and equity differently, tightening a weak draft message, and deciding what to disclose about a competing offer.",
          ],
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
          kind: "chart",
          heading: "This scenario's numbers, side by side",
          description: "The offer sits right at the bottom of the researched range — well below even the walk-away number, which is exactly why a counter is worth making here.",
          chartType: "bar",
          unit: "base salary ($)",
          data: [
            { label: "Current pay", value: 95000 },
            { label: "Offer received", value: 102000 },
            { label: "Walk-away", value: 100000 },
            { label: "Target", value: 112000 },
            { label: "Stretch (opening ask)", value: 118000 },
          ],
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
          kind: "practice",
          heading: "Evaluate a total-comp trade-off",
          prompt:
            "You have two offers for the same type of role. Offer A: $125,000 base, no meaningful equity. Offer B: $108,000 base, plus equity the company estimates at roughly $24,000/year over a 4-year vest, at a company you have genuine conviction in. Calculate the rough annual total comp for each, and name two things you'd want to know before treating Offer B's number as directly comparable to Offer A's.",
          hint: "Total comp isn't just base plus the headline equity figure — a vesting cliff, the company's actual valuation trajectory, and how liquid or illiquid the equity is all change how much that number is really worth to you today, versus on paper.",
          solution:
            "Offer A ≈ $125,000/year, essentially guaranteed. Offer B ≈ $132,000/year on paper ($108,000 + $24,000), but that $24,000 is an estimate, not cash — it assumes the company's valuation holds or grows, and it's usually illiquid until a future exit or liquidity event. Two things worth confirming before treating them as equivalent: the vesting schedule (is there a 1-year cliff, meaning nothing vests until year one is complete?), and how the equity is being valued (a recent funding round's valuation, or a more speculative internal estimate?). Offer A's number is safer; Offer B's is higher on paper but carries real uncertainty that a single dollar figure can hide.",
        },
        {
          kind: "practice",
          heading: "Rewrite a weak counter into a strong one",
          prompt:
            "A friend drafts this counter-offer message and asks for feedback before sending it: \"Hey, thanks so much for the offer! I was hoping there might be a little more room on the salary if that's possible? No worries at all if not, I totally understand if it's not doable!\" Identify what's weak about it, and rewrite it using the three-beat structure from this course.",
          hint: "It's missing a specific number entirely, and the apologetic tone — signaling twice that it's fine to say no before the other side has even responded — undercuts the ask before it's made.",
          solution:
            "What's weak: there's no specific number (\"a little more\" gives the recruiter nothing concrete to act on or take to a manager internally), and the message negotiates against itself twice — \"no worries at all\" and \"I totally understand if it's not doable\" signal in advance that the asker doesn't expect or need a yes, which makes it easy to simply decline. Rewritten: \"Thank you so much for the offer — I'm genuinely excited about the role. Based on my research into similar positions at comparable companies, I was hoping we could get closer to $[specific number] on the base. Is there flexibility there?\" Same warmth, but now it's a genuine, answerable question with a real number attached.",
        },
        {
          kind: "practice",
          heading: "Decide what to disclose about a competing offer",
          prompt:
            "You have a real competing offer at $118,000 for a similar-scope role, and you're currently negotiating a preferred offer that's at $108,000. Using this course's guidance, write the specific line you'd use to disclose it, and explain what you'd deliberately choose not to say.",
          hint: "Disclose the number and role type if you're comfortable; this course specifically notes you don't need to name the company unless doing so helps your case, and a genuine deadline is useful information, not a pressure tactic, as long as it's actually true.",
          solution:
            "\"I have another offer at $118,000 for a similar-scope role, and while this is honestly my first choice, I wanted to see if there's room to close some of that gap.\" Deliberately left out: the specific company name (not required, and only worth naming if it strengthens the case — a well-known, hard-to-get offer might; a lesser-known one might not add much), and any invented urgency — if there's no real deadline on the other offer, none is mentioned, since manufacturing one is exactly the kind of bluff this course warns against.",
        },
        {
          kind: "practice",
          heading: "Decide: accept, push, or walk",
          prompt:
            "Your walk-away number was $100,000. The recruiter says the final offer is $103,000 base, with no competing offer in hand and a role you're genuinely excited about. Using this course's framework, decide what you'd do next, and justify it in one or two sentences.",
          hint: "The decision runs off the walk-away number set before the conversation, not a feeling in the moment — and checking for flexibility on a non-base lever doesn't require reopening the base number itself.",
          solution:
            "$103,000 clears the $100,000 walk-away number, so this isn't a case for declining outright. The reasonable move: ask once whether there's flexibility on a non-base lever (sign-on, start date, review timeline) without pushing on the base itself, then accept if nothing further moves — a firm final offer that clears your walk-away number, for a role you're genuinely excited about, is a good outcome, not a loss just because the stretch number wasn't reached.",
        },
        {
          kind: "diagram",
          heading: "The five exercises as one decision flow",
          description: "Different scenarios, same underlying shape — research grounds the number, the number grounds the message, and the walk-away number grounds the final call.",
          steps: [
            { label: "Research the range", detail: "Comp data, recruiter conversations, your network" },
            { label: "Set three numbers", detail: "Walk-away, target, and stretch — before the pressure of a live call" },
            { label: "Make a specific ask", detail: "A real figure, grounded in research or experience, not a vague hope" },
            { label: "Prioritize if it stalls", detail: "One or two levers that matter most, not everything at once" },
            { label: "Decide against walk-away", detail: "Accept, push once more, or decline — measured against the number set in step 2" },
          ],
        },
        {
          kind: "bullets",
          heading: "What separates a strong negotiation from a weak one, across all five exercises",
          bullets: [
            "A specific number beats a vague hope every time — in the base counter, the total-comp comparison, and the competing-offer disclosure alike, the version that works is the one with an actual figure attached.",
            "Confidence and warmth aren't in tension — every strong rewrite above kept the gratitude and the enthusiasm, it just stopped apologizing for having a number at all.",
            "Uncertainty — an equity estimate, a stated deadline, a company's real flexibility — is information to name honestly, not something to paper over with false confidence in either direction.",
          ],
        },
        {
          kind: "summary",
          heading: "What a well-run negotiation looks like",
          bullets: [
            "Three real numbers, decided before the pressure of a live conversation — not one wish figure.",
            "A specific counter grounded in research or experience, not just \"I was hoping for more.\"",
            "A clear priority order on non-salary levers, asked for one or two at a time, not all at once.",
            "A decision — accept, push once more, or decline — measured against a walk-away number set in advance, not against how the conversation happens to feel in the moment.",
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
