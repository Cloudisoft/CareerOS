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
  ],
};
