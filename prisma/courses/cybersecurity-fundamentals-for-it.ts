import type { CourseSeed } from "../course-types";

export const course: CourseSeed = {
  slug: "cybersecurity-fundamentals-for-it",
  title: "Cybersecurity Fundamentals for IT Professionals",
  description:
    "The core security principles, common attack vectors, and practical habits that apply across almost every IT role — not just dedicated security positions.",
  category: "Security",
  level: "BEGINNER",
  order: 7,
  lessons: [
    {
      title: "The CIA Triad and Why It's the Starting Point",
      durationMinutes: 5,
      slides: [
        {
          kind: "title",
          heading: "The CIA Triad and Why It's the Starting Point",
          subheading:
            "Nearly every security decision can be framed against three properties: Confidentiality, Integrity, and Availability.",
        },
        {
          kind: "bullets",
          heading: "The three properties",
          bullets: [
            "Confidentiality — only authorized people/systems can access the data. A data breach is a confidentiality failure.",
            "Integrity — data hasn't been tampered with. A system that lets anyone silently modify financial records has an integrity failure, even if access is otherwise well-controlled.",
            "Availability — authorized users can actually access the system when they need to. A denial-of-service attack is purely an availability failure.",
          ],
        },
        {
          kind: "text",
          heading: "Why thinking in these terms is useful",
          body: [
            "Different systems weight these differently. A public status page cares enormously about availability and barely about confidentiality. A system holding medical records cares enormously about confidentiality and integrity.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "A concrete example",
          body: "Encrypting a database protects confidentiality but does nothing for availability — a ransomware attack can still lock you out of your own encrypted data. Real security posture layers multiple protections.",
        },
      ],
    },
    {
      title: "Common Attack Vectors",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Common Attack Vectors",
          subheading:
            "Understanding how systems actually get compromised makes every other security practice make more sense.",
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Phishing and social engineering",
          body: "The overwhelming majority of real breaches start with a human, not a technical vulnerability. No firewall stops this; it's addressed through awareness and systems designed so one person's mistake doesn't cascade into full compromise.",
        },
        {
          kind: "bullets",
          heading: "Credential-based attacks",
          bullets: [
            "Credential stuffing — attackers use leaked username/password pairs from one breach to try other services, betting on password reuse.",
            "Brute force — systematically trying passwords, mitigated by rate limiting, lockouts, and MFA.",
          ],
        },
        {
          kind: "bullets",
          heading: "Injection attacks",
          bullets: [
            "SQL injection — untrusted input concatenated directly into a database query. Prevented by parameterized queries.",
            "Cross-site scripting (XSS) — untrusted input rendered as executable code in another user's browser. Prevented by properly escaping output.",
          ],
        },
        {
          kind: "text",
          heading: "Misconfiguration",
          body: [
            "A publicly exposed storage bucket, an admin panel with default credentials, an overly permissive firewall rule — not sophisticated exploits, just mistakes an attacker only has to find.",
          ],
        },
        {
          kind: "summary",
          heading: "The practical implication",
          bullets: [
            "Most real breaches exploit a known category of weakness that a fairly standard security practice would have prevented.",
          ],
        },
      ],
    },
    {
      title: "Least Privilege and Defense in Depth",
      durationMinutes: 5,
      slides: [
        {
          kind: "title",
          heading: "Least Privilege and Defense in Depth",
          subheading:
            "Two principles do more real-world security work than almost any specific tool.",
        },
        {
          kind: "bullets",
          heading: "Least privilege",
          intro: "Grant the minimum access required to do a job. If a marketing analyst's account only has read access to a dashboard, a phished password there can't reach customer payment data.",
          bullets: [
            "Application service accounts get only the specific database permissions they need.",
            "Temporary elevated access beats permanent elevated access \"in case.\"",
            "Regularly review who has access to what.",
          ],
        },
        {
          kind: "bullets",
          heading: "Defense in depth",
          intro: "No single security control is perfect, so real security posture layers multiple independent controls. Example layering for a web application:",
          bullets: [
            "Network level — firewall rules.",
            "Application level — input validation, authentication, authorization.",
            "Data level — encryption at rest.",
            "Monitoring — logging and alerting.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Why both principles together matter",
          body: "Least privilege limits how much any single compromised point can reach. Defense in depth ensures no single compromised point is enough on its own.",
        },
      ],
    },
    {
      title: "Practical Security Hygiene",
      durationMinutes: 5,
      slides: [
        {
          kind: "title",
          heading: "Practical Security Hygiene",
          subheading:
            "Most of the security value in day-to-day IT work comes from a small set of unglamorous, consistently-applied habits.",
        },
        {
          kind: "bullets",
          heading: "The habits that matter most",
          bullets: [
            "Patching — unpatched software is one of the most common real causes of breaches, because known vulnerabilities are publicly documented.",
            "Multi-factor authentication (MFA) — a stolen password alone shouldn't be enough. MFA stops the overwhelming majority of credential-based attacks even when a password is compromised.",
            "Backups, tested — a backup never tested for restoration isn't reliable, it's an assumption. Ransomware specifically targets backups, which is why an offline or immutable backup copy matters.",
            "Logging and monitoring — a breach not noticed for months does far more damage than one caught within hours. Centralized logging and basic alerting turns \"we found out three months later\" into \"we caught this within the hour.\"",
          ],
        },
        {
          kind: "summary",
          heading: "The unifying theme",
          bullets: [
            "A sophisticated architecture with unpatched systems and no MFA is weaker in practice than a simple architecture where the basics are actually, reliably applied.",
          ],
        },
      ],
    },
  ],
};
