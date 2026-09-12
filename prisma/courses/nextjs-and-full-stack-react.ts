import type { CourseSeed } from "../course-types";

export const course: CourseSeed = {
  slug: "nextjs-and-full-stack-react",
  title: "Next.js and Full-Stack React",
  description:
    "Why React alone isn't a full app, and how the App Router's routing, Server/Client Components, and data fetching fit together into one mental model.",
  category: "Web Development",
  level: "INTERMEDIATE",
  order: 14,
  lessons: [
    {
      title: "Why a Framework on Top of React",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Why a Framework on Top of React",
          subheading:
            "This course assumes you're comfortable with React itself. Next.js is one of several frameworks that answer the same question: what does React not solve on its own?",
        },
        {
          kind: "text",
          heading: "React renders components. That's it.",
          body: [
            "React's job is turning components into UI. It has no built-in opinion about how a URL maps to a screen, how data gets from a server to a component, or whether your page's HTML is generated ahead of time or on every request. Any real application needs answers to all three.",
            "You could wire these up yourself with a bundler, a router library, and a data-fetching library glued together by hand — plenty of apps did exactly that for years. A framework like Next.js bundles opinionated, well-tested answers to these problems so you're not re-solving them project by project.",
          ],
        },
        {
          kind: "bullets",
          heading: "The three problems a framework actually solves",
          bullets: [
            "Routing — mapping a URL like /jobs/42 to the right component, without you writing that mapping logic yourself.",
            "Rendering strategy — deciding whether a page's HTML is built at request time, ahead of time at build, or some hybrid, and shipping the right one automatically.",
            "Data fetching — getting data to the component that needs it, on the server where possible, without exposing database credentials or unnecessary API surface to the browser.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "\"Full-stack React\" is the point",
          body: "Plain React runs entirely in the browser — every component is client-side, and any data has to arrive via a separate API you build and call from the client. Next.js blurs that line: components can run on the server, read a database directly, and send only the resulting HTML and necessary data to the browser. That's the core shift this course covers, and it changes how you should think about where code actually runs.",
        },
        {
          kind: "text",
          heading: "What this course covers",
          body: [
            "Next.js has two routing systems historically — the older Pages Router and the newer App Router. This course covers the App Router, which is the current, actively developed approach and the one new projects should default to.",
          ],
        },
      ],
    },
    {
      title: "The App Router: File-Based Routing",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "The App Router: File-Based Routing",
          subheading:
            "Instead of configuring routes in code, the folder structure inside your `app` directory is the routing table.",
        },
        {
          kind: "bullets",
          heading: "The core convention",
          bullets: [
            "Each folder inside `app` maps to a URL segment. `app/jobs/page.tsx` becomes the page at `/jobs`.",
            "A folder needs a `page.tsx` file to actually be a visitable route — a folder with no `page.tsx` is just a path segment, useful for nesting layouts or organizing dynamic segments.",
            "Square brackets create dynamic segments: `app/jobs/[id]/page.tsx` matches `/jobs/42`, `/jobs/anything`, and makes `id` available as a parameter inside the page.",
            "A `layout.tsx` file wraps every page nested beneath it — shared navigation, sidebars, or providers go here instead of being repeated per page.",
          ],
        },
        {
          kind: "example",
          heading: "A dynamic route reading its URL parameter",
          body: "The framework passes route parameters into the page component as props — no manual URL parsing needed.",
          code: `// app/jobs/[id]/page.tsx
export default async function JobPage({ params }) {
  const { id } = await params;
  const job = await getJob(id);

  return <h1>{job.title}</h1>;
}
// Visiting /jobs/42 renders this with params.id === "42"`,
        },
        {
          kind: "bullets",
          heading: "A few special file names worth knowing",
          bullets: [
            "loading.tsx — shown automatically while a page's data is still loading, no manual loading state needed.",
            "error.tsx — catches errors thrown while rendering that route segment and shows a fallback instead of a blank crash.",
            "not-found.tsx — shown when a route (or a page that calls the `notFound()` function) can't find what it's looking for.",
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Think in nested layouts, not repeated headers",
          body: "A common mistake coming from a single-page-app background is copying the same navigation bar or wrapper into every page component. In the App Router, that belongs in a `layout.tsx` once, at the right level of nesting — every page under it inherits it automatically, and it doesn't re-render on navigation between pages that share it.",
        },
      ],
    },
    {
      title: "Server Components vs. Client Components",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Server Components vs. Client Components",
          subheading:
            "The single most important new concept in the App Router — and the one most likely to cause confusion coming from plain React.",
        },
        {
          kind: "text",
          heading: "The default has changed",
          body: [
            "In the App Router, every component is a Server Component by default. A Server Component runs only on the server — it can read a database, access secret environment variables, and read files directly, and none of that code is ever sent to the browser. Only the resulting HTML (and a compact description of the UI) reaches the client.",
            "This is a real reversal from plain React, where every component runs in the browser. Here, the browser is the exception you opt into, not the default.",
          ],
        },
        {
          kind: "bullets",
          heading: "When you need a Client Component",
          intro: "Add the \"use client\" directive at the top of a file when a component needs any of the following — these are things a Server Component genuinely cannot do:",
          bullets: [
            "React hooks that manage in-browser state or lifecycle: useState, useEffect, useReducer.",
            "Event handlers: onClick, onChange, onSubmit — anything that responds to the user doing something in the browser.",
            "Browser-only APIs: localStorage, window, geolocation, and similar.",
            "Third-party libraries that themselves rely on browser APIs or hooks.",
          ],
        },
        {
          kind: "example",
          heading: "Marking a component as client-side",
          body: "The directive goes at the very top of the file, before any imports. Everything that file exports is then a Client Component.",
          code: `"use client";

import { useState } from "react";

export function LikeButton() {
  const [liked, setLiked] = useState(false);
  return (
    <button onClick={() => setLiked(!liked)}>
      {liked ? "Liked" : "Like"}
    </button>
  );
}`,
        },
        {
          kind: "bullets",
          heading: "The practical rule of thumb",
          bullets: [
            "Default to a Server Component. Only add \"use client\" when the component actually needs interactivity, state, or a browser API.",
            "Push \"use client\" as far down the tree as you reasonably can — a small interactive button doesn't require making its entire parent page a Client Component too.",
            "A Server Component can render a Client Component as a child. A Client Component cannot import and directly render a Server Component the same way — but it can receive one as a prop (often written as `children`) that was rendered by its server-side parent.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "The common mistake: \"use client\" at the top of everything",
          body: "It's tempting to slap \"use client\" on a whole page the moment anything on it needs interactivity, especially early on. That silently opts a much larger chunk of your app out of server-side rendering, database access, and the bundle-size benefits that are the entire reason Server Components exist. Isolate the interactive part into its own small client component instead of converting the whole tree.",
        },
      ],
    },
    {
      title: "Data Fetching Patterns",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Data Fetching Patterns",
          subheading:
            "Because Server Components can run real server-side code, data fetching looks fundamentally different than it did with client-only React.",
        },
        {
          kind: "example",
          heading: "Fetching directly in a Server Component",
          body: "No useEffect, no loading state to manage by hand, no client-side request at all — the component itself is async, and the data is ready before any HTML reaches the browser.",
          code: `// app/jobs/page.tsx (a Server Component — no "use client")
export default async function JobsPage() {
  const jobs = await db.job.findMany({ where: { status: "open" } });

  return (
    <ul>
      {jobs.map((job) => (
        <li key={job.id}>{job.title}</li>
      ))}
    </ul>
  );
}`,
        },
        {
          kind: "bullets",
          heading: "Why this is a real shift, not just new syntax",
          bullets: [
            "No API endpoint is needed just to move data from a database to this page — the Server Component talks to the database directly.",
            "No loading spinner logic, no useEffect, no risk of a stale closure or a missing dependency — the data is simply awaited before render.",
            "The database credentials and query logic never reach the browser's JavaScript bundle at all, which is both a performance and a security improvement.",
          ],
        },
        {
          kind: "bullets",
          heading: "Fetching in parallel to avoid waterfalls",
          intro: "A common mistake is awaiting requests one after another when they don't actually depend on each other:",
          bullets: [
            "Sequential (slow): `const user = await getUser(); const jobs = await getJobs();` — the second request doesn't start until the first finishes, even though neither needs the other's result.",
            "Parallel (faster): `const [user, jobs] = await Promise.all([getUser(), getJobs()]);` — both requests fire at the same time.",
          ],
        },
        {
          kind: "text",
          heading: "What about Client Components that need data?",
          body: [
            "A Client Component can still fetch data itself — for things that only make sense after user interaction, like a search box's live results. The common pattern is for a Server Component to fetch the initial data and pass it down as a prop, and for a Client Component to handle any fetching that happens later, in response to something the user does.",
          ],
        },
      ],
    },
    {
      title: "API Routes and Route Handlers",
      durationMinutes: 5,
      slides: [
        {
          kind: "title",
          heading: "API Routes and Route Handlers",
          subheading:
            "If Server Components can fetch data directly, why would you still need an API endpoint? A few real reasons remain.",
        },
        {
          kind: "bullets",
          heading: "When you still need a route handler",
          bullets: [
            "Something outside your own app needs to call you — a webhook from a payment provider, a third-party integration, a mobile app hitting the same backend.",
            "A Client Component needs to trigger an action after the initial page has already loaded — submitting a form via a fetch call, for instance.",
            "You need to control the exact HTTP response — custom headers, a non-HTML content type, a specific status code.",
          ],
        },
        {
          kind: "example",
          heading: "A route handler, file-based like pages",
          body: "A `route.ts` file in the app directory exports a function named after the HTTP method it handles.",
          code: `// app/api/jobs/route.ts
export async function GET() {
  const jobs = await db.job.findMany({ where: { status: "open" } });
  return Response.json(jobs);
}

export async function POST(request) {
  const body = await request.json();
  const job = await db.job.create({ data: body });
  return Response.json(job, { status: 201 });
}`,
        },
        {
          kind: "example",
          heading: "Calling it from a Client Component",
          code: `"use client";

async function applyToJob(jobId) {
  const res = await fetch("/api/applications", {
    method: "POST",
    body: JSON.stringify({ jobId }),
  });
  if (!res.ok) throw new Error("Application failed");
}`,
        },
        {
          kind: "summary",
          heading: "Recap",
          bullets: [
            "Server Components handle the common case: rendering a page with data already fetched on the server, no separate endpoint required.",
            "Route handlers exist for cases that genuinely need an HTTP endpoint — external callers, post-load client actions, or custom responses.",
            "A route.ts file, named GET/POST/etc. functions, and file-based paths under app/api mirror the same routing convention as pages.",
          ],
        },
      ],
    },
    {
      title: "Rendering Strategies: Static, Dynamic, and In Between",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Rendering Strategies: Static, Dynamic, and In Between",
          subheading:
            "The last piece: when is a page's HTML actually generated? Next.js picks a sensible default per page, and you can override it.",
        },
        {
          kind: "bullets",
          heading: "The three strategies",
          bullets: [
            "Static rendering — HTML is generated once, at build time, and reused for every visitor. Fast and cacheable, right for content that's the same for everyone and doesn't change often (a marketing page, a blog post).",
            "Dynamic rendering — HTML is generated fresh on every request, on the server. Right for content that's personalized or must always be current (a logged-in dashboard, live pricing).",
            "Incremental Static Regeneration (ISR) — a middle ground: pages are served statically, but automatically regenerated in the background after a set interval, so content stays reasonably fresh without paying the cost of rendering on every single request.",
          ],
        },
        {
          kind: "text",
          heading: "How Next.js picks by default",
          body: [
            "Next.js infers the strategy from what a page actually does. A page that only reads static content and takes no dynamic input tends to render statically. The moment a page reads something request-specific — cookies, headers, search parameters used to change the query, or a fetch marked as uncached — it becomes dynamic for that request.",
          ],
        },
        {
          kind: "example",
          heading: "Opting into revalidation (ISR)",
          body: "Adding a revalidate option to a fetch tells Next.js to serve the cached page but refresh it in the background after the given number of seconds.",
          code: `async function getJobs() {
  const res = await fetch("https://api.example.com/jobs", {
    next: { revalidate: 60 }, // refresh at most once per minute
  });
  return res.json();
}`,
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Choosing a strategy is a judgment call, not a rule",
          body: "The question worth asking per page: how stale can this data be before it's actually wrong for the user? A product catalog can tolerate being a minute old (ISR). A checkout page cannot (dynamic). A terms-of-service page barely ever changes at all (static). Picking the loosest strategy the content can honestly tolerate is usually the right default — it's the cheapest to serve.",
        },
        {
          kind: "summary",
          heading: "Recap",
          bullets: [
            "Static rendering is fastest and cheapest, but only right for content that's the same for every visitor.",
            "Dynamic rendering handles personalized or must-be-current content, at the cost of rendering on every request.",
            "ISR serves cached pages while refreshing them periodically in the background — a practical middle ground for content that changes, but not on every request.",
          ],
        },
      ],
    },
  ],
};
