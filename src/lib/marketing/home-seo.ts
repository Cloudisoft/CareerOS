import { HOME_TUTORIALS, posterSrc, videoSrc } from "@/config/tutorial-videos";
import { BRAND } from "@/config/brand";
/**
 * Homepage FAQ (rendered on the page and mirrored in FAQPage structured
 * data — the two must match) and the site's structured data.
 */
export const HOME_FAQS = [
  {
    q: "What is CareerOS by Silver Springs Staffing?",
    a: "CareerOS is the AI career platform from Silver Springs Staffing (silverspringstaffing.com), found at careeros.silverspringstaffing.com. Job seekers use it to find jobs, tailor resumes and practise interviews; recruiters and staffing firms use its Recruiter Suite to post jobs, search resumes and screen candidates.",
  },
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
      "@id": `${BRAND.parent.url}/#organization`,
      name: BRAND.parent.name,
      alternateName: BRAND.parent.alternateNames,
      url: BRAND.parent.url,
      sameAs: [BRAND.parent.url],
      subOrganization: { "@id": `${url}/#organization` },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${url}/#organization`,
      name: BRAND.name,
      legalName: BRAND.fullName,
      alternateName: BRAND.alternateNames,
      url,
      logo: `${url}/brand/icon-512.png`,
      image: `${url}/brand/logo-full-dark.png`,
      slogan: BRAND.tagline,
      description: "CareerOS by Silver Springs Staffing is an AI career operating system for job seekers and a Recruiter Suite for hiring teams and staffing firms.",
      parentOrganization: { "@id": `${BRAND.parent.url}/#organization` },
      sameAs: [BRAND.parent.url],
      knowsAbout: ["job search", "resume writing", "applicant tracking systems", "interview preparation", "recruiting", "staffing"],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${url}/#website`,
      name: BRAND.fullName,
      alternateName: BRAND.alternateNames,
      url,
      inLanguage: "en",
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
      name: BRAND.fullName,
      alternateName: BRAND.alternateNames,
      publisher: { "@id": `${url}/#organization` },
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
    ...HOME_TUTORIALS.map((v) => ({
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: v.title,
      description: v.description,
      thumbnailUrl: `${url}${posterSrc(v.slug)}`,
      contentUrl: `${url}${videoSrc(v.slug)}`,
      uploadDate: "2026-11-05",
      duration: `PT${Math.round(v.duration)}S`,
      publisher: { "@id": `${url}/#organization` },
    })),
  ];
}
