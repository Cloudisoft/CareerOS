import { describe, expect, it } from "vitest";
import { FILL_SCRIPTS, page } from "./load";

const profile = {
  identity: { firstName: "Ada", lastName: "Lovelace", email: "ada@example.com", phone: "+1 555 0100", city: "Austin", country: "United States" },
  experience: { currentTitle: "QA Analyst", currentCompany: "Analytical Engines", totalYears: 6, history: [{ title: "QA Analyst", company: "Analytical Engines" }] },
  skills: { core: ["Selenium"], familiar: [], tools: [], languages: [] },
  workAuth: { needsSponsorship: false, willingToRelocate: false, authorizedIn: ["US"] },
};

function context(over: Record<string, unknown> = {}) {
  return {
    resume: { name: "Ada_CV.pdf", mime: "application/pdf", dataUrl: "data:application/pdf;base64,JVBERi0xLjQK" },
    recall: async () => null,
    recallKey: async () => null,
    answerQuestion: async () => null,
    generate: async () => "",
    ...over,
  };
}

describe("answers by meaning", () => {
  const { CareerOS } = page("", ["lib/answers.js"]);
  const pick = (opts: string[], v: string) => CareerOS.Answers.pickOption(opts, v);

  it("maps yes/no to however the form words it", () => {
    const vet = ["I identify as one or more of the classifications of protected veteran", "I am not a protected veteran", "I don't wish to answer"];
    expect(pick(vet, "No")).toBe("I am not a protected veteran");
    expect(pick(vet, "Yes")).toBe(vet[0]);
    expect(pick(["Yes, I have a disability", "No, I do not have a disability", "I do not want to answer"], "No")).toBe("No, I do not have a disability");
  });

  it("maps any 'prefer not to say' to the form's decline option, and Male to Man", () => {
    expect(pick(["Male", "Female", "Decline To Self Identify"], "Prefer not to say")).toBe("Decline To Self Identify");
    expect(pick(["Man", "Woman", "I don't wish to answer"], "Male")).toBe("Man");
  });

  it("answers 'how did you hear' with Google or the closest source", () => {
    expect(pick(["LinkedIn", "Search Engine (Google, Bing)", "Other"], "Google")).toBe("Search Engine (Google, Bing)");
    expect(pick(["Job board", "Social media", "Other"], "Google")).toBe("Social media");
    expect(pick(["Red", "Blue"], "Green")).toBeNull();
  });

  it("knows the questions every form asks", () => {
    const std = (q: string) => CareerOS.Answers.standardAnswer(q, profile);
    expect(std("How did you hear about this job?")).toEqual({ value: "Google", key: "referral" });
    expect(std("Have you ever worked for Roblox?")!.value).toBe("No");
    expect(std("Have you previously worked at Analytical Engines?")!.value).toBe("Yes");
    expect(std("Are you a protected veteran?")!.key).toBe("eeo:veteran");
  });

  it("remembers self-identification answers by meaning", () => {
    expect(CareerOS.Answers.meaningOf("Veteran status", "I am not a protected veteran")).toEqual({ key: "eeo:veteran", value: "No" });
    expect(CareerOS.Answers.meaningOf("Gender", "I don't wish to answer")).toEqual({ key: "eeo:gender", value: "Prefer not to say" });
  });
});

