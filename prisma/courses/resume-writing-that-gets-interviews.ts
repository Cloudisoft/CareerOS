import type { CourseSeed } from "../course-types";

export const course: CourseSeed = {
  slug: "resume-writing-that-gets-interviews",
  title: "Resume Writing That Gets Interviews",
  description:
    "The structural and content decisions that actually move a resume from the reject pile to the interview list.",
  category: "Resume",
  level: "BEGINNER",
  order: 1,
  lessons: [
    {
      title: "Structure Before Style",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Structure Before Style",
          subheading:
            "A resume gets scanned, not read — 20-40 seconds on a first pass. Structure is what makes that scan work in your favor.",
        },
        {
          kind: "bullets",
          heading: "The order that works",
          bullets: [
            "Contact info — name, email, phone, city/state (not full address), LinkedIn.",
            "Summary — 2-3 lines, only if it adds something a title alone doesn't say.",
            "Experience — reverse chronological. This is 70% of the page for most people.",
            "Skills — a scannable list, grouped if you have more than 10.",
            "Education — near the bottom unless you're a student or recent grad.",
          ],
        },
        {
          kind: "bullets",
          heading: "Contact info and summary: the details that trip people up",
          intro: "Two lines at the top of the page carry more silent judgment than their size suggests.",
          bullets: [
            "Use an email address that looks professional — firstname.lastname@... beats a leftover handle from years ago. Recruiters do notice, even if they never say so.",
            "Skip the physical street address entirely; city and state (or \"Remote\" / \"Open to relocation\") is what a hybrid or remote-first hiring process actually needs.",
            "Add a portfolio, GitHub, or work-samples link only if it's genuinely worth a click — a stale, half-finished profile linked prominently does more harm than no link at all.",
            "A summary earns its place only when the title alone undersells you: a career change, a return from a gap, or a senior scope a generic title doesn't capture. If your title and first bullet already say it, a summary is redundant weight at the top of the page.",
          ],
        },
        {
          kind: "bullets",
          heading: "When the standard order should flex",
          intro: "The five-section order is the right default, not a rigid law — a few situations genuinely call for reordering it.",
          bullets: [
            "Students and recent grads: Education moves above Experience, since it's currently the strongest signal you have.",
            "Highly technical roles: a Skills or Technical Skills section often moves up to just below the summary, since a recruiter scanning for specific tools wants that upfront, not three jobs down.",
            "Portfolio-driven fields (design, some engineering roles): a short Projects or Selected Work section can sit above Experience if the work itself is the strongest evidence of skill.",
            "Whatever you reorder, keep Contact info first and keep the order consistent with what a scanning reader expects to find where — don't invent a sixth, unfamiliar section name for something that fits cleanly into one of the standard five.",
          ],
        },
        {
          kind: "bullets",
          heading: "What breaks the scan",
          bullets: [
            "Burying the job title in a paragraph instead of a clear heading line.",
            "Objective statements like \"seeking a challenging role\" that tell the reader nothing.",
            "Inconsistent dates — \"2021-2023\" next to \"March 2021 - Present\" reads as careless.",
            "Two-column layouts with graphics — they can scramble an ATS's reading order entirely.",
          ],
        },
        {
          kind: "example",
          heading: "A summary line that earns its place",
          body: "The difference isn't tone — it's information. The second version tells a reader something the job title alone can't.",
          code: `Weak: "Results-driven professional with strong communication
skills seeking a challenging opportunity to grow."

Earns its place: "Product marketer moving into full-stack PMM
after two years running go-to-market for B2B SaaS launches —
bringing hands-on experience with pricing, positioning, and
cross-functional launch execution."`,
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "How far back Experience should go",
          body: "As a rough default, keep detailed bullets to the last 10-15 years. Older roles can either drop off entirely or compress into a single \"Earlier Experience\" line with just titles and companies — this isn't about hiding age, it's that a role from decades ago rarely tells a hiring manager anything about what you can do today, and the space is worth more spent on recent, relevant work.",
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "The five-second test",
          body: "Cover the page with your hand and reveal it for five seconds. If you don't remember your most recent title, your most recent company, and one number that shows impact, the structure needs work before you touch a single sentence.",
        },
      ],
    },
    {
      title: "Turning Duties Into Impact",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Turning Duties Into Impact",
          subheading:
            "The single biggest quality gap between resumes isn't grammar — it's the gap between describing a job and describing what you did in it.",
        },
        {
          kind: "example",
          heading: "Duty vs. impact",
          body: "The second version answers the question every hiring manager actually has: if I hire this person, what changes?",
          code: `Duty: "Responsible for managing the customer support queue."

Impact: "Cleared a 200-ticket backlog in six weeks by rewriting the
triage process, cutting average response time from 18 hours to 4."`,
        },
        {
          kind: "chart",
          heading: "The measurable difference impact language points to",
          description: "The rewrite above isn't just better phrasing — it names a real before/after that a reader can picture.",
          chartType: "bar",
          unit: "avg. response time (hours)",
          data: [
            { label: "Before (duty-only)", value: 18 },
            { label: "After (impact rewrite)", value: 4 },
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "A number without context is still weak",
          body: "\"Increased sales by 20%\" sounds like impact until someone asks the obvious follow-up: 20% of what, over what period, compared to what baseline? A number that can't survive that question reads as decoration. \"Grew regional sales from $1.2M to $1.44M over two quarters, ahead of a flat market\" survives it — it's specific enough to be checked and precise enough to be believed.",
        },
        {
          kind: "example",
          heading: "The same rewrite pattern on a role without an obvious number",
          body: "Not every job produces a clean dollar figure — the skeleton still works when the measurable change is operational rather than financial.",
          code: `Duty: "Responsible for scheduling and coordinating meetings
for a 12-person department."

Impact: "Rebuilt the department's meeting-scheduling process
around a shared calendar system, cutting the average time to
book a cross-team meeting from three days of back-and-forth
email to under an hour."`,
        },
        {
          kind: "bullets",
          heading: "A repeatable rewrite pattern",
          intro: "For each bullet, answer three things, then use this skeleton:",
          bullets: [
            "What did you actually do? (the verb — led, built, negotiated, redesigned)",
            "On what? (the specific thing — a process, a system, a budget, a team)",
            "What changed because of it? (a number, a before/after, a consequence)",
            "Skeleton: [Did X] by [doing Y], resulting in [Z].",
          ],
        },
        {
          kind: "bullets",
          heading: "Two small habits that make bullets read faster",
          bullets: [
            "Front-load the strongest word. A scanning reader reads the first word of each bullet far more carefully than the rest — \"Led\" or \"Cut\" at the start does more work than the same fact buried mid-sentence.",
            "Keep verb tense consistent within a job: past tense for roles you've left, present tense for your current role, and don't mix the two within the same block.",
            "Match bullet length to importance, not to filling the line — a one-line bullet for a minor task next to a two-line bullet for your biggest win signals proportion correctly; making every bullet the same length hides which ones actually matter.",
          ],
        },
        {
          kind: "bullets",
          heading: "When you don't have a clean number",
          intro: "A fabricated metric is worse than none — it costs credibility the moment someone asks you to walk through it.",
          bullets: [
            "Use scale instead: \"across 12 markets,\" \"for a team of 40,\" \"serving 3,000 monthly users.\"",
            "Use before/after in words: \"went from manual spreadsheet tracking to an automated weekly report.\"",
            "Use relative impact: \"the fastest-growing account on the team that quarter.\"",
          ],
        },
        {
          kind: "text",
          heading: "How this compares to other formulas you'll see",
          body: [
            "You'll also see this called CAR (Context-Action-Result) or the XYZ formula (\"Accomplished X, measured by Y, by doing Z\") in other advice. They're the same underlying idea in a different order — name the situation briefly, name the action clearly, name the measurable outcome.",
            "Pick whichever ordering makes the sentence read most naturally for a given bullet; the skeleton in this course leads with the action because that's usually the most interesting part to a scanning reader, but there's nothing wrong with leading with result when the number itself is the strongest hook: \"Cut release time from two days to four hours by redesigning the deployment pipeline.\"",
          ],
        },
        {
          kind: "example",
          heading: "The same skeleton on a bullet with a technical, operational result",
          body: "The formula holds regardless of domain — the action and the measurable change are what carry it, not the specific field.",
          code: `Duty: "Responsible for fixing bugs reported by customers."

Impact: "Diagnosed and shipped fixes for the 15 highest-impact
customer-reported bugs in a single sprint, cutting the open
critical-bug count from 40 to 9 and clearing a backlog that
had been growing for three months."`,
        },
        {
          kind: "bullets",
          heading: "Where people fumble applying the skeleton",
          intro: "The formula is simple; these are the four ways people quietly undermine it anyway.",
          bullets: [
            "Piling on adjectives instead of naming an action — \"results-driven,\" \"detail-oriented,\" and \"dynamic\" describe how you'd like to be seen, not something you actually did. Cut every adjective a bullet doesn't need to make its point.",
            "Claiming full credit for a team result with no sense of your specific role — \"Launched a product that generated $2M in revenue\" reads very differently once a reader realizes you were one of fifteen people on that launch. Naming your specific piece is more credible, not less impressive.",
            "Defaulting to no scale language at all for genuinely unmeasured work, instead of reaching for the honest alternatives from a few slides back — \"across 12 markets,\" \"for a team of 40\" still communicate real scope without inventing a precise number you don't have.",
            "Mixing verb tense within the same role — describing a past job with a mix of \"manages\" and \"managed\" reads as a proofreading miss before a reader even gets to judging the substance.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "A longer bullet isn't automatically a more impressive one",
          body: "It's tempting to think a bullet that runs two full lines and mentions three tools, a methodology, and a stakeholder group must be doing more work than a short one — often it's doing the opposite, burying the one fact that mattered under detail nobody asked for. A scanning reader's attention drops sharply after the first ten or twelve words of a bullet. If the result is the third clause in a long sentence, most readers never reach it. Say the impact first, or say it in fewer words — length is not the same axis as strength.",
        },
        {
          kind: "summary",
          heading: "The verb audit",
          bullets: [
            "Circle the first word of every bullet.",
            "\"Responsible for,\" \"helped with,\" \"worked on\" describe presence, not action — rewrite those first.",
            "Swap in the verb that actually matches what you did: owned, shipped, negotiated, cut, grew, fixed, launched.",
          ],
        },
      ],
    },
    {
      title: "Beating the ATS Without Gaming It",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Beating the ATS Without Gaming It",
          subheading:
            "Applicant tracking systems don't reject resumes with some secret algorithm — most of what trips them up is plain formatting and missing keyword overlap.",
        },
        {
          kind: "bullets",
          heading: "What actually matters",
          bullets: [
            "Use the words from the job posting, where true — the exact phrase, not a synonym only you'd recognize as equivalent.",
            "Standard section headers: \"Experience,\" \"Education,\" \"Skills.\" Creative alternatives often don't parse.",
            "Simple, single-column layout — tables and multi-column designs are the most common cause of an ATS reading a resume out of order.",
            ".docx or a text-selectable PDF — never a scanned image or a design-tool export that flattens text into shapes.",
          ],
        },
        {
          kind: "diagram",
          heading: "How an ATS actually reads your resume",
          description: "Most rejections happen in the middle steps, not because a human decided against you — the file never made it to them intact.",
          steps: [
            { label: "Upload", detail: "Candidate submits a .docx or text-selectable PDF" },
            { label: "Parse", detail: "ATS extracts raw text from the file" },
            { label: "Sort into fields", detail: "Text mapped to Experience, Education, Skills, etc." },
            { label: "Keyword match", detail: "Parsed content compared against the job posting" },
            { label: "Rank for recruiter", detail: "Higher-overlap resumes surface first for a human read" },
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "What doesn't work (and can backfire)",
          body: "White-text keyword stuffing gets flagged by some systems and is instantly visible to any human who opens the file differently. Listing keywords you can't speak to in an interview wastes the interview you got.",
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "One overlooked detail: headers and footers",
          body: "Contact info placed in a document header or footer is invisible to a large share of ATS parsers — they often skip those regions entirely. Keep your name and contact details in the main body of the first page, not tucked into a header, even though it looks fine to a human eye either way.",
        },
        {
          kind: "text",
          heading: "The honest keyword pass",
          body: [
            "Before submitting, read the posting once for required skills and tools, then check your resume actually contains the ones you truly have — not to invent matches, but to make sure real, relevant experience isn't described in different words than the posting uses for the same thing.",
            "Spell out acronyms the first time and include both forms where space allows — \"Search Engine Optimization (SEO)\" — since some parsers match the exact string a posting uses, and you don't know in advance whether that posting wrote out the long form or the abbreviation.",
          ],
        },
        {
          kind: "terminal",
          heading: "A five-minute test: see your resume the way a parser does",
          description: "Before trusting a layout, run something close to what many ATS parsers actually do — extract raw text with no visual formatting — and read the result honestly.",
          lines: [
            { text: "pdftotext resume.pdf resume.txt" },
            { text: "cat resume.txt" },
            { text: "Jane Torres  Product Manager  Skills  SQL  Figma  Experience", output: true },
            { text: "Senior PM  TechCo  2021-Present  Led launch of...  Education", output: true },
            { text: "B.A. Economics  State University  2016  Amplitude  Notion", output: true },
            { text: "# A two-column layout interleaved Skills, Experience, and", output: true },
            { text: "# Education into one unreadable stream — exactly what many", output: true },
            { text: "# real parsers see, even though the PDF looks fine to a human" },
          ],
        },
        {
          kind: "bullets",
          heading: "File-naming and format details that quietly matter",
          intro: "None of these affect keyword matching directly, but each one is a real, documented way resumes get mishandled before a human ever opens the file.",
          bullets: [
            "Name the file with your actual name — FirstLast-Resume.pdf, not resume_final_v3.docx — since some systems display the filename to the recruiter, and a generic one is an easy first impression to avoid giving away for free.",
            "Save as .docx unless a posting explicitly asks for PDF; some older or lower-cost ATS platforms still parse Word documents more reliably than PDFs, especially PDFs exported from design tools rather than a word processor.",
            "Never password-protect or restrict-edit the file — some parsers simply can't open it, and it silently drops out of the pipeline with no error shown to you.",
            "Avoid embedding a photo, icon, or logo as anything other than a genuinely decorative element — some parsers attempt to extract text from images and produce garbage that gets attached to your profile.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "The \"ATS auto-rejects for X\" myth",
          body: "Job-search folklore is full of confident claims about ATS platforms auto-rejecting a resume for a specific font, a missing comma, or an unlucky word choice. In reality there's no universal blacklist — different ATS products use different, often fairly basic keyword-and-field matching models, and most surface a ranked list for a recruiter to review rather than silently discarding anyone below a line. The formatting and keyword advice in this lesson is worth following because it reliably improves how well real content gets extracted and matched, not because there's a single secret rule being gamed. Chasing a rumored trick is usually wasted effort that a plain, honest formatting pass already covers.",
        },
        {
          kind: "chart",
          heading: "The effect of an honest keyword pass",
          description: "A single pass matching real, true experience to the posting's own language typically lifts an ATS keyword-match score without adding a single fabricated skill.",
          chartType: "bar",
          unit: "% keyword overlap with posting",
          data: [
            { label: "Before keyword pass", value: 45 },
            { label: "After keyword pass", value: 78 },
          ],
        },
      ],
    },
    {
      title: "The One-Page Rule and When to Break It",
      durationMinutes: 5,
      slides: [
        {
          kind: "title",
          heading: "The One-Page Rule and When to Break It",
          subheading:
            "\"Keep it to one page\" is good advice for most early-to-mid-career resumes and bad advice for a lot of senior ones. The real rule is narrower.",
        },
        {
          kind: "text",
          heading: "Why the one-page rule exists in the first place",
          body: [
            "The rule isn't about page count for its own sake — it's a proxy for information density. A recruiter spending 20-40 seconds on an initial scan can absorb roughly one page of well-organized content in that time; a second page they never reach might as well not exist.",
            "That's why the real question is never \"how many pages,\" it's \"is every line on this page worth the reader's limited attention\" — a dense, padded one-pager can actually be worse than a lean two-pager, because padding dilutes the signal the reader is scanning for.",
          ],
        },
        {
          kind: "bullets",
          heading: "When one page is right",
          bullets: [
            "Under ~8-10 years of relevant experience.",
            "A single, focused career track without major pivots.",
            "Roles where depth in one or two recent jobs matters more than a full history.",
          ],
        },
        {
          kind: "bullets",
          heading: "When two pages are defensible",
          bullets: [
            "12+ years of experience where cutting older, still-relevant roles would misrepresent your background.",
            "Multiple distinct career chapters (e.g., individual contributor then people management).",
            "Executive and technical-leadership resumes, where one page forces cutting context a committee actually needs.",
          ],
        },
        {
          kind: "bullets",
          heading: "Forcing one page the wrong way",
          bullets: [
            "Shrinking font below 10.5pt or margins below half an inch to squeeze in one more line — it reads as visibly cramped and makes the whole page harder to scan, working against the exact goal the page count was meant to serve.",
            "Keeping every job you've ever had at equal length instead of compressing older, less relevant roles to a single line each.",
            "Listing every task from a role instead of the 3-4 that actually show impact — a bullet that doesn't clear the cut test below is exactly what should go first.",
            "The better move, in order: cut low-value bullets, then compress older roles, then trim margins slightly, then reduce font — never in the reverse order.",
          ],
        },
        {
          kind: "example",
          heading: "Compressing an older role instead of cutting or cramming",
          body: "This preserves the signal (what the role was, roughly when) without spending five lines on a job from over a decade ago that no longer needs bullet-level detail.",
          code: `Before (full detail, still at 5 bullets):
Marketing Coordinator, Acme Co. — 2011-2013
• Managed social media accounts
• Coordinated with design team on campaign assets
• Assisted with email marketing calendar
• Tracked campaign performance metrics
• Supported trade show logistics

After (compressed to one line):
Marketing Coordinator, Acme Co. — 2011-2013
Social media, email campaigns, and event support for a
15-person marketing team.`,
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "A two-page resume isn't the only option for extra context",
          body: "If you're right on the edge — not quite 12+ years, but genuinely losing something relevant by cutting to one page — a cover letter can sometimes carry context a resume shouldn't, rather than stretching to a second page for it. The resume stays a scan; the letter is where a fuller story belongs.",
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "The cut test",
          body: "For any bullet, ask: does removing this line lose something a reader needs to decide whether to interview me? If the honest answer is no, it's decoration — cut it, regardless of what page you're on. Almost nothing justifies a third page.",
        },
      ],
    },
    {
      title: "Proofreading Like a Recruiter Reads",
      durationMinutes: 4,
      slides: [
        {
          kind: "title",
          heading: "Proofreading Like a Recruiter Reads",
          subheading:
            "A single typo won't always sink a resume, but it changes how carefully the rest gets read — a real cost in a competitive pile.",
        },
        {
          kind: "bullets",
          heading: "Read it in the wrong order",
          intro: "Reading top to bottom, your brain autocorrects what it expects to see. Break that pattern:",
          bullets: [
            "Read bullets bottom to top, one at a time, out of context.",
            "Read it out loud — awkward phrasing that looks fine on the page usually sounds wrong immediately.",
            "Check every number separately. A resume claiming \"cut costs 140%\" undermines every other stat on the page.",
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "What spell-check misses",
          body: "A spell-checker won't catch a real word used wrong — \"manger\" instead of \"manager,\" \"complimentary\" instead of \"complementary,\" or a company name spelled as a different real word. These are exactly the errors a bottom-to-top read and a name-specific pass are designed to catch, because your eye stops auto-correcting once it's reading out of normal order.",
        },
        {
          kind: "example",
          heading: "What a real-word typo actually looks like in context",
          body: "A spell-checker sees a correctly spelled word and moves on — it has no idea the word is wrong for the sentence. This is exactly the category of mistake a normal top-to-bottom read tends to glide right past.",
          code: `Slipped through: "Reported directly to the senior manger
on all budget decisions."

Caught on a bottom-to-top read: "Reported directly to the
senior manager on all budget decisions."`,
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Changing the format tricks your eye into actually seeing it",
          body: "After staring at the same document for hours, your brain stops reading it and starts pattern-matching against what it expects to be there — which is exactly how obvious errors survive ten read-throughs. Changing the document's appearance breaks that autopilot: export it to PDF if you've been editing in Word, temporarily switch the font, zoom in well past normal size, or print a physical copy. None of these change the content, but each one makes the page look unfamiliar enough that your eye has to actually process it again instead of skimming from memory.",
        },
        {
          kind: "bullets",
          heading: "A last five-minute checklist before sending",
          intro: "Quick enough to run every time, even under deadline pressure.",
          bullets: [
            "Every date format matches, and the math checks out — a role listed as \"2021-2023\" should actually span roughly two years, not four.",
            "Every company and tool name is spelled and capitalized exactly the way that company or tool spells it, not an approximation.",
            "The file itself is named professionally and saved in the format the posting actually asked for.",
            "You've read the summary and first bullet of your most recent role one final time — it's the part a rushed reader is most likely to actually reach.",
          ],
        },
        {
          kind: "bullets",
          heading: "Three passes worth doing",
          bullets: [
            "Consistency pass — tense, date format, bullet punctuation, all matching.",
            "Name pass — company, tool, and product names spelled and capitalized exactly right.",
            "Fresh-eyes pass — wait a few hours or a day before the final read.",
          ],
        },
        {
          kind: "bullets",
          heading: "Using grammar and AI tools without losing your voice",
          bullets: [
            "A grammar checker is good at catching mechanical errors — subject-verb agreement, comma splices, tense mismatches — and worth running as one of your passes, not a replacement for a human read.",
            "Be careful with AI \"improve this\" rewrites on a resume — they tend to smooth every bullet into the same generic, slightly inflated register, which is the opposite of the specific, plainspoken impact language this course argues for.",
            "If you do use one, check that every fact and number it touched is still exactly true — a rewrite optimizing for flow has quietly changed the meaning of a bullet more than once.",
          ],
        },
        {
          kind: "summary",
          heading: "One more set of eyes",
          bullets: [
            "Have someone outside the process read it — not for content, just for clarity.",
            "Could they tell what you do and what you're good at from this page alone, in under a minute?",
          ],
        },
      ],
    },
    {
      title: "Resumes for Career Changers and Employment Gaps",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Resumes for Career Changers and Employment Gaps",
          subheading:
            "Every rule so far assumes a clean, linear career. If yours has a gap or a pivot, the fixes are specific — not just \"be more confident.\"",
        },
        {
          kind: "bullets",
          heading: "Gaps and pivots are different problems",
          bullets: [
            "A gap is a stretch of time with no paid work on the resume — caregiving, a layoff, illness, travel, a return to school.",
            "A pivot is continuous work history that just doesn't point at the job you're applying for now.",
            "Both trigger the same silent question in a reader's head — \"why isn't this straightforward?\" — and both are best answered on the page, briefly, rather than left for the reader to guess at.",
          ],
        },
        {
          kind: "bullets",
          heading: "Handling a gap without hiding it",
          bullets: [
            "Don't switch to year-only dates (\"2021-2023\") just for the gap year — it's a pattern recruiters recognize immediately, and it reads as concealment rather than as neutral.",
            "If you did anything structured during the gap — freelance work, a certification, caregiving that involved real coordination and budget, volunteer leadership — list it as a real line item with dates, the way you would a job.",
            "For an unstructured gap, a single factual phrase is enough on the resume itself: \"Family caregiving leave, 2022-2023.\" Save the fuller story, if anyone asks, for the interview.",
            "Never fabricate a title or a company to paper over the months. It's discoverable, and it costs you more than the honest gap would have.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "A layoff isn't something to soften or hide",
          body: "Widespread layoffs mean hiring managers no longer read a layoff as a signal about individual performance the way they might have a decade ago. There's no need to euphemize it in a cover letter or interview (\"my position was eliminated in a company-wide restructuring\" is enough) — and there's nothing to disclose on the resume itself at all, since the resume already just shows the role ending on a given date.",
        },
        {
          kind: "example",
          heading: "Brief on the page, fuller in conversation",
          body: "The resume's job is to not raise a red flag, not to fully resolve the reader's curiosity — save the complete story for a conversation where you control the framing directly.",
          code: `Too much on the page: "Left the workforce in 2022 to care for
a family member following an unexpected diagnosis, which
required intensive at-home support and coordination with
multiple specialists over an 18-month period before returning
to full-time work."

Right amount on the page: "Family caregiving leave, 2022-2023"

(The fuller version above is worth having ready — just for the
interview, not the resume.)`,
        },
        {
          kind: "bullets",
          heading: "Handling a pivot: lead with the transfer, not the timeline",
          bullets: [
            "Add a 2-3 line summary that states the pivot plainly: \"Marketing coordinator moving into UX design, with two years leading user research for product launches.\" Don't make the reader infer the story from job titles alone.",
            "Reorder your skills section to foreground what transfers — user research, stakeholder interviews, data analysis — ahead of what's specific to the old track.",
            "Rewrite old-job bullets through the lens of the new target, honestly. The same project can honestly be described as \"led customer interviews that shaped a product redesign\" if that's genuinely what you did, even though your title was Marketing Coordinator.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "What undermines a pivot resume",
          body: "Keeping every bullet in the original professional voice of the old career, with none of it translated toward the new one, forces the reader to do the pivot's work for you. If you wouldn't naturally use a term in an interview for the new role, don't lean on it here either.",
        },
        {
          kind: "summary",
          heading: "The honest version reads stronger",
          bullets: [
            "A gap or pivot named briefly and factually reads as someone in control of their story.",
            "A gap disguised or a pivot left unexplained reads as something to be suspicious of — usually worse than the truth would have.",
          ],
        },
      ],
    },
    {
      title: "Practice: Rewriting Weak Bullets Into Impact",
      durationMinutes: 12,
      slides: [
        {
          kind: "title",
          heading: "Practice: Rewriting Weak Bullets Into Impact",
          subheading:
            "Six real rewrites, using the skeleton and the honest-metric moves from this course. Do them before checking the model answers.",
        },
        {
          kind: "bullets",
          heading: "Before you start each one",
          intro: "Work through the same three questions every time, in this order, before you write a single word of the rewrite.",
          bullets: [
            "What did the person actually do — the verb? Not the title of the project, the actual action they took.",
            "What did they do it to or with — the specific process, system, team, or budget involved?",
            "What changed because of it — a real number if there is one, honest scale language if there isn't, and never a figure that wasn't actually measured.",
          ],
        },
        {
          kind: "practice",
          heading: "Rewrite a duty-only bullet",
          prompt:
            "Rewrite this bullet using the skeleton [Did X] by [doing Y], resulting in [Z]: \"Responsible for the company's social media accounts.\" Assume you actually grew a following, posted more consistently, and increased engagement, even though you don't remember the exact numbers.",
          hint: "Start with the verb: what did you actually do to the accounts — grew, redesigned, launched, restructured? Then attach scale or before/after language instead of a number you don't have.",
          solution:
            "\"Rebuilt the brand's social content calendar and posting cadence, growing Instagram followers by roughly 40% over eight months and lifting average post engagement from under 1% to consistently above 3%.\" If you truly have no numbers at all: \"Restructured the brand's social content calendar from ad hoc posting to a consistent weekly schedule, taking the account from stalled growth to the fastest-growing of the company's three platforms.\"",
        },
        {
          kind: "practice",
          heading: "Fix a bullet that buries the actual work in \"helped with\"",
          prompt:
            "Rewrite: \"Helped with the launch of a new customer onboarding process.\" You know the person actually wrote onboarding emails and ran training for new hires, but was not the project lead.",
          hint: "\"Helped with\" hides your specific piece. Name exactly what you owned, even as one contributor on a bigger project — that's still a real, specific claim.",
          solution:
            "\"Wrote the full email sequence and led training sessions for a new customer onboarding process, one of three workstreams on a cross-functional launch that cut new-customer support tickets by 25% in the first quarter.\" Notice it's honest about scope (\"one of three workstreams\") while still being specific about the individual contribution.",
        },
        {
          kind: "practice",
          heading: "Rewrite a bullet with a fabricated-sounding number",
          prompt:
            "Rewrite this bullet, which currently reads as unbelievable: \"Increased team productivity by 300% through better time management.\" The real story: you introduced a shared task board that cut the time the team spent in status meetings roughly in half.",
          hint: "An implausible percentage is worse than no percentage. Anchor the claim to something concrete and checkable — time saved, meetings cut, a process replaced — rather than an abstract \"productivity\" figure.",
          solution:
            "\"Introduced a shared task board to replace status-update meetings, cutting the team's weekly meeting time roughly in half and freeing an estimated 4 hours per person per week for direct project work.\"",
        },
        {
          kind: "practice",
          heading: "Rewrite an ops bullet with no dollar figure at all",
          prompt:
            "Rewrite: \"In charge of ordering office supplies and managing vendor relationships.\" The real story: this person consolidated the vendor list from six suppliers down to two, which noticeably cut how long invoice processing took each month.",
          hint: "There's no revenue or headcount number here, and that's fine — anchor the claim to the consolidation itself (6 vendors to 2) and the operational effect (faster invoice processing), which are both concrete and checkable on their own.",
          solution:
            "\"Consolidated the company's vendor list from 6 suppliers to 2, cutting monthly invoice-processing time roughly in half and simplifying budget tracking across the office.\" The 6-to-2 detail does the work a dollar figure would have — it's specific, verifiable, and shows a real before/after without inventing a metric that was never tracked.",
        },
        {
          kind: "practice",
          heading: "Rewrite a bullet that takes full credit for a team win",
          prompt:
            "Rewrite: \"Launched a new customer portal that increased customer satisfaction.\" The real story: this person was one of four engineers on the project and owned the front-end build specifically; a separate team handled backend and support processes.",
          hint: "Full credit for a team launch is the kind of claim that unravels fast in an interview. Naming your specific piece honestly — \"one of four,\" \"owned the front-end\" — is more credible, not less impressive, and it's a claim you can actually defend in detail.",
          solution:
            "\"Owned the front-end build for a new customer self-service portal, one of four engineers on the launch team, contributing to a 20-point lift in the company's customer satisfaction score over the following two quarters.\" This keeps the real, verifiable outcome (the CSAT lift) while being honest and specific about which part of it this person actually built.",
        },
        {
          kind: "practice",
          heading: "Rewrite a bullet with an implausible-sounding number",
          prompt:
            "Rewrite: \"Boosted customer retention by 500% through improved communication.\" The real story: this person introduced a structured onboarding call for new customers, which brought quarterly churn down from about 18% to about 11%.",
          hint: "A \"500%\" retention claim doesn't pass a basic sanity check — retention can't realistically increase by that much, which is exactly what makes a reader distrust the whole bullet. Replace it with the real before/after figure, which is both more believable and, not coincidentally, actually true.",
          solution:
            "\"Introduced a structured onboarding call for new customers, cutting quarterly churn from roughly 18% to 11% over two quarters.\" The real number is less dramatic-sounding than \"500%\" and considerably more convincing, because it's specific, plausible, and something this person could walk an interviewer through in detail.",
        },
        {
          kind: "practice",
          heading: "Fix a \"helped with\" bullet in a people-ops context",
          prompt:
            "Rewrite: \"Helped with the hiring process for new employees.\" The real story: this person built a structured interview scorecard that the whole team adopted, which cut the average time-to-hire from about six weeks to about four.",
          hint: "\"Helped with\" hides a specific, ownable contribution — building and getting the team to adopt a scorecard is a concrete action with a measurable downstream effect, not vague assistance.",
          solution:
            "\"Built a structured interview scorecard adopted team-wide, cutting average time-to-hire from roughly six weeks to four.\" Notice the verb (\"built\"), the specific artifact (a scorecard, not just \"the hiring process\" in the abstract), and a real before/after number — the full skeleton, in one sentence.",
        },
        {
          kind: "practice",
          heading: "Rewrite a bullet padded with buzzwords instead of substance",
          prompt:
            "Rewrite: \"Dynamic, results-driven professional who leveraged synergies to drive strategic initiatives forward.\" The real story: this person is a warehouse operations lead who redesigned the pick-and-pack layout, reducing average order-fulfillment time from 22 minutes to 14.",
          hint: "None of the buzzwords in the original tell a reader anything real — strip every adjective that isn't earning its place, and replace the whole sentence with the actual action and the actual number.",
          solution:
            "\"Redesigned the warehouse's pick-and-pack layout, cutting average order-fulfillment time from 22 minutes to 14.\" Every word in the rewrite is doing real work; none of it could be true of some other person's unrelated job the way \"dynamic, results-driven professional\" could describe almost anyone on any resume.",
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Notice what every rewrite in this lesson has in common",
          body: "Not one of the model answers above invented a number, exaggerated scope, or claimed credit the original scenario didn't support. Every improvement came from the same two moves: naming a specific action instead of a vague one, and anchoring the result to something true and checkable, even when that meant honest scale language instead of a dollar figure. That's the entire skill — it isn't about sounding more impressive, it's about being specific enough that a reader believes you, and specific enough that you could talk through any one of these bullets in detail without hesitating.",
        },
        {
          kind: "summary",
          heading: "What good rewriting looks like",
          bullets: [
            "Every bullet starts with a specific verb, not \"responsible for\" or \"helped with.\"",
            "A missing number is replaced with real scale or before/after language — never an invented figure.",
            "The claim stays something you could defend in detail if an interviewer asked \"walk me through that.\"",
            "Credit is scoped honestly to your actual contribution on a team effort — specific and partial beats vague and total every time.",
          ],
        },
      ],
    },
    {
      title: "Knowledge Check: Resume Writing",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Knowledge Check: Resume Writing",
          subheading:
            "Five questions across the whole course — the kind of thing a hiring manager's first 30-second scan would actually catch.",
        },
        {
          kind: "quiz",
          heading: "Structure",
          question:
            "A candidate puts a two-paragraph \"Objective\" statement at the top of their resume, above their most recent job title. What's the main problem with this, per this course?",
          options: [
            "It's outdated formatting that ATS systems can no longer parse at all",
            "It uses space a scanning reader needs for concrete signal, and vague language like \"seeking a challenging role\" tells the reader nothing",
            "Objective statements are only appropriate for candidates with a college degree",
            "It should be replaced with a two-page cover letter instead",
          ],
          correctIndex: 1,
          explanation:
            "The course's core structural argument is that a resume is scanned in 20-40 seconds, so every line has to earn its place. A generic objective burns prime top-of-page space without giving the reader anything concrete — the fix is either cutting it or replacing it with a tight, specific summary.",
        },
        {
          kind: "quiz",
          heading: "Impact vs. duty",
          question:
            "Which rewrite best follows the \"[Did X] by [doing Y], resulting in [Z]\" skeleton from this course?",
          options: [
            "\"Responsible for managing a team of engineers and various technical projects.\"",
            "\"Worked on improving the deployment process for the engineering team.\"",
            "\"Redesigned the deployment pipeline by automating manual test steps, cutting release time from two days to four hours.\"",
            "\"Passionate about engineering excellence and continuous process improvement.\"",
          ],
          correctIndex: 2,
          explanation:
            "Only the third option names a specific action (redesigned), what it was applied to (the deployment pipeline, via automating manual steps), and a concrete result (two days to four hours). The others describe presence or personality, not impact.",
        },
        {
          kind: "quiz",
          heading: "ATS formatting",
          question:
            "Which resume choice is most likely to cause an ATS to read a resume's content out of order or drop sections entirely?",
          options: [
            "Using the exact phrasing from the job posting for a skill you genuinely have",
            "Listing skills in a single grouped section near the middle of the page",
            "A two-column layout with graphics or icons next to each section",
            "Ordering sections as Contact, Summary, Experience, Skills, Education",
          ],
          correctIndex: 2,
          explanation:
            "Multi-column layouts and embedded graphics are the most common cause of an ATS misreading section order or missing content, because many parsers read left-to-right, top-to-bottom across the whole page rather than following visual columns.",
        },
        {
          kind: "quiz",
          heading: "Page length",
          question:
            "A candidate with 14 years of experience across two distinct chapters (5 years as an individual contributor, then 9 years in people management) is deciding between one and two pages. What does this course recommend?",
          options: [
            "Always stay at one page regardless of experience — two pages is never acceptable",
            "Two pages is defensible here, since cutting either chapter to fit one page would misrepresent a real, relevant part of their background",
            "Three pages, to give equal space to both chapters",
            "One page, but only if font size is reduced to fit everything",
          ],
          correctIndex: 1,
          explanation:
            "The course's one-page rule is narrower than \"always one page\" — it explicitly calls out 12+ years of experience with multiple distinct career chapters as a case where two pages is defensible, because compressing to one page would cut context a reader actually needs.",
        },
        {
          kind: "quiz",
          heading: "Career gaps and pivots",
          question:
            "Someone has an 8-month employment gap for a documented medical leave. According to this course, what's the recommended way to handle it on the resume?",
          options: [
            "Switch all dates on the resume to year-only format so the gap isn't visually obvious",
            "List a brief, factual line for the period (e.g., \"Medical leave, 2023\") rather than hiding or fabricating it",
            "Omit the most recent job entirely so the timeline looks continuous",
            "Leave it unaddressed on the resume and explain it only if asked directly in an interview",
          ],
          correctIndex: 1,
          explanation:
            "The course's guidance is to name a gap briefly and factually rather than disguise it — switching to year-only dates or omitting jobs to hide a gap reads as concealment, which usually costs more credibility than the honest, short explanation would.",
        },
        {
          kind: "summary",
          heading: "This course's core takeaways",
          bullets: [
            "Structure controls whether the content even gets read — fix the scan before the sentences.",
            "Every bullet should show impact (verb + what + result), not just describe a duty.",
            "ATS problems are almost always plain formatting and keyword-overlap issues, not a hidden algorithm to game.",
            "The one-page rule is about experience shape, not a fixed law — defend every line with the cut test.",
            "Proofread out of normal reading order, since your brain autocorrects what it expects to see.",
            "A gap or a pivot, named honestly and briefly, reads better than one hidden or left unexplained.",
          ],
        },
      ],
    },
  ],
};
