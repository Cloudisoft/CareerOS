import type { CourseSeed } from "../course-types";

export const course: CourseSeed = {
  slug: "nodejs-fundamentals",
  title: "Node.js Fundamentals",
  description:
    "What the Node.js runtime actually is, how its event loop makes single-threaded non-blocking I/O work, and how to build and package a basic server.",
  category: "Web Development",
  level: "INTERMEDIATE",
  order: 15,
  lessons: [
    {
      title: "What Node.js Actually Is",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "What Node.js Actually Is",
          subheading:
            "Node.js isn't a language, a framework, or a browser feature — it's a runtime that lets JavaScript execute outside the browser entirely.",
        },
        {
          kind: "text",
          heading: "A runtime, not a language",
          body: [
            "JavaScript itself was designed to run inside a browser, where the browser provides things like the DOM, `window`, and `fetch`. Node.js takes V8 — the same JavaScript engine Chrome uses to execute JavaScript — and pairs it with a completely different set of built-in capabilities suited to a server or command-line environment: reading and writing files, opening network connections, spawning processes.",
            "The language you write is still JavaScript. What's different is what's available to call, and where the code actually runs — on a machine you control, not inside a user's browser tab.",
          ],
        },
        {
          kind: "bullets",
          heading: "What that unlocks",
          bullets: [
            "Full filesystem access — reading, writing, and watching files, which a browser deliberately restricts for security.",
            "Direct network servers — Node can listen on a port and respond to raw HTTP or TCP traffic itself, rather than only making requests like a browser does.",
            "The same language on both ends of an app — a team can share validation logic, types, or utility code between a React frontend and a Node backend.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Why \"non-blocking\" was the original pitch",
          body: "Node was built around a specific bet: that for a huge share of real server workloads — waiting on a database, a file, or a network call — a server spends most of its time waiting, not computing. Traditional server models often handled this by spinning up a new thread per connection, which gets expensive at scale. Node instead uses a single main thread that never sits idle waiting on I/O — it starts the operation, moves on, and comes back when the result is ready. The next lesson covers exactly how that works.",
        },
        {
          kind: "summary",
          heading: "Recap",
          bullets: [
            "Node.js is a runtime — V8 plus a set of APIs for filesystem, networking, and system-level work — not a new language or a framework.",
            "It lets JavaScript run outside a browser, on a server or as a command-line tool.",
            "Its core design bet is that non-blocking I/O handles typical server workloads (mostly waiting, not computing) more efficiently than a thread-per-connection model.",
          ],
        },
      ],
    },
    {
      title: "The Event Loop and Non-Blocking I/O",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "The Event Loop and Non-Blocking I/O",
          subheading:
            "\"Single-threaded but handles thousands of concurrent connections\" sounds contradictory until you see how the event loop actually works.",
        },
        {
          kind: "text",
          heading: "Single-threaded, for your code",
          body: [
            "Your JavaScript — the functions you write — runs on a single main thread, one line at a time, just like JavaScript in a browser tab. Two of your functions never run at the exact same instant on that thread.",
            "What makes Node handle concurrency well isn't parallel execution of your code — it's that slow operations (reading a file, querying a database, making a network request) are handed off to the system or a background thread pool, freeing the main thread to keep handling other work while it waits.",
          ],
        },
        {
          kind: "example",
          heading: "Blocking vs. non-blocking, made concrete",
          body: "The synchronous version freezes the entire process for every other request until the file read finishes. The asynchronous version keeps the main thread free to handle other work while the read happens in the background.",
          code: `// Blocking: nothing else Node is doing can proceed until this returns
const data = fs.readFileSync("large-file.txt");
console.log(data);

// Non-blocking: the main thread moves on immediately,
// and this callback runs later, once the read completes
fs.readFile("large-file.txt", (err, data) => {
  console.log(data);
});
console.log("This logs before the file finishes reading");`,
        },
        {
          kind: "bullets",
          heading: "The event loop, at a practical level",
          bullets: [
            "Your code runs until it either finishes or hands off an operation (a timer, a file read, a network call) to be completed elsewhere.",
            "The main thread is then free — it picks up other pending work, including other requests that came in.",
            "When a handed-off operation completes, its callback (or the resolution of its promise) gets queued to run on the main thread.",
            "The event loop is the mechanism that keeps checking: is there completed work waiting to run? If so, run it next, in order.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "CPU-heavy work still blocks everything",
          body: "Non-blocking I/O only helps with waiting — it does nothing for a genuinely long computation running on the main thread, like sorting a huge array or hashing something expensive synchronously. That kind of work still blocks the single thread completely, and every other request stalls behind it, exactly like the synchronous file read above. Real CPU-bound work belongs in a worker thread or a separate process, not on the main thread of a server handling requests.",
        },
        {
          kind: "summary",
          heading: "Recap",
          bullets: [
            "Your JavaScript runs on one thread, one operation at a time — Node doesn't parallelize your code itself.",
            "Slow I/O is handed off elsewhere, freeing the main thread to handle other work in the meantime.",
            "This model is efficient for I/O-bound work (waiting) and a poor fit for CPU-bound work (heavy computation), which blocks the single thread regardless.",
          ],
        },
      ],
    },
    {
      title: "Modules: CommonJS and ESM",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Modules: CommonJS and ESM",
          subheading:
            "Node has two module systems in active use, and knowing which one a given file is using — and why it sometimes matters — avoids a lot of confusing errors.",
        },
        {
          kind: "example",
          heading: "CommonJS: Node's original system",
          body: "require() and module.exports load and expose modules synchronously. This was Node's only module system for most of its history, and huge amounts of existing code and packages still use it.",
          code: `// math.js
function add(a, b) {
  return a + b;
}
module.exports = { add };

// app.js
const { add } = require("./math");
console.log(add(2, 3));`,
        },
        {
          kind: "example",
          heading: "ESM: the JavaScript standard, now supported natively",
          body: "import and export are the module syntax defined by the JavaScript language itself (also used in the browser and in frontend frameworks) — Node added native support for it after CommonJS was already established.",
          code: `// math.mjs
export function add(a, b) {
  return a + b;
}

// app.mjs
import { add } from "./math.mjs";
console.log(add(2, 3));`,
        },
        {
          kind: "bullets",
          heading: "How Node decides which one a file is using",
          bullets: [
            "A .mjs file extension is always treated as ESM; a .cjs file is always treated as CommonJS, regardless of anything else.",
            "For plain .js files, Node checks the nearest package.json for a \"type\" field: \"type\": \"module\" means .js files are treated as ESM in that project; omitting it (or \"type\": \"commonjs\") means CommonJS.",
            "Mixing the two in one project is common in practice (many packages still ship CommonJS), but mixing require() and import in the same file is not allowed — pick one per file, matching what that file's module system actually is.",
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Why this matters practically, not just academically",
          body: "The most common real symptom of a module-system mismatch is an error like \"require is not defined in ES module scope\" or \"Cannot use import statement outside a module\" — usually caused by a package.json's \"type\" field not matching the syntax actually used in a file, or a dependency shipping only one module format when your project expects the other. Recognizing this class of error immediately, instead of treating it as mysterious, saves real debugging time.",
        },
        {
          kind: "summary",
          heading: "Recap",
          bullets: [
            "CommonJS (require/module.exports) is Node's original, still-widespread module system.",
            "ESM (import/export) is the JavaScript language standard, now natively supported by Node.",
            "File extension and package.json's \"type\" field determine which system a given file is treated as — and the two can't be mixed within a single file.",
          ],
        },
      ],
    },
    {
      title: "Building a Basic HTTP Server",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Building a Basic HTTP Server",
          subheading:
            "Before reaching for a framework like Express, it's worth seeing what Node gives you for free — a real HTTP server, with no dependencies at all.",
        },
        {
          kind: "example",
          heading: "The built-in http module",
          body: "createServer takes a function that runs for every incoming request. This is a genuine, working HTTP server — no framework required.",
          code: `const http = require("http");

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Hello from Node" }));
});

server.listen(3000, () => {
  console.log("Listening on port 3000");
});`,
        },
        {
          kind: "example",
          heading: "A minimal router by hand",
          body: "Without a framework, routing is just checking req.url and req.method yourself — this is exactly the repetitive work that frameworks like Express exist to remove.",
          code: `const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200);
    res.end("ok");
    return;
  }

  if (req.method === "GET" && req.url.startsWith("/users/")) {
    const id = req.url.split("/")[2];
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ id }));
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});`,
        },
        {
          kind: "bullets",
          heading: "Why almost nobody ships raw http in production",
          bullets: [
            "Route matching, especially with URL parameters and query strings, gets unwieldy fast by hand.",
            "Parsing a JSON request body requires manually collecting data chunks from the request stream yourself — the raw module doesn't do it for you.",
            "Middleware patterns (authentication, logging, error handling applied consistently across routes) have to be built from scratch.",
            "This is exactly what frameworks like Express or Fastify provide — they're built on top of this same http module, not a replacement for it.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Why it's still worth knowing the raw version",
          body: "Every framework you'll use is a layer on top of exactly this module — understanding what createServer, req, and res actually are makes framework behavior (and framework bugs) far less mysterious, because you can reason about what's happening underneath the abstraction instead of treating it as a black box.",
        },
      ],
    },
    {
      title: "npm and package.json",
      durationMinutes: 5,
      slides: [
        {
          kind: "title",
          heading: "npm and package.json",
          subheading:
            "package.json is the one file that describes what a Node project is, what it depends on, and how to run it.",
        },
        {
          kind: "example",
          heading: "A typical package.json",
          code: `{
  "name": "my-api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js",
    "test": "node --test"
  },
  "dependencies": {
    "express": "^4.19.2"
  },
  "devDependencies": {
    "typescript": "^5.5.0"
  }
}`,
        },
        {
          kind: "bullets",
          heading: "The fields that matter day to day",
          bullets: [
            "dependencies — packages the running application actually needs.",
            "devDependencies — tools only needed while developing (test runners, linters, type checkers), not shipped or needed in production.",
            "scripts — named shortcuts run with `npm run <name>` (start and test have short aliases: `npm start`, `npm test`).",
            "The caret (^) in a version like \"^4.19.2\" allows automatic updates to newer minor and patch versions, but not a new major version — the convention most packages use to signal breaking changes only happen at a major bump.",
          ],
        },
        {
          kind: "text",
          heading: "package-lock.json, and why it's committed",
          body: [
            "package.json specifies acceptable version ranges, not exact versions. package-lock.json records the exact resolved version of every dependency (and every dependency's dependencies) actually installed. Committing the lock file means every teammate, and every CI run, installs the identical dependency tree — without it, \"it works on my machine\" becomes a real and common problem, since two installs done days apart could quietly resolve different versions.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "node_modules doesn't belong in version control",
          body: "node_modules is regenerated from package.json and package-lock.json by running `npm install` — it's large, machine-specific in places, and entirely reproducible. It should be in .gitignore, not committed. If a project is missing that entry and node_modules gets committed by accident, it bloats the repository significantly and causes painful merge conflicts on a file nobody should be hand-editing.",
        },
        {
          kind: "summary",
          heading: "Recap",
          bullets: [
            "package.json declares a project's dependencies, scripts, and metadata.",
            "dependencies ship with the app; devDependencies are for development and testing only.",
            "package-lock.json pins exact versions so installs are reproducible across machines — commit it.",
          ],
        },
      ],
    },
    {
      title: "Asynchronous Patterns in a Server Context",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Asynchronous Patterns in a Server Context",
          subheading:
            "Node's whole design leans on async code — and in a server handling many requests, how you write async code has real consequences beyond style.",
        },
        {
          kind: "example",
          heading: "From callbacks to promises to async/await",
          body: "These three examples do the same thing. Each style solved a real problem with the one before it.",
          code: `// Callbacks — the original style, prone to deep nesting ("callback hell")
fs.readFile("a.txt", (err, data) => {
  if (err) return handleError(err);
  process(data, (err, result) => {
    if (err) return handleError(err);
    console.log(result);
  });
});

// Promises — flatten nesting, chain with .then()
readFilePromise("a.txt")
  .then((data) => process(data))
  .then((result) => console.log(result))
  .catch(handleError);

// async/await — reads like synchronous code, same underlying promises
async function run() {
  try {
    const data = await readFilePromise("a.txt");
    const result = await process(data);
    console.log(result);
  } catch (err) {
    handleError(err);
  }
}`,
        },
        {
          kind: "bullets",
          heading: "Error handling is not optional in a server",
          bullets: [
            "An unhandled rejected promise or a thrown error inside an async route handler can, depending on your framework and Node version, crash the entire process — taking down every other in-flight request, not just the one that failed.",
            "Always wrap awaited calls that can fail in try/catch inside request handlers, or use a framework's built-in mechanism for catching async route errors.",
            "A single unguarded await on a flaky network call is a common, real cause of a whole server going down over one bad request.",
          ],
        },
        {
          kind: "example",
          heading: "Running independent async work concurrently",
          body: "Just like on the frontend, awaiting requests one at a time when they don't depend on each other wastes time a server doesn't need to spend.",
          code: `// Slower: each await waits for the previous one to finish first
const user = await getUser(id);
const orders = await getOrders(id);

// Faster: both run at the same time
const [user, orders] = await Promise.all([getUser(id), getOrders(id)]);`,
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Why this matters more on a server than in a script",
          body: "A one-off script that blocks or crashes only affects itself. A server process handling many concurrent requests is shared — a bug in handling one request (an unguarded rejection, an accidental synchronous block) can degrade or take down every other request currently in flight. Async correctness in Node is a reliability concern for the whole process, not just a style preference for the one function you're writing.",
        },
        {
          kind: "summary",
          heading: "Recap",
          bullets: [
            "async/await is the standard modern style — same underlying promises, more readable control flow.",
            "Every await that can fail needs real error handling in a server context — an unhandled failure can affect every other in-flight request.",
            "Use Promise.all for independent async operations so they run concurrently instead of needlessly one after another.",
          ],
        },
      ],
    },
  ],
};
