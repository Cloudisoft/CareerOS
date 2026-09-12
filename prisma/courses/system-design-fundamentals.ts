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
  ],
};
