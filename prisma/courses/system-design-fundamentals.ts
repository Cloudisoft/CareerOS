import type { CourseSeed } from "../course-types";

export const course: CourseSeed = {
  slug: "system-design-fundamentals",
  title: "System Design Fundamentals",
  description:
    "How to approach an open-ended system design problem, the core scaling techniques behind most large systems, and a worked example that ties them together.",
  category: "Software Architecture",
  level: "ADVANCED",
  order: 22,
  lessons: [
    {
      title: "Approaching an Open-Ended Design Problem",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Approaching an Open-Ended Design Problem",
          subheading:
            "\"Design a URL shortener\" or \"design Twitter\" isn't a trick question with a hidden right answer — it's a test of whether you narrow an underspecified problem before you start solving it.",
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "The most common failure mode",
          body: "Jumping straight to a diagram of services and databases, for a problem that hasn't been scoped yet. A technically sound design for the wrong scale, or the wrong feature set, reads as a bigger miss than a simpler design for the right one.",
        },
        {
          kind: "bullets",
          heading: "Clarify functional scope first",
          bullets: [
            "What does the system actually need to do, in the first version? \"Design a URL shortener\" could mean just shorten-and-redirect, or also custom aliases, expiration, click analytics, per-user accounts.",
            "What's explicitly out of scope? Saying \"I'm not going to handle abuse detection in this design, but here's where it would plug in\" is a legitimate, senior answer — not a gap.",
          ],
        },
        {
          kind: "bullets",
          heading: "Then pin down scale — this changes everything downstream",
          bullets: [
            "Roughly how many users, and how many requests per second at peak? A system for 10,000 daily users and one for 10 million call for genuinely different designs, not the same design at different sizes.",
            "What's the read/write ratio? A URL shortener is read-heavy — far more redirects happen than new links get created — and that single fact should shape the design more than almost anything else.",
            "What matters more when they conflict: absolute consistency, or availability and low latency? A payments ledger and a social media like counter make opposite trade-offs here, reasonably.",
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "A workable order to move through",
          body: "Clarify requirements and scale, sketch the obvious/naive design, identify where it breaks under the stated scale, then apply techniques to fix each bottleneck — narrating why each one is needed, not just naming it. The rest of this course is that toolkit of techniques.",
        },
      ],
    },
    {
      title: "Scaling: Vertical vs. Horizontal",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Scaling: Vertical vs. Horizontal",
          subheading:
            "Every scaling technique in this course is, underneath, a variation on one of these two moves — and knowing which one you're reaching for clarifies the trade-off you're accepting.",
        },
        {
          kind: "bullets",
          heading: "Vertical scaling — a bigger machine",
          bullets: [
            "Move the same single server to more CPU, more RAM, faster disks.",
            "Simple: no architectural change, no new failure modes, nothing to coordinate.",
            "Has a hard ceiling — there's a biggest machine your cloud provider sells — and that one machine is a single point of failure the whole time.",
          ],
        },
        {
          kind: "bullets",
          heading: "Horizontal scaling — more machines",
          bullets: [
            "Run the same service on many smaller servers instead of one large one, splitting the load across them.",
            "No hard ceiling in principle — add another machine when you need more capacity.",
            "Introduces real complexity: something has to distribute requests across machines, and anything those machines need to agree on (session state, a counter) now needs explicit coordination instead of just living in one process's memory.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "The requirement horizontal scaling imposes",
          body: "For a server to be one of several interchangeable copies, it generally can't hold state a specific user's next request depends on — session data belongs in a shared store like Redis, not an in-memory dictionary on one server, or that user's next request might land on a different machine that's never heard of them. This property — statelessness — is what makes \"just add more servers\" actually work.",
        },
        {
          kind: "text",
          heading: "In practice",
          body: [
            "Most real systems do both: vertically size each machine reasonably, and horizontally scale the number of them. The stateless application tier is usually the easy part to scale horizontally; the database is usually the hard part, which is why database scaling gets its own lesson later in this course.",
          ],
        },
      ],
    },
    {
      title: "Caching Strategies and Invalidation",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Caching Strategies and Invalidation",
          subheading:
            "A cache trades memory for speed by keeping a copy of data closer to where it's needed. The trade almost always works — until the copy and the source of truth disagree.",
        },
        {
          kind: "bullets",
          heading: "The two most common patterns",
          bullets: [
            "Cache-aside (lazy loading) — the application checks the cache first; on a miss, it reads from the database, then writes that result into the cache for next time. Simple, and the cache only ever holds data that's actually been requested.",
            "Write-through — every write goes to the cache and the database together, so the cache is never stale immediately after a write, at the cost of every write paying the latency of both.",
          ],
        },
        {
          kind: "text",
          heading: "Why cache invalidation is the hard part, not the cache itself",
          body: [
            "Storing a copy of data is easy. Knowing the instant that copy stops being accurate is the actual problem — famously one of the few genuinely hard problems in computer science. A user updates their profile photo; every cached copy of their profile, anywhere, is now wrong until something removes or refreshes it.",
          ],
        },
        {
          kind: "bullets",
          heading: "The practical tools for handling it",
          bullets: [
            "TTL (time-to-live) — every cache entry expires automatically after N seconds, bounding how stale data can ever get, without anyone having to remember to invalidate it.",
            "Explicit invalidation on write — when a record changes, the code that changed it also deletes (or updates) that record's cache entry, right then.",
            "Versioned or namespaced keys — caching \"profile:v3:user123\" and bumping the version on change makes old entries simply unreachable, without deleting them one by one.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Cache stampede",
          body: "A popular cache entry expires, and a sudden burst of concurrent requests all miss the cache at once and hit the database simultaneously — sometimes hard enough to take it down. A short random jitter added to each TTL, or a lock so only one request repopulates the cache while others wait, are the two standard defenses.",
        },
      ],
    },
    {
      title: "Load Balancing",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Load Balancing",
          subheading:
            "Once you've scaled horizontally, something has to decide which of your many servers handles each incoming request — that's the whole job of a load balancer.",
        },
        {
          kind: "bullets",
          heading: "Common distribution algorithms",
          bullets: [
            "Round robin — requests cycle through servers in order. Simple, works well when servers and requests are roughly uniform.",
            "Least connections — send the next request to whichever server currently has the fewest active connections. Handles requests of very different costs better than round robin.",
            "Consistent hashing — route based on a hash of some request property (like user ID), so the same key tends to land on the same server — useful when that server has warmed up something cacheable for that key.",
          ],
        },
        {
          kind: "bullets",
          heading: "Health checks: the other half of the job",
          bullets: [
            "The load balancer pings each server on a regular interval and stops sending it traffic the moment it fails to respond — this is the actual mechanism behind horizontal scaling's promise of surviving one server crashing.",
            "Without health checks, a load balancer keeps sending requests to a dead server and users see failures until a human intervenes — the health check is what makes horizontal scaling self-healing instead of just \"more capacity.\"",
          ],
        },
        {
          kind: "text",
          heading: "L4 vs. L7, briefly",
          body: [
            "A layer-4 (transport layer) load balancer routes based on IP and port alone — fast, protocol-agnostic, but blind to what's inside the request. A layer-7 (application layer) load balancer reads the actual HTTP request — path, headers, cookies — and can route \"/api/*\" to one set of servers and \"/images/*\" to another. Most web-facing systems use L7 for that routing flexibility, and reach for L4 when raw throughput matters more than routing intelligence.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "The load balancer is also a single point of failure — worth naming out loud",
          body: "Putting one load balancer in front of many servers just moves the single point of failure up one level. Real deployments run at least two load balancers, with a mechanism (often DNS or a floating IP) to fail over between them — worth mentioning explicitly in a design discussion, since it's the kind of detail that shows you're not just naming techniques but actually reasoning about where the system can still break.",
        },
      ],
    },
    {
      title: "Scaling Databases: Replication and Sharding",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Scaling Databases: Replication and Sharding",
          subheading:
            "The application tier scales horizontally without much drama because it's stateless. The database holds the actual state — which is exactly why scaling it is the harder problem.",
        },
        {
          kind: "bullets",
          heading: "Replication: copies for reads and safety",
          bullets: [
            "One primary (leader) database handles all writes; one or more replicas (followers) continuously copy those writes and can serve read queries.",
            "This directly matches a read-heavy workload — spread read traffic across several replicas while writes stay funneled through one primary that stays consistent.",
            "Replication is asynchronous in most setups, which means a replica can lag slightly behind the primary — a read immediately after a write can, briefly, return stale data. Worth naming as a trade-off, not glossing over.",
          ],
        },
        {
          kind: "bullets",
          heading: "Sharding: splitting the data itself",
          bullets: [
            "Replication copies the same full dataset everywhere. Sharding does the opposite — it splits the dataset itself across multiple databases, each holding a subset (commonly by a hash or range of some key, like user ID).",
            "This is what you reach for when the write volume, or the dataset size itself, has outgrown what one primary database can hold or handle — replication alone doesn't help because every replica still needs the full dataset and still funnels writes through one primary.",
            "The real cost: a query that needs data from more than one shard (e.g., \"top 10 across all users\") is no longer one simple query — the application has to fan out across shards and merge results itself.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "The hot shard problem",
          body: "Sharding by user ID sounds even until one user — a celebrity account, a viral post — generates disproportionate traffic and its shard becomes a bottleneck all by itself, while every other shard sits idle. Choosing a shard key is one of the highest-leverage decisions in a sharded design, precisely because a bad one reintroduces the exact bottleneck sharding was meant to remove.",
        },
        {
          kind: "text",
          heading: "A rule of thumb for which to reach for",
          body: [
            "Replication first — it's simpler, and it directly addresses a read-heavy load, which describes most systems. Reach for sharding only once write volume or raw data size has genuinely outgrown a single primary, since it adds real complexity to nearly every query that touches more than one shard.",
          ],
        },
      ],
    },
    {
      title: "Worked Example: Designing a URL Shortener",
      durationMinutes: 8,
      slides: [
        {
          kind: "title",
          heading: "Worked Example: Designing a URL Shortener",
          subheading:
            "Every technique from this course, applied to one concrete problem — the way a real design conversation actually builds up, one bottleneck at a time.",
        },
        {
          kind: "text",
          heading: "Step 1: scope and scale, decided out loud",
          body: [
            "Functional scope: submit a long URL, get back a short code; visiting the short URL redirects to the original. Custom aliases and click analytics are explicitly out of scope for this pass. Scale: 100 million shortened links created total, 1 billion redirects served per day — a workload that is overwhelmingly reads over writes, roughly 1000:1.",
          ],
        },
        {
          kind: "bullets",
          heading: "Step 2: the naive design, and where it breaks",
          bullets: [
            "One app server, one database: on write, generate a short code, store {code, long_url}; on read, look up the code and issue an HTTP redirect.",
            "At 1 billion redirects a day (roughly 11,600 requests per second on average, with real peaks well above that), one app server and one database both fall over — this is the concrete bottleneck the rest of the design exists to fix.",
          ],
        },
        {
          kind: "bullets",
          heading: "Step 3: apply the toolkit, in order of impact",
          bullets: [
            "Horizontal scaling + load balancing — run many stateless app servers behind a load balancer; any one of them can handle any redirect request, since nothing about a redirect depends on which server serves it.",
            "Caching — this workload is exactly what caching is built for: a small fraction of links (recently created, or simply popular) account for a large fraction of redirects. Cache {code → long_url} with a TTL, and the overwhelming majority of reads never touch the database at all.",
            "Read replicas — for the cache misses that do reach the database, route them to read replicas rather than the primary, which stays reserved for writes (new links being created).",
            "Sharding — only if the dataset of 100 million links outgrows a single primary's capacity for the write path; shard by a hash of the short code, since that spreads load evenly and there's no natural \"hot key\" the way a shard-by-user design might have.",
          ],
        },
        {
          kind: "example",
          heading: "The resulting request path, restated concretely",
          code: `Write path:
  client -> load balancer -> app server -> generate code
         -> write to primary DB (sharded by code hash)
         -> write-through to cache

Read path (redirect):
  client -> load balancer -> app server -> check cache
    cache hit  -> redirect immediately (~99% of requests)
    cache miss -> read replica -> populate cache -> redirect`,
        },
        {
          kind: "summary",
          heading: "What this example demonstrates",
          bullets: [
            "Every technique was introduced to fix a specific, named bottleneck — not applied by default because it's a well-known pattern.",
            "The read-heavy ratio, identified back in step 1, is the single fact that shaped almost every later decision — caching and read replicas both exist because of it.",
            "This is the shape a real design answer should take: naive design, identified bottleneck, targeted fix, repeated — not a diagram of every technique you know, applied all at once.",
          ],
        },
      ],
    },
    {
      title: "Rate Limiting and Backpressure",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Rate Limiting and Backpressure",
          subheading:
            "Every technique so far assumed legitimate traffic that simply needs to be served efficiently. Rate limiting is the piece that protects a system when traffic — abusive or just excessive — needs to be refused instead.",
        },
        {
          kind: "text",
          heading: "What rate limiting actually protects",
          body: [
            "A rate limiter caps how many requests a given client (by API key, user ID, or IP) can make in a window of time, rejecting the excess with a 429-style response instead of processing it. It protects two different things at once: the backend itself, from being overwhelmed by one client's traffic (accidental — a buggy retry loop — or deliberate, like a scraper or a brute-force login attempt), and fairness between clients, so one noisy consumer can't degrade service for everyone else on shared infrastructure.",
          ],
        },
        {
          kind: "bullets",
          heading: "The standard algorithms, and the actual trade-off between them",
          bullets: [
            "Fixed window — count requests in discrete windows (e.g. per calendar minute), reset to zero at each boundary. Simple, but bursty at the edges: a client can send a full window's worth of requests in the last second of one window and another full window's worth in the first second of the next, doubling the intended rate briefly.",
            "Sliding window — instead of a hard reset, the window continuously slides with time, smoothing out that edge-burst problem at the cost of a bit more bookkeeping (tracking timestamps, or a weighted blend of the current and previous window).",
            "Token bucket — a bucket holds up to N tokens, refilling at a steady rate; each request consumes one token, and a request with no tokens available is rejected. This naturally allows a short burst (spending saved-up tokens) while still enforcing a steady average rate over time — the algorithm most APIs actually reach for, because occasional legitimate bursts are common and shouldn't be penalized the way a rigid fixed window would.",
          ],
        },
        {
          kind: "example",
          heading: "Where it's enforced changes what it protects",
          body: "Rate limiting isn't one decision — it's usually layered, and each layer catches something the others don't.",
          code: `Layer                 Protects against                 Typical granularity
---------------------------------------------------------------------------
CDN / edge / gateway   Broad abuse, DDoS-style floods    Per IP, very cheap to check
API gateway            Per-client fairness, quota tiers  Per API key / per user
Application code       Expensive-specific-endpoint abuse Per endpoint, per user
                        (e.g. "send password reset email")`,
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Backpressure: rate limiting's quieter cousin",
          body: "Rate limiting rejects excess requests from a client outright. Backpressure is the related idea of a system signaling upstream that it's overloaded — a queue that stops accepting new items once it's full, or a service that starts returning errors deliberately, faster and cheaper than trying to process everything and collapsing under the load. A queue worker falling behind message production is a classic case: without backpressure, the queue simply grows unbounded until memory runs out, rather than failing predictably and visibly earlier.",
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "A shared rate limiter needs shared state, not per-server counters",
          body: "Behind a load balancer with multiple app servers, a rate limiter that counts requests in a local in-memory variable on each server is enforcing the limit per server, not per client overall — a client hitting 5 servers round-robin effectively gets 5x the intended limit. Enforcing a real global limit needs a shared, fast store (Redis is the standard choice) that every server checks against, the same statelessness requirement that shows up everywhere else in a horizontally scaled system.",
        },
        {
          kind: "summary",
          heading: "Recap",
          bullets: [
            "Rate limiting caps a client's request rate to protect backend capacity and fairness between clients — token bucket is the most common algorithm because it tolerates legitimate short bursts.",
            "It's typically layered: a cheap, broad check at the edge (CDN/gateway) plus tighter, more specific limits closer to the application for expensive endpoints.",
            "Backpressure is the related idea of a system pushing back when overloaded (a full queue, an early error) instead of accepting unbounded work it can't actually handle.",
            "Enforcing a limit across multiple servers requires shared state (like Redis) — a per-server in-memory counter only enforces the limit per server, not overall.",
          ],
        },
      ],
    },
    {
      title: "Practice: Applying the Toolkit to New Scenarios",
      durationMinutes: 14,
      slides: [
        {
          kind: "title",
          heading: "Practice: Applying the Toolkit to New Scenarios",
          subheading:
            "Two open-ended design scenarios. Work through scope, scale, naive design, and bottlenecks before checking the worked solution — that order is most of the exercise.",
        },
        {
          kind: "practice",
          heading: "1. Design a rate limiter for a public API",
          prompt:
            "Design a rate limiter for a public API with these constraints: it needs to enforce 100 requests/minute per API key, run correctly across 20 app servers behind a load balancer, and reject excess requests in well under 5ms so it doesn't itself become the bottleneck. Sketch the approach: what algorithm, where the counters live, and how a request is checked.",
          hint:
            "Whatever you pick has to be shared across all 20 servers (not per-server state), and fast enough that the check itself doesn't dominate the request's latency budget. What kind of store is built for exactly this kind of fast, shared counter?",
          solution:
            "Token bucket per API key, with the bucket state (tokens remaining, last refill time) stored in Redis rather than in any app server's memory — that's what makes it correct across all 20 servers regardless of which one handles a given request. On each request: the app server computes the key's Redis key (e.g. `ratelimit:{apiKey}`), atomically checks and decrements available tokens (using a Lua script or Redis's built-in atomic operations so a burst of concurrent requests to the same key can't race past each other and both succeed when only one token remained), and refills tokens lazily based on elapsed time since the last check rather than running a separate background refill process per key.\n\nWhy token bucket over fixed window here: 100 req/min is an average rate, and legitimate API consumers often burst — a client that batches its calls once a minute rather than trickling them out steadily shouldn't be penalized for it, which is exactly what token bucket tolerates and fixed window doesn't. Why Redis specifically: it's fast enough (sub-millisecond) to check on every request without meaningfully affecting latency, and — critically — it's the one place all 20 app servers can share the exact same counter, avoiding the per-server-counter bug where a client round-robining across servers gets a multiple of the intended limit.\nKey decision: the atomicity of the check-and-decrement matters as much as the algorithm choice — without it, concurrent requests to the same key can both read \"1 token left\" and both proceed, silently allowing the limit to be exceeded under real concurrent load.",
        },
        {
          kind: "practice",
          heading: "2. Diagnose and fix a design under revised requirements",
          prompt:
            "The URL shortener from this course's worked example was designed assuming a 1000:1 read/write ratio. Now assume a new requirement: link creation suddenly needs to support 50,000 writes/second (a marketing partner is bulk-importing links), while redirects stay roughly the same volume as before. Which part of the earlier design breaks first under this new requirement, and what's the fix?",
          hint:
            "The original design leaned on one write-only primary database plus read replicas — that split was built around reads being the dominant traffic. Which side of that split does a 50,000 writes/second spike actually stress?",
          solution:
            "The single primary database is what breaks first — read replicas don't help write throughput at all, since every write still funnels through the one primary regardless of how many read replicas exist. 50,000 writes/second sustained is well beyond what a single primary can typically absorb, especially with cache invalidation or write-through work happening per write.\n\nFix: this is exactly the scenario sharding exists for — shard the links table by a hash of the short code (the same shard key reasoned about in the worked example, chosen specifically because it distributes evenly with no natural hot key), splitting the 50,000 writes/second across N primaries instead of one. Each shard handles a fraction of the import load in parallel. The read path barely changes — a redirect still checks the cache first, and a cache miss now has to be routed to the correct shard's replica based on the same short-code hash used for writes, rather than a single replica pool.\nKey decision: read replicas and sharding solve different problems (read scale vs. write/data-volume scale), and this scenario is a clean illustration of why the course's rule of thumb — reach for sharding only once write volume has genuinely outgrown a single primary — applies here specifically because the bottleneck moved from reads to writes, not because sharding is simply the \"next step up\" from replication.",
        },
        {
          kind: "summary",
          heading: "What a correct solution demonstrates",
          bullets: [
            "Matching the algorithm to the actual traffic shape (token bucket tolerating legitimate bursts) rather than picking whichever rate-limiting technique is most familiar.",
            "Recognizing that shared enforcement across multiple servers requires a shared, atomic store — not assuming any in-memory or per-server approach generalizes.",
            "Correctly attributing a new bottleneck to the specific part of the system it actually stresses (writes vs. reads) instead of reflexively reapplying the same fix that solved a previous, different bottleneck.",
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
            "Five questions across the whole course — testing the reasoning behind each technique, not just its name.",
        },
        {
          kind: "quiz",
          heading: "Approaching an open-ended problem",
          question:
            "In a system design interview, a candidate immediately starts drawing a diagram of load balancers, caches, and sharded databases for \"design a URL shortener,\" without first discussing scope or scale. What's the most accurate assessment of this approach?",
          options: [
            "It's a strong start — jumping to a complete architecture shows deep technical knowledge.",
            "It's a common failure mode — without first pinning down functional scope and scale, a technically sound-looking design may be solving the wrong problem, which reads as a bigger miss than a simpler design for the right one.",
            "It doesn't matter what order these are discussed in, as long as all the right components eventually get mentioned.",
            "It's correct as long as caching is included, since caching is required in every system design regardless of scale.",
          ],
          correctIndex: 1,
          explanation:
            "The course calls this out directly as the most common failure mode: a diagram of services before the problem is scoped. Requirements (what the system does, what's explicitly out of scope) and scale (users, request rate, read/write ratio, consistency vs. availability needs) should shape which techniques are even relevant — applying sharding or heavy caching to a problem that doesn't need them is a real miss, not a neutral safe default.",
        },
        {
          kind: "quiz",
          heading: "Statelessness and horizontal scaling",
          question:
            "A team horizontally scales their app servers to handle more load, but stores each logged-in user's session data in a plain in-memory object on whichever server first handled their login. What breaks, and why?",
          options: [
            "Nothing breaks — horizontal scaling makes every server identical automatically, including their in-memory data.",
            "A user's session can appear to randomly disappear whenever the load balancer routes their next request to a different server that never saw their login.",
            "This only becomes a problem once the number of servers exceeds 10.",
            "This is fine as long as a fixed-window rate limiter is also in place.",
          ],
          correctIndex: 1,
          explanation:
            "Horizontal scaling's promise — any server can handle any request — requires servers to be stateless, meaning nothing about handling a request depends on state that only lives in one specific server's memory. Session data kept in-process breaks exactly this: a request landing on a different server than the one that saw the login effectively hits a server that's \"never heard of them,\" the precise failure mode the course calls out. The fix is moving session state to a shared store (like Redis), not adding more servers or a rate limiter.",
        },
        {
          kind: "quiz",
          heading: "Caching and invalidation",
          question:
            "A popular product page's cache entry expires, and in the same instant, 5,000 concurrent requests all miss the cache and hit the database simultaneously. What is this called, and what's a standard defense?",
          options: [
            "A hot shard, defended against by choosing a better sharding key.",
            "A cache stampede, defended against with a short random jitter on TTLs or a lock so only one request repopulates the cache while others wait.",
            "Cache invalidation, defended against by switching from cache-aside to write-through.",
            "A thundering herd of replicas, defended against by adding more read replicas.",
          ],
          correctIndex: 1,
          explanation:
            "This is a cache stampede — a burst of simultaneous misses on one popular key overwhelming the database at once. Jittered TTLs (so entries don't all expire at exactly the same instant) and a repopulation lock (so only one request refetches while the rest wait for that result) are the two standard defenses. A hot shard is a different problem — one shard getting disproportionate traffic — and neither more replicas nor a caching-strategy swap addresses the actual simultaneous-miss dynamic here.",
        },
        {
          kind: "quiz",
          heading: "Replication vs. sharding",
          question:
            "A system's read traffic has grown 10x, but total data size and write volume are unchanged and comfortably handled by the current primary database. What's the appropriate next step?",
          options: [
            "Shard the database, since sharding is the standard next step whenever a system needs to scale.",
            "Add read replicas, since a read-heavy increase with unchanged write volume and data size is exactly what replication (not sharding) is designed to address.",
            "Both sharding and replication should be added together as a default pairing.",
            "Switch from cache-aside to write-through caching, since that's the correct response to any traffic growth.",
          ],
          correctIndex: 1,
          explanation:
            "The course's rule of thumb is explicit: reach for replication first since it directly addresses read-heavy load (spreading reads across replicas while writes stay on the primary), and reach for sharding only once write volume or data size has genuinely outgrown a single primary — neither of which is true in this scenario. Sharding here would add real complexity (multi-shard queries) to solve a problem replication already solves more simply.",
        },
        {
          kind: "quiz",
          heading: "Rate limiting across multiple servers",
          question:
            "An API enforces a 100 req/min limit per client, but the counter is a plain JavaScript object kept in each app server's memory, and the API runs behind a load balancer across 10 servers. What's the actual effect?",
          options: [
            "The limit is enforced correctly, since each server independently caps requests at 100/min.",
            "A client can receive up to roughly 10x the intended limit, since each server tracks its own separate count and the load balancer can spread that client's requests across all 10.",
            "The load balancer automatically merges the counters from all 10 servers into one shared total.",
            "This has no effect on the rate limit, only on which algorithm (token bucket vs. fixed window) is being used.",
          ],
          correctIndex: 1,
          explanation:
            "An in-memory counter is local to one server's process — it has no visibility into what the other 9 servers are counting. A client whose requests get distributed across all 10 servers can effectively get up to 10x the intended limit, since each server independently allows 100/min without any awareness of the others. Enforcing a real global limit requires a shared store like Redis that every server checks against, not more sophisticated per-server logic.",
        },
        {
          kind: "summary",
          heading: "Course takeaways",
          bullets: [
            "Scope and scale (especially the read/write ratio and consistency-vs-availability trade-off) should be pinned down before any specific technique is chosen — a good design for the wrong scale reads as a bigger miss than a simple design for the right one.",
            "Horizontal scaling requires statelessness — anything a server needs to remember across requests belongs in a shared store, not a server's own memory.",
            "Caching trades memory for speed; invalidation (not storage) is the hard part, and TTLs, explicit invalidation, and jittered expirations are the practical tools for managing it.",
            "Load balancers distribute traffic and remove failed servers via health checks — and need redundancy themselves, since one load balancer just moves the single point of failure up a level.",
            "Replication scales reads by copying data; sharding scales writes and data volume by splitting it — replication first, sharding only once write volume or size genuinely outgrows a single primary.",
            "Rate limiting and backpressure protect a system from excess or abusive load, but only work correctly across multiple servers when the limiting state itself is shared, not per-server.",
          ],
        },
      ],
    },
  ],
};
