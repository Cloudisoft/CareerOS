import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/page-hero";
import { Reveal } from "@/components/marketing/reveal";

export const metadata: Metadata = {
  title: "About",
  description: "Why Career OS exists and what it's built to do.",
};

const PARAGRAPHS = [
  "Job searching today means juggling a job board, a resume tool, an ATS checker, a spreadsheet of applications, an interview prep app, and a course platform — none of which talk to each other. Career OS exists because your career shouldn't require ten logins.",
  "Everything in Career OS reads from and writes back to one Career Profile. Your resume knows what your target jobs need. Your interview practice knows what job you're preparing for. Your learning plan knows exactly which skill gap is costing you interviews. Auto Apply knows your real preferences and never guesses at facts it doesn't have.",
  "We built Career OS to be honest by design: it never fabricates a submitted application, never invents an answer to a legal or work-authorization question, and never bypasses a CAPTCHA or login on your behalf. When it needs you, it tells you exactly why.",
];

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="About" title="Why Career OS exists" align="left" />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="space-y-6">
          {PARAGRAPHS.map((text, i) => (
            <Reveal key={text.slice(0, 24)} delay={i * 0.08}>
              <p className="leading-relaxed text-muted-foreground">{text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </>
  );
}
