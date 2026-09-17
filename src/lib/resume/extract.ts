import "server-only";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export class ResumeExtractError extends Error {
  code = "UNSUPPORTED_FILE";
}

const MAX_FILE_BYTES = 8 * 1024 * 1024;

/** Extracts plain text from an uploaded resume file (PDF, DOCX, or .txt). */
export async function extractResumeText(buffer: Buffer, mimeType: string, filename: string): Promise<string> {
  if (buffer.byteLength > MAX_FILE_BYTES) {
    throw new ResumeExtractError("That file is too large. Use a resume under 8 MB.");
  }

  const lower = filename.toLowerCase();

  if (mimeType === "application/pdf" || lower.endsWith(".pdf")) {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lower.endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (mimeType.startsWith("text/") || lower.endsWith(".txt")) {
    return buffer.toString("utf-8");
  }

  throw new ResumeExtractError("Upload a PDF, DOCX, or plain text resume.");
}
