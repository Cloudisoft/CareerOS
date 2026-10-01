import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { ResumeContent } from "@/lib/validations/resume";

/** The fields a rendered resume needs, normalized from either a Resume
 * Studio resume or the Career Profile, whichever the person has. */
export interface ResumeDocument {
  name: string;
  email: string;
  phone: string;
  location: string;
  links: string[];
  summary: string;
  experience: { title: string; company: string; location: string; dates: string; bullets: string[] }[];
  education: { school: string; degree: string; dates: string }[];
  skills: string[];
  certifications: string[];
}

interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
}

export function documentFromResumeContent(contact: ContactInfo, content: ResumeContent): ResumeDocument {
  return {
    ...contact,
    links: [content.links.linkedin, content.links.github, content.links.portfolio].filter(Boolean),
    summary: content.summary,
    experience: content.experience.map((e) => ({
      title: e.title,
      company: e.company,
      location: e.location,
      dates: dateRange(e.startDate, e.isCurrent ? "Present" : e.endDate),
      bullets: e.bullets.filter(Boolean),
    })),
    education: content.education.map((e) => ({
      school: e.school,
      degree: [e.degree, e.fieldOfStudy].filter(Boolean).join(", "),
      dates: dateRange(e.startDate, e.endDate),
    })),
    skills: content.skills.filter(Boolean),
    certifications: content.certifications.map((c) => [c.name, c.issuer, c.year].filter(Boolean).join(", ")).filter(Boolean),
  };
}

/** Shape produced by buildExtensionProfile in src/lib/autoapply/adapter.ts. */
interface ExtensionProfileLike {
  identity: { firstName: string; lastName: string; email: string; phone: string; city: string; state: string; country: string; linkedin: string; github: string; portfolio: string };
  experience: { history: { title: string; company: string; start: string; end: string; location: string; bullets: string[] }[] };
  skills: { core: string[]; familiar: string[]; tools: string[] };
  education: { degree: string; field: string; school: string; year: string | number }[];
  certifications: string[];
  narrative: { summary: string };
}

export function documentFromProfile(p: ExtensionProfileLike): ResumeDocument {
  const i = p.identity;
  return {
    name: [i.firstName, i.lastName].filter(Boolean).join(" "),
    email: i.email,
    phone: i.phone,
    location: [i.city, i.state, i.country].filter(Boolean).join(", "),
    links: [i.linkedin, i.github, i.portfolio].filter(Boolean),
    summary: p.narrative.summary,
    experience: p.experience.history.map((h) => ({
      title: h.title,
      company: h.company,
      location: h.location,
      dates: dateRange(h.start, h.end || "Present"),
      bullets: (h.bullets || []).filter(Boolean),
    })),
    education: p.education.map((e) => ({
      school: e.school,
      degree: [e.degree, e.field].filter(Boolean).join(", "),
      dates: e.year ? String(e.year) : "",
    })),
    skills: [...p.skills.core, ...p.skills.tools, ...p.skills.familiar].filter(Boolean),
    certifications: p.certifications.filter(Boolean),
  };
}

function dateRange(start: string, end: string) {
  const s = formatDate(start);
  const e = formatDate(end);
  if (s && e) return `${s} - ${e}`;
  return s || e;
}

function formatDate(value: string) {
  if (!value) return "";
  const m = /^(\d{4})-(\d{2})/.exec(value);
  if (!m) return value;
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(m[2]) - 1];
  return month ? `${month} ${m[1]}` : m[1];
}

/* The built-in Helvetica only covers Latin-1 (WinAnsi). Fancy punctuation
   is mapped to plain equivalents and anything else outside that range is
   dropped, rather than letting one emoji in a bullet fail the whole file. */
function clean(text: string) {
  return String(text || "")
    .replace(/[‘’‛]/g, "'")
    .replace(/[“”‟]/g, '"')
    .replace(/[–—−]/g, "-")
    .replace(/…/g, "...")
    .replace(/[•●▪]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "")
    .trim();
}

const PAGE = { width: 612, height: 792, margin: 50 };
const INK = rgb(0.11, 0.09, 0.13);
const MUTED = rgb(0.42, 0.4, 0.45);
const ACCENT = rgb(0.95, 0.3, 0.18);

