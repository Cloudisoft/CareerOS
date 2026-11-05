// Ten unique 30–45 second tutorials. Screens are real Career OS pages (demo data).
window.VIDEOS = {
  // ---------------- HOMEPAGE ----------------
  "home-ai-job-search": (I) => ({
    scenes: [
      { d: 4.5, bg: "cream", items: [I.kicker("AI job search", { x: 80, y: 220 }), I.title('Describe the job.<br><span class="grad">We find it.</span>', { y: 270, size: 84 }), I.body("No keyword guessing. Just say what you want.", { y: 470 })] },
      { d: 7, bg: "cream", items: [
        I.title("Type it like you'd say it", { y: 150, size: 46, center: true, x: 0, w: 1280 }),
        I.typing("Remote data analyst, visa sponsorship", { x: 220, y: 300, w: 840, typeAt: 0.9, cps: 15, pressAt: 5.2 }),
        I.chips(["Remote", "Internships", "No experience required", "Visa sponsorship"], { y: 430, center: true, x: 0, w: 1280, at: 1.2 }),
        I.cursor({ path: [[3.8, 1150, 560], [5.0, 1020, 342]], clicks: [5.2] }),
      ] },
      { d: 9.5, bg: "white", items: [
        I.screen("jobs", { path: "/jobs?q=analyst", from: { x: 0.05, y: 0.08, w: 0.62 }, to: { x: 0.34, y: 0.12, w: 0.62 }, moveAt: 3.2, moveEnd: 6.2 }),
        I.callout("Every match in one list", { x: 70, y: 540, at: 1.2, until: 4.2 }),
        I.callout("At a glance: pay, place, work rights", { x: 640, y: 560, at: 5.8, from: "right" }),
      ] },
      { d: 7.5, bg: "cream", items: [
        I.title("One-tap filters that matter", { y: 170, size: 52, center: true, x: 0, w: 1280 }),
        I.chips(["No experience required", "Remote", "Internships", "Open to visa sponsorship", "OPT / CPT friendly", "Closing soon", "UK", "India", "UAE", "Canada"], { y: 300, center: true, x: 140, w: 1000, at: 0.7, stagger: 0.22, activate: 3, activateAt: 4.4 }),
      ] },
      { d: 4.5, bg: "cream", end: true, items: [I.endcard({ tagline: 'Search less. <span class="grad">Get hired faster.</span>' })] },
    ],
  }),

  "home-resume-studio": (I) => ({
    scenes: [
      { d: 4.5, bg: "cream", items: [I.kicker("Resume Studio", { y: 220 }), I.title('A resume tailored<br>to <span class="grad">every job.</span>', { y: 270, size: 84 }), I.body("ATS-ready in minutes, written from your Career Profile.", { y: 470 })] },
      { d: 8, bg: "white", items: [
        I.screen("resume-editor", { path: "/resume-studio", from: { x: 0.12, y: 0.05, w: 0.7 }, to: { x: 0.2, y: 0.2, w: 0.5 }, moveAt: 1.5, moveEnd: 5 }),
        I.callout("Pick a job to tailor against", { x: 820, y: 130, at: 1.4, until: 4.6, from: "right" }),
        I.callout("AI improves your summary and bullets", { x: 760, y: 520, at: 5, from: "right" }),
      ] },
      { d: 9, bg: "cream", items: [
        I.beforeAfter("Responsible for creating weekly sales reports.", "Automated weekly SQL reporting, saving 6 hours a week and cutting errors by 30%.", { y: 200, strikeAt: 1.4, typeAt: 2.4 }),
        I.callout("Numbers and outcomes, not duties", { x: 140, y: 560, at: 6.4, light: true }),
      ] },
      { d: 8, bg: "white", items: [
        I.screen("ats", { path: "/ats-scanner", w: 640, x: 80, y: 120, from: { x: 0.16, y: 0.04, w: 0.56 } }),
        I.counter({ label: "ATS match", from: 54, to: 88, x: 780, y: 200, w: 380, at: 0.6, countAt: 1.4, dur: 2.4, suffix: "%", note: "after tailoring to the job", good: true }),
      ] },
      { d: 4.5, bg: "cream", end: true, items: [I.endcard({ tagline: 'Stand out to <span class="grad">people and bots.</span>' })] },
    ],
  }),

  "home-auto-apply": (I) => ({
    scenes: [
      { d: 4.5, bg: "plum", items: [I.kicker("Auto Apply", { y: 220 }), I.title('Apply while you sleep.<br><span class="grad">Stay in control.</span>', { y: 270, size: 80 }), I.body("You set the rules. Career OS does the clicking.", { y: 470 })] },
      { d: 8, bg: "white", items: [
        I.screen("auto-apply", { path: "/auto-apply", from: { x: 0.12, y: 0.06, w: 0.66 }, to: { x: 0.2, y: 0.22, w: 0.5 }, moveAt: 1.5, moveEnd: 5.5 }),
        I.callout("Minimum match score", { x: 80, y: 560, at: 2.6, until: 7.6 }),
        I.callout("Daily limit and pacing", { x: 860, y: 560, at: 4.4, from: "right" }),
      ] },
      { d: 10, bg: "cream", items: [
        I.title("How it works", { y: 120, size: 46, center: true, x: 0, w: 1280 }),
        I.steps([["🎯", "Match", "jobs above your score"], ["✍️", "Tailor", "resume per job"], ["🚀", "Apply", "within your limits"], ["📋", "Track", "every application"]], { y: 270, at: 0.8, stagger: 1.5 }),
      ] },
      { d: 8, bg: "white", items: [
        I.screen("applications", { path: "/applications", from: { x: 0.12, y: 0.03, w: 0.62 }, to: { x: 0.12, y: 0.12, w: 0.62 }, moveAt: 1, moveEnd: 6 }),
        I.callout("Every application, tracked by stage", { x: 70, y: 560, at: 1.4 }),
      ] },
      { d: 4.5, bg: "cream", end: true, items: [I.endcard({ tagline: 'More applications. <span class="grad">Less effort.</span>' })] },
    ],
  }),

  "home-interview-ai": (I) => ({
    scenes: [
      { d: 4.5, bg: "cream", items: [I.kicker("Interview AI", { y: 220 }), I.title('Practise the interview<br><span class="grad">before the interview.</span>', { y: 270, size: 80 }), I.body("Realistic questions for your role, scored instantly.", { y: 470 })] },
      { d: 7, bg: "white", items: [
        I.screen("interview", { path: "/interview-ai", from: { x: 0.12, y: 0.03, w: 0.6 }, to: { x: 0.12, y: 0.12, w: 0.5 }, moveAt: 1.5, moveEnd: 4.5 }),
        I.cursor({ path: [[1.5, 900, 600], [3.6, 330, 455]], clicks: [3.9] }),
        I.callout("Pick a type and a target job", { x: 760, y: 560, at: 1.8, from: "right" }),
      ] },
      { d: 11, bg: "cream", items: [
        I.typedCard("Question 2 of 6", "Tell me about a time you used data to change a decision.", { x: 90, y: 110, w: 640, typeAt: 0.5, cps: 30, minH: 80 }),
        I.typedCard("Your answer", "At Brightline I noticed stock-outs spiking before holidays. I built a Python forecast, shared it with merchandising, and we cut stock-outs by 18%.", { x: 90, y: 330, w: 640, typeAt: 2.8, cps: 42, size: 21, minH: 150 }),
        I.ring({ x: 860, y: 140, size: 280, value: 86, label: "Answer score", at: 5.8, fillAt: 6.2 }),
        I.chips(["Clear result ✓", "Add your role's scope"], { x: 800, y: 470, w: 420, at: 8, stagger: 0.4 }),
      ] },
      { d: 7, bg: "white", items: [
        I.screen("dashboard", { path: "/dashboard", from: { x: 0.12, y: 0.05, w: 0.86 }, to: { x: 0.55, y: 0.26, w: 0.44 }, moveAt: 1, moveEnd: 4.5 }),
        I.callout("Practice raises your Career Readiness", { x: 70, y: 560, at: 4 }),
      ] },
      { d: 4.5, bg: "cream", end: true, items: [I.endcard({ tagline: 'Walk in <span class="grad">ready.</span>' })] },
    ],
  }),

  "home-ai-work": (I) => ({
    scenes: [
      { d: 4.5, bg: "plum", items: [I.kicker("AI Work · with micro1", { y: 220 }), I.title('Get paid to <span class="grad">train AI.</span>', { y: 270, size: 88 }), I.body("Remote, flexible, hourly work using what you already know.", { y: 400 })] },
      { d: 8, bg: "white", items: [
        I.screen("ai-work", { path: "/ai-work", from: { x: 0.12, y: 0.03, w: 0.7 }, to: { x: 0.12, y: 0.05, w: 0.62 }, moveAt: 1, moveEnd: 4 }),
        I.callout("Engineering, finance, medicine, law, languages and more", { x: 70, y: 565, at: 1.6 }),
      ] },
      { d: 8.5, bg: "white", items: [
        I.screen("ai-work", { path: "/ai-work", from: { x: 0.12, y: 0.5, w: 0.62 }, to: { x: 0.12, y: 0.55, w: 0.48 }, moveAt: 1, moveEnd: 5 }),
        I.callout("Hourly pay shown upfront", { x: 70, y: 565, at: 1.4, until: 5 }),
        I.callout("Your fit, from your skills", { x: 820, y: 565, at: 4.4, from: "right" }),
      ] },
      { d: 9, bg: "cream", items: [
        I.title("Four steps", { y: 120, size: 46, center: true, x: 0, w: 1280 }),
        I.steps([["🧭", "Pick a role", "that fits your skills"], ["🤖", "AI interview", "20–40 minutes"], ["✅", "Get onboarded", "matched to projects"], ["💸", "Get paid", "directly by micro1"]], { y: 270, at: 0.8, stagger: 1.4 }),
      ] },
      { d: 4.5, bg: "cream", end: true, items: [I.endcard({ tagline: 'Your expertise, <span class="grad">paid hourly.</span>' })] },
    ],
  }),

  // ---------------- LEARNING HUB ----------------
  "learn-ats-101": (I) => ({
    scenes: [
      { d: 4.5, bg: "cream", items: [I.kicker("Learning · ATS 101", { y: 220 }), I.title('What an ATS<br><span class="grad">actually reads.</span>', { y: 270, size: 84 }), I.body("Most resumes are screened by software before a person sees them.", { y: 470 })] },
      { d: 9, bg: "white", items: [I.parse({ keywords: ["SQL", "Python", "Tableau", "Forecasting", "Stakeholders", "A/B testing"] })] },
      { d: 10, bg: "cream", items: [
        I.title("Three rules that get you through", { y: 120, size: 48 }),
        I.list(["Use the job's own words for your skills", "Keep a simple layout: no tables or images", "Prove impact with numbers"], { y: 210, at: 0.8, stagger: 1.6 }),
      ] },
      { d: 8, bg: "white", items: [
        I.screen("ats", { path: "/ats-scanner", w: 640, x: 80, y: 120, from: { x: 0.16, y: 0.04, w: 0.56 } }),
        I.card('<div class="label">Try it</div><div style="font-size:26px;font-weight:700;margin-top:10px;color:#0b1220;line-height:1.35">Paste a job into the ATS Scanner to see missing keywords before you apply.</div>', { x: 780, y: 220, w: 420, at: 1 }),
      ] },
      { d: 4.5, bg: "cream", end: true, items: [I.endcard({ tagline: 'Get past the bots. <span class="grad">Reach people.</span>' })] },
    ],
  }),

  "learn-job-gpt": (I) => ({
    scenes: [
      { d: 4.5, bg: "plum", items: [I.kicker("Learning · Job GPT", { y: 220 }), I.title('Your AI <span class="grad">career coach.</span>', { y: 270, size: 86 }), I.body("Ask about your search. Answers use your own profile.", { y: 400 })] },
      { d: 6, bg: "white", items: [
        I.screen("job-gpt", { path: "/job-gpt", from: { x: 0.12, y: 0.05, w: 0.86 }, to: { x: 0.25, y: 0.2, w: 0.6 }, moveAt: 1, moveEnd: 4.5 }),
        I.callout("Starts from your Career Profile", { x: 70, y: 565, at: 1.4 }),
      ] },
      { d: 11, bg: "cream", items: [
        I.bubble("Which of my skills are most in demand for analyst roles?", { me: true, right: 120, y: 120, w: 560, at: 0.4, typeAt: 0.6, cps: 34 }),
        I.bubble("SQL and Tableau show up in most of your best matches. Adding a small Python forecasting project to your resume would lift your match on senior roles.", { x: 120, y: 270, w: 700, at: 3.4, typeAt: 3.8, cps: 45, tag: "Example answer" }),
        I.callout("Plain answers, with a next step", { x: 120, y: 520, at: 8 }),
      ] },
      { d: 9, bg: "cream", items: [
        I.title("Good questions to ask", { y: 110, size: 46 }),
        I.list(["Which jobs fit me best this week?", "Rewrite this bullet for a product role", "What salary should I ask for?", "How do I explain a career gap?"], { y: 190, at: 0.6, stagger: 1.2, gap: 18 }),
      ] },
      { d: 4.5, bg: "cream", end: true, items: [I.endcard({ tagline: 'Ask better. <span class="grad">Move faster.</span>' })] },
    ],
  }),

  "learn-work-rights": (I) => ({
    scenes: [
      { d: 4.5, bg: "cream", items: [I.kicker("Learning · Work rights", { y: 220 }), I.title('Visa, OPT, PR or citizen?<br><span class="grad">Filter smart.</span>', { y: 270, size: 76 }), I.body("Find roles that fit your work authorization, anywhere.", { y: 470 })] },
      { d: 7.5, bg: "white", items: [I.globe(["US", "UK", "Australia", "New Zealand", "India", "UAE", "Canada", "EMEA"])] },
      { d: 8, bg: "white", items: [
        I.screen("jobs-filters", { path: "/jobs", x: 360, w: 860, from: { x: 0.55, y: 0.05, w: 0.45 }, to: { x: 0.6, y: 0.08, w: 0.36 }, moveAt: 1, moveEnd: 4 }),
        I.callout("Open to visa sponsorship", { x: 70, y: 470, at: 2.6 }),
        I.callout("Open to students on OPT / CPT", { x: 70, y: 530, at: 3.6 }),
        I.callout("Hide citizens / PR-only roles", { x: 70, y: 590, at: 4.6 }),
      ] },
      { d: 8.5, bg: "white", items: [
        I.screen("jobs-uk", { path: "/jobs?country=UK", from: { x: 0.3, y: 0.05, w: 0.7 }, to: { x: 0.45, y: 0.25, w: 0.5 }, moveAt: 1, moveEnd: 4.5 }),
        I.callout("Every job spells out its work rights", { x: 70, y: 565, at: 4.2 }),
      ] },
      { d: 5.5, bg: "cream", items: [I.title("Tip", { y: 200, size: 40 }), I.body("Read the posting carefully and confirm visa terms with the employer before you accept an offer.", { y: 260, size: 34, w: 1000 })] },
      { d: 4.5, bg: "cream", end: true, items: [I.endcard({ tagline: 'Jobs that fit <span class="grad">your status.</span>' })] },
    ],
  }),

  "learn-follow-up": (I) => ({
    scenes: [
      { d: 4.5, bg: "cream", items: [I.kicker("Learning · Follow-ups", { y: 220 }), I.title('Applied? Follow up<br><span class="grad">in 7 days.</span>', { y: 270, size: 84 }), I.body("A short, polite note keeps you top of mind.", { y: 470 })] },
      { d: 10, bg: "white", items: [
        I.title("The follow-up rhythm", { y: 110, size: 46, center: true, x: 0, w: 1280 }),
        I.steps([["📨", "Day 0", "apply"], ["👋", "Day 7", "first follow-up"], ["🔁", "Day 14", "second follow-up"], ["➡️", "Day 21", "move on"]], { y: 260, at: 0.8, stagger: 1.6 }),
      ] },
      { d: 10, bg: "cream", items: [
        I.typedCard("Follow-up draft", "Hi Priya,\nI applied for the Data Analyst role last week and wanted to share why I'm excited about it: I recently cut stock-outs 18% with a Python forecast. Happy to share more. Thank you!\nMaya", { x: 170, y: 110, w: 940, typeAt: 0.6, cps: 40, size: 23, minH: 250 }),
        I.callout("Career OS drafts it from your profile", { x: 170, y: 575, at: 6.8, light: true }),
      ] },
      { d: 7.5, bg: "white", items: [
        I.screen("dashboard-lower", { path: "/dashboard", from: { x: 0.12, y: 0.05, w: 0.86 }, to: { x: 0.6, y: 0.36, w: 0.4 }, moveAt: 1, moveEnd: 4.5 }),
        I.callout("Follow-ups due show on your Home", { x: 70, y: 565, at: 4 }),
      ] },
      { d: 4.5, bg: "cream", end: true, items: [I.endcard({ tagline: 'Stay <span class="grad">top of mind.</span>' })] },
    ],
  }),

  "learn-career-profile": (I) => ({
    scenes: [
      { d: 4.5, bg: "plum", items: [I.kicker("Learning · Career Profile", { y: 220 }), I.title('Better profile,<br><span class="grad">better matches.</span>', { y: 270, size: 84 }), I.body("Your profile powers matching, resumes and interviews.", { y: 470 })] },
      { d: 8, bg: "white", items: [
        I.screen("profile", { path: "/profile", from: { x: 0.12, y: 0.04, w: 0.7 }, to: { x: 0.12, y: 0.3, w: 0.62 }, moveAt: 1, moveEnd: 6 }),
        I.callout("Skills, experience, goals and work authorization", { x: 70, y: 565, at: 1.4 }),
      ] },
      { d: 10, bg: "cream", items: [
        I.bars([["Resume", 88], ["Profile", 92], ["Skills", 78], ["Interview", 71], ["Job match", 84]], { x: 100, y: 130, w: 600, label: "What makes up your score", fillAt: 0.8 }),
        I.ring({ x: 820, y: 170, size: 300, value: 82, label: "Career readiness", at: 2.4, fillAt: 3 }),
      ] },
      { d: 8, bg: "white", items: [
        I.screen("dashboard", { path: "/dashboard", from: { x: 0.12, y: 0.35, w: 0.62 }, to: { x: 0.14, y: 0.4, w: 0.5 }, moveAt: 1, moveEnd: 5 }),
        I.callout("Match scores on every job", { x: 70, y: 565, at: 2 }),
      ] },
      { d: 4.5, bg: "cream", end: true, items: [I.endcard({ tagline: 'Five minutes. <span class="grad">Better matches.</span>' })] },
    ],
  }),
};
