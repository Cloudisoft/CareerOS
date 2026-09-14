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
        {
          kind: "bullets",
          heading: "Non-functional requirements — easy to skip, and just as shaping as features",
          intro: "\"What does it do\" is only half the scope. \"How well does it have to do it\" is the other half, and it changes the design as much as any feature does.",
          bullets: [
            "Latency budget — is 200ms fine, or does this sit in a path where 20ms is the ceiling? A search-as-you-type feature and an overnight batch report have wildly different tolerances, and that alone rules out or requires whole categories of technique.",
            "Availability target — 99.9% uptime allows about 8.7 hours of downtime a year; 99.99% allows about 52 minutes. Going from three nines to four nines isn't a small tweak — it usually means redundancy at every layer, not just the obvious ones.",
            "Durability — can this data be regenerated or re-fetched if lost, or is losing it unacceptable (a financial transaction, a user's uploaded file)? That answer decides how much replication and backup effort is actually justified.",
            "Consistency model — does every reader need to see the latest write immediately, or is a brief delay (eventual consistency) acceptable in exchange for better availability and lower latency? Naming this trade-off explicitly is one of the clearest signals of seniority in a design discussion.",
          ],
        },
        {
          kind: "example",
          heading: "Back-of-the-envelope math turns \"a lot of users\" into a real number",
          body: "Rough estimation, done in front of whoever you're designing for, is expected — and it's what turns \"handle a lot of traffic\" into an actual, checkable design target. The precision doesn't matter much; the order of magnitude does.",
          language: "text",
          code: `Given: 10 million daily active users, each performs ~5 actions/day

Average QPS = (10,000,000 × 5) / 86,400 seconds ≈ 580 requests/second

Peak QPS: traffic is rarely flat — assume a 5x peak-to-average ratio
  for a consumer app with daily usage patterns
  580 × 5 ≈ 2,900 requests/second at peak

Storage, if each action writes a ~1KB record:
  10,000,000 × 5 × 1KB ≈ 50GB/day → ~18TB/year before any replication`,
        },
        {
          kind: "bullets",
          heading: "A handful of questions worth asking out loud, not just silently assuming",
          bullets: [
            "What's the peak-to-average traffic ratio, and is it predictable (daily commute patterns) or spiky and unpredictable (a flash sale, a viral post)? Predictable peaks can be capacity-planned for; unpredictable ones need headroom or autoscaling.",
            "What happens to this feature if a downstream dependency — a third-party API, another internal service — is slow or unavailable? Designing the failure path is not optional polish; it's part of the design.",
            "Is this a greenfield system, or does it need to interoperate with something that already exists? Constraints from existing infrastructure often matter more than any technique in this course.",
          ],
        },
        {
          kind: "diagram",
          heading: "The full shape of a design conversation, start to finish",
          description: "This is the loop the rest of the course's techniques get plugged into — worth having as a mental checklist going in.",
          steps: [
            { label: "Clarify functional scope", detail: "What's in, what's explicitly out, for this pass" },
            { label: "Clarify scale and non-functionals", detail: "Users, QPS, read/write ratio, latency, availability, consistency" },
            { label: "Back-of-envelope math", detail: "Turn \"a lot\" into an actual number worth designing around" },
            { label: "Sketch the naive design", detail: "The simplest thing that could possibly work" },
            { label: "Identify where it breaks", detail: "Name the specific bottleneck at the stated scale" },
            { label: "Apply a technique, narrating why", detail: "Repeat until the design holds up under the stated numbers" },
          ],
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
          kind: "callout",
          tone: "warning",
          heading: "Not every workload parallelizes cleanly — the part that doesn't caps your speedup",
          body: "Horizontal scaling assumes the work can actually be split across machines with little coordination between them. Some workloads resist this — a computation with a strictly sequential dependency, or a single global counter every request needs to increment exactly once. Amdahl's law formalizes the intuition: if even 10% of a workload is inherently sequential, no amount of added parallelism can ever push the total speedup past 10x, because that 10% has to happen no matter how many machines are standing by idle. In practice this shows up as \"we added 10 more servers and throughput barely moved\" — usually because the actual bottleneck was a serialized piece (a single lock, a single queue, a single non-sharded table) that horizontal scaling never touched.",
        },
        {
          kind: "diagram",
          heading: "A stateless request, end to end",
          description: "Any of the servers can handle any request, because none of them holds state the request depends on.",
          steps: [
            { label: "Client request", detail: "Could be handled by any of the servers behind the load balancer" },
            { label: "Load balancer picks a server", detail: "Server A, B, or C — interchangeable" },
            { label: "Server handles the request", detail: "Reads/writes session state from a shared store, not its own memory" },
            { label: "Shared store (e.g. Redis)", detail: "Any server's next request can read the same session data" },
          ],
        },
        {
          kind: "chart",
          heading: "Where vertical scaling hits a wall",
          description: "Illustrative cost of a single cloud instance as it scales up — capacity roughly doubles at each step, but the price per unit of capacity climbs, not stays flat.",
          chartType: "bar",
          unit: "$/month",
          data: [
            { label: "4 vCPU / 16GB", value: 140 },
            { label: "8 vCPU / 32GB", value: 310 },
            { label: "16 vCPU / 64GB", value: 700 },
            { label: "32 vCPU / 128GB", value: 1650 },
            { label: "64 vCPU / 256GB (largest available)", value: 4200 },
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Horizontal scaling isn't just about the ceiling — it's cheaper per unit, and it buys redundancy for free",
          body: "The chart's real lesson isn't just that the biggest machine runs out — it's that four of the 16 vCPU machines cost roughly $2,800/month for 64 vCPUs total, well under the $4,200 for one 64 vCPU machine with the same raw capacity. Horizontal scaling on smaller, cheaper instances is often less expensive per unit of capacity, on top of removing the single point of failure a lone large machine represents. The catch, as covered earlier, is that those four machines only work as a substitute if the workload can actually be split across them — which is exactly the statelessness requirement.",
        },
        {
          kind: "example",
          heading: "What horizontal scaling looks like operationally: an autoscaling policy",
          body: "In practice, horizontal scaling is rarely a fixed number of servers — it's a policy that adds and removes capacity automatically based on load, so you're not paying for peak capacity around the clock.",
          language: "yaml",
          code: `# Simplified autoscaling group policy
min_instances: 3        # never scale below this, for redundancy alone
max_instances: 50        # a ceiling to cap runaway cost
target_cpu_utilization: 60%

scale_out:
  when: avg_cpu > 70% for 3 minutes
  add: 2 instances

scale_in:
  when: avg_cpu < 30% for 10 minutes
  remove: 1 instance      # remove cautiously — scale in slower than scale out`,
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
          kind: "diagram",
          heading: "Cache-aside, on a read",
          description: "The most common pattern: check the cache first, and only go to the database on a miss.",
          steps: [
            { label: "Request arrives", detail: "The app needs a piece of data" },
            { label: "Check the cache", detail: "Cache-aside: look here first" },
            { label: "Cache miss → read the database", detail: "The source of truth" },
            { label: "Write the result into the cache", detail: "So the next request for this key is a hit" },
            { label: "Return to the caller", detail: "Same response either way" },
          ],
        },
        {
          kind: "bullets",
          heading: "A third pattern, less common but worth recognizing",
          bullets: [
            "Write-behind (write-back) — the write goes to the cache immediately and returns, while the write to the database happens asynchronously afterward. Fast writes, at the real risk of losing data if the cache crashes before that async write completes — used sparingly, mostly for write-heavy workloads that can tolerate some loss.",
          ],
        },
        {
          kind: "chart",
          heading: "Why hit ratio matters more than almost any other cache metric",
          description: "Illustrative average response time as the cache hit ratio improves, for a lookup that costs 2ms from cache versus 80ms from the database.",
          chartType: "line",
          unit: "ms",
          data: [
            { label: "50% hit ratio", value: 41 },
            { label: "80% hit ratio", value: 18 },
            { label: "95% hit ratio", value: 6 },
            { label: "99% hit ratio", value: 3 },
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
        {
          kind: "bullets",
          heading: "Eviction: what happens when the cache itself fills up",
          intro: "TTLs handle staleness. Eviction handles a different problem entirely — the cache has a fixed memory budget, and it's full.",
          bullets: [
            "LRU (least recently used) — evict whatever hasn't been read in the longest time. The default in most caching systems, and a reasonable one: recently accessed data tends to be accessed again soon.",
            "LFU (least frequently used) — evict whatever has been read the fewest times overall, regardless of recency. Better than LRU for data with a stable \"always popular\" set that shouldn't get evicted just because of one quiet hour.",
            "Redis and most managed caches let you configure the eviction policy per instance — picking the wrong one for your access pattern silently degrades your hit ratio without throwing any error to tell you why.",
          ],
        },
        {
          kind: "terminal",
          heading: "Setting a TTL and watching it expire, in Redis",
          description: "The everyday commands behind everything this lesson describes conceptually.",
          lines: [
            { text: "redis-cli SET user:123:profile '{\"name\":\"Ada\"}' EX 300" },
            { text: "OK", output: true },
            { text: "redis-cli TTL user:123:profile" },
            { text: "(integer) 300", output: true },
            { text: "# ... 300 seconds later ..." },
            { text: "redis-cli GET user:123:profile" },
            { text: "(nil)", output: true },
          ],
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
          kind: "diagram",
          heading: "The health check loop",
          description: "What makes horizontal scaling self-healing instead of just \"more capacity.\"",
          steps: [
            { label: "Load balancer pings each server", detail: "On a regular interval, e.g. every 5 seconds" },
            { label: "Server responds healthy", detail: "Stays in the rotation for new requests" },
            { label: "Server fails to respond", detail: "Load balancer marks it unhealthy" },
            { label: "Traffic stops routing to it", detail: "Remaining healthy servers absorb the load until it recovers" },
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
        {
          kind: "bullets",
          heading: "Sticky sessions: a pragmatic, imperfect middle ground",
          bullets: [
            "A load balancer can be configured to route the same client's requests to the same server every time — usually via a cookie — instead of distributing them freely. This makes an otherwise-stateful server workable without a shared session store.",
            "The trade-off: it partially reintroduces the exact problem statelessness was meant to solve. If that one server goes down, every session pinned to it is lost or has to be rebuilt elsewhere, and load distribution gets less even since some servers may end up with disproportionately \"sticky\" clients.",
            "It's a reasonable short-term or lower-stakes answer, but a shared session store is almost always the better long-term one — sticky sessions are worth mentioning as a trade-off you're consciously choosing, not something to lean on by default.",
          ],
        },
        {
          kind: "example",
          heading: "Weighted routing: not every server is equal",
          body: "When servers differ in capacity — a mixed fleet during a migration, or intentionally provisioned differently — a load balancer can send proportionally more traffic to the bigger ones instead of splitting evenly.",
          language: "nginx",
          code: `upstream backend {
    server 10.0.1.10:8080 weight=3;  # a larger instance — gets 3x the traffic
    server 10.0.1.11:8080 weight=1;
    server 10.0.1.12:8080 weight=1;
}

# roughly 60% of requests go to .10, 20% each to .11 and .12`,
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "TLS termination is usually the load balancer's job too",
          body: "Decrypting HTTPS traffic is CPU work, and doing it once at the load balancer — then forwarding plain HTTP to app servers over the private network — means every app server doesn't have to repeat that cost, and certificates only need managing in one place instead of on every instance. This is called TLS termination, and it's one of the load balancer's jobs that's easy to forget when first sketching a design, but worth naming since \"where does HTTPS actually get decrypted\" is a real, concrete question in any web-facing system.",
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
          kind: "diagram",
          heading: "Writes vs. reads under replication",
          description: "One primary handles every write; replicas absorb read traffic and can lag slightly behind.",
          steps: [
            { label: "Write request", detail: "INSERT/UPDATE — goes to the primary only" },
            { label: "Primary commits the write", detail: "Then streams the change to replicas" },
            { label: "Replicas apply the change", detail: "Asynchronously — a brief lag is possible" },
            { label: "Read requests", detail: "Routed to any replica, spreading read load" },
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Synchronous replication exists too — it just trades away availability for it",
          body: "Everything above assumes asynchronous replication, the common default. A synchronous replica requires the primary to wait for the replica to confirm the write before telling the client it succeeded — guaranteeing zero lag, but meaning the primary is now only as available as its slowest synchronous replica, and a network blip between them stalls every write. Some systems use a middle ground — semi-synchronous, requiring confirmation from just one of several replicas — to bound the worst-case lag without fully coupling write latency to replica health.",
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
          kind: "bullets",
          heading: "Three ways to pick which shard a given piece of data lives on",
          bullets: [
            "Hash-based — hash the key (e.g. user ID) and mod by the shard count. Distributes evenly with no natural hot spot, but adding a shard later means most keys hash to a different shard than before, which is expensive to rebalance without a technique like consistent hashing.",
            "Range-based — shard A holds users 1-1,000,000, shard B holds 1,000,001-2,000,000, and so on. Makes range queries (\"everyone who signed up in March\") cheap, since they typically hit one shard — but is exactly what creates a hot shard when activity isn't evenly spread across ranges, like all-new-signups landing on the newest, single shard.",
            "Directory-based — a separate lookup service tracks exactly which shard holds which key. Most flexible (rebalancing means updating the directory, not rehashing everything), but that directory is now its own critical, highly-available piece of infrastructure.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "The hot shard problem",
          body: "Sharding by user ID sounds even until one user — a celebrity account, a viral post — generates disproportionate traffic and its shard becomes a bottleneck all by itself, while every other shard sits idle. Choosing a shard key is one of the highest-leverage decisions in a sharded design, precisely because a bad one reintroduces the exact bottleneck sharding was meant to remove.",
        },
        {
          kind: "diagram",
          heading: "A query that has to fan out across shards",
          description: "The real cost of sharding, made concrete — a query no single shard can answer alone.",
          steps: [
            { label: "\"Top 10 most active users overall\" arrives", detail: "No single shard has the full picture" },
            { label: "Application queries every shard in parallel", detail: "Each returns its own local top 10" },
            { label: "Application merges the partial results", detail: "Re-sorts across all shards' results together" },
            { label: "Final top 10 returned", detail: "Work the database did for free with one primary now lives in application code" },
          ],
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
          kind: "example",
          heading: "A detail worth deciding explicitly: how the short code is generated",
          body: "This is a small decision that's easy to wave past, but it has real trade-offs — worth naming in a real design conversation rather than assuming \"something randomish\" is enough.",
          language: "text",
          code: `Option 1 — random string, check for collision, retry on conflict
  Simple. At 100M links the collision odds per attempt are still low with
  a 7-character base62 code (62^7 ≈ 3.5 trillion possibilities), but every
  write now needs a uniqueness check against the database — extra latency
  on the write path, and a retry loop for the rare collision.

Option 2 — auto-incrementing ID, encoded as base62
  No collision possible, no uniqueness check needed. The trade-off: IDs
  are sequential and guessable (code "aB3" followed by "aB4" reveals link
  volume and creation order) — acceptable for this use case, not for
  something like an invoice or account number.

Chosen: Option 2 — the write path stays simple (encode an incrementing
ID, no DB round-trip to check uniqueness), and guessability isn't a
real concern for a public link-shortening product.`,
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
          kind: "callout",
          tone: "insight",
          heading: "What a strong answer names explicitly, and a weaker one skips",
          body: "It's easy to stop at the diagram above and call the design done. A stronger answer keeps going for one more beat: what happens if the cache cluster itself goes down entirely? Every request becomes a cache miss simultaneously — effectively a self-inflicted cache stampede, exactly the failure mode from the caching lesson, at the worst possible moment. The honest answer is that read replicas need enough spare headroom to absorb 100% of read traffic temporarily, not just the cache-miss fraction, and that's a capacity number worth stating out loud rather than assuming away.",
        },
        {
          kind: "diagram",
          heading: "The read path, the request that happens a billion times a day",
          description: "A redirect — by far the dominant traffic for this system, given the 1000:1 read/write ratio.",
          steps: [
            { label: "Client requests short URL", detail: "GET /abc123" },
            { label: "Load balancer → app server", detail: "Any stateless app server can handle it" },
            { label: "Check the cache", detail: "code → long_url lookup" },
            { label: "Cache hit (~99%)", detail: "Redirect immediately, no database hit at all" },
            { label: "Cache miss → read replica", detail: "Looked up on a replica, not the write primary" },
            { label: "Populate cache, then redirect", detail: "The next request for this code is a cache hit" },
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "A sanity check worth doing: does the storage number even matter here?",
          body: "100 million links, each maybe 500 bytes once you include the long URL, the short code, metadata, and index overhead, comes to about 50GB total — small enough to fit comfortably on a single modern database instance, replication aside. That's a useful, explicit reason sharding is deferred to \"only if\" rather than designed in from the start: the write-volume trigger this course keeps coming back to (50,000 writes/second, from the practice exercise coming up next) is a real concern here, but raw data size on its own isn't. Saying that out loud, with the actual number, is stronger than just asserting \"sharding isn't needed yet.\"",
        },
        {
          kind: "summary",
          heading: "What this example demonstrates",
          bullets: [
            "Every technique was introduced to fix a specific, named bottleneck — not applied by default because it's a well-known pattern.",
            "The read-heavy ratio, identified back in step 1, is the single fact that shaped almost every later decision — caching and read replicas both exist because of it.",
            "Even a detail as small as \"how is the short code generated\" carries a real trade-off (collision-checked random vs. encoded auto-increment) worth deciding on purpose, not by default.",
            "A design isn't finished at the happy-path diagram — naming what happens when a supporting piece (the cache cluster) fails entirely is part of a complete answer, not an optional extra.",
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
          kind: "example",
          heading: "Telling the client what happened, not just rejecting silently",
          body: "A rejected request should say so clearly enough that a well-behaved client can react correctly — retrying immediately just recreates the same problem a moment later.",
          language: "http",
          code: `HTTP/1.1 429 Too Many Requests
Retry-After: 30
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1719432600

{"error": "rate_limit_exceeded", "message": "Try again in 30 seconds"}`,
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Circuit breakers: backpressure applied to an unhealthy dependency",
          body: "A related pattern worth knowing by name: a circuit breaker wraps calls to a downstream dependency and, after enough failures in a row, \"trips\" — failing new calls immediately, without even attempting them, for a cooldown period before cautiously letting a few through to test recovery. It protects the caller from wasting time and resources on a dependency that's already struggling, and protects the struggling dependency from being hit with retries piling on top of its existing problems. Rate limiting protects a system from its clients; a circuit breaker protects a system from a dependency it relies on — the same defensive instinct, aimed in the other direction.",
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
          kind: "callout",
          tone: "tip",
          heading: "How to work through these",
          body: "Resist the urge to jump straight to the solution's structure — a database change, a new caching layer. Start by naming exactly which specific number in the scenario is the actual constraint (a request rate, a write volume, a fan-out size), and only then ask which technique from this course targets that specific number. The scenarios below are deliberately close to how these questions get asked in practice: a working design, plus one new fact that breaks something specific about it.",
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
          kind: "practice",
          heading: "3. A celebrity post creates a hot key in the feed cache",
          prompt:
            "A social feed system caches each user's feed as a pre-computed list under the key feed:{userId}. This works well until a celebrity account with 40 million followers posts, and a background job needs to update all 40 million cached feed entries — meanwhile, reads for the celebrity's own profile page (a single key, hit by a huge share of those same 40 million users checking the post) spike so hard they degrade the cache cluster for unrelated traffic. Identify the two distinct problems here and propose a fix for each.",
          hint:
            "These are two different mechanisms even though they share a trigger. One is a write-amplification problem (updating a huge number of cache entries for one event). The other is the same single key being read so heavily it behaves like the hot shard problem from the database lesson, just applied to a cache node instead of a database shard.",
          solution:
            "Problem 1 — write amplification: pre-computing and pushing a feed update to 40 million individual cached entries for a single post is the wrong model at this scale; it turns one event into 40 million writes. The standard fix is to flip from a push (fan-out-on-write) model to a pull (fan-out-on-read) model specifically for high-follower accounts: instead of writing the post into every follower's cached feed, store the post once, and merge it into a follower's feed at read time by checking a small list of \"who does this user follow that has enough followers to warrant pull instead of push.\" Most systems use a hybrid — fan-out-on-write for typical accounts (cheap, since follower counts are small), fan-out-on-read for high-follower accounts specifically (the celebrity threshold), rather than picking one model globally.\n\nProblem 2 — hot key: one cache key (the celebrity's profile or post) receiving a disproportionate share of reads is functionally identical to the hot shard problem, just at the cache layer — sharding the cache by key hash doesn't help, because it's one key, not a distribution-across-keys issue. The standard fix is local, in-process caching of that specific hot value on each app server (an additional cache layer in front of the shared cache, holding just the small number of genuinely hot keys), or replicating that one key across several cache nodes and load-balancing reads across the copies, rather than treating it as a normal key living on a single cache node.\nKey decision: recognizing that \"a celebrity posts\" isn't one problem — it's a write-side fan-out problem and a read-side hot-key problem that happen to share a trigger, and they need genuinely different fixes, not one bigger cache.",
        },
        {
          kind: "summary",
          heading: "What a correct solution demonstrates",
          bullets: [
            "Matching the algorithm to the actual traffic shape (token bucket tolerating legitimate bursts) rather than picking whichever rate-limiting technique is most familiar.",
            "Recognizing that shared enforcement across multiple servers requires a shared, atomic store — not assuming any in-memory or per-server approach generalizes.",
            "Correctly attributing a new bottleneck to the specific part of the system it actually stresses (writes vs. reads) instead of reflexively reapplying the same fix that solved a previous, different bottleneck.",
            "Separating two problems that share a trigger but need distinct fixes — a single \"add more cache\" instinct doesn't address either the fan-out or the hot-key dynamic on its own.",
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
