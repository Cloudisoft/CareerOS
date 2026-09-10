import type { ReactNode } from "react";

/**
 * Minimal markdown renderer for course lesson content — headings, bold,
 * numbered/bulleted lists, and paragraphs. Deliberately not a full markdown
 * library: lesson content only ever uses this small, predictable subset.
 */
function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part
  );
}

export function LessonContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];
  let listOrdered = false;

  function flushList() {
    if (!listItems.length) return;
    const Tag = listOrdered ? "ol" : "ul";
    blocks.push(
      <Tag key={blocks.length} className={listOrdered ? "list-decimal space-y-1 pl-5" : "list-disc space-y-1 pl-5"}>
        {listItems.map((item, i) => (
          <li key={i} className="text-sm leading-relaxed text-foreground">
            {renderInline(item)}
          </li>
        ))}
      </Tag>
    );
    listItems = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith("```")) {
      flushList();
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i += 1;
      }
      blocks.push(
        <pre key={blocks.length} className="overflow-x-auto rounded-md border border-border bg-surface-raised p-3 text-xs">
          <code className="font-mono text-foreground">{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    if (!line) {
      flushList();
      continue;
    }
    if (line.startsWith("## ")) {
      flushList();
      blocks.push(
        <h3 key={blocks.length} className="mt-6 text-base font-semibold text-foreground first:mt-0">
          {line.slice(3)}
        </h3>
      );
      continue;
    }
    const numbered = /^\d+\.\s+/.exec(line);
    if (numbered) {
      if (listItems.length && !listOrdered) flushList();
      listOrdered = true;
      listItems.push(line.slice(numbered[0].length));
      continue;
    }
    if (line.startsWith("- ")) {
      if (listItems.length && listOrdered) flushList();
      listOrdered = false;
      listItems.push(line.slice(2));
      continue;
    }
    flushList();
    blocks.push(
      <p key={blocks.length} className="text-sm leading-relaxed text-foreground">
        {renderInline(line)}
      </p>
    );
  }
  flushList();

  return <div className="space-y-3">{blocks}</div>;
}
