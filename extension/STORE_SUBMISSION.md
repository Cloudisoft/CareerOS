# Chrome Web Store submission

Upload **`careeros.zip`** from `./build.sh package`. Never zip the folder by
hand — that includes `manifest.dev.json`, which permits a model-provider host.

## What changed to make approval straightforward

The install prompt used to read *"Read and change your data on linkedin.com,
indeed.com and 32 other sites."* That is the single biggest reason an
auto-apply extension gets a hard review, and it costs installs before anyone
has seen the product.

Now the extension requests **two hosts at install** — its own backend. Every job
site is an optional permission, granted from a settings screen when the person
turns that group on. Content scripts register at runtime against whatever they
granted.

`tabs` was also removed. Every call the extension makes (`create`, `remove`,
`query` for the active tab id, `sendMessage`) works without it. `tabs` grants
read access to the URL and title of every open tab, which is the permission
reviewers scrutinise hardest here, and nothing was using what it granted.

## Dashboard fields

**Single purpose**
> CareerOS helps a job seeker apply to jobs faster. It reads a job posting, scores it against the profile in the user's CareerOS account, fills the application form with a resume tailored for that role, and records the outcome.

**Category:** Productivity · **Language:** English

## Permission justifications

| Permission | Justification |
|---|---|
| `storage` | Holds the user's profile, saved answers, settings and application history so forms can be filled and the same role is not applied to twice. |
| `unlimitedStorage` | The resume file is held as a data URL for attaching to forms. With saved answers and history this exceeds the 5MB default. |
| `activeTab` | When the user opens the popup on a posting, the extension reads that tab's title, company and description to score the role. |
| `scripting` | Job sites are optional permissions. Content scripts cannot be declared in the manifest for hosts granted at runtime, so they are registered with `chrome.scripting.registerContentScripts` after the user grants a site group. |
| `alarms` | Resumes an in-progress batch after Chrome suspends the service worker, and refreshes the badge count. Without it a long run stops silently. |
| `notifications` | Tells the user when a batch finishes, or stops because a site asked for a captcha or login only a person can complete. Runs happen in background tabs, so this is the only way to surface it. |

**Required host permissions**

> `https://*.careeros.example/*` and `http://localhost:3000/*` — the CareerOS backend. It holds the user's profile and generates the tailored resume for each role.

**Optional host permissions**

> Job sites and job search APIs. None are requested at install. The user grants a group from the extension's settings when they choose to use those sites, and can revoke it there. The extension has no access to any site the user has not enabled.

## Remote code

**No.** All logic ships in the package. Network requests return JSON only.

## Data usage

| Category | Collected | Why |
|---|---|---|
| Personally identifiable information | Yes | Name, email, phone and address, entered by the user and typed into application forms |
| Location | No | The user types a city as text; no geolocation API |
| Web history | No | |
| User activity | No | No click, mouse or keystroke monitoring |
| Website content | Yes | Job descriptions and form fields on sites the user enabled |
| Financial information | No | Salary expectation is a preference, not account data |
| Health information | No | |
| Authentication information | No | Site passwords are never read, stored or transmitted |
| Personal communications | No | |

All three certifications are true: not sold, not used for unrelated purposes,
not used for creditworthiness.

## Reviewer notes

Paste this. It answers what review would otherwise email about:

> CareerOS requires a CareerOS account. Test account: [email / password]
>
> To set up: sign in at [your URL], open Auto Apply, press "Pair this browser",
> and enter the six-character code in the extension's Account tab. Then enable
> at least one site group on the same tab — the extension has no site access
> until the user grants it.
>
> On LinkedIn, Indeed, ZipRecruiter, Dice and Glassdoor the extension fills
> forms but does not submit them, because those platforms prohibit automated
> interaction in their terms. Submission is automated only on employer-side
> applicant tracking systems, where the candidate applies directly to the
> employer. This is enforced in lib/policy.js and cannot be bypassed from the UI.
>
> The extension does not spoof browser fingerprints, solve captchas, rotate IP
> addresses, or disguise automated control. When a run meets a captcha or a
> login wall it stops and notifies the user.

The last paragraph matters. This category is read with suspicion by default, and
stating plainly what the extension does not do saves a rejection round.

## Before you upload

1. Set `DEFAULT_BASE` in `lib/careeros-api.js` to your real Career OS API URL (ends in /api/extension).
2. `./build.sh package`
3. Privacy policy live at a public HTTPS URL.
4. Screenshots at 1280×800: the Account tab showing pairing and site access, the
   popup on a posting with a match score, the run dashboard mid-run.
5. A demo video: pairing, granting a site group, one fill, one batch.

## What still gets extensions like this rejected

1. A boilerplate privacy policy. It must name what is collected.
2. Permissions that are not used. `tabs`, `scripting` (in the old build) and
   `api.anthropic.com` were all removed for this reason. Audit each time.
3. Automation the listing does not mention. Describe auto-apply plainly.
4. Anything resembling evasion. There is none here, so say so.
