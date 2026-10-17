import { readFileSync } from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";

const dir = path.resolve(import.meta.dirname, "..");

/** A page with the extension's scripts loaded the way Chrome injects them (plain scripts sharing `window`). */
export function page(html: string, scripts: string[], url = "https://job-boards.greenhouse.io/acme/jobs/1") {
  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, { url, runScripts: "outside-only", pretendToBeVisual: true });
  const w = dom.window as unknown as Window & typeof globalThis & { CareerOS: any; eval: (s: string) => unknown };
  // jsdom does no layout: treat every element as having a box unless it is hidden by style.
  w.Element.prototype.getClientRects = function () {
    return [{ width: 100, height: 20 }] as unknown as DOMRectList;
  };
  w.Element.prototype.getBoundingClientRect = function () {
    return { width: 100, height: 40, top: 0, left: 0, right: 100, bottom: 40, x: 0, y: 0, toJSON() {} } as DOMRect;
  };
  // jsdom has no DataTransfer, and input.files only accepts a real FileList: stand in for both, as Chrome provides.
  class DataTransferStub {
    private list: File[] = [];
    items = { add: (f: File) => this.list.push(f) };
    get files() {
      return Object.assign([...this.list], { item: (i: number) => this.list[i] ?? null });
    }
  }
  (w as any).DataTransfer = DataTransferStub;
  const fileStore = new WeakMap<object, unknown>();
  Object.defineProperty(w.HTMLInputElement.prototype, "files", {
    configurable: true,
    get() { return fileStore.get(this) ?? Object.assign([], { item: () => null }); },
    set(v) { fileStore.set(this, v); },
  });
  // A minimal chrome.storage for lib/storage.js.
  const store: Record<string, unknown> = {};
  (w as any).chrome = {
    storage: {
      local: {
        get: (keys: string[], cb: (r: Record<string, unknown>) => void) =>
          setTimeout(() => cb(Object.fromEntries(keys.filter((k) => k in store).map((k) => [k, structuredClone(store[k])]))), 1),
        set: (obj: Record<string, unknown>, cb: () => void) =>
          setTimeout(() => {
            Object.assign(store, structuredClone(obj));
            cb();
          }, 1),
      },
    },
    runtime: { getManifest: () => ({ version: "test" }) },
  };
  for (const s of scripts) w.eval(readFileSync(path.join(dir, s), "utf8"));
  return { w, doc: w.document, CareerOS: w.CareerOS, store };
}

export const FILL_SCRIPTS = ["lib/storage.js", "lib/profile.js", "lib/ats.js", "lib/answers.js", "lib/filler.js"];
