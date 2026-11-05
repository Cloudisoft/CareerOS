/**
 * Career OS tutorial videos (30–45 s motion graphics built from real Career OS
 * screens, with original background music). Files live in
 * public/videos/tutorials; posters share the slug.
 */
export interface TutorialVideo {
  slug: string;
  title: string;
  description: string;
  /** Seconds. */
  duration: number;
  topic: string;
}

export const HOME_TUTORIALS: TutorialVideo[] = [
  { slug: "home-ai-job-search", topic: "Job search", title: "Describe the job. We find it.", description: "Search in plain words, then narrow with one-tap filters for remote, internships, visa sponsorship and more.", duration: 33 },
  { slug: "home-resume-studio", topic: "Resume Studio", title: "A resume tailored to every job", description: "Tailor your resume to a job and let AI turn duties into results that pass the ATS.", duration: 34 },
  { slug: "home-auto-apply", topic: "Auto Apply", title: "Apply while you sleep, stay in control", description: "Set your minimum match score and daily limit; Career OS matches, tailors, applies and tracks.", duration: 35 },
  { slug: "home-interview-ai", topic: "Interview AI", title: "Practise the interview before the interview", description: "Answer realistic questions for your role and get an instant score with what to improve.", duration: 34 },
  { slug: "home-ai-work", topic: "AI Work", title: "Get paid to train AI with micro1", description: "Find remote, hourly AI-training roles that fit your skills, practise the AI interview and apply.", duration: 34.5 },
];

export const LEARNING_TUTORIALS: TutorialVideo[] = [
  { slug: "learn-ats-101", topic: "ATS 101", title: "What an applicant tracking system actually reads", description: "How ATS software scans resumes for keywords, and three rules to get through to a person.", duration: 36 },
  { slug: "learn-job-gpt", topic: "Job GPT", title: "Use Job GPT as your career coach", description: "Ask about your search and get plain answers built on your own Career Profile, plus good questions to try.", duration: 35 },
  { slug: "learn-work-rights", topic: "Work rights", title: "Visa, OPT, PR or citizen? Filter smart", description: "Find roles that fit your work authorization across the US, UK, Australia, NZ, India, UAE, Canada and EMEA.", duration: 38.5 },
  { slug: "learn-follow-up", topic: "Follow-ups", title: "The 7-day follow-up rule", description: "When and how to follow up after applying, and where Career OS reminds you.", duration: 36.5 },
  { slug: "learn-career-profile", topic: "Career Profile", title: "Better profile, better matches", description: "What makes up your Career Readiness score and how a complete profile improves every match.", duration: 35 },
];

export const videoSrc = (slug: string) => `/videos/tutorials/${slug}.mp4`;
export const posterSrc = (slug: string) => `/videos/tutorials/${slug}.jpg`;

export function formatDuration(seconds: number) {
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
