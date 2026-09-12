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
    {
      title: "Server Actions: Mutations Without an API Route",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Server Actions: Mutations Without an API Route",
          subheading:
            "Route handlers cover the case where you genuinely need an HTTP endpoint. For a form on your own page that just needs to write data, Server Actions skip that layer entirely.",
        },
        {
          kind: "text",
          heading: "What a Server Action actually is",
          body: [
            "A Server Action is a regular async function marked with the \"use server\" directive that Next.js turns into a callable server-side operation — you can pass it directly as a form's action, or call it from a Client Component like a normal function. Under the hood, Next.js still makes a network request to run it on the server, but you never write the route handler, the fetch call, or the JSON parsing yourself.",
            "This closes a real gap left by the earlier data-fetching lesson: Server Components make reading data trivial (just await it), but they can't handle a form submission — that requires a Client Component or an action, and Server Actions are the framework's answer for the write side of that same trivial-by-default goal.",
          ],
        },
        {
          kind: "example",
          heading: "A Server Action wired directly to a form",
          body: "No onSubmit, no client-side fetch, no JSON.stringify — the form's action prop takes the function directly, and it runs on the server when submitted.",
          code: `// app/jobs/actions.ts
"use server";

export async function createJob(formData: FormData) {
  const title = formData.get("title") as string;
  await db.job.create({ data: { title, status: "open" } });
}

// app/jobs/new/page.tsx (a Server Component)
import { createJob } from "../actions";

export default function NewJobPage() {
  return (
    <form action={createJob}>
      <input name="title" placeholder="Job title" />
      <button type="submit">Create</button>
    </form>
  );
}`,
        },
        {
          kind: "example",
          heading: "Revalidating after a write",
          body: "A mutation that changes data doesn't automatically update pages that already cached the old version. revalidatePath tells Next.js to treat a specific route's cached data as stale and regenerate it on the next request.",
          code: `"use server";

import { revalidatePath } from "next/cache";

export async function createJob(formData: FormData) {
  const title = formData.get("title") as string;
  await db.job.create({ data: { title, status: "open" } });
  revalidatePath("/jobs"); // the jobs list page will show the new job on next visit
}`,
        },
        {
          kind: "bullets",
          heading: "Where a Server Action fits versus a route handler",
          bullets: [
            "Server Action: a mutation triggered from your own app's UI — a form submit, a button click that saves something. No separate endpoint needed, and it composes naturally with revalidatePath/revalidateTag.",
            "Route handler: something outside your app needs to call this (a webhook, a mobile client, a public API), or you need to control the raw HTTP response.",
            "Both ultimately run server-side code in response to a request — the difference is who's calling it and how directly it's tied to your own UI.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "A Server Action is still a public entry point",
          body: "Because a Server Action can be called directly (not just through the form it was attached to), it needs the same authentication and authorization checks you'd put in a route handler — Next.js does not implicitly restrict who can invoke it just because it's defined next to a particular page. Treat every Server Action as reachable by anyone, and check permissions inside it, not just in the UI that happens to render the form.",
        },
        {
          kind: "summary",
          heading: "Recap",
          bullets: [
            "\"use server\" turns an async function into a callable server-side mutation — usable directly as a form's action or called from client code.",
            "revalidatePath/revalidateTag tell Next.js which cached data is now stale after a write, so subsequent renders reflect the change.",
            "Server Actions handle mutations from your own UI without a route handler; route handlers remain for external callers or when you need raw control over the HTTP response.",
            "A Server Action is a real, directly callable server endpoint — it needs its own authorization checks, not just a form that happens to be gated in the UI.",
          ],
        },
      ],
    },
    {
      title: "Practice: Choosing the Right Piece of the App Router",
      durationMinutes: 13,
      slides: [
        {
          kind: "title",
          heading: "Practice: Choosing the Right Piece of the App Router",
          subheading:
            "Given a scenario, decide: Server or Client Component, which data-fetching approach, and which rendering strategy. Then check your reasoning against a worked answer.",
        },
        {
          kind: "practice",
          heading: "1. A product page with a live 'add to cart' button",
          prompt:
            "You're building `app/products/[id]/page.tsx`. It needs to: read the product from the database and show its details, and include an \"Add to cart\" button that updates a client-side cart count without a full page reload. As currently written below, the whole file has \"use client\" at the top because of the button. Restructure it so only the interactive part is a Client Component, and describe what rendering strategy fits this page.\n\n```jsx\n\"use client\";\n\nexport default function ProductPage({ params }) {\n  const [product, setProduct] = useState(null);\n\n  useEffect(() => {\n    fetch(`/api/products/${params.id}`).then(r => r.json()).then(setProduct);\n  }, [params.id]);\n\n  if (!product) return <p>Loading...</p>;\n\n  return (\n    <div>\n      <h1>{product.name}</h1>\n      <p>{product.description}</p>\n      <AddToCartButton productId={product.id} />\n    </div>\n  );\n}\n```",
          hint:
            "The page itself doesn't need any hooks or event handlers — only AddToCartButton does. What would the page look like as an async Server Component that fetches directly from the database, with the button pulled into its own client file?",
          solution:
            "Make the page a Server Component that reads the product directly from the database (no fetch, no loading state, no client JS shipped for the parts that don't need it), and isolate only the button — the actually-interactive part — into its own Client Component.\n\n```jsx\n// app/products/[id]/page.tsx (Server Component — no \"use client\")\nimport { AddToCartButton } from \"./add-to-cart-button\";\n\nexport default async function ProductPage({ params }) {\n  const { id } = await params;\n  const product = await db.product.findUnique({ where: { id } });\n\n  return (\n    <div>\n      <h1>{product.name}</h1>\n      <p>{product.description}</p>\n      <AddToCartButton productId={product.id} />\n    </div>\n  );\n}\n\n// app/products/[id]/add-to-cart-button.tsx\n\"use client\";\n\nexport function AddToCartButton({ productId }) {\n  const [added, setAdded] = useState(false);\n  return (\n    <button onClick={() => setAdded(true)}>\n      {added ? \"Added\" : \"Add to cart\"}\n    </button>\n  );\n}\n```\nRendering strategy: product detail pages like this are a textbook case for ISR — the description and name rarely change minute to minute, but they're not truly static forever (price or stock could update). Fetching the product with a revalidate window (e.g. `next: { revalidate: 300 }`) gets nearly static-page speed while keeping the page from serving month-old data indefinitely.\nKey decision: pushing \"use client\" down to just the button means the product's name and description are rendered on the server with zero client JS for that part, and the page never needs a loading spinner for its main content.",
        },
        {
          kind: "practice",
          heading: "2. A comment form that needs to save and refresh the list",
          prompt:
            "A blog post page shows existing comments and a form to add a new one. Currently the form posts to a route handler via fetch, then manually calls `router.refresh()`. Rewrite the mutation using a Server Action instead, including making sure the comment list actually reflects the new comment without a manual refresh call.\n\n```jsx\n// app/api/comments/route.ts\nexport async function POST(request) {\n  const { postId, body } = await request.json();\n  await db.comment.create({ data: { postId, body } });\n  return Response.json({ ok: true });\n}\n\n// CommentForm.tsx\n\"use client\";\nexport function CommentForm({ postId }) {\n  const router = useRouter();\n  async function handleSubmit(e) {\n    e.preventDefault();\n    const body = new FormData(e.target).get(\"body\");\n    await fetch(\"/api/comments\", { method: \"POST\", body: JSON.stringify({ postId, body }) });\n    router.refresh();\n  }\n  return (\n    <form onSubmit={handleSubmit}>\n      <textarea name=\"body\" />\n      <button type=\"submit\">Post</button>\n    </form>\n  );\n}\n```",
          hint:
            "A Server Action can be the form's action directly, removing the need for onSubmit, fetch, and the route handler. What replaces the manual router.refresh() call so the comment list updates automatically?",
          solution:
            "Move the mutation into a Server Action and call revalidatePath for the post's page — that's what makes the comment list reflect the new comment, replacing the manual `router.refresh()`.\n\n```jsx\n// app/posts/[id]/actions.ts\n\"use server\";\nimport { revalidatePath } from \"next/cache\";\n\nexport async function addComment(postId: string, formData: FormData) {\n  const body = formData.get(\"body\") as string;\n  await db.comment.create({ data: { postId, body } });\n  revalidatePath(`/posts/${postId}`);\n}\n\n// CommentForm.tsx — still a Client Component (it needs to bind postId)\n\"use client\";\nimport { addComment } from \"./actions\";\n\nexport function CommentForm({ postId }) {\n  const addCommentForPost = addComment.bind(null, postId);\n  return (\n    <form action={addCommentForPost}>\n      <textarea name=\"body\" />\n      <button type=\"submit\">Post</button>\n    </form>\n  );\n}\n```\nKey decision: `.bind(null, postId)` supplies the postId argument ahead of time so the form only needs to submit the textarea's value — a common pattern for passing extra context into a Server Action beyond what the form fields themselves carry. The route handler and manual fetch/refresh are gone entirely; the Server Action and revalidatePath replace both.",
        },
        {
          kind: "summary",
          heading: "What a correct solution demonstrates",
          bullets: [
            "Defaulting to a Server Component and isolating only the genuinely interactive piece into a Client Component, rather than converting a whole page.",
            "Matching a rendering strategy to how stale the content can honestly tolerate being, instead of defaulting to fully dynamic out of caution.",
            "Replacing a route handler + manual refresh with a Server Action + revalidatePath for a mutation that's really just \"this page's own form,\" and remembering that a Server Action still needs its own checks — it isn't automatically as protected as the UI around it.",
          ],
        },
      ],
    },
    {
      title: "Knowledge Check",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Knowledge Check",
          subheading:
            "Five questions across the whole course — testing whether the App Router's mental model actually stuck, not lesson-by-lesson recall.",
        },
        {
          kind: "quiz",
          heading: "What a framework adds on top of React",
          question:
            "Which of the following is NOT one of the core problems a framework like Next.js solves on top of plain React?",
          options: [
            "Mapping a URL to the right component to render.",
            "Deciding whether a page's HTML is generated at build time, at request time, or somewhere in between.",
            "Compiling JSX into function calls before the browser runs the code.",
            "Getting data to a component without necessarily exposing an API endpoint or database credentials to the browser.",
          ],
          correctIndex: 2,
          explanation:
            "JSX compilation is a build-tool concern (Babel or the compiler bundled into whatever tool you're using) that exists independent of any framework — plain React with a bundler already needs it. Routing, rendering strategy, and server-side data access are the three problems this course identified as what a framework specifically adds on top of React itself.",
        },
        {
          kind: "quiz",
          heading: "Server vs. Client Components",
          question:
            "A component needs to call useState to track whether a dropdown is open. What does it need, and what's the actual consequence of adding it?",
          options: [
            "It needs \"use client\" at the top of its file — that component (and everything else exported from that file) now runs in the browser instead of the server.",
            "Nothing — useState works the same in Server and Client Components since both are just React components.",
            "It needs \"use client\", but only that single component's file stops being a Server Component; every component that imports and renders it also automatically becomes a Client Component.",
            "It needs to be moved into a route handler, since only route handlers can hold interactive state in the App Router.",
          ],
          correctIndex: 0,
          explanation:
            "useState requires \"use client\" — Server Components can't hold browser-side state or lifecycle at all. Adding it opts that file's exports into running in the browser, but it does not force every parent that renders it to also become a Client Component — a Server Component can still render a Client Component as a child; the boundary only pushes one direction (a Client Component can't render a Server Component the same way in reverse).",
        },
        {
          kind: "quiz",
          heading: "Choosing a rendering strategy",
          question:
            "A logged-in account settings page shows the current user's own data and needs to always be current for that specific user. Which rendering strategy fits, and why?",
          options: [
            "Static rendering, since account settings pages rarely change in structure.",
            "ISR with a long revalidation window, since account data doesn't change every second.",
            "Dynamic rendering, since the content is personalized per request and must reflect the current user, not a cached shared version.",
            "It doesn't matter — Next.js always renders every page dynamically by default regardless of what it reads.",
          ],
          correctIndex: 2,
          explanation:
            "Static and ISR both serve a cached version of a page to multiple visitors — appropriate when the content is the same for everyone (or can tolerate being briefly stale). A page reading data specific to the current logged-in user needs to render fresh per request, which is exactly what dynamic rendering is for. Next.js infers this automatically once a page reads something request-specific, like cookies or a session.",
        },
        {
          kind: "quiz",
          heading: "Server Actions and authorization",
          question:
            "A Server Action deletes a job posting and is only rendered behind a \"Delete\" button that's hidden in the UI unless the current user owns that job. Is this sufficient protection?",
          options: [
            "Yes — since the button is only rendered for the owner, the action can never be triggered by anyone else.",
            "No — a Server Action is a real, directly callable server endpoint regardless of which UI renders it, so it needs its own ownership check inside the action itself.",
            "Yes, but only if the action is defined in the same file as the page that renders the button.",
            "No — Server Actions can only be secured by moving the logic into a route handler instead.",
          ],
          correctIndex: 1,
          explanation:
            "Hiding a button doesn't prevent someone from invoking the underlying Server Action directly — it's a callable server endpoint, not a UI-gated function. The action itself needs to verify the current user actually owns the job before deleting it, the same way a route handler would need to check authorization rather than trusting that only \"authorized\" UI calls it.",
        },
        {
          kind: "quiz",
          heading: "Data fetching and waterfalls",
          question:
            "A Server Component needs both a user's profile and their recent orders, and neither depends on the other's result. What's the better approach, and why?",
          options: [
            "Awaiting getUser() and then getOrders() sequentially, since Server Components must fetch data one call at a time.",
            "Using Promise.all to fetch both concurrently, since sequential awaits on independent requests waste time neither request actually needs to spend waiting.",
            "Fetching getOrders() inside a useEffect after the page has rendered with just the user.",
            "It doesn't matter, since Server Component data fetching always happens in parallel automatically regardless of how it's written.",
          ],
          correctIndex: 1,
          explanation:
            "Sequential awaits on requests that don't depend on each other create an avoidable waterfall — the second request doesn't start until the first resolves, even though it could have started immediately. Promise.all runs independent requests concurrently. Server Components don't parallelize this for you automatically just by virtue of being async — you still write Promise.all yourself when requests are independent, and Server Components can't use useEffect at all (that requires a Client Component).",
        },
        {
          kind: "summary",
          heading: "Course takeaways",
          bullets: [
            "A framework adds routing, a rendering strategy, and server-side data access on top of what plain React provides on its own.",
            "Server Components are the default; \"use client\" is an opt-in for state, effects, event handlers, or browser APIs, pushed as far down the tree as possible.",
            "Fetch directly in Server Components, run independent requests with Promise.all, and reach for a route handler only when something outside your own UI needs to call you.",
            "Server Actions handle mutations from your own app's forms without a separate endpoint, paired with revalidatePath/revalidateTag to keep cached data in sync — but they're real endpoints and need their own authorization checks.",
            "Pick the loosest rendering strategy (static, then ISR, then dynamic) that the content can honestly tolerate — it's the cheapest one to serve.",
          ],
        },
      ],
    },
  ],
};
