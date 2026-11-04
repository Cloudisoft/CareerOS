import type { CourseSeed } from "../course-types";

export const course: CourseSeed = {
  slug: "devops-and-ci-cd-fundamentals",
  title: "DevOps and CI/CD Fundamentals",
  description:
    "The practices and pipeline concepts that turn 'it works on my machine' into a reliable, repeatable path from commit to production.",
  category: "DevOps",
  level: "INTERMEDIATE",
  order: 6,
  lessons: [
    {
      title: "What DevOps Actually Means",
      durationMinutes: 5,
      slides: [
        {
          kind: "title",
          heading: "What DevOps Actually Means",
          subheading:
            "\"DevOps\" gets used loosely enough to mean almost anything. At its core, it's a specific idea: breaking down the separation between the people who write software and the people who operate it.",
        },
        {
          kind: "text",
          heading: "The cultural shift, briefly",
          body: [
            "Before DevOps became common practice, a development team would \"throw code over the wall\" to a separate operations team, who had to run it without having written it — friction, slow releases, mutual blame.",
          ],
        },
        {
          kind: "bullets",
          heading: "The practical pillars",
          bullets: [
            "Automation. Manual deployment steps are slow and error-prone; automating them (via CI/CD) makes releases fast and repeatable.",
            "Shared ownership. The team that builds a service is also on the hook for its reliability.",
            "Fast feedback loops. Small, frequent changes with fast feedback beat large, infrequent releases.",
            "Infrastructure as code. Environments defined in version-controlled configuration rather than manually clicked together.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "What DevOps is not",
          body: "Not a job title alone, and not simply \"using Docker\" or \"using Kubernetes\" — a team can use every modern tool and still not practice DevOps if deployments are manual, infrequent, and owned by a separate team from the people who wrote the code.",
        },
        {
          kind: "bullets",
          heading: "The four DORA metrics: measuring this instead of guessing",
          intro: "The DevOps Research and Assessment (DORA) team's research ties four measurable metrics to actual organizational performance — this is how \"we're doing DevOps well\" stops being a feeling:",
          bullets: [
            "Deployment frequency — how often code reaches production. Elite teams deploy on-demand, multiple times a day; low performers deploy monthly or less.",
            "Lead time for changes — time from a commit landing to it running in production. Hours for elite teams, versus weeks or months elsewhere.",
            "Change failure rate — the percentage of deployments that cause a production failure requiring a fix. Lower is better, and it's the metric that keeps \"deploy faster\" honest.",
            "Time to restore service — how long it takes to recover once a deployment does cause an incident. This is the metric that matters most when something inevitably goes wrong.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "\"You build it, you run it\"",
          body: "The phrase, associated with Amazon's Werner Vogels, captures the ownership half of DevOps concretely: the engineers who write a service also carry its on-call pager. That single structural change is what actually forces the cultural shift — nobody writes code they're comfortable being woken up for at 3am without also caring about its monitoring, its rollback plan, and its failure modes.",
        },
        {
          kind: "text",
          heading: "Blameless postmortems, the practice that makes shared ownership survive an incident",
          body: [
            "When something breaks, a blameless postmortem asks \"what in our systems and processes allowed this to happen\" instead of \"who broke it.\" The distinction isn't just being nice — a team that fears blame stops reporting near-misses and small mistakes, which is exactly the information that prevents the next, bigger incident. Shared ownership only holds up as a real practice if failure is treated as a systems problem to fix, not a person to blame.",
          ],
        },
        {
          kind: "text",
          heading: "Where the ideas actually came from",
          body: [
            "DevOps didn't appear from nowhere in 2009 — it borrows directly from Lean manufacturing (specifically the Toyota Production System's focus on small batches, fast feedback, and stopping the line the moment a defect is found) and from Agile software development's push toward shorter iteration cycles. The \"2009 Velocity conference\" moment often credited as DevOps's starting point was really the point where infrastructure and operations caught up to an idea software development had already been moving toward for years: smaller changes, shipped and verified faster, beat large changes shipped rarely.",
            "That lineage matters practically: a team struggling to adopt DevOps is often really struggling with the same underlying problem Lean and Agile both target — batch size. A deploy that bundles three weeks of changes is harder to review, harder to test, and harder to roll back than one that ships a single day's work; most of what DevOps prescribes is really just consistently choosing the smaller batch.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "A concrete before/after",
          body: "Before: a developer opens a ticket for the ops queue to deploy their change; three weeks later, on-call gets paged for a bug in code they didn't write and can't read; a postmortem names the developer who introduced it. After: the same developer merges, watches their own CI/CD pipeline deploy it within the hour, gets paged directly if it misbehaves, and a blameless retro afterward asks why the test suite didn't catch it. Nothing about the tooling has to differ between these two — the difference is entirely who owns what.",
        },
      ],
    },
    {
      title: "CI/CD Pipelines, Step by Step",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "CI/CD Pipelines, Step by Step",
          subheading:
            "A CI/CD pipeline automates the path from a code change to a running deployment.",
        },
        {
          kind: "bullets",
          heading: "Continuous Integration (CI)",
          intro: "Triggered on every code push. The point of CI is to catch problems within minutes of a change.",
          bullets: [
            "Build — compile the code / install dependencies.",
            "Lint/format check — catch style issues automatically.",
            "Automated tests — unit tests (fast, isolated) and often integration tests (slower).",
            "Security/dependency scanning — checking for known vulnerabilities.",
          ],
        },
        {
          kind: "terminal",
          heading: "What a CI run actually looks like",
          description: "The four checks from the previous slide, running in order and failing fast.",
          lines: [
            { text: "npm ci" },
            { text: "added 412 packages in 8s", output: true },
            { text: "npm run lint" },
            { text: "✔ No ESLint warnings or errors", output: true },
            { text: "npm test" },
            { text: "Tests: 118 passed, 118 total", output: true },
            { text: "npm audit --audit-level=high" },
            { text: "found 0 high severity vulnerabilities", output: true },
          ],
        },
        {
          kind: "text",
          heading: "Build once, promote everywhere",
          body: [
            "A common mistake: rebuilding the application separately for staging and for production. Even with identical source code, a separate build can pull a slightly different dependency version, use a different base image tag, or hit a flaky network blip — meaning what you actually tested in staging isn't bit-for-bit what reaches production.",
            "The fix is to build one versioned artifact (a Docker image tagged with the git SHA, or a compiled binary) after CI passes, push it to a registry, and promote that exact artifact through staging and then production — only the environment configuration changes between stages, never the artifact itself.",
          ],
        },
        {
          kind: "example",
          heading: "Caching dependencies to cut CI time",
          language: "yaml",
          body: "Re-downloading every dependency on every run wastes minutes per build — caching keyed on the lockfile hash skips that when nothing's changed:",
          code: `- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: npm-\${{ hashFiles('package-lock.json') }}
    restore-keys: npm-`,
        },
        {
          kind: "bullets",
          heading: "Secrets in CI: the credentials the pipeline itself needs",
          bullets: [
            "A CI job that deploys to production needs real credentials — cloud API keys, a registry push token — stored as encrypted secrets in the CI platform (GitHub Actions secrets, not hardcoded in the workflow file or committed to the repo).",
            "Scope those credentials to exactly what the job needs (push to one specific ECR repo, not full account access) — a compromised CI pipeline with overly broad credentials is a direct path to the production account, not just to the codebase.",
            "Secrets never appear in logs by default on major CI platforms (they're masked), but a poorly written script that echoes an environment variable for \"debugging\" can leak one anyway — worth checking before merging any workflow change that touches secret-bearing steps.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Flaky tests erode trust in the whole pipeline faster than you'd expect",
          body: "A test that fails intermittently for reasons unrelated to the actual change (timing, shared test-database state, network calls that should have been mocked) trains engineers to re-run CI until it goes green rather than investigate failures — which means a real failure gets re-run away too. Quarantine known-flaky tests into a separate, non-blocking job immediately, track them, and fix or delete them; don't let \"just retry it\" become the team's default response to red CI.",
        },
        {
          kind: "bullets",
          heading: "Continuous Delivery vs. Continuous Deployment",
          bullets: [
            "Continuous Delivery — every change that passes CI is built into a release-ready artifact, but a human triggers the actual deployment.",
            "Continuous Deployment — every change that passes CI deploys to production automatically, no manual gate.",
            "Continuous Deployment requires real confidence in test coverage and monitoring.",
          ],
        },
        {
          kind: "bullets",
          heading: "Common pipeline stages after CI passes",
          bullets: [
            "Deploy to a staging environment mirroring production.",
            "Run smoke tests against staging.",
            "Deploy to production, often using a strategy that limits blast radius.",
            "Post-deploy verification — automated health checks.",
          ],
        },
        {
          kind: "example",
          heading: "Running CI jobs in parallel with a matrix",
          language: "yaml",
          body: "Testing against multiple Node versions sequentially wastes time when they don't depend on each other — a matrix runs them concurrently instead:",
          code: `jobs:
  test:
    strategy:
      matrix:
        node-version: [18, 20, 22]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node-version }}
      - run: npm ci && npm test`,
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Split slow test suites instead of just parallelizing versions",
          body: "The same matrix mechanism splits one long test suite into several parallel shards (matrix: shard: [1, 2, 3, 4] with each job running a quarter of the tests) — a 20-minute suite becomes a 5-minute one on four runners. The catch: shards need to be balanced by actual runtime, not just file count, or one slow shard becomes the bottleneck the others wait on anyway.",
        },
        {
          kind: "bullets",
          heading: "Trunk-based development: the branching strategy CI actually assumes",
          intro: "A CI pipeline that runs on every push is only as useful as how often changes actually reach a shared branch — this is where branching strategy and CI/CD stop being separate topics:",
          bullets: [
            "Trunk-based development merges small changes to main multiple times a day, often behind a feature flag if the feature isn't finished — CI runs constantly against a branch that's always close to what's actually in production, and merge conflicts stay small because nothing sits unmerged for long.",
            "Long-lived feature branches — a branch that exists for weeks before merging — mean CI on that branch is testing an increasingly stale combination, and the merge back to main is where the real risk (and often the real bugs) actually show up, right at the moment everyone assumed the feature was done.",
            "This is why \"deployment frequency\" and \"lead time for changes,\" the DORA metrics from the previous lesson, correlate so strongly with branching strategy in practice — a team can have a fast, well-configured pipeline and still ship slowly if changes queue up for weeks before ever reaching it.",
            "Feature flags are what make trunk-based development survive unfinished work: merging incomplete code behind a flag that's off in production is safe in a way merging incomplete code directly into a live feature never is.",
          ],
        },
        {
          kind: "diagram",
          heading: "A commit's path through the pipeline",
          description: "Each stage from this lesson, in the order it actually runs.",
          steps: [
            { label: "Push", detail: "Triggers CI" },
            { label: "Build & Lint", detail: "Compile, install deps, style check" },
            { label: "Test", detail: "Unit, then integration" },
            { label: "Security Scan", detail: "Known-vulnerability check" },
            { label: "Deploy Staging", detail: "Mirrors production" },
            { label: "Smoke Test", detail: "Confirms staging works" },
            { label: "Deploy Production", detail: "Rolling, blue-green, or canary" },
            { label: "Health Check", detail: "Post-deploy verification" },
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Why this matters for anyone",
          body: "Even as an individual contributor, understanding what each pipeline stage checks for changes how you write code and tests.",
        },
      ],
    },
    {
      title: "Containers and Docker, Conceptually",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Containers and Docker, Conceptually",
          subheading:
            "Containers solve a specific, real problem: \"it works on my machine.\"",
        },
        {
          kind: "text",
          heading: "What a container actually is",
          body: [
            "A container packages an application with everything it needs to run — dependencies, runtime, system libraries, configuration — into a single, portable unit.",
            "Unlike a full VM, containers share the host OS kernel, making them far lighter weight.",
          ],
        },
        {
          kind: "example",
          heading: "The key mental model",
          body: "A Docker image is a snapshot — the packaged application and dependencies, built once. A container is a running instance of that image. You can run many containers from the same image.",
          code: `docker build -t my-app:1.0 .
docker run -p 3000:3000 my-app:1.0`,
        },
        {
          kind: "terminal",
          heading: "What that build and run actually print",
          lines: [
            { text: "docker build -t my-app:1.0 ." },
            { text: "[+] Building 14.2s (10/10) FINISHED", output: true },
            { text: " => [internal] load build definition from Dockerfile", output: true },
            { text: " => [4/5] RUN npm ci --omit=dev", output: true },
            { text: " => exporting to image", output: true },
            { text: " => => naming to docker.io/library/my-app:1.0", output: true },
            { text: "docker run -p 3000:3000 my-app:1.0" },
            { text: "Server listening on port 3000", output: true },
          ],
        },
        {
          kind: "text",
          heading: "Why this solves the \"works on my machine\" problem",
          body: [
            "If the image contains the exact runtime, dependency versions, and configuration, a container built from it behaves identically on a laptop, CI server, or production.",
          ],
        },
        {
          kind: "bullets",
          heading: "Dockerfiles, briefly",
          bullets: [
            "A Dockerfile is the recipe: start from a base image, copy in code, install dependencies, specify the start command.",
            "Each instruction adds a layer, and Docker caches layers that haven't changed.",
            "Dependency installation is typically ordered before copying application code so code changes don't invalidate the slower dependency-install cache layer.",
          ],
        },
        {
          kind: "bullets",
          heading: "Registries: where images actually live",
          intro: "A build on your laptop is only useful elsewhere once it's pushed somewhere other machines can pull it from:",
          bullets: [
            "Docker Hub is the default public registry; most teams running production workloads use a private one instead — Amazon ECR, Google Artifact Registry, or a self-hosted registry.",
            "An image name encodes its registry and tag: 123456789012.dkr.ecr.us-east-1.amazonaws.com/my-app:1.4.2 — no registry prefix at all means Docker Hub by default.",
            "The :latest tag is a convenience, not a version — it silently points at whatever was most recently pushed, which is exactly why production deployments should always reference an explicit, immutable tag (a version number or a git SHA) instead.",
          ],
        },
        {
          kind: "terminal",
          heading: "Basic troubleshooting commands",
          description: "The first three commands anyone reaches for when a running container isn't behaving.",
          lines: [
            { text: "docker ps" },
            { text: "CONTAINER ID   IMAGE          STATUS          PORTS", output: true },
            { text: "a1b2c3d4e5f6   my-app:1.0     Up 3 minutes    0.0.0.0:3000->3000/tcp", output: true },
            { text: "docker logs -f a1b2c3d4e5f6" },
            { text: "2024-03-11T14:02:01Z ERROR checkout: payment provider timeout", output: true },
            { text: "docker exec -it a1b2c3d4e5f6 sh" },
            { text: "/app # ", output: true },
          ],
        },
        {
          kind: "bullets",
          heading: "Images build in layers — and layers get reused",
          bullets: [
            "Each Dockerfile instruction (FROM, RUN, COPY) produces one immutable, cacheable layer, stacked on top of the previous one — the final image is the sum of all of them.",
            "Layers are content-addressed, so if two images share the exact same base-image layers, Docker (and the registry) only stores and transfers those shared layers once — this is why images built from a common base pull much faster the second time.",
            "docker history my-app:1.0 shows every layer in an image with its size — the fastest way to spot an accidentally bloated layer (a stray apt-get cache, a copied node_modules) that's inflating every image built from that Dockerfile.",
          ],
        },
        {
          kind: "text",
          heading: "Containers share a kernel — that's the speed, and the security caveat",
          body: [
            "Because containers share the host's OS kernel rather than each running their own, they start in milliseconds and use a fraction of a VM's memory overhead. The tradeoff: isolation between containers is weaker than between VMs — a kernel-level vulnerability can, in principle, let a process escape its container and reach the host or other containers, in a way a hypervisor boundary between VMs is specifically designed to prevent.",
            "In practice this means: don't run containers as root when avoidable, don't treat a container boundary as a substitute for real security controls on genuinely untrusted code, and keep the host kernel patched — the container doesn't insulate you from that.",
          ],
        },
        {
          kind: "text",
          heading: "Containers vs. virtual machines, precisely",
          body: [
            "A VM virtualizes an entire machine: a hypervisor sits between the VM and the physical hardware, and each VM runs its own full OS kernel, complete with its own boot process, its own device drivers, its own memory management — genuinely isolated from every other VM on the same host at the hardware-virtualization layer. That isolation is strong, but it's also why a VM takes tens of seconds to boot and reserves a fixed chunk of RAM whether or not it's using it.",
            "A container skips virtualizing hardware entirely and instead uses OS-level isolation features already built into the Linux kernel — namespaces (so a container sees only its own processes, network interfaces, and filesystem) and cgroups (which enforce CPU and memory limits). No second kernel is booted; the container's process is just a regular process on the host, isolated by the kernel rather than by virtualized hardware. That's the entire reason containers start in milliseconds instead of tens of seconds, and why a single host can run dozens of containers in the memory footprint of a handful of VMs.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Where this connects to orchestration",
          body: "Running dozens of containers across multiple machines, handling failures and scaling, is what Kubernetes exists to manage.",
        },
      ],
    },
    {
      title: "Deployment Strategies That Limit Blast Radius",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Deployment Strategies That Limit Blast Radius",
          subheading:
            "Deploying a new version by replacing the old one everywhere at once works — until the new version has a problem, at which point every user is affected simultaneously.",
        },
        {
          kind: "bullets",
          heading: "Rolling deployment",
          bullets: [
            "Instances are updated a few at a time, so at any moment some run the old version and some the new one.",
            "A problem partway through can pause the rollout with only a fraction of traffic affected.",
          ],
        },
        {
          kind: "terminal",
          heading: "A rolling update pausing itself automatically",
          description: "On Kubernetes, a rollout that starts failing its readiness checks halts on its own — this is what \"a problem partway through can pause the rollout\" actually looks like.",
          lines: [
            { text: "kubectl rollout status deployment/checkout" },
            { text: "Waiting for deployment \"checkout\" rollout to finish: 2 out of 5 new replicas have been updated...", output: true },
            { text: "Waiting for deployment \"checkout\" rollout to finish: 2 out of 5 new replicas have been updated...", output: true },
            { text: "error: deployment \"checkout\" exceeded its progress deadline", output: true },
            { text: "kubectl rollout undo deployment/checkout" },
            { text: "deployment.apps/checkout rolled back", output: true },
          ],
        },
        {
          kind: "bullets",
          heading: "Blue-green deployment",
          bullets: [
            "Two full environments exist: \"blue\" (live) and \"green\" (new).",
            "Traffic switches from blue to green all at once after green is verified healthy.",
            "Switching back is immediate if needed. Costs more since two environments run simultaneously.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "The database is the part blue-green doesn't neatly solve",
          body: "Instantly cutting traffic back to blue after a bad green release is only truly instant if both environments can safely talk to the same database schema. A migration that drops a column green no longer needs, but blue still reads, breaks the instant-rollback guarantee the moment you switch back. The standard fix is expand/contract migrations — add new columns and dual-write in one release, remove the old ones only in a later release once nothing references them — so both versions of the app can run against the same schema simultaneously.",
        },
        {
          kind: "bullets",
          heading: "Canary deployment",
          bullets: [
            "A new version is released to a small percentage of real traffic first (e.g., 5%), monitored closely, expanded only if healthy.",
            "Catches problems that only appear under real production load.",
          ],
        },
        {
          kind: "chart",
          heading: "Roughly how much traffic sees a bad release before rollback",
          description:
            "Not a hard rule — but it's why canary is usually the first strategy reached for on higher-risk changes.",
          chartType: "bar",
          unit: "% of users initially exposed",
          data: [
            { label: "Canary", value: 5 },
            { label: "Rolling (4 instances)", value: 25 },
            { label: "Blue-Green", value: 100 },
          ],
        },
        {
          kind: "text",
          heading: "Feature flags, as a complementary tool",
          body: [
            "A feature flag lets new code ship to production dark, then get turned on for specific users or ramped up gradually — independent of the deployment itself.",
          ],
        },
        {
          kind: "bullets",
          heading: "Recreate deployment: the naive baseline these all improve on",
          intro: "Worth naming explicitly, since it's the default a team falls into before adopting any of the above:",
          bullets: [
            "All old instances are stopped, then all new instances are started — the simplest possible strategy, and the one with the worst blast radius: 100% of users see downtime during the gap, and 100% of users are exposed the instant the new version starts, good or bad.",
            "It's still a reasonable choice for a low-traffic internal tool, a batch job, or anything where a short downtime window is genuinely fine — the other strategies exist to avoid a cost that isn't always worth paying to avoid.",
          ],
        },
        {
          kind: "bullets",
          heading: "Shadow deployments: real traffic, zero user exposure",
          intro: "A pattern distinct from all four strategies above, and worth knowing separately:",
          bullets: [
            "A shadow (or \"dark launch\") deployment receives a copy of real production traffic — mirrored, not routed — processes it, and its responses are discarded or compared against the live version's, but never actually returned to the user.",
            "This validates a new version against genuinely real traffic patterns and volume with zero blast radius, since a broken shadow deployment can error constantly without a single real user ever seeing a bad response.",
            "The tradeoff: it doubles infrastructure cost while it's running, and it only validates read-heavy or side-effect-free behavior cleanly — mirroring a request that writes to a database means either accepting duplicate writes or building deliberate isolation (a shadow database, a dry-run flag) so the shadow path doesn't corrupt real data.",
            "In practice this shows up most for a rewrite of a critical, high-traffic service (a pricing engine, a recommendation system) where the risk of a canary's smaller exposure still feels too high, and the team wants full-volume validation before any real user sees the new code at all.",
            "Shadow deployments and canaries aren't mutually exclusive — some teams shadow a rewrite first to catch obvious breakage risk-free, then canary the same version once shadow testing looks clean, treating the two as sequential stages of the same rollout rather than competing choices.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Canary is about safety, A/B testing is about a decision",
          body: "The two look similar — both route a percentage of traffic to a variant — but they answer different questions. A canary asks \"is this new version safe to release?\" and gets rolled forward to 100% or rolled back entirely based on error rate and latency. An A/B test asks \"which of these two versions do users prefer?\" and can run for weeks with both variants staying live simultaneously, judged on a business metric like conversion rate rather than error rate.",
        },
        {
          kind: "summary",
          heading: "The common thread",
          bullets: [
            "Every strategy exists to answer one question: if this deployment has a problem, how many real users find out before someone notices and can respond?",
          ],
        },
      ],
    },
    {
      title: "Observability: Metrics, Logs, Traces, and Alerting",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Observability: Metrics, Logs, Traces, and Alerting",
          subheading:
            "A deployment strategy limits how many users are affected by a bad release — but only if someone actually finds out something's wrong before they do.",
        },
        {
          kind: "bullets",
          heading: "The three pillars",
          bullets: [
            "Metrics — numeric time-series data (request rate, latency, error rate, CPU). Cheap to store, good for dashboards and threshold-based alerts, but tell you *that* something's wrong, not *why*.",
            "Logs — discrete, timestamped event records. Good for reconstructing exactly what happened at a specific moment, once you already know roughly where to look.",
            "Traces — follow a single request as it moves across multiple services, showing where time is actually being spent in a distributed system that metrics and logs alone can't reconstruct.",
          ],
        },
        {
          kind: "text",
          heading: "Why \"it's deployed\" isn't the same as \"it's fine\"",
          body: [
            "A deploy can succeed — containers started, the process is running, a basic health check passed — while the application is actually broken for a subset of users, or failing silently on a code path the health check never exercises. Only real signals about actual behavior catch that gap.",
          ],
        },
        {
          kind: "terminal",
          heading: "A passing health check next to a broken log stream",
          description: "Both of these are true at the same time — that's the gap observability closes.",
          lines: [
            { text: "curl -s -o /dev/null -w '%{http_code}\\n' https://api.acme.com/healthz" },
            { text: "200", output: true },
            { text: "tail -n 3 /var/log/app/checkout.log" },
            { text: "2024-03-11T14:02:01Z ERROR checkout: payment provider timeout after 3 retries", output: true },
            { text: "2024-03-11T14:02:03Z ERROR checkout: payment provider timeout after 3 retries", output: true },
            { text: "2024-03-11T14:02:05Z ERROR checkout: payment provider timeout after 3 retries", output: true },
          ],
        },
        {
          kind: "bullets",
          heading: "Structured logging: what makes logs actually searchable",
          intro: "A log line like \"payment failed\" is nearly useless once you have thousands of requests a minute — structured logging fixes that:",
          bullets: [
            "Log as JSON key-value fields (level, timestamp, request_id, user_id, message) instead of a free-text sentence, so a log aggregator can filter and group on any field instead of grepping for substrings.",
            "Propagate a single request_id (or correlation ID) generated at the edge through every downstream service call and into every log line it produces — this is what lets you pull every log entry tied to one specific failing request across five microservices in one query.",
            "Without a shared request ID, reconstructing what happened to one user's request across services means manually correlating log lines by timestamp and hoping nothing else happened at the same moment.",
          ],
        },
        {
          kind: "text",
          heading: "SLIs, SLOs, and error budgets: what alerting thresholds should be based on",
          body: [
            "An SLI (Service Level Indicator) is a specific measured metric — request latency, error rate. An SLO (Service Level Objective) is the target for it — \"99.9% of requests succeed in a rolling 30-day window.\" The gap between 100% and that target is the error budget: a 99.9% SLO allows about 43 minutes of full downtime (or an equivalent amount of partial degradation) per month before you've breached it.",
            "This reframes alerting from arbitrary thresholds to a real budget: burning error budget fast (a spike using up a week's allowance in an hour) pages immediately; burning it slowly might just need a ticket. It also gives teams a principled way to say no to a risky release — \"we're out of error budget this month\" is a harder argument to wave away than a vague feeling that things have been shaky.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "High-cardinality labels can quietly blow up your metrics bill",
          body: "Adding user_id or request_id as a label on a Prometheus metric seems harmless, but each unique label value creates a new time series — millions of users means millions of time series, which can crash a metrics backend or make queries unusably slow. Keep high-cardinality identifiers in logs and traces, where they belong, and keep metric labels to bounded, low-cardinality dimensions like status_code, method, or region.",
        },
        {
          kind: "bullets",
          heading: "RED and USE: two starting templates instead of a blank dashboard",
          intro: "\"Add some metrics\" is vague enough that teams often build dashboards nobody can quickly read during an incident — RED and USE are two well-established starting points instead of guessing:",
          bullets: [
            "RED (Rate, Errors, Duration) — for a request-driven service: how many requests per second, what fraction are erroring, and how long they take (usually as a percentile, like p50/p95/p99, since an average latency hides the slow tail that's actually causing complaints).",
            "USE (Utilization, Saturation, Errors) — for a resource, like a host, a disk, or a queue: how busy it is, how much work is queued waiting for it, and whether it's throwing errors. Better suited to infrastructure-level components than to request-driven services.",
            "A service's dashboard built around RED and its underlying infrastructure's dashboard built around USE, side by side, covers the large majority of \"where do I even start looking\" during an incident — without either framework, dashboards tend to accumulate whatever metric happened to be easy to add at the time, not what's actually useful under pressure.",
            "Percentiles matter more than they first seem: a p50 (median) latency of 80ms next to a p99 of 4 seconds means most users have a fine experience while roughly 1 in 100 has a genuinely broken one — an average alone would report something like 120ms and hide that tail completely.",
          ],
        },
        {
          kind: "example",
          heading: "A basic alerting rule",
          language: "yaml",
          code: `- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
  for: 5m
  labels:
    severity: page
  annotations:
    summary: "Error rate above 5% for 5+ minutes"`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Alert fatigue is a real failure mode, not a minor annoyance",
          body: "Too many low-signal alerts and on-call engineers start ignoring pages entirely — the exact opposite of the goal. Page only on symptoms a human needs to act on right now (user-facing error rate, latency past an SLO); route everything else to a dashboard or a log for later investigation instead.",
        },
        {
          kind: "summary",
          heading: "Where this connects back",
          bullets: [
            "A canary release is only as good as the metrics you're actually watching during it — without them, a canary just means the outage starts smaller, not that it gets caught.",
            "Good observability turns \"customers are complaining\" into \"the alert fired four minutes ago and here's the exact request path that's failing.\"",
          ],
        },
      ],
    },
    {
      title: "Practice: Building a Safer Deploy Pipeline",
      durationMinutes: 13,
      slides: [
        {
          kind: "title",
          heading: "Practice: Building a Safer Deploy Pipeline",
          subheading:
            "Six exercises spanning CI automation, credential scoping, deployment strategy, canary monitoring, alerting, and artifact integrity — write your answer before checking the solution.",
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "How to use this practice",
          body: "Every exercise below traces back to a specific failure mode this course covered — a slow-to-fail CI job, an over-scoped credential, a rollout that should've been halted, a release strategy mismatched to its actual risk. Write your own answer in your own words before checking the solution; the value here is in the diagnosis, not in memorizing six answers.",
        },
        {
          kind: "practice",
          heading: "Write a CI job that fails fast",
          prompt:
            "Write a GitHub Actions CI workflow for a Node.js app that triggers on every push, installs dependencies, and runs lint then tests — failing the whole job the moment either step fails, without wasting time on later steps.",
          hint: "GitHub Actions steps already run sequentially and stop the job on the first failing step by default — you don't need to add any special failure-handling for that part.",
          solution: `name: CI
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci          # exact, reproducible install from the lockfile
      - run: npm run lint    # job stops here automatically if lint fails
      - run: npm test

Why this ordering specifically: lint is far cheaper to run than the full
test suite, so putting it first means a purely stylistic mistake fails
in seconds instead of waiting behind a two-minute test run to find out.
Ordering steps cheapest-and-most-likely-to-catch-something first is a
small, easy habit that adds up across hundreds of CI runs a week.`,
        },
        {
          kind: "practice",
          heading: "Scope down an over-broad CI credential",
          prompt:
            "A CI job builds a Docker image, pushes it to one specific ECR repository, and updates one ECS service to use the new image. Someone under deadline pressure attached this IAM policy to the job's role to \"just make the permission error go away\":\n\n```json\n{\n  \"Effect\": \"Allow\",\n  \"Action\": \"*\",\n  \"Resource\": \"*\"\n}\n```\n\nRewrite it to follow least privilege — scoped to exactly what this job does, nothing else.",
          hint: "List the concrete actions the job performs (push an image, update a service) before writing any policy — a wildcard action or resource is a sign you haven't actually enumerated what's needed yet.",
          solution: `{
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["ecr:GetAuthorizationToken"],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["ecr:BatchCheckLayerAvailability", "ecr:PutImage", "ecr:InitiateLayerUpload", "ecr:UploadLayerPart", "ecr:CompleteLayerUpload"],
      "Resource": "arn:aws:ecr:us-east-1:123456789012:repository/acme-api"
    },
    {
      "Effect": "Allow",
      "Action": ["ecs:UpdateService", "ecs:DescribeServices"],
      "Resource": "arn:aws:ecs:us-east-1:123456789012:service/prod-cluster/acme-api"
    }
  ]
}
// ecr:GetAuthorizationToken has to stay account-wide — it's how ECR
// login itself works, not a resource-scoped action. Everything else is
// pinned to the one repository and one service this job actually
// touches, not "every repo and every service in the account."

Why this matters beyond tidiness: a compromised CI pipeline (a malicious
dependency, a leaked token) with this narrower policy can only push a
bad image to one repo and redeploy one service — with the original
wildcard policy, the same compromise is a direct path to deleting or
modifying anything in the entire AWS account.`,
        },
        {
          kind: "practice",
          heading: "Pick the right deployment strategy",
          prompt:
            "Your team is about to ship a rewrite of the checkout flow — high risk, and hard to fully validate in staging because real behavior depends on the live payment provider. Traffic is heavy and continuous. Choose rolling, blue-green, or canary for this specific release, and justify it in 2-3 sentences against the other two.",
          hint: "Which strategy specifically exposes new code to a small, controlled slice of *real* traffic before committing further — the thing staging can't fully substitute for here?",
          solution:
            "Canary. It exposes the rewrite to a small percentage of real production traffic and real payment-provider behavior — exactly what staging can't replicate — and can be halted before most users are affected if something's wrong. Rolling would eventually expose all real traffic to the new code at full scale before you've gathered much production signal; blue-green cuts over 100% of traffic in one step, carrying the same all-at-once risk without the incremental, real-world information a canary buys you first. Worth naming explicitly: canary is the right call here specifically because the risk is concentrated in real-world behavior (the live payment provider) that staging can't reproduce — for a change where the risk were purely about load at scale instead, that tradeoff might land differently.",
        },
        {
          kind: "terminal",
          heading: "The canary from that release, four minutes in",
          description:
            "5% of checkout traffic is on the new version. Here's what on-call actually sees while deciding whether to expand it or roll it back.",
          lines: [
            { text: "kubectl get pods -l app=checkout,track=canary" },
            { text: "NAME                        READY   STATUS    RESTARTS", output: true },
            { text: "checkout-canary-7f9c-2xk1   1/1     Running   0", output: true },
            { text: "curl -s https://internal-metrics.acme.com/checkout/error_rate?track=canary" },
            { text: '{"error_rate": 0.048, "sample_size": 812, "window": "4m"}', output: true },
            { text: "curl -s https://internal-metrics.acme.com/checkout/error_rate?track=stable" },
            { text: '{"error_rate": 0.006, "sample_size": 15400, "window": "4m"}', output: true },
          ],
        },
        {
          kind: "practice",
          heading: "Decide: expand the canary or roll it back",
          prompt:
            "Using the metrics on the previous slide — the canary's error rate is 4.8% against a stable baseline of 0.6%, on a sample of 812 canary requests over 4 minutes — what's the right call: expand the canary to more traffic, hold and keep watching, or roll it back? Justify your answer, including whether the sample size changes your confidence in the decision.",
          hint: "Compare the canary's error rate to the baseline as a ratio, not just as two small-looking percentages, and consider whether 812 requests is enough to trust that difference isn't noise.",
          solution:
            "Roll it back. 4.8% is roughly 8x the stable baseline's 0.6% error rate — that's not a marginal blip, it's an order-of-magnitude jump, and 812 requests over 4 minutes is a large enough sample that this isn't likely to be random noise at that gap size. The whole reason a canary release exists is to catch exactly this signal before it reaches the other 95% of traffic — continuing to hold and watch only makes sense when the numbers are close enough that more data would actually change the decision, and an 8x error-rate jump doesn't leave that kind of ambiguity. Roll back first, then investigate the cause with the smaller blast radius already contained, rather than debating it live while more users are exposed.",
        },
        {
          kind: "practice",
          heading: "Alert on the metric that matters",
          prompt:
            "Write a Prometheus-style alerting rule that pages on-call when the p95 request latency for a service exceeds 800ms for more than 10 minutes. Assume a histogram metric http_request_duration_seconds_bucket is already exported.",
          hint: "Use histogram_quantile() over rate() of the bucket metric to compute p95, and set `for:` long enough to avoid paging on a brief blip.",
          solution: `- alert: HighLatencyP95
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.8
  for: 10m
  labels:
    severity: page
  annotations:
    summary: "p95 latency above 800ms for 10+ minutes"

Two details worth defending if asked: the 5m window inside rate()
smooths out second-to-second noise in the underlying counter without
hiding a genuine sustained spike, and the "for: 10m" is what separates
a real, page-worthy trend from one bad minute that resolves on its own
— without it, this rule would fire (and wake someone up) on far more
transient blips than actual incidents.`,
        },
        {
          kind: "practice",
          heading: "Spot the build-once-promote-everywhere violation",
          prompt:
            "Review this deployment workflow. It looks reasonable at a glance, but it violates a principle covered earlier in this course. Identify the bug and fix it.\n\n```yaml\ndeploy-staging:\n  steps:\n    - run: docker build -t registry/app:latest .\n    - run: docker push registry/app:latest\n    - run: kubectl set image deployment/app app=registry/app:latest -n staging\n\ndeploy-production:\n  needs: [staging-smoke-tests]\n  steps:\n    - run: docker build -t registry/app:latest .\n    - run: docker push registry/app:latest\n    - run: kubectl set image deployment/app app=registry/app:latest -n production\n```",
          hint: "Compare what actually gets built in the staging job versus the production job — are they guaranteed to be the exact same bytes, or could something have changed between the two builds?",
          solution:
            "The bug: production runs `docker build` a second time instead of promoting the exact image staging already tested. Even with identical source code checked out, a second build can pull a slightly different dependency version, resolve a `latest` base-image tag differently, or just hit a flaky network blip — so what passed staging's smoke tests isn't provably what reaches production. It also tags everything `latest`, so there's no way to even name which specific build is running where.\n\nFix: build one image tagged with the immutable git SHA, push it once, and have both staging and production deploy that exact tag — never rebuild between stages.\n\n```yaml\nbuild:\n  steps:\n    - run: docker build -t registry/app:${{ github.sha }} .\n    - run: docker push registry/app:${{ github.sha }}\n\ndeploy-staging:\n  needs: [build]\n  steps:\n    - run: kubectl set image deployment/app app=registry/app:${{ github.sha }} -n staging\n\ndeploy-production:\n  needs: [staging-smoke-tests]\n  steps:\n    - run: kubectl set image deployment/app app=registry/app:${{ github.sha }} -n production\n```",
        },
        {
          kind: "summary",
          heading: "What a correct solution demonstrates",
          bullets: [
            "Automating fast feedback so a broken change fails in CI within minutes, not after a human notices in production.",
            "Scoping CI credentials to exactly what a job needs, so a compromised pipeline has a small blast radius instead of full account access.",
            "Matching a deployment strategy to the actual risk profile of a release, not defaulting to whatever's easiest to configure.",
            "Reading canary metrics against a baseline, not in isolation, and rolling back decisively once the gap is too large to be noise.",
            "Alerting on a threshold and duration tied to real user experience, avoiding both silence on real problems and noise on brief blips.",
            "Recognizing that a rebuilt artifact — even from identical source — isn't provably identical to what staging actually tested.",
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
          subheading: "Five questions across the whole course — not just the last lesson.",
        },
        {
          kind: "quiz",
          heading: "What DevOps actually means",
          question:
            "A team automates every deployment step with modern container tooling, but ships behind a manual approval from a separate ops team who didn't write the code, once a month. Are they \"practicing DevOps\"?",
          options: [
            "Yes, because they use modern container tooling",
            "No — DevOps is about shared ownership and fast feedback loops, not which tools are in the pipeline",
            "Yes, because a CI/CD pipeline exists",
            "No, because DevOps strictly requires Continuous Deployment",
          ],
          correctIndex: 1,
          explanation:
            "Tooling alone doesn't make a team \"DevOps\" — the separate approval process, owned by people other than those who wrote the code, and the once-a-month cadence are exactly the pattern DevOps exists to break.",
        },
        {
          kind: "quiz",
          heading: "Delivery vs. deployment",
          question: "What's the actual difference between Continuous Delivery and Continuous Deployment?",
          options: [
            "Continuous Delivery skips automated tests; Continuous Deployment doesn't",
            "Continuous Delivery produces a release-ready artifact after every passing change, but a human triggers the deploy; Continuous Deployment deploys automatically with no manual gate",
            "They're the same practice with different names",
            "Continuous Deployment only applies to staging environments",
          ],
          correctIndex: 1,
          explanation:
            "The distinction is entirely about the manual gate before production — Continuous Deployment requires enough confidence in tests and monitoring to remove it.",
        },
        {
          kind: "quiz",
          heading: "Dockerfile layer caching",
          question:
            "Why do well-written Dockerfiles typically copy package.json and install dependencies before copying the rest of the application code?",
          options: [
            "It's required by Docker's build syntax",
            "So the dependency-install layer is only re-run when dependencies actually change, instead of on every code edit",
            "It reduces how many containers Docker can create from the image",
            "It's necessary for EXPOSE to work correctly",
          ],
          correctIndex: 1,
          explanation:
            "Docker caches each layer and reuses it unchanged unless its instruction or inputs changed — copying manifests first means the slow install step is skipped on ordinary code changes.",
        },
        {
          kind: "quiz",
          heading: "Canary vs. rolling",
          question: "What specifically distinguishes a canary deployment from a rolling deployment?",
          options: [
            "Canary requires two full duplicate environments; rolling doesn't",
            "Canary intentionally routes a small, controlled percentage of real traffic to the new version and expands only if it stays healthy, rather than gradually replacing all instances by default",
            "Rolling deployments cannot be automated",
            "Canary deployments never involve any monitoring",
          ],
          correctIndex: 1,
          explanation:
            "A rolling deployment replaces instances gradually with the assumption each new one is fine once its health check passes; a canary deliberately limits and monitors real traffic exposure before expanding further.",
        },
        {
          kind: "quiz",
          heading: "Deploys vs. observability",
          question:
            "Every recent deploy shows as successful, and every container passed its health check, but customer complaints about a broken feature are coming in. What does this mainly illustrate?",
          options: [
            "Health checks are unnecessary and should be removed",
            "A successful deploy isn't the same as a working application for real users — exactly what metrics, logs, and traces exist to catch beyond deploy status",
            "This can only be explained by a bug in the CI pipeline itself",
            "The team should switch from rolling to blue-green deployments",
          ],
          correctIndex: 1,
          explanation:
            "A basic health check usually just confirms the process started and responds — it doesn't exercise every code path. Real observability (error rates, traces, user-facing metrics) is what catches problems a shallow health check misses.",
        },
        {
          kind: "quiz",
          heading: "Error budgets",
          question:
            "A service has a 99.9% SLO for a rolling 30-day window, and this month it has already used most of its error budget after a rocky release early in the month. A team wants to ship another risky change right now. What does the error budget framework suggest?",
          options: [
            "Ship it anyway — SLOs only matter at the very end of the 30-day window",
            "The error budget is a spending limit on acceptable failure, not just a target — burning most of it already is a concrete, non-emotional reason to delay a risky release until the budget resets or recovers",
            "Error budgets only apply to Continuous Deployment, not Continuous Delivery",
            "The team should immediately switch every deployment to blue-green",
          ],
          correctIndex: 1,
          explanation:
            "The entire point of an error budget is to turn 'should we ship this risky thing right now' from a vague feeling into a number — an SLO burned mostly through its allowance for the month is a legitimate, measurable reason to hold off, the same way a real budget being nearly spent is a reason to hold off on a discretionary purchase.",
        },
        {
          kind: "quiz",
          heading: "Structured logging and request IDs",
          question:
            "A request fails somewhere across five microservices, and nobody can tell which downstream call actually caused it without manually eyeballing timestamps across five separate log streams. What specific practice from this course prevents that?",
          options: [
            "Switching every service to use the same programming language",
            "Propagating one request ID (or correlation ID), generated at the edge, through every downstream call and into every log line those calls produce",
            "Increasing the log retention period",
            "Disabling debug-level logging in production",
          ],
          correctIndex: 1,
          explanation:
            "A shared request ID threaded through every service call and every log line it produces is what lets you pull every log entry tied to one specific failing request in a single query, across however many services it touched — without it, you're stuck manually correlating log lines by timestamp and hoping nothing else happened at the same moment.",
        },
        {
          kind: "summary",
          heading: "The course, in seven takeaways",
          bullets: [
            "DevOps is shared ownership and fast feedback loops between the people who write and the people who operate software — not a specific toolset.",
            "CI catches problems within minutes of a change; CD decides how (and how automatically) a passing change reaches production.",
            "Containers solve \"it works on my machine\" by packaging the exact runtime and dependencies an app needs.",
            "Rolling, blue-green, and canary all exist to answer one question: how many real users find out before someone notices and responds.",
            "A successful deploy is not proof the app works — metrics, logs, traces, and alerting are what actually catch that gap.",
            "An error budget turns \"should we ship this risky change right now\" into a measurable question instead of a judgment call.",
            "A shared request ID across services is what makes \"what happened to this one failing request\" answerable in minutes instead of an afternoon of log spelunking.",
          ],
        },
      ],
    },
  ],
};