describe("filling forms", () => {
  /** react-select look-alike (Greenhouse job boards): opens on mousedown, shows the choice in its own element. */
  const reactSelect = (id: string, label: string, options: string[]) => `
    <div class="field"><label for="${id}">${label} *</label>
      <div class="select__container"><div class="select__control"><div class="select__value-container">
        <div class="select__placeholder">Select...</div>
        <div class="select__input-container"><input id="${id}" role="combobox" aria-autocomplete="list" aria-required="true"></div>
      </div></div><div class="menu" data-options='${JSON.stringify(options).replace(/'/g, "&#39;")}'></div></div></div>`;

  function wireReactSelect(doc: Document) {
    doc.querySelectorAll<HTMLElement>(".menu").forEach((host) => {
      const options: string[] = JSON.parse(host.dataset.options!);
      const container = host.parentElement!;
      const input = container.querySelector("input")!;
      const render = (filter: string) => {
        host.innerHTML = "";
        for (const o of options.filter((x) => x.toLowerCase().includes(filter.toLowerCase()))) {
          const el = doc.createElement("div");
          el.className = "select__option";
          el.textContent = o;
          el.addEventListener("click", () => {
            const vc = container.querySelector(".select__value-container")!;
            vc.querySelector(".select__placeholder, .select__single-value")?.remove();
            const sv = doc.createElement("div");
            sv.className = "select__single-value";
            sv.textContent = o;
            vc.prepend(sv);
            host.innerHTML = "";
          });
          host.appendChild(el);
        }
      };
      container.querySelector(".select__control")!.addEventListener("mousedown", () => render(""));
      input.addEventListener("input", () => render(input.value));
    });
  }

  it("fills searchable dropdowns by meaning and reads the choice back", async () => {
    const { doc, CareerOS } = page(
      `<form>${reactSelect("vet", "Protected Veteran Status", ["I identify as a protected veteran", "I am not a protected veteran", "I don't wish to answer"])}
       ${reactSelect("src", "How did you hear about us?", ["LinkedIn", "Search engine", "Referral"])}</form>`,
      FILL_SCRIPTS
    );
    wireReactSelect(doc);
    const form = doc.querySelector("form")!;
    const report = await CareerOS.Filler.fillForm(form, CareerOS.Profile.hydrate({ ...profile, voluntary: { veteran: "No" } }), context());
    expect(report.skipped).toEqual([]);
    const values = Array.from(doc.querySelectorAll(".select__single-value")).map((e) => e.textContent);
    expect(values).toEqual(["I am not a protected veteran", "Search engine"]);
    expect(CareerOS.Filler.missingRequired(form)).toEqual([]);
  });

  it("uses the person's earlier answer to a self-identification question", async () => {
    const { doc, CareerOS } = page(`<form>${reactSelect("g", "Gender", ["Man", "Woman", "Decline to self-identify"])}</form>`, FILL_SCRIPTS);
    wireReactSelect(doc);
    await CareerOS.Filler.fillForm(doc.querySelector("form"), CareerOS.Profile.hydrate(profile), context({ recallKey: async (k: string) => (k === "eeo:gender" ? "Male" : null) }));
    expect(doc.querySelector(".select__single-value")!.textContent).toBe("Man");
  });

  it("answers 18+ questions however they're worded", () => {
    const { CareerOS } = page("", ["lib/answers.js"]);
    for (const q of ["Are you 18 or older?", "Are you at least 18 years of age?", "Are you 18+?", "Are you of legal working age?"]) {
      expect(CareerOS.Answers.standardAnswer(q, {})?.key).toBe("over18");
    }
  });

  it("answers Ashby-style Yes/No buttons, styled radios and consent boxes; never gives the resume to a cover letter upload", async () => {
    const { doc, CareerOS } = page(
      `<div class="ashby-application-form-container">
        <div class="ashby-application-form-field-entry"><label>Have you ever worked for Acme? *</label>
          <div><button type="button">Yes</button><button type="button">No</button></div></div>
        <fieldset><legend>Are you 18 or older? *</legend>
          <label><input type="radio" name="age" value="yes" style="opacity:0" required> Yes</label>
          <label><input type="radio" name="age" value="no" style="opacity:0"> No</label></fieldset>
        <label><input type="checkbox" id="c" required> I acknowledge the Privacy Notice *</label>
        <label for="cv">Resume *</label><input type="file" id="cv" style="display:none" required>
        <label for="cl">Cover letter</label><input type="file" id="cl">
        <button class="ashby-application-form-submit-button">Submit Application</button></div>`,
      FILL_SCRIPTS,
      "https://jobs.ashbyhq.com/acme/1/application"
    );
    const clicked: string[] = [];
    doc.querySelectorAll("button[type=button]").forEach((b) => b.addEventListener("click", () => { clicked.push(b.textContent!); b.setAttribute("aria-pressed", "true"); }));
    const { ATS, Filler, Profile } = CareerOS;
    const form = ATS.findForm(ATS.detect(doc.location), doc);
    expect(form.className).toBe("ashby-application-form-container");
    await Filler.fillForm(form, Profile.hydrate(profile), context());
    expect(clicked).toEqual(["No"]);
    expect((doc.querySelector("input[value=yes]") as HTMLInputElement).checked).toBe(true);
    expect((doc.getElementById("c") as HTMLInputElement).checked).toBe(true);
    expect((doc.getElementById("cv") as HTMLInputElement).files![0].name).toBe("Ada_CV.pdf");
    expect((doc.getElementById("cl") as HTMLInputElement).files!.length).toBe(0);
    expect(Filler.missingRequired(form)).toEqual([]);
  });

  it("never overwrites an answer already on the page, and reports what only the person can answer", async () => {
    const { doc, CareerOS } = page(
      `<form><label for="fn">First name *</label><input id="fn" value="Augusta" required>
       <label for="q">Describe your favourite Lisp macro *</label><textarea id="q" required></textarea></form>`,
      FILL_SCRIPTS
    );
    const form = doc.querySelector("form")!;
    const report = await CareerOS.Filler.fillForm(form, CareerOS.Profile.hydrate(profile), context());
    expect((doc.getElementById("fn") as HTMLInputElement).value).toBe("Augusta");
    expect(report.skipped.map((s: { label: string }) => s.label)).toEqual(["Describe your favourite Lisp macro *"]);
    expect(CareerOS.Filler.missingRequired(form).map((f: { label: string }) => f.label)).toEqual(["Describe your favourite Lisp macro *"]);
    // The person answers; the read-only check sees it without touching the page.
    (doc.getElementById("q") as HTMLTextAreaElement).value = "defmacro with gensym";
    expect(CareerOS.Filler.missingRequired(form)).toEqual([]);
  });

  it("asks the AI for unknown dropdowns with the form's options", async () => {
    const { doc, CareerOS } = page(
      `<form><label for="t">Which testing framework do you use most? *</label>
       <select id="t" required><option value="">Select…</option><option>Selenium</option><option>Cypress</option></select></form>`,
      FILL_SCRIPTS
    );
    let asked: unknown = null;
    await CareerOS.Filler.fillForm(doc.querySelector("form"), CareerOS.Profile.hydrate(profile), context({
      answerQuestion: async (q: string, options: string[]) => { asked = options; return "Selenium"; },
    }));
    expect(asked).toEqual(["Selenium", "Cypress"]);
    expect((doc.getElementById("t") as HTMLSelectElement).value).toBe("Selenium");
  });
});

