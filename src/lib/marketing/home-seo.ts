/**
 * Homepage FAQ (rendered on the page and mirrored in FAQPage structured
 * data — the two must match) and the site's structured data.
 */
export const HOME_FAQS = [
  {
    q: "What is Career OS?",
    a: "Career OS is a career operating system: one place to find jobs, build and tailor resumes, check them against applicant tracking systems, apply automatically with Auto Apply, practise with Interview AI, learn new skills and grow your network.",
  },
  {
    q: "Is Career OS free?",
    a: "Yes. The Free plan includes your Career Profile, job search and core tools. Paid plans start at $19 a month for higher Auto Apply limits, Job GPT, Interview AI and more, and you can cancel anytime.",
  },
  {
    q: "How does Auto Apply work?",
    a: "Auto Apply finds jobs that match your preferences, checks them against your safety rules and applies with your chosen resume. It never invents information and never bypasses CAPTCHAs or logins — anything it isn't sure about comes back to you.",
  },
  {
    q: "What is the Career OS and micro1 partnership?",
    a: "Career OS is in partnership with micro1, an AI-powered talent platform that connects vetted engineers and domain experts with AI labs, startups and enterprises. Career OS members can explore micro1 opportunities alongside Career OS job search, and use Interview AI to prepare for AI-led interviews.",
  },
  {
    q: "Does Career OS have tools for recruiters and staffing firms?",
    a: "Yes. The Recruiter Suite adds daily job posting, resume search with unlockable contact details, AI ATS screening, a candidate pipeline, InMail to hiring teams and opted-in candidates, and boosted posts. Plans are $499 and $999 a month, with a free 3-day trial.",
  },
];

export function homeStructuredData(baseUrl: string) {
  const url = baseUrl.replace(/\/$/, "");
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${url}/#organization`,
      name: "Career OS",
      url,
      logo: `${url}/brand/icon-512.png`,
      description: "Career OS is a career operating system for job seekers and a Recruiter Suite for hiring teams.",
      knowsAbout: ["job search", "resume writing", "applicant tracking systems", "interview preparation", "recruiting"],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${url}/#website`,
      name: "Career OS",
      url,
      publisher: { "@id": `${url}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${url}/jobs?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Career OS",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web, Chrome",
      url,
      offers: [
        { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD" },
        { "@type": "Offer", name: "Recruiter Suite Starter", price: "499", priceCurrency: "USD" },
        { "@type": "Offer", name: "Recruiter Suite Professional", price: "999", priceCurrency: "USD" },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: HOME_FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];
}
