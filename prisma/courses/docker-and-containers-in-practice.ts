import type { CourseSeed } from "../course-types";

export const course: CourseSeed = {
  slug: "docker-and-containers-in-practice",
  title: "Docker and Containers in Practice",
  description:
    "Move past the conceptual pitch for containers and actually build one: real Dockerfiles, multi-stage builds, volumes, networking, and Compose.",
  category: "DevOps",
  level: "INTERMEDIATE",
  order: 17,
  lessons: [
    {
      title: "Images and Containers, With Real Commands",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Images and Containers, With Real Commands",
          subheading:
            "You've probably heard \"an image is a snapshot, a container is a running instance.\" This lesson makes that distinction concrete by actually building and running one.",
        },
        {
          kind: "example",
          heading: "Building and running from a Dockerfile",
          body: "Three commands, three different things happening. Confusing them is the single most common source of \"why isn't my change showing up\" confusion for people new to Docker.",
          code: `# Build an image from the Dockerfile in the current directory, tag it "myapp:1.0"
docker build -t myapp:1.0 .

# Run a container FROM that image — this is a new, isolated process
docker run -d -p 3000:3000 --name myapp-1 myapp:1.0

# Run a second, completely independent container from the same image
docker run -d -p 3001:3000 --name myapp-2 myapp:1.0

# List the running containers — you'll see two, both from myapp:1.0
docker ps`,
        },
        {
          kind: "text",
          heading: "What just happened",
          body: [
            "`docker build` read the Dockerfile, executed each instruction, and produced an image: a read-only, layered filesystem plus metadata about how to start a process from it. Nothing ran yet — this is closer to compiling a program than running one.",
            "Each `docker run` created a new container: a live process with its own writable filesystem layer, network namespace, and process tree, started from that same image. The two containers above share the same underlying image layers on disk but have zero effect on each other at runtime — killing myapp-2 doesn't touch myapp-1.",
          ],
        },
        {
          kind: "bullets",
          heading: "The mistake this distinction prevents",
          bullets: [
            "Editing a file inside a running container, then wondering why a fresh `docker run` doesn't have that edit — it's gone, because you changed the container's writable layer, not the image.",
            "Rebuilding an image and expecting already-running containers to update themselves — they won't. You have to stop the old container and run a new one from the new image.",
            "Assuming \"restarting the container\" is the same as \"getting the latest code\" — a restart reuses the same container and its stopped state; a rebuild is what actually incorporates new code.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "A useful mental shortcut",
          body: "Image = class. Container = instance. You build a class once and instantiate it as many times as you want; each instance has its own state and none of them can modify the class definition by living their own life.",
        },
      ],
    },
    {
      title: "Writing a Real Dockerfile",
      durationMinutes: 8,
      slides: [
        {
          kind: "title",
          heading: "Writing a Real Dockerfile",
          subheading:
            "A Dockerfile is a build recipe read top to bottom. The order you write instructions in isn't cosmetic — it directly controls how fast your rebuilds are.",
        },
        {
          kind: "example",
          heading: "A Node.js Dockerfile, instruction by instruction",
          language: "dockerfile",
          code: `FROM node:20-slim

WORKDIR /app

# Copy ONLY the dependency manifests first
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Now copy the rest of the application code
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]`,
        },
        {
          kind: "bullets",
          heading: "What each instruction actually does",
          bullets: [
            "FROM — the base image everything else builds on top of. `node:20-slim` gives you Node 20 on a trimmed-down Debian, instead of building a Linux userland yourself.",
            "WORKDIR — sets the working directory for every instruction after it, and creates it if it doesn't exist.",
            "COPY — copies files from your build context (the folder you ran `docker build` in) into the image.",
            "RUN — executes a command during the build and bakes its result into a new layer (installing dependencies, compiling assets).",
            "EXPOSE — documentation that the container listens on this port; it does not itself publish the port to your host.",
            "CMD — the default command run when a container starts from this image (overridable at `docker run` time).",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Why the manifest-then-code order matters",
          body: "Docker caches each layer and reuses it if the instruction and its inputs haven't changed. Copying package.json before the rest of the code means the (slow) `npm ci` layer only re-runs when dependencies actually change — editing application code no longer invalidates it. Copy everything at once instead, and every code change forces a full dependency reinstall on every build.",
        },
        {
          kind: "bullets",
          heading: "Common Dockerfile mistakes",
          bullets: [
            "Running as root inside the container with no USER instruction — fine for local dev, a real problem for anything production-facing.",
            "No .dockerignore — without one, `COPY . .` happily ships your local node_modules, .git folder, and .env file into the image.",
            "Using `latest` as a base image tag — it silently changes what \"the same Dockerfile\" builds from one day to the next.",
          ],
        },
      ],
    },
    {
      title: "Multi-Stage Builds",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Multi-Stage Builds",
          subheading:
            "Compiling and building often need tools you don't want in your final image at all. Multi-stage builds let you use them anyway — and throw them away.",
        },
        {
          kind: "text",
          heading: "The problem multi-stage builds fix",
          body: [
            "A TypeScript or React build needs the whole toolchain — the compiler, dev dependencies, source maps, the works. None of that needs to exist in the image that actually runs in production; it only needs the compiled output. Without multi-stage builds, people either ship a bloated image with the entire build toolchain in it, or hand-roll a separate build step outside Docker that quietly drifts from what the Dockerfile does.",
          ],
        },
        {
          kind: "example",
          heading: "Two stages, one Dockerfile",
          language: "dockerfile",
          code: `# Stage 1: build
FROM node:20 AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: run
FROM node:20-slim
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
CMD ["node", "dist/server.js"]`,
        },
        {
          kind: "bullets",
          heading: "Reading the two stages",
          bullets: [
            "AS builder names the first stage so it can be referenced later — it's a full build environment that exists only during the build.",
            "COPY --from=builder pulls specific files out of that stage into the new, final stage — nothing else from the builder stage comes along.",
            "The final image never contains the TypeScript compiler, the source .ts files, or any dev-only dependency — only what running the app actually requires.",
            "docker build still produces one image at the end (from the last stage) — the earlier stages exist only to produce inputs for it.",
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "The payoff is measurable",
          body: "It's common to see a single-stage image at 1.2GB shrink to under 200MB after switching to multi-stage — smaller images pull faster, start faster, and shrink your attack surface since tools an attacker could use (compilers, package managers) simply aren't there.",
        },
      ],
    },
    {
      title: "Volumes and Persistent Data",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Volumes and Persistent Data",
          subheading:
            "A container's writable layer disappears the moment the container is removed. If your app writes data it needs to keep, that's a problem you have to solve on purpose.",
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "The trap this catches people in",
          body: "A database running in a plain container looks fine for weeks — until someone runs `docker rm` to clean up, or a deploy replaces the container, and every row is gone. Containers are meant to be disposable; anything you can't afford to lose can't live only in a container's own filesystem.",
        },
        {
          kind: "example",
          heading: "Named volumes vs. bind mounts",
          code: `# Named volume — Docker manages where this lives on the host
docker volume create pgdata
docker run -d --name db -v pgdata:/var/lib/postgresql/data postgres:16

# Bind mount — you choose the exact host path, useful for local dev
docker run -d --name web \\
  -v $(pwd)/src:/app/src \\
  -p 3000:3000 myapp:1.0`,
        },
        {
          kind: "bullets",
          heading: "When to use which",
          bullets: [
            "Named volumes — for data a container produces and needs to persist (database files, uploaded assets). Docker owns the storage location; you just reference the volume by name.",
            "Bind mounts — for mapping a host directory straight into the container, most often your local source code during development so edits show up without a rebuild.",
            "Neither — for anything genuinely disposable (a cache that's fine to lose, a temp directory) — let it live in the container's writable layer and vanish with it.",
          ],
        },
        {
          kind: "summary",
          heading: "The rule of thumb",
          bullets: [
            "If losing the data would be a real problem, it does not belong only inside a container's writable layer.",
            "Named volumes for data the container itself owns and generates.",
            "Bind mounts for connecting to files that live on the host, most commonly your own source code.",
          ],
        },
      ],
    },
    {
      title: "Networking Between Containers",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Networking Between Containers",
          subheading:
            "Containers are isolated by default — two containers can't talk to each other, or to the outside world, unless you explicitly wire that up.",
        },
        {
          kind: "example",
          heading: "Publishing a port to your host",
          code: `# HOST:CONTAINER — 8080 on your machine forwards to 3000 inside the container
docker run -d -p 8080:3000 myapp:1.0

# Without -p, the container's port 3000 is reachable from
# other containers on the same network, but not from your host at all`,
        },
        {
          kind: "bullets",
          heading: "The -p flag, precisely",
          bullets: [
            "-p 8080:3000 means: traffic to localhost:8080 on your machine gets forwarded to port 3000 inside the container.",
            "The two numbers rarely need to match — your app can listen on 3000 internally while you expose it on 8080, or any port you choose, externally.",
            "This is for host-to-container traffic. It has nothing to do with whether two containers can reach each other.",
          ],
        },
        {
          kind: "example",
          heading: "Letting two containers talk to each other",
          code: `# Create a dedicated network
docker network create app-net

# Attach both containers to it
docker run -d --name db --network app-net postgres:16
docker run -d --name web --network app-net -p 8080:3000 myapp:1.0

# From inside "web", the database is reachable at the hostname "db" —
# Docker's embedded DNS resolves container names on a shared network`,
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Names, not IP addresses",
          body: "On a user-defined network, Docker gives every container a DNS entry matching its name. Your app's connection string can say host=db instead of a hardcoded IP that changes every time the container restarts — this is the mechanism that makes container-to-container communication actually maintainable.",
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "A frequent mix-up",
          body: "Containers not attached to the same network can't resolve each other by name even if both are running on the same host — \"running on my machine\" is not the same as \"on the same Docker network.\" This is the single most common cause of a working app on the host that can't reach its own database once containerized.",
        },
      ],
    },
    {
      title: "Docker Compose for Local Multi-Container Setups",
      durationMinutes: 8,
      slides: [
        {
          kind: "title",
          heading: "Docker Compose for Local Multi-Container Setups",
          subheading:
            "Once your app is a web service plus a database plus a cache, running three separate `docker run` commands by hand every time stops being reasonable. Compose describes the whole setup as one file.",
        },
        {
          kind: "example",
          heading: "A real docker-compose.yml",
          language: "yaml",
          code: `services:
  web:
    build: .
    ports:
      - "8080:3000"
    environment:
      - DATABASE_URL=postgresql://app:secret@db:5432/appdb
      - REDIS_URL=redis://cache:6379
    depends_on:
      - db
      - cache

  db:
    image: postgres:16
    environment:
      - POSTGRES_USER=app
      - POSTGRES_PASSWORD=secret
      - POSTGRES_DB=appdb
    volumes:
      - pgdata:/var/lib/postgresql/data

  cache:
    image: redis:7

volumes:
  pgdata:`,
        },
        {
          kind: "bullets",
          heading: "What Compose is doing for you",
          bullets: [
            "One docker network is created automatically, and every service can reach the others by name — db and cache above, exactly like the manual `docker network create` from the last lesson.",
            "build: . tells Compose to build the web image from the Dockerfile in this directory, rather than pulling a pre-built one, the way image: postgres:16 does.",
            "The named volume pgdata persists database data across `docker compose down` and `docker compose up`, as long as you don't add the -v flag to explicitly remove volumes.",
            "depends_on controls start order, not readiness — Postgres accepting connections and Postgres's container merely existing are two different points in time, worth handling with a retry loop in your app's startup code.",
          ],
        },
        {
          kind: "example",
          heading: "The commands you'll actually run",
          code: `docker compose up -d        # start everything, in the background
docker compose logs -f web  # tail logs for one service
docker compose down         # stop and remove containers (volumes are kept)
docker compose down -v      # also remove named volumes — data is gone`,
        },
        {
          kind: "summary",
          heading: "Where this fits",
          bullets: [
            "Compose is a local-development and single-host tool — it describes \"these containers, together, on this machine.\"",
            "It is not an orchestrator for production traffic across multiple machines, automatic failover, or rolling deploys — that's the problem Kubernetes exists to solve.",
            "Treat your docker-compose.yml as documentation of your app's real dependencies, kept in the repo, not a wiki page describing them.",
          ],
        },
      ],
    },
    {
      title: "Securing and Resource-Limiting Containers in Production",
      durationMinutes: 8,
      slides: [
        {
          kind: "title",
          heading: "Securing and Resource-Limiting Containers in Production",
          subheading:
            "A container that works on your laptop isn't automatically safe to run in production — a short list of defaults needs to be deliberately overridden first.",
        },
        {
          kind: "example",
          heading: "Running as a non-root user",
          language: "dockerfile",
          code: `FROM node:20-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .

# Create a dedicated, unprivileged user instead of running as root
RUN addgroup --system app && adduser --system --ingroup app app
USER app

EXPOSE 3000
CMD ["node", "server.js"]`,
        },
        {
          kind: "bullets",
          heading: "Other production defaults worth overriding",
          bullets: [
            "A read-only root filesystem (`docker run --read-only`, with explicit writable mounts only for the few paths that truly need writes) so a compromised process can't rewrite the application itself.",
            "Dropping unneeded Linux capabilities (`--cap-drop=ALL --cap-add=<only what's actually needed>`) instead of accepting Docker's broader default set.",
            "Scanning images for known vulnerabilities in the base image and dependencies (Docker Scout, Trivy, or a registry's built-in scanner) as an automated CI step, not an occasional manual check.",
          ],
        },
        {
          kind: "example",
          heading: "Resource limits, at run time",
          code: `docker run -d \\
  --name web \\
  --memory="512m" \\
  --cpus="1.0" \\
  --restart=on-failure:5 \\
  myapp:1.0`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Without limits, one container can starve every other container on the host",
          body: "A memory leak or runaway process with no --memory cap can consume all of a shared host's RAM, taking down unrelated containers that had nothing to do with the bug. The isolation containers give you by default doesn't include resource fairness — that has to be set explicitly.",
        },
        {
          kind: "summary",
          heading: "The practical baseline",
          bullets: [
            "Add a non-root USER to any Dockerfile heading toward production — it's one of the cheapest security wins available.",
            "Set memory and CPU limits on anything sharing a host with other workloads.",
            "Scan images in CI, not manually and occasionally — a base image that was clean last month often isn't today.",
          ],
        },
      ],
    },
    {
      title: "Practice: Hardening and Debugging Containers",
      durationMinutes: 14,
      slides: [
        {
          kind: "title",
          heading: "Practice: Hardening and Debugging Containers",
          subheading: "Three exercises — a Dockerfile fix, a debugging scenario, and a production run command — write your own answer first.",
        },
        {
          kind: "practice",
          heading: "Make this Dockerfile run as non-root",
          prompt:
            "Rewrite this Dockerfile so the container runs as a non-root user, without breaking the app:\n\nFROM node:20-slim\nWORKDIR /app\nCOPY package.json package-lock.json ./\nRUN npm ci --omit=dev\nCOPY . .\nEXPOSE 3000\nCMD [\"node\", \"server.js\"]",
          hint: "You need to create a system user/group and switch to it with USER before CMD — and consider whether the app writes anything to disk at runtime that the new user needs permission for.",
          solution: `FROM node:20-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .

# Create an unprivileged user and hand ownership of /app to it —
# needed if the app writes anything (logs, temp files) at runtime
RUN addgroup --system app && adduser --system --ingroup app app \\
  && chown -R app:app /app
USER app

EXPOSE 3000
CMD ["node", "server.js"]`,
        },
        {
          kind: "practice",
          heading: "Debug a restarting container",
          prompt:
            "`docker ps` shows a container cycling between \"Up 2 seconds\" and \"Restarting (1) 4 seconds ago\". `docker logs mycontainer` prints `Error: connect ECONNREFUSED 127.0.0.1:5432` right before each restart. It was started with `docker run -d --name mycontainer --restart=always myapp:1.0` (no --network flag), and a separate `db` container running Postgres already exists. Diagnose the cause and fix it.",
          hint: "What does 127.0.0.1 actually refer to inside a container? And are these two containers even on a network where they could resolve each other by name?",
          solution: `# The app is connecting to 127.0.0.1, which inside its own container means
# itself — nothing is listening there, since Postgres runs in a different
# container entirely. It's also never been attached to any network shared
# with "db", so even a corrected hostname couldn't resolve.

docker network create app-net
docker run -d --name db --network app-net postgres:16
docker run -d --name mycontainer --network app-net \\
  -e DB_HOST=db \\
  --restart=on-failure \\
  myapp:1.0
# DB_HOST=db lets the app connect to the "db" container by its network name
# instead of 127.0.0.1, and --network app-net makes that name resolvable.`,
        },
        {
          kind: "practice",
          heading: "Write a production-ready run command",
          prompt:
            "Write a single `docker run` command for a production web container that: limits it to 256MB memory and 0.5 CPU, restarts on failure but gives up after 3 attempts instead of looping forever, runs detached, and maps host port 8080 to the container's port 3000.",
          hint: "--restart accepts on-failure:N for a bounded retry count, rather than always which retries forever.",
          solution: `docker run -d \\
  --name web \\
  -p 8080:3000 \\
  --memory="256m" \\
  --cpus="0.5" \\
  --restart=on-failure:3 \\
  myapp:1.0`,
        },
        {
          kind: "summary",
          heading: "What a correct solution demonstrates",
          bullets: [
            "Adding a non-root user without breaking file permissions the app actually needs at runtime.",
            "Diagnosing container-to-container networking failures from log output and the run command itself, instead of guessing at application code.",
            "Writing a run command with resource and restart limits appropriate for a shared production host, not just \"whatever works locally.\"",
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
          heading: "Image vs. container",
          question:
            "You edit a file inside a running container, then run `docker run` again from the same image without rebuilding. Where is your edit?",
          options: [
            "In the new container automatically, since containers share the image's writable layer",
            "Gone — the edit lived only in the old container's own writable layer, never in the image",
            "In the image, but not in any container",
            "Saved automatically to a bind mount",
          ],
          correctIndex: 1,
          explanation:
            "A container's writable layer is its own — changes made inside a running container never propagate back into the image it was started from, or into any other container started from that same image.",
        },
        {
          kind: "quiz",
          heading: "Base image tags",
          question:
            "A Dockerfile builds fine locally but produces a noticeably different result months later, using the exact same file with no code changes. What's the most likely cause?",
          options: [
            "Docker's build cache expired on its own",
            "The base image is pinned to a moving tag like `latest` instead of a specific version, so the same Dockerfile now pulls a different underlying image",
            ".dockerignore rules expire automatically after some months",
            "COPY instructions are non-deterministic by design",
          ],
          correctIndex: 1,
          explanation:
            "A tag like `latest` (or any unpinned tag) can point to a different image over time — the Dockerfile text didn't change, but what FROM actually resolves to did.",
        },
        {
          kind: "quiz",
          heading: "Multi-stage builds",
          question: "What does a multi-stage build actually remove from your final image compared to a single-stage build?",
          options: [
            "Nothing — multi-stage builds only affect build speed, not the final image's size or contents",
            "The build-time toolchain and intermediate files (compilers, dev dependencies, pre-compiled source) only needed to produce the final artifact, not to run it",
            "The application's own runtime dependencies",
            "All environment variables set anywhere in the Dockerfile",
          ],
          correctIndex: 1,
          explanation:
            "COPY --from pulls only specific files out of an earlier build stage — everything else that stage installed (compilers, dev-only packages, source before compilation) never reaches the final image.",
        },
        {
          kind: "quiz",
          heading: "Volumes",
          question:
            "You need a Postgres container's data to survive `docker rm` and a full container replacement during a deploy. What's the right tool?",
          options: [
            "A bind mount pointing at a temp directory",
            "A named volume, since Docker manages its storage independent of any single container's lifecycle",
            "Nothing — Postgres data persists automatically regardless of how the container is run",
            "The container's own writable layer, since it survives docker rm by default",
          ],
          correctIndex: 1,
          explanation:
            "A container's writable layer is deleted with the container — a named volume is Docker-managed storage that outlives any one container and can be re-attached to whatever replaces it.",
        },
        {
          kind: "quiz",
          heading: "Container networking",
          question:
            "Containers \"web\" and \"db\" are both running on the same Docker host, started with plain `docker run` and no shared `--network` beyond Docker's default. Can \"web\" reach \"db\" using the hostname \"db\"?",
          options: [
            "Yes — all containers on the same host can always resolve each other by name",
            "Not reliably — DNS-based name resolution between containers requires both to be attached to the same user-defined network, not merely running on the same host",
            "Yes, but only if both containers expose the exact same port",
            "No — containers can never communicate with each other under any configuration",
          ],
          correctIndex: 1,
          explanation:
            "\"Running on the same machine\" is not the same as \"on the same Docker network.\" Name-based resolution only works between containers explicitly attached to a shared user-defined network.",
        },
        {
          kind: "summary",
          heading: "The course, in six takeaways",
          bullets: [
            "An image is a built snapshot; a container is a running instance of it — edits inside a container never change the image.",
            "Order Dockerfile instructions so dependency installs are cached separately from application code changes.",
            "Multi-stage builds keep build-only tools and files out of the image that actually ships.",
            "Named volumes persist data a container owns; bind mounts connect to files that live on the host.",
            "Container-to-container communication requires an explicit shared network — proximity on the same host isn't enough.",
            "Production containers need a non-root user, resource limits, and a bounded restart policy — none of that is on by default.",
          ],
        },
      ],
    },
  ],
};
