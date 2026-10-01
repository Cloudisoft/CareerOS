import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { documentFromProfile, documentFromResumeContent, renderResumePdf } from "./pdf";
import { resumeContentSchema } from "@/lib/validations/resume";

const contact = { name: "Abosede Oakanbi", email: "a@example.com", phone: "555-0100", location: "Chicago, IL" };

describe("renderResumePdf", () => {
  it("renders a valid PDF from Resume Studio content, including unicode punctuation", async () => {
    const content = resumeContentSchema.parse({
      summary: "Salesforce analyst — 8 years’ experience “turning” requirements into shipped CRM changes 🚀",
      experience: [
        {
          title: "Salesforce Business Analyst",
          company: "Acme",
          startDate: "2020-03",
          isCurrent: true,
          bullets: Array.from({ length: 40 }, (_, i) => `Delivered workflow improvement number ${i + 1} across Sales Cloud and Service Cloud for regional teams`),
        },
      ],
      education: [{ school: "University of Lagos", degree: "BSc", fieldOfStudy: "Economics", endDate: "2014" }],
      skills: ["Salesforce", "SQL", "Jira"],
    });

    const bytes = await renderResumePdf(documentFromResumeContent(contact, content));
    expect(Buffer.from(bytes.slice(0, 5)).toString()).toBe("%PDF-");
    const loaded = await PDFDocument.load(bytes);
    // 40 long bullets cannot fit on one page — proves page breaks happen.
    expect(loaded.getPageCount()).toBeGreaterThan(1);
  });

  it("renders from a Career Profile when there is no Resume Studio resume", async () => {
    const doc = documentFromProfile({
      identity: { firstName: "Ada", lastName: "L", email: "ada@example.com", phone: "", city: "Austin", state: "TX", country: "", linkedin: "", github: "", portfolio: "" },
      experience: { history: [{ title: "Product Owner", company: "Beta", start: "2021-01-01", end: "", location: "", bullets: ["Owned the roadmap"] }] },
      skills: { core: ["Agile"], familiar: [], tools: ["Jira"] },
      education: [],
      certifications: ["Certified ScrumMaster"],
      narrative: { summary: "" },
    });
    expect(doc.experience[0].dates).toBe("Jan 2021 - Present");
    const loaded = await PDFDocument.load(await renderResumePdf(doc));
    expect(loaded.getPageCount()).toBe(1);
  });
});