describe("storage", () => {
  it("serialises concurrent writes so results from several tabs aren't lost", async () => {
    const { CareerOS } = page("", ["lib/storage.js"]);
    await Promise.all(Array.from({ length: 10 }, (_, i) => CareerOS.Storage.logApplication({ url: `https://x.test/${i}`, status: "submitted" })));
    expect((await CareerOS.Storage.getApplications()).length).toBe(10);
  });

  it("recognises the same job across tracking links, devices, and only counts real submissions", async () => {
    const { CareerOS } = page("", ["lib/storage.js"]);
    const S = CareerOS.Storage;
    await S.logApplication({ url: "https://boards.greenhouse.io/acme/jobs/1?gh_src=abc", status: "submitted" });
    await S.logApplication({ url: "https://jobs.lever.co/acme/2", status: "filled" });
    await S.saveServerApplied(["https://jobs.ashbyhq.com/acme/3/?utm_source=x"]);
    expect(await S.alreadyApplied("https://boards.greenhouse.io/acme/jobs/1")).toBeTruthy();
    expect(await S.alreadyApplied("https://jobs.lever.co/acme/2")).toBeNull();
    expect(await S.alreadyApplied("https://jobs.ashbyhq.com/acme/3")).toBeTruthy();
    expect(await S.appliedToday()).toBe(1);
  });

  it("replaces the old localhost / placeholder server address with production", async () => {
    const { CareerOS, store } = page("", ["lib/storage.js"]);
    store["careeros.settings"] = { apiBase: "http://localhost:3000/api/extension", webAppUrl: "https://app.careeros.example" };
    const s = await CareerOS.Storage.getSettings();
    expect(s.apiBase).toBe("https://careeros.silverspringstaffing.com/api/extension");
    expect(s.webAppUrl).toBe("https://careeros.silverspringstaffing.com");
  });

  it("recalls an answer for a similarly worded question", async () => {
    const { CareerOS } = page("", ["lib/storage.js"]);
    await CareerOS.Storage.rememberAnswer("Which ticketing tools have you used day to day?", "Zendesk and Jira");
    expect(await CareerOS.Storage.recallAnswer("Which ticketing tools have you used day-to-day? *")).toBe("Zendesk and Jira");
    await CareerOS.Storage.rememberAnswer("eeo:veteran", "No");
    expect(await CareerOS.Storage.recallKey("eeo:veteran")).toBe("No");
    // Answers saved on the account (another browser) are used too; this profile's own answers win.
    await CareerOS.Storage.mergeServerAnswers([{ question: "Notice period?", answer: "30 days" }, { question: "Which ticketing tools have you used day to day?", answer: "Other" }]);
    expect(await CareerOS.Storage.recallAnswer("Notice period")).toBe("30 days");
    expect(await CareerOS.Storage.recallAnswer("Which ticketing tools have you used day to day?")).toBe("Zendesk and Jira");
  });
});

describe("field patterns", () => {
  it("recognise work authorization and sponsorship questions however they're phrased", () => {
    const { CareerOS } = page("", ["lib/profile.js", "lib/ats.js"]);
    const key = (label: string) => CareerOS.ATS.FIELD_PATTERNS.find((p: { re: RegExp }) => p.re.test(label.toLowerCase()))?.key;
    expect(key("Are you legally authorized to work in the United States?")).toBe("workAuth");
    expect(key("Are you authorised to work in the UK?")).toBe("workAuth");
    expect(key("Will you now or in the future require sponsorship for employment visa status?")).toBe("sponsorship");
    expect(key("Do you require visa sponsorship?")).toBe("sponsorship");
  });
});
