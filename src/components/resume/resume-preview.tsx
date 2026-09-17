import type { ResumeContent } from "@/lib/validations/resume";

interface ResumeHeader {
  name: string;
  email: string;
  phone: string;
  location: string;
}

interface ResumePreviewProps {
  header: ResumeHeader;
  content: ResumeContent;
}

export function ResumePreview({ header, content }: ResumePreviewProps) {
  const contactLine = [header.location, header.phone, header.email, content.links.linkedin, content.links.github, content.links.portfolio]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <div id="resume-print-area" className="mx-auto max-w-[8.5in] rounded-lg border border-border bg-white p-10 text-neutral-900 shadow-sm print:max-w-none print:rounded-none print:border-0 print:shadow-none">
      <header className="border-b border-neutral-300 pb-4 text-center">
        <h1 className="text-2xl font-bold tracking-wide">{header.name || "Your Name"}</h1>
        {contactLine && <p className="mt-1 text-xs text-neutral-600">{contactLine}</p>}
      </header>

      {content.summary && (
        <section className="mt-5">
          <p className="text-sm leading-relaxed text-neutral-800">{content.summary}</p>
        </section>
      )}

      {content.experience.length > 0 && (
        <section className="mt-5">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">Experience</h2>
          <div className="space-y-4">
            {content.experience.map((exp, i) => (
              <div key={i}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <p className="text-sm font-semibold">
                    {exp.title || "Title"} {exp.company && <span className="font-normal text-neutral-600">· {exp.company}</span>}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {[exp.startDate, exp.isCurrent ? "Present" : exp.endDate].filter(Boolean).join(" – ")}
                    {exp.location ? `  ·  ${exp.location}` : ""}
                  </p>
                </div>
                {exp.bullets.length > 0 && (
                  <ul className="mt-1.5 list-disc space-y-1 pl-5">
                    {exp.bullets.filter(Boolean).map((bullet, bi) => (
                      <li key={bi} className="text-sm leading-snug text-neutral-800">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {content.education.length > 0 && (
        <section className="mt-5">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">Education</h2>
          <div className="space-y-2">
            {content.education.map((edu, i) => (
              <div key={i} className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="text-sm font-semibold">
                  {edu.school || "School"}
                  {edu.degree && <span className="font-normal text-neutral-600"> · {edu.degree}{edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ""}</span>}
                </p>
                <p className="text-xs text-neutral-500">{[edu.startDate, edu.endDate].filter(Boolean).join(" – ")}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {content.skills.length > 0 && (
        <section className="mt-5">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">Skills</h2>
          <p className="text-sm text-neutral-800">{content.skills.join("  ·  ")}</p>
        </section>
      )}

      {content.certifications.length > 0 && (
        <section className="mt-5">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">Certifications</h2>
          <div className="space-y-1">
            {content.certifications.map((c, i) => (
              <p key={i} className="text-sm text-neutral-800">
                {c.name}
                {c.issuer ? ` — ${c.issuer}` : ""}
                {c.year ? ` (${c.year})` : ""}
              </p>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