export async function renderResumePdf(doc: ResumeDocument): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${clean(doc.name) || "Resume"} - Resume`);
  pdf.setCreator("CareerOS");
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page: PDFPage = pdf.addPage([PAGE.width, PAGE.height]);
  let y = PAGE.height - PAGE.margin;
  const contentWidth = PAGE.width - PAGE.margin * 2;

  function ensure(space: number) {
    if (y - space < PAGE.margin) {
      page = pdf.addPage([PAGE.width, PAGE.height]);
      y = PAGE.height - PAGE.margin;
    }
  }

  function wrap(text: string, font: PDFFont, size: number, width: number) {
    const words = clean(text).split(" ").filter(Boolean);
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= width) {
        line = next;
      } else {
        if (line) lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function write(text: string, opts: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; indent?: number; gap?: number } = {}) {
    const font = opts.font ?? regular;
    const size = opts.size ?? 10;
    const indent = opts.indent ?? 0;
    const lineHeight = size * 1.35;
    for (const line of wrap(text, font, size, contentWidth - indent)) {
      ensure(lineHeight);
      page.drawText(line, { x: PAGE.margin + indent, y: y - size, size, font, color: opts.color ?? INK });
      y -= lineHeight;
    }
    y -= opts.gap ?? 0;
  }

  function writeRow(left: string, right: string, font: PDFFont, size: number) {
    const r = clean(right);
    const rightWidth = r ? regular.widthOfTextAtSize(r, size - 0.5) : 0;
    const leftLines = wrap(left, font, size, contentWidth - rightWidth - 12);
    leftLines.forEach((line, idx) => {
      ensure(size * 1.35);
      page.drawText(line, { x: PAGE.margin, y: y - size, size, font, color: INK });
      if (idx === 0 && r) {
        page.drawText(r, { x: PAGE.width - PAGE.margin - rightWidth, y: y - size, size: size - 0.5, font: regular, color: MUTED });
      }
      y -= size * 1.35;
    });
  }

  function section(title: string) {
    ensure(34);
    y -= 10;
    page.drawText(title.toUpperCase(), { x: PAGE.margin, y: y - 10, size: 10, font: bold, color: ACCENT });
    y -= 15;
    page.drawLine({
      start: { x: PAGE.margin, y },
      end: { x: PAGE.width - PAGE.margin, y },
      thickness: 0.6,
      color: rgb(0.86, 0.83, 0.8),
    });
    y -= 8;
  }

  // Header
  write(doc.name || "Resume", { font: bold, size: 20, gap: 2 });
  const contact = [doc.email, doc.phone, doc.location].map(clean).filter(Boolean).join("  |  ");
  if (contact) write(contact, { size: 9.5, color: MUTED });
  if (doc.links.length) write(doc.links.map(clean).join("  |  "), { size: 9.5, color: MUTED });

  if (clean(doc.summary)) {
    section("Summary");
    write(doc.summary, { size: 10 });
  }

  const experience = doc.experience.filter((e) => clean(e.title) || clean(e.company));
  if (experience.length) {
    section("Experience");
    experience.forEach((e, idx) => {
      writeRow(clean(e.title) || clean(e.company), e.dates, bold, 10.5);
      const sub = [e.title ? e.company : "", e.location].map(clean).filter(Boolean).join(" - ");
      if (sub) write(sub, { size: 9.5, color: MUTED });
      e.bullets.forEach((b) => {
        const lines = wrap(b, regular, 10, contentWidth - 12);
        lines.forEach((line, li) => {
          ensure(13.5);
          if (li === 0) page.drawText("-", { x: PAGE.margin + 2, y: y - 10, size: 10, font: regular, color: MUTED });
          page.drawText(line, { x: PAGE.margin + 12, y: y - 10, size: 10, font: regular, color: INK });
          y -= 13.5;
        });
      });
      if (idx < experience.length - 1) y -= 6;
    });
  }

  const education = doc.education.filter((e) => clean(e.school));
  if (education.length) {
    section("Education");
    education.forEach((e) => {
      writeRow(e.school, e.dates, bold, 10.5);
      if (clean(e.degree)) write(e.degree, { size: 9.5, color: MUTED, gap: 3 });
    });
  }

  if (doc.skills.length) {
    section("Skills");
    write(Array.from(new Set(doc.skills.map(clean).filter(Boolean))).join(", "), { size: 10 });
  }

  if (doc.certifications.length) {
    section("Certifications");
    doc.certifications.forEach((c) => write(c, { size: 10 }));
  }

  return pdf.save();
}
