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
          kind: "example",
          heading: "Something only possible outside a browser",
          body: "Reading an arbitrary file from disk directly — no such capability exists in browser JavaScript at all, sandboxed deliberately for security. It's a small, concrete illustration of \"different capabilities, same language.\"",
          code: `const fs = require("fs");

const contents = fs.readFileSync("config.json", "utf8");
console.log(JSON.parse(contents));
// A browser tab has no equivalent — it can't reach an arbitrary file on the
// visitor's disk, and for good reason.`,
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
          kind: "bullets",
          heading: "Node isn't the only JavaScript runtime outside a browser",
          bullets: [
            "Deno, from one of Node's original creators, ships TypeScript support and stricter security (no filesystem or network access by default) built in, aiming to fix some of Node's early design decisions.",
            "Bun focuses heavily on raw startup and execution speed, and bundles a bundler and test runner into the runtime itself rather than treating them as separate tools.",
            "Node remains the overwhelming default in production because of its maturity and its ecosystem — the same reason an established language rarely gets displaced purely on technical merits alone.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Why \"non-blocking\" was the original pitch",
          body: "Node was built around a specific bet: that for a huge share of real server workloads — waiting on a database, a file, or a network call — a server spends most of its time waiting, not computing. Traditional server models often handled this by spinning up a new thread per connection, which gets expensive at scale. Node instead uses a single main thread that never sits idle waiting on I/O — it starts the operation, moves on, and comes back when the result is ready. The next lesson covers exactly how that works.",
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "global instead of window",
          body: "A value that would live on `window` in a browser lives on `global` in Node — but reaching for it directly is rare in practice; well-written Node code deals in modules and explicit imports rather than implicit globals. The one Node global you'll actually see constantly is `process` — access to environment variables, command-line arguments, and the running process itself.",
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Why the npm ecosystem matters here",
          body: "Node ships with a deliberately small standard library. Most day-to-day capability — web frameworks, database clients, testing tools — comes from npm packages layered on top, covered in a later lesson. This is a real design trade: a lean core plus an enormous package ecosystem filling in the rest, rather than a large batteries-included standard library the way some other languages ship by default.",
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
          kind: "example",
          heading: "Microtasks run before the next macrotask, every time",
          body: "Promise callbacks (microtasks) are drained completely before Node moves on to the next timer or I/O callback (a macrotask) — which is why this logs in an order that looks surprising at first glance.",
          code: `console.log("1: sync");

setTimeout(() => console.log("4: setTimeout"), 0);

Promise.resolve().then(() => console.log("3: promise"));

console.log("2: sync");

// Actual output:
// 1: sync
// 2: sync
// 3: promise      <- microtask, runs before any macrotask, even a 0ms timer
// 4: setTimeout    <- macrotask, runs only after all pending microtasks drain`,
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
          kind: "diagram",
          heading: "One trip through the event loop",
          description: "What happens to a single async operation, like a file read, from start to its callback running.",
          steps: [
            { label: "Code runs synchronously", detail: "Executes until it returns or hands off an operation" },
            { label: "I/O operation handed off", detail: "e.g. fs.readFile — given to the OS / background thread pool" },
            { label: "Main thread stays free", detail: "Picks up other pending work — other requests, timers, callbacks" },
            { label: "Operation completes", detail: "Its callback is queued, ready to run" },
            { label: "Event loop runs the callback", detail: "Runs on the main thread, in order, once it's next up" },
          ],
        },
        {
          kind: "text",
          heading: "libuv: the engine underneath the event loop",
          body: [
            "The event loop itself isn't implemented in JavaScript — it's provided by libuv, a C library Node is built on top of, which is also what actually hands I/O operations off to the operating system or a background thread pool in the first place. You don't interact with libuv directly, but it's worth knowing the event loop is a real, separate piece of engineering underneath the JavaScript you write, not just a metaphor for \"async stuff happens later.\"",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "CPU-heavy work still blocks everything",
          body: "Non-blocking I/O only helps with waiting — it does nothing for a genuinely long computation running on the main thread, like sorting a huge array or hashing something expensive synchronously. That kind of work still blocks the single thread completely, and every other request stalls behind it, exactly like the synchronous file read above. Real CPU-bound work belongs in a worker thread or a separate process, not on the main thread of a server handling requests.",
        },
        {
          kind: "bullets",
          heading: "A timer's delay is a minimum, not a guarantee",
          bullets: [
            "setTimeout(fn, 1000) schedules fn to run no sooner than 1 second from now, not exactly at 1 second. If the main thread is busy with other work when that time arrives, the timer's callback waits until the thread is actually free.",
            "This is a direct consequence of the single-threaded model: the event loop can't interrupt currently running code to fire a timer early, so a busy thread delays every pending timer equally.",
            "process.nextTick (a Node-specific addition, not part of the general microtask queue) runs even before other microtasks like resolved promises — worth knowing the name so it doesn't seem mysterious in library code, though direct use in typical application code is uncommon.",
          ],
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
          kind: "bullets",
          heading: "Interop between the two isn't fully symmetric",
          bullets: [
            "ESM importing CommonJS mostly just works — Node wraps a CommonJS module's module.exports as the default export automatically.",
            "CommonJS requiring ESM does not work the same way — require() is synchronous, and loading an ES module is inherently asynchronous, so a plain require() of a .mjs file throws rather than silently working. Dynamic import() (below) is the way around this from a CommonJS file.",
            "This asymmetry is the single most common real reason a project can't just \"add one ESM-only package\" to an otherwise CommonJS codebase without some friction.",
          ],
        },
        {
          kind: "example",
          heading: "Dynamic import() works in both systems",
          body: "Unlike static import/require, import() is a function that returns a promise — it works inside CommonJS files too, and is the standard way to load a module conditionally or lazily, without needing it upfront.",
          code: `// Works in a CommonJS file, not just an ESM one
async function loadFormatter(locale) {
  const { format } = await import(\`./formatters/\${locale}.js\`);
  return format;
}`,
        },
        {
          kind: "text",
          heading: "Top-level await: an ESM-only feature",
          body: [
            "ESM allows await at the top level of a module, outside any async function — useful for a module that needs to load some configuration or data before anything importing it can run. CommonJS has no equivalent; await there is only valid inside an async function, which is one more real reason a project leaning on top-level await needs to be ESM.",
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "package.json's \"exports\" field narrows what's importable",
          body: "A package can declare an \"exports\" field in its package.json to explicitly list which files consumers are allowed to import — anything left out becomes inaccessible from outside the package, even if the file physically exists on disk. This is an increasingly common, deliberate way for library authors to stop consumers from reaching into internal files, and a real reason \"importing a file that clearly exists in node_modules\" can still fail with a resolution error.",
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
          kind: "terminal",
          heading: "Running the server and hitting it",
          description: "Start the server, then make a request against it from another terminal.",
          lines: [
            { text: "node server.js" },
            { text: "Listening on port 3000", output: true },
            { text: "curl http://localhost:3000" },
            { text: '{"message":"Hello from Node"}', output: true },
          ],
        },
        {
          kind: "text",
          heading: "One callback, called once per request — not once per connection",
          body: [
            "A single TCP connection can carry multiple HTTP requests over time thanks to keep-alive — the callback passed to createServer runs once for each individual request, not once when a connection opens. In practice you rarely need to think about the connection layer directly; Node's http module handles the framing of where one request ends and the next begins.",
          ],
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
          kind: "example",
          heading: "Parsing a JSON request body by hand",
          body: "req is a readable stream, not already-parsed data — this is the exact manual work a framework like Express removes with a single line, app.use(express.json()).",
          code: `function handlePost(req, res) {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });
  req.on("end", () => {
    const data = JSON.parse(body);
    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ received: data }));
  });
}`,
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "req and res are streams, not simple objects",
          body: "req is a readable stream — you listen for \"data\" events as chunks arrive, and \"end\" once they're done — and res is a writable stream, where you can call res.write() multiple times before res.end(). This is why a large response can be sent incrementally instead of built entirely in memory first, and why frameworks built on top of http still expose stream-like behavior for things like file downloads.",
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
          kind: "bullets",
          heading: "A couple of headers worth understanding, not just setting",
          bullets: [
            "Content-Type tells the client how to interpret the body — get it wrong (say, sending JSON with a text/plain Content-Type) and a client's automatic parsing may not kick in, even though the actual bytes are valid JSON.",
            "Content-Length, when set explicitly, tells the client exactly how many bytes to expect; without it (or chunked transfer-encoding), a client can't always tell where a response actually ends.",
            "Status codes carry real meaning that clients and tools rely on: the 200 range for success, 400 range for a client mistake, 500 range for a server-side failure — returning 200 with an error message in the body, a common shortcut, breaks any tooling that checks the status code rather than parsing every response body.",
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
          kind: "terminal",
          heading: "Installing and running from package.json",
          description: "npm reads the scripts and dependencies fields to know what to do.",
          lines: [
            { text: "npm install" },
            { text: "added 47 packages in 3s", output: true },
            { text: "npm run dev" },
            { text: "> my-api@1.0.0 dev", output: true },
            { text: "> node --watch server.js", output: true },
            { text: "Listening on port 3000", output: true },
          ],
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
    {
      title: "Scaling Across Cores: Worker Threads and the Cluster Module",
      durationMinutes: 8,
      slides: [
        {
          kind: "title",
          heading: "Scaling Across Cores: Worker Threads and the Cluster Module",
          subheading:
            "Earlier in this course: CPU-heavy work blocks Node's single main thread completely, and \"real CPU-bound work belongs in a worker thread or a separate process.\" This lesson is that promise, kept.",
        },
        {
          kind: "text",
          heading: "One thread, one core, by default",
          body: [
            "A single Node process runs your JavaScript on one thread, which means it uses exactly one CPU core for that code, no matter how many cores the machine actually has. Non-blocking I/O makes that one thread handle many concurrent connections well — but it does nothing for a machine sitting on 8 cores while your process only ever touches one of them.",
            "Node gives you two different tools for this, and they solve different problems: worker_threads for splitting up CPU-heavy work within one process, and the cluster module (or just running multiple processes) for using multiple cores to handle more concurrent requests.",
          ],
        },
        {
          kind: "example",
          heading: "worker_threads: offloading a genuinely expensive computation",
          body: "The main thread stays free to keep handling requests while the worker does the CPU-heavy work on a separate thread, and hands back only the result.",
          code: `// worker.js
const { parentPort, workerData } = require("worker_threads");

function hashPassword(password) {
  // stand-in for real, deliberately slow work (e.g. bcrypt/scrypt at a high cost factor)
  let result = password;
  for (let i = 0; i < 1_000_000; i++) result = sha256(result);
  return result;
}

parentPort.postMessage(hashPassword(workerData.password));

// server.js
const { Worker } = require("worker_threads");

function hashInBackground(password) {
  return new Promise((resolve, reject) => {
    const worker = new Worker("./worker.js", { workerData: { password } });
    worker.on("message", resolve);
    worker.on("error", reject);
  });
}`,
        },
        {
          kind: "example",
          heading: "cluster: using every core to handle more requests",
          body: "cluster forks multiple copies of your whole process — one per core is typical — and load-balances incoming connections across them. Each worker is a fully separate process with its own memory; they don't share variables the way threads in other languages do.",
          code: `const cluster = require("cluster");
const os = require("os");
const http = require("http");

if (cluster.isPrimary) {
  const cpuCount = os.cpus().length;
  for (let i = 0; i < cpuCount; i++) cluster.fork();

  cluster.on("exit", (worker) => {
    console.log(\`Worker \${worker.process.pid} died, starting a new one\`);
    cluster.fork(); // keep the pool at full strength
  });
} else {
  // each worker runs its own independent HTTP server on the same port;
  // the OS/cluster module distributes incoming connections across them
  http.createServer((req, res) => res.end("handled by a worker")).listen(3000);
}`,
        },
        {
          kind: "diagram",
          heading: "How cluster distributes incoming connections",
          description: "One primary process forks a worker per CPU core; each worker runs its own copy of the server.",
          steps: [
            { label: "Primary process starts", detail: "cluster.isPrimary — forks one worker per CPU core" },
            { label: "N worker processes", detail: "Each runs the full server independently, listening on the same port" },
            { label: "Incoming connection", detail: "The OS / cluster module distributes it to one worker" },
            { label: "Worker handles the request", detail: "Separate memory — no shared variables with other workers" },
            { label: "Worker dies?", detail: "The \"exit\" handler forks a replacement to keep the pool at full strength" },
          ],
        },
        {
          kind: "chart",
          heading: "Throughput: single process vs. cluster",
          description: "Illustrative requests/sec for an I/O-bound server on a 4-core machine.",
          chartType: "bar",
          unit: "requests/sec",
          data: [
            { label: "1 process (no cluster)", value: 2500 },
            { label: "cluster, 4 workers", value: 9000 },
          ],
        },
        {
          kind: "bullets",
          heading: "Which one actually fits your problem",
          bullets: [
            "worker_threads: one specific piece of work is CPU-heavy (image resizing, password hashing, parsing a huge file) and would otherwise freeze the main thread for everyone. You want to offload just that computation.",
            "cluster (or running N separate processes behind a load balancer, which is the more common production pattern): your I/O-bound server itself needs more raw throughput than one core's event loop can push through, so you replicate the whole server across cores.",
            "In practice, most production Node deployments reach for multiple processes (via cluster, or an orchestrator like PM2 or Kubernetes running several replicas) rather than worker_threads for general scaling — worker_threads is a more surgical tool for one expensive task, not a general-purpose scaling strategy.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Neither of these is free complexity",
          body: "Worker threads and separate processes don't share memory the way regular JavaScript objects do — passing data across that boundary means serializing it (structured cloning for worker_threads, IPC message passing for cluster), which has real cost for large payloads. And with cluster specifically, in-memory state like a rate limiter's counter or a WebSocket connection map now lives separately in each worker process unless you explicitly move it to a shared store like Redis — the same statelessness requirement that showed up for horizontal scaling in general applies just as much across Node worker processes on one machine.",
        },
        {
          kind: "summary",
          heading: "Recap",
          bullets: [
            "A single Node process uses one thread and one CPU core by default, regardless of how many the machine has.",
            "worker_threads offloads one specific CPU-heavy computation onto a separate thread, keeping the main thread free for I/O.",
            "cluster (or multiple processes generally) replicates your whole server across cores to handle more concurrent requests — the more common real-world scaling approach.",
            "Both add real complexity — memory isn't shared across the boundary, so state that used to live in one process's memory needs a deliberate home (message passing, or a shared store like Redis).",
          ],
        },
      ],
    },
    {
      title: "Practice: Diagnosing Blocking and Concurrency Bugs",
      durationMinutes: 12,
      slides: [
        {
          kind: "title",
          heading: "Practice: Diagnosing Blocking and Concurrency Bugs",
          subheading:
            "Three snippets, each with a real bug rooted in how Node's event loop and async model actually work. Diagnose before you fix.",
        },
        {
          kind: "practice",
          heading: "1. A server that intermittently stalls for everyone",
          prompt:
            "This endpoint computes a report by resizing and hashing a large in-memory dataset synchronously. Under load, other, unrelated requests to this same server start timing out during that computation, even though they don't touch reports at all. Explain why, and describe a fix.\n\n```js\napp.get(\"/reports/:id\", (req, res) => {\n  const data = loadDatasetSync(req.params.id); // fast, just a DB read\n  const report = computeExpensiveReportSync(data); // CPU-heavy, takes ~2 seconds\n  res.json(report);\n});\n```",
          hint:
            "Node runs your JavaScript on a single main thread. What happens to every other pending request — including ones for completely different routes — while one synchronous, CPU-heavy function is running on that same thread?",
          solution:
            "`computeExpensiveReportSync` runs on the main thread and doesn't yield at all for its full ~2 seconds — non-blocking I/O only helps with waiting on things like disk or network, it does nothing for actual computation. While that function runs, the event loop can't process anything else: no other request's callback runs, no other response gets sent, regardless of which route they hit. Fix: move the CPU-heavy computation off the main thread with worker_threads, so it doesn't block other requests while it runs.\n\n```js\nconst { Worker } = require(\"worker_threads\");\n\napp.get(\"/reports/:id\", async (req, res) => {\n  const data = await loadDataset(req.params.id); // non-blocking read\n  const report = await new Promise((resolve, reject) => {\n    const worker = new Worker(\"./compute-report-worker.js\", { workerData: data });\n    worker.on(\"message\", resolve);\n    worker.on(\"error\", reject);\n  });\n  res.json(report);\n});\n```\nKey decision: the fix isn't to make the computation \"async\" with a plain Promise wrapper — that doesn't help, since the computation itself would still run synchronously on the main thread inside that promise. It genuinely needs to run on a different thread to stop blocking everything else.",
        },
        {
          kind: "practice",
          heading: "2. A request that crashes the whole server, not just itself",
          prompt:
            "One flaky downstream API occasionally times out. When it does, this entire Node process crashes, taking down every other in-flight request along with it. Find the missing piece.\n\n```js\napp.get(\"/profile/:id\", async (req, res) => {\n  const user = await db.user.findUnique({ where: { id: req.params.id } });\n  const enrichment = await fetchFromFlakyPartnerApi(user.email); // sometimes rejects\n  res.json({ ...user, enrichment });\n});\n```",
          hint:
            "What happens, by default, to a rejected promise inside an async function when nothing catches it? In a server handling many requests concurrently, whose problem does an unhandled rejection actually become?",
          solution:
            "The await on `fetchFromFlakyPartnerApi` has no try/catch, so when that call rejects, the rejection propagates out of the route handler unhandled — depending on the framework and Node version, this can crash the entire process, not just fail this one request. Every other request already in flight goes down with it. Fix: wrap the failure-prone call in try/catch and respond with an error for just that request.\n\n```js\napp.get(\"/profile/:id\", async (req, res) => {\n  const user = await db.user.findUnique({ where: { id: req.params.id } });\n  try {\n    const enrichment = await fetchFromFlakyPartnerApi(user.email);\n    res.json({ ...user, enrichment });\n  } catch (err) {\n    console.error(\"Partner API failed, returning profile without enrichment\", err);\n    res.json({ ...user, enrichment: null });\n  }\n});\n```\nKey decision: the fix contains the failure to the one request that hit it — a flaky partner API degrades that one profile response (missing enrichment data) instead of taking the entire server offline for everyone.",
        },
        {
          kind: "summary",
          heading: "What a correct solution demonstrates",
          bullets: [
            "Recognizing the difference between I/O-bound waiting (which non-blocking I/O handles well) and CPU-bound computation (which still blocks the single main thread completely).",
            "Knowing that offloading real work requires an actual separate thread or process (worker_threads), not just wrapping synchronous work in a Promise.",
            "Treating every await that can fail as something that needs its own error handling, because an unhandled rejection in a server context can take down every other in-flight request, not just the one that failed.",
          ],
        },
      ],
    },
    {
      title: "Knowledge Check",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Knowledge Check",
          subheading:
            "Five questions across the whole course — testing whether Node's actual execution model stuck, not lesson-by-lesson recall.",
        },
        {
          kind: "quiz",
          heading: "What non-blocking I/O actually buys you",
          question:
            "A request handler does `const result = sortHugeArraySynchronously(data)`, a computation that takes 3 real seconds with no I/O at all. Does Node's non-blocking I/O model help here?",
          options: [
            "Yes — Node automatically moves any expensive operation off the main thread to keep the server responsive.",
            "No — non-blocking I/O only helps with waiting on things like disk, network, or timers; a synchronous CPU-bound computation still runs entirely on, and blocks, the single main thread.",
            "Yes, but only if the function is wrapped in a Promise first.",
            "No — Node has no way to run CPU-heavy work faster than a synchronous language would.",
          ],
          correctIndex: 1,
          explanation:
            "Node's whole non-blocking model is about handing I/O operations off elsewhere so the main thread isn't stuck waiting on them. It does nothing for a genuinely long computation — that still runs synchronously on the one main thread and blocks every other pending request the entire time it runs, exactly like the blocking fs.readFileSync example from earlier in the course.",
        },
        {
          kind: "quiz",
          heading: "Modules",
          question:
            "A file named `utils.js` sits in a project whose package.json has no \"type\" field at all. It contains `import { helper } from \"./helper.js\"`. What happens?",
          options: [
            "It works fine — import/export always works in any .js file in modern Node.",
            "Node treats it as CommonJS by default (no \"type\": \"module\" set), and `import` at the top level of a CommonJS file throws a syntax/module error.",
            "Node automatically detects the import statement and switches that one file to ESM mode.",
            "It works, but only if the project also has a .mjs file somewhere else in the same folder.",
          ],
          correctIndex: 1,
          explanation:
            "Without \"type\": \"module\" in the nearest package.json, plain .js files default to CommonJS, where the module syntax is require/module.exports, not import/export. Using import in that file produces exactly the kind of \"Cannot use import statement outside a module\" error the course flagged as a common, recognizable symptom of a module-system mismatch — the fix is either renaming to .mjs, or adding \"type\": \"module\" to package.json.",
        },
        {
          kind: "quiz",
          heading: "Error handling in a server context",
          question:
            "Why does the course treat unguarded awaits as a bigger deal in a Node server than in a one-off script?",
          options: [
            "Because await is slower inside an HTTP handler than in a plain script.",
            "Because a server process handles many concurrent requests, so an unhandled rejection in one request's handler can crash the whole process and take down every other in-flight request with it.",
            "Because scripts don't support try/catch the way server handlers do.",
            "Because only server code is compiled by V8, while scripts are interpreted directly.",
          ],
          correctIndex: 1,
          explanation:
            "A script that crashes only affects itself. A server process is shared across many concurrent requests, so an unguarded await that rejects can, depending on the framework and Node version, crash the entire process — every other request in flight goes down too, not just the one that hit the failure. That's why real error handling around awaited calls is a reliability requirement in server code, not a style preference.",
        },
        {
          kind: "quiz",
          heading: "cluster and shared state",
          question:
            "A team puts a simple in-memory rate limiter (a plain JavaScript object counting requests per IP) into their Express app, then deploys it behind cluster with 4 workers. What's the actual effect?",
          options: [
            "The rate limiter works exactly the same as with one process, since cluster shares memory transparently across workers.",
            "Each of the 4 worker processes keeps its own separate copy of the counter object, so a client can effectively get up to 4x the intended limit depending on which worker handles each request.",
            "cluster automatically detects in-memory state and moves it to a shared location.",
            "The app crashes on startup because in-memory state isn't allowed under cluster.",
          ],
          correctIndex: 1,
          explanation:
            "Each cluster worker is a fully separate OS process with its own memory — nothing is shared automatically. A rate limiter's counts, or any other in-memory state, ends up siloed per worker, so a client bounced across workers can exceed the intended limit. Shared state across worker processes needs an explicit shared store, like Redis, the same requirement that applies to horizontal scaling generally.",
        },
        {
          kind: "quiz",
          heading: "package.json fundamentals",
          question:
            "A package is listed under devDependencies instead of dependencies. What's the practical consequence?",
          options: [
            "It won't be installed at all when someone runs npm install.",
            "It's understood to be needed only for development/testing (a linter, test runner, type checker) and isn't expected to be required by the running application in production.",
            "It gets installed with a different, incompatible version resolution algorithm than regular dependencies.",
            "It's automatically excluded from package-lock.json.",
          ],
          correctIndex: 1,
          explanation:
            "Both dependencies and devDependencies are installed by a plain `npm install` and both are recorded in package-lock.json — the distinction is about intent and, in some deployment setups, about what actually gets installed in a production build (`npm install --omit=dev` skips devDependencies). Putting a package meant for local development or CI into dependencies instead just misrepresents what the running app actually needs to function.",
        },
        {
          kind: "summary",
          heading: "Course takeaways",
          bullets: [
            "Node is a runtime (V8 plus system-level APIs), not a new language — the same JavaScript, running with different capabilities in a different environment.",
            "Non-blocking I/O keeps one thread free while waiting on slow operations; it does nothing for CPU-heavy computation, which still blocks that same thread completely.",
            "CommonJS and ESM are two real, non-interchangeable module systems in active use — file extension and package.json's \"type\" field determine which one applies.",
            "async/await is the standard control flow for async code, but every await that can fail needs real error handling — an unhandled rejection can take down a whole server process.",
            "worker_threads and cluster (or multiple processes generally) are how you use more than one CPU core — and neither shares memory automatically, so cross-process state needs a deliberate shared store.",
          ],
        },
      ],
    },
  ],
};
