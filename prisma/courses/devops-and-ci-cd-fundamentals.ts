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
          kind: "bullets",
          heading: "Blue-green deployment",
          bullets: [
            "Two full environments exist: \"blue\" (live) and \"green\" (new).",
            "Traffic switches from blue to green all at once after green is verified healthy.",
            "Switching back is immediate if needed. Costs more since two environments run simultaneously.",
          ],
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
          kind: "text",
          heading: "Feature flags, as a complementary tool",
          body: [
            "A feature flag lets new code ship to production dark, then get turned on for specific users or ramped up gradually — independent of the deployment itself.",
          ],
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
            "Three exercises spanning CI automation, deployment strategy choice, and alerting — write your answer before checking the solution.",
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
      - run: npm test`,
        },
        {
          kind: "practice",
          heading: "Pick the right deployment strategy",
          prompt:
            "Your team is about to ship a rewrite of the checkout flow — high risk, and hard to fully validate in staging because real behavior depends on the live payment provider. Traffic is heavy and continuous. Choose rolling, blue-green, or canary for this specific release, and justify it in 2-3 sentences against the other two.",
          hint: "Which strategy specifically exposes new code to a small, controlled slice of *real* traffic before committing further — the thing staging can't fully substitute for here?",
          solution:
            "Canary. It exposes the rewrite to a small percentage of real production traffic and real payment-provider behavior — exactly what staging can't replicate — and can be halted before most users are affected if something's wrong. Rolling would eventually expose all real traffic to the new code at full scale before you've gathered much production signal; blue-green cuts over 100% of traffic in one step, carrying the same all-at-once risk without the incremental, real-world information a canary buys you first.",
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
    summary: "p95 latency above 800ms for 10+ minutes"`,
        },
        {
          kind: "summary",
          heading: "What a correct solution demonstrates",
          bullets: [
            "Automating fast feedback so a broken change fails in CI within minutes, not after a human notices in production.",
            "Matching a deployment strategy to the actual risk profile of a release, not defaulting to whatever's easiest to configure.",
            "Alerting on a threshold and duration tied to real user experience, avoiding both silence on real problems and noise on brief blips.",
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
          kind: "summary",
          heading: "The course, in five takeaways",
          bullets: [
            "DevOps is shared ownership and fast feedback loops between the people who write and the people who operate software — not a specific toolset.",
            "CI catches problems within minutes of a change; CD decides how (and how automatically) a passing change reaches production.",
            "Containers solve \"it works on my machine\" by packaging the exact runtime and dependencies an app needs.",
            "Rolling, blue-green, and canary all exist to answer one question: how many real users find out before someone notices and responds.",
            "A successful deploy is not proof the app works — metrics, logs, traces, and alerting are what actually catch that gap.",
          ],
        },
      ],
    },
  ],
};
