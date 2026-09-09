import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Why Career OS exists and what it's built to do.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-4xl font-bold text-foreground sm:text-5xl">About Career OS</h1>
      <div className="mt-8 space-y-6 text-muted-foreground">
        <p>
          Job searching today means juggling a job board, a resume tool, an ATS checker, a
          spreadsheet of applications, an interview prep app, and a course platform — none of
          which talk to each other. Career OS exists because your career shouldn't require ten
          logins.
        </p>
        <p>
          Everything in Career OS reads from and writes back to one Career Profile. Your resume
          knows what your target jobs need. Your interview practice knows what job you're
          preparing for. Your learning plan knows exactly which skill gap is costing you
          interviews. Auto Apply knows your real preferences and never guesses at facts it
          doesn't have.
        </p>
        <p>
          We built Career OS to be honest by design: it never fabricates a submitted application,
          never invents an answer to a legal or work-authorization question, and never bypasses a
          CAPTCHA or login on your behalf. When it needs you, it tells you exactly why.
        </p>
      </div>
    </div>
  );
}
