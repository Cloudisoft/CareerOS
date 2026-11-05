import type { CourseSeed } from "../course-types";

export const course: CourseSeed = {
  slug: "kubernetes-fundamentals",
  title: "Kubernetes Fundamentals",
  description:
    "The core objects, mechanisms, and mental model behind Kubernetes — for engineers who already know their way around a container.",
  category: "DevOps",
  level: "INTERMEDIATE",
  order: 18,
  lessons: [
    {
      title: "The Problem Kubernetes Actually Solves",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "The Problem Kubernetes Actually Solves",
          subheading:
            "Docker answers \"how do I package and run one container.\" Kubernetes answers a different question: how do I run hundreds of containers, across many machines, without babysitting them by hand.",
        },
        {
          kind: "text",
          heading: "What running containers by hand looks like at scale",
          body: [
            "Imagine 30 containers across 6 servers. A server dies — someone has to notice, and manually start those containers elsewhere. Traffic doubles — someone has to manually start more copies and figure out which server has room. A new version ships — someone has to carefully replace containers one at a time so the app stays up during the rollout. None of this is hard to do once. It's unsustainable to do by hand, every day, at 3am, without mistakes.",
          ],
        },
        {
          kind: "text",
          heading: "What teams built before Kubernetes existed",
          body: [
            "Nobody ignored this problem before Kubernetes — most teams facing it built their own automation. A shell script triggered by cron that pinged a health endpoint and restarted a service if it didn't respond. An Ansible playbook that SSH'd into a fleet of servers, one by one, to redeploy a new build. A cloud provider's auto-scaling group wired to a CPU metric that only sort of matched what the application actually needed. It worked, in the sense that outages got shorter. It also meant every company reinvented the same brittle wheel, undocumented and slightly different each time, with the one engineer who understood the deploy script being exactly the person paged at 3am when it broke.",
          ],
        },
        {
          kind: "example",
          heading: "A homegrown restart script, and what it doesn't handle",
          language: "bash",
          code: `# cron: */2 * * * * /opt/scripts/watchdog.sh
#!/bin/bash
if ! curl -sf http://localhost:3000/health > /dev/null; then
  echo "$(date) unhealthy, restarting" >> /var/log/watchdog.log
  systemctl restart web-app
fi

# Handles: a single process wedged on one known server.
# Doesn't handle: which of 6 servers has spare capacity for
# a new copy, replacing copies gradually during a version
# rollout without downtime, or the server itself being gone.`,
        },
        {
          kind: "bullets",
          heading: "What Kubernetes takes over",
          bullets: [
            "Scheduling — deciding which machine in the cluster each container should run on, based on available resources.",
            "Self-healing — noticing a container died and starting a replacement, automatically, without a human paging anyone.",
            "Scaling — running more or fewer copies of something in response to a declared target or load.",
            "Service discovery — giving a moving, scaling set of containers a stable way to find and talk to each other.",
            "Rolling updates — replacing old containers with new ones gradually, so the app keeps serving traffic the whole time.",
            "Configuration and secrets management — distributing config and credentials to the right containers without baking them into an image.",
            "Storage orchestration — attaching persistent disks to whichever node a stateful Pod happens to land on, and following it if it moves.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "The core idea: declarative, not imperative",
          body: "You don't tell Kubernetes the steps to take. You describe the end state you want — \"3 copies of this container, always running\" — and a set of controllers continuously compare that desired state to what's actually running, taking action to close any gap. This loop, run over and over, is the mechanism behind both self-healing and scaling.",
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "\"Just write a better script\" doesn't actually scale",
          body: "The instinct when a watchdog script breaks is usually to patch it — add a check for this edge case, a retry for that one. But every patch makes the script handle one more scenario while staying blind to the next one, and nobody is testing it against the full range of failures a real cluster hits: partial network partitions, a node that's alive but unreachable, two deploys racing each other. Kubernetes isn't a bigger script — it's a general-purpose control loop that was built, tested, and hardened against exactly those edge cases by an entire community, which is a different kind of investment than one team's cron job can ever be.",
        },
        {
          kind: "chart",
          heading: "Recovery time: hand-rolled scripts vs. a reconciliation loop",
          description: "Illustrative numbers from a mid-size team's incident review, comparing the same node failure handled three different ways.",
          chartType: "bar",
          unit: "minutes to recover",
          data: [
            { label: "No automation, paged manually", value: 34 },
            { label: "Cron watchdog script", value: 9 },
            { label: "Kubernetes self-healing", value: 0.5 },
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "The bigger win is a shared API, not just automation",
          body: "A team's cron scripts and Ansible playbooks are usually specific to that team's infrastructure — they don't transfer to a new hire, a different cloud, or a laptop running a local cluster for testing. Kubernetes' object model (Pods, Deployments, Services) is identical whether the cluster is a three-node bare-metal rack, a managed EKS cluster, or Minikube on a laptop. That portability, as much as the automation itself, is why it became the industry standard rather than just one more in-house scheduler. A resume line reading \"experience with Kubernetes\" means something concrete and transferable in a way \"wrote deploy scripts\" never quite does.",
        },
      ],
    },
    {
      title: "Pods: The Smallest Deployable Unit",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Pods: The Smallest Deployable Unit",
          subheading:
            "Kubernetes doesn't schedule containers directly — it schedules Pods. Understanding why is the first real \"aha\" moment in learning Kubernetes.",
        },
        {
          kind: "example",
          heading: "A minimal Pod definition",
          language: "yaml",
          code: `apiVersion: v1
kind: Pod
metadata:
  name: web-app
  labels:
    app: web-app
spec:
  containers:
    - name: web
      image: myregistry/web-app:1.4
      ports:
        - containerPort: 3000`,
        },
        {
          kind: "terminal",
          heading: "Applying that Pod",
          lines: [
            { text: "kubectl apply -f pod.yaml" },
            { text: "pod/web-app created", output: true },
            { text: "kubectl get pods" },
            { text: "NAME      READY   STATUS    RESTARTS   AGE", output: true },
            { text: "web-app   1/1     Running   0          4s", output: true },
          ],
        },
        {
          kind: "bullets",
          heading: "Why a wrapper around containers at all",
          bullets: [
            "A Pod is one or more containers that are always scheduled together, on the same machine, sharing the same network namespace and, optionally, storage.",
            "Every container in a Pod shares one IP address and one port space — two containers in the same Pod can't both bind port 3000, the same constraint as two processes on one host.",
            "Most Pods run exactly one container — the wrapper exists for the cases where a second, tightly coupled container genuinely needs to travel with the first.",
            "The classic case is a \"sidecar\": a log-shipping or service-mesh proxy container that runs alongside your app container, reachable at localhost because they share a network namespace.",
            "Containers in the same Pod still have separate filesystems by default — sharing storage between them requires an explicit shared volume, like the logs example below.",
          ],
        },
        {
          kind: "example",
          heading: "A two-container Pod: app plus sidecar",
          body: "Both containers start together, share localhost, and live or die as a unit — the sidecar reads logs the app container writes to a shared volume.",
          language: "yaml",
          code: `apiVersion: v1
kind: Pod
metadata:
  name: web-app
spec:
  containers:
    - name: web
      image: myregistry/web-app:1.4
      volumeMounts:
        - name: logs
          mountPath: /var/log/app
    - name: log-shipper
      image: myregistry/log-shipper:1.0
      volumeMounts:
        - name: logs
          mountPath: /var/log/app
  volumes:
    - name: logs
      emptyDir: {}`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Pods are disposable — don't create them directly",
          body: "A bare Pod, if its node dies, is simply gone — nothing recreates it. In real usage you almost never write `kind: Pod` yourself; you describe a Deployment (next lesson), and Kubernetes creates and manages the Pods for you, replacing them automatically when they disappear.",
        },
        {
          kind: "diagram",
          heading: "A Pod's lifecycle phases",
          description: "kubectl get pods shows one of these phases in the STATUS column — knowing what each means is most of debugging a stuck Pod.",
          steps: [
            { label: "Pending", detail: "Accepted by the API server, not yet scheduled or still pulling its image" },
            { label: "ContainerCreating", detail: "Scheduled to a node; the runtime is pulling the image and starting the container" },
            { label: "Running", detail: "At least one container is running — this alone doesn't mean it's ready for traffic" },
            { label: "Succeeded / Failed", detail: "All containers exited; restartPolicy decides whether kubelet tries again" },
          ],
        },
        {
          kind: "text",
          heading: "What labels are for",
          body: [
            "The `labels: app: web-app` block isn't decoration — labels are how every other Kubernetes object finds this Pod. A Service finds the Pods it should send traffic to by matching labels, not by name or IP. That indirection is what lets Pods be replaced constantly without anything that depends on them needing to change.",
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "requests and limits, briefly",
          body: "Every container in a Pod can declare `resources.requests` (what the scheduler reserves for it when choosing a node) and `resources.limits` (a hard ceiling the runtime enforces). Set requests too low and the scheduler happily packs far more Pods onto a node than it can actually sustain under real load; set limits too low on memory specifically and the container gets OOMKilled the moment it needs more, restarting in a loop even though nothing in the application is actually broken.",
        },
        {
          kind: "terminal",
          heading: "Reading a Pod's events when something's wrong",
          description: "describe surfaces the scheduler's and kubelet's own running commentary — usually the fastest way to see why a Pod isn't Running yet.",
          lines: [
            { text: "kubectl describe pod web-app" },
            { text: "Events:", output: true },
            { text: "  Type    Reason     Age   From               Message", output: true },
            { text: "  ----    ------     ----  ----               -------", output: true },
            { text: "  Normal  Scheduled  10s   default-scheduler  Successfully assigned default/web-app to node-2", output: true },
            { text: "  Normal  Pulling    9s    kubelet            Pulling image \"myregistry/web-app:1.4\"", output: true },
            { text: "  Normal  Pulled     6s    kubelet            Successfully pulled image in 2.8s", output: true },
            { text: "  Normal  Started    5s    kubelet            Started container web", output: true },
          ],
        },
        {
          kind: "bullets",
          heading: "initContainers: setup that must finish before the app container starts",
          intro: "A Pod can declare one or more initContainers that run to completion, in order, before any of the Pod's regular containers start at all:",
          bullets: [
            "A common use: waiting for a dependency to be reachable (a database accepting connections) before the app container even attempts to start, instead of relying on the app's own retry logic to paper over a dependency that isn't ready yet.",
            "Another common use: running a one-time setup step — downloading a config file, running a database migration, cloning a git repo into a shared volume — that the main container then reads from, without bundling that setup logic into the app image itself.",
            "If an initContainer fails, kubelet retries it (subject to the Pod's restartPolicy) and the regular containers never start until every initContainer has succeeded — this is a hard gate, not a best-effort head start.",
            "initContainers show up in kubectl describe pod's events and in kubectl get pods' STATUS column as Init:0/1 or similar while they're still running — worth recognizing that status specifically, since it means the app container hasn't even attempted to start yet, not that it's crashing.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "A Pod gets a new IP every single time it's recreated",
          body: "This is the detail that makes Services necessary rather than a nice-to-have. When a Pod restarts because of a crash, a node failure, or a rolling update, it isn't the same Pod resuming — it's a brand new Pod with a brand new internal IP address, and its old IP is simply gone, reassigned to whatever the scheduler places next. Anything that cached or hardcoded the old Pod's IP breaks the moment that happens. Pods are meant to be treated as ephemeral, interchangeable units — which is exactly the problem the next lesson's Services solve.",
        },
      ],
    },
    {
      title: "Deployments: Declarative Scaling and Self-Healing",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Deployments: Declarative Scaling and Self-Healing",
          subheading:
            "A Deployment is the object you actually write day to day — it describes a Pod template and how many copies of it should exist, then keeps that promise.",
        },
        {
          kind: "example",
          heading: "A real Deployment",
          language: "yaml",
          code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
        - name: web
          image: myregistry/web-app:1.4
          ports:
            - containerPort: 3000`,
        },
        {
          kind: "bullets",
          heading: "How self-healing actually works",
          bullets: [
            "replicas: 3 is a target the Deployment's controller continuously enforces, not a one-time instruction.",
            "If a node crashes and takes a Pod with it, the controller notices the running count dropped below 3 and schedules a replacement — usually within seconds.",
            "This is the same mechanism, not a special case: scaling up is just changing replicas to a higher number and watching the controller create more Pods to match.",
            "This is also why Deployments are the right place to configure a horizontal pod autoscaler — the HPA just changes replicas automatically based on observed CPU or a custom metric, using the exact same reconciliation path as a manual kubectl scale.",
          ],
        },
        {
          kind: "example",
          heading: "Scaling and updating from the command line",
          code: `# Scale to 5 replicas
kubectl scale deployment web-app --replicas=5

# Roll out a new image version
kubectl set image deployment/web-app web=myregistry/web-app:1.5

# Watch the rollout replace Pods gradually
kubectl rollout status deployment/web-app

# Undo it if something's wrong
kubectl rollout undo deployment/web-app`,
        },
        {
          kind: "terminal",
          heading: "What the rollout actually prints",
          lines: [
            { text: "kubectl scale deployment web-app --replicas=5" },
            { text: "deployment.apps/web-app scaled", output: true },
            { text: "kubectl set image deployment/web-app web=myregistry/web-app:1.5" },
            { text: "deployment.apps/web-app image updated", output: true },
            { text: "kubectl rollout status deployment/web-app" },
            {
              text: "Waiting for deployment \"web-app\" rollout to finish: 2 out of 5 new replicas have been updated...",
              output: true,
            },
            { text: "deployment \"web-app\" successfully rolled out", output: true },
            { text: "kubectl logs -l app=web-app --tail=1" },
            { text: "web-app-7d9f6c5b8d-4kx2p 2024-03-11T10:02:01Z Server listening on port 3000", output: true },
            { text: "web-app-7d9f6c5b8d-8j5nq 2024-03-11T10:02:03Z Server listening on port 3000", output: true },
            { text: "kubectl rollout undo deployment/web-app" },
            { text: "deployment.apps/web-app rolled back", output: true },
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Rolling updates, under the hood",
          body: "By default a Deployment replaces old Pods with new ones a few at a time, only removing an old Pod once a new one is confirmed healthy — never all at once. That's what lets `kubectl set image` ship a new version with zero downtime, and what makes `kubectl rollout undo` a fast, safe way to reverse a bad deploy.",
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "A common mistake: editing a Pod directly to \"fix\" it",
          body: "If a Pod managed by a Deployment is misbehaving, editing it directly with `kubectl edit pod` feels faster than touching the Deployment — and it's almost always wrong. The Deployment's controller doesn't know about your manual edit; the next reconciliation pass replaces that Pod with a fresh one built from the unedited template, silently discarding the fix. Anything you want to persist has to go into the Deployment's Pod template, not onto a Pod instance directly.",
        },
        {
          kind: "bullets",
          heading: "Two more fields you'll see on almost every real Pod spec",
          bullets: [
            "restartPolicy — Always (the default, and what Deployments use), OnFailure, or Never; controls whether kubelet restarts a container after it exits.",
            "env — environment variables passed into the container, often sourced from a ConfigMap or Secret rather than written as literal values in the manifest.",
            "imagePullPolicy — IfNotPresent (default for a fixed tag) vs. Always; using a moving tag like `:latest` without Always risks a node silently running a stale cached image.",
          ],
        },
        {
          kind: "text",
          heading: "The object you don't usually see: ReplicaSet",
          body: [
            "A Deployment doesn't manage Pods directly — it manages a ReplicaSet, and the ReplicaSet manages the Pods. Every time you change the Pod template (a new image, an added env var), the Deployment creates a brand new ReplicaSet at 0 replicas, then shifts replicas from the old ReplicaSet to the new one gradually — that shift is the rolling update. The old ReplicaSet is kept around at 0 replicas rather than deleted, which is exactly what `kubectl rollout undo` uses to roll back instantly instead of reapplying an old manifest from scratch.",
          ],
        },
        {
          kind: "diagram",
          heading: "One Deployment, two revisions",
          description: "Each Pod template change gets its own ReplicaSet — this is the actual mechanism behind rollout and rollback.",
          steps: [
            { label: "Deployment web-app", detail: "Owns a Pod template and a revision history" },
            { label: "ReplicaSet rev. 1 (image :1.4)", detail: "Scaled to 0 after the rollout completes, kept for rollback" },
            { label: "ReplicaSet rev. 2 (image :1.5)", detail: "Scaled up to 5 — this is what's actually running now" },
          ],
        },
        {
          kind: "example",
          heading: "Controlling how aggressive a rollout is",
          body: "maxSurge caps how many extra Pods can exist during the rollout; maxUnavailable caps how many can be down. Together they trade rollout speed against how much capacity you're willing to lose mid-deploy.",
          language: "yaml",
          code: `spec:
  replicas: 10
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2          # up to 12 Pods total during rollout
      maxUnavailable: 1    # never fewer than 9 healthy Pods`,
        },
        {
          kind: "terminal",
          heading: "Inspecting and targeting rollback by revision",
          lines: [
            { text: "kubectl rollout history deployment/web-app" },
            { text: "REVISION  CHANGE-CAUSE", output: true },
            { text: "1         kubectl apply --record", output: true },
            { text: "2         kubectl set image deployment/web-app web=myregistry/web-app:1.5", output: true },
            { text: "kubectl rollout undo deployment/web-app --to-revision=1" },
            { text: "deployment.apps/web-app rolled back", output: true },
          ],
        },
        {
          kind: "bullets",
          heading: "PodDisruptionBudgets: protecting availability during voluntary disruptions",
          intro: "A rolling update is a voluntary disruption Kubernetes controls carefully — but node drains for cluster maintenance or a cluster autoscaler scaling down are voluntary disruptions too, and by default nothing stops them from taking out too many Pods of the same Deployment at once:",
          bullets: [
            "A PodDisruptionBudget (PDB) sets a floor — minAvailable: 2, say — that voluntary disruptions must respect; Kubernetes will delay or block an eviction that would drop a Deployment's healthy Pod count below that floor.",
            "This only governs voluntary disruptions initiated through the Kubernetes API (a node drain, a cluster autoscaler decision) — it has no effect on an involuntary one, like a node actually crashing or losing power, which Kubernetes can't negotiate with after the fact.",
            "Without a PDB, draining three nodes for maintenance in quick succession could legally evict every single replica of a Deployment simultaneously if they all happened to land on those three nodes — technically \"voluntary\" and technically respecting nothing, since there was no floor set to respect.",
            "A PDB is what makes a cluster upgrade or a node pool replacement something an operator can run confidently during business hours, rather than something scheduled for 2am specifically because nobody's sure how much capacity it'll take out at once.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "A rollout that never finishes usually means a broken readinessProbe, not a slow one",
          body: "If `kubectl rollout status` hangs at \"2 out of 5 new replicas updated\" indefinitely, the new Pods are almost always stuck failing readiness — the Deployment refuses to keep replacing old Pods until the new ones report healthy, which is the safety mechanism working exactly as designed, not a bug in the rollout itself. `kubectl describe pod` on one of the new replicas, not the Deployment itself, is where the real cause shows up — usually a failing readinessProbe or a container stuck in CrashLoopBackOff.",
        },
      ],
    },
    {
      title: "Services: Stable Networking for Unstable Pods",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Services: Stable Networking for Unstable Pods",
          subheading:
            "Pods get replaced constantly and each one gets a new IP address when it is. A Service is the fix: a stable address in front of a shifting set of Pods.",
        },
        {
          kind: "example",
          heading: "A Service targeting the Deployment above",
          language: "yaml",
          code: `apiVersion: v1
kind: Service
metadata:
  name: web-app
spec:
  selector:
    app: web-app
  ports:
    - port: 80
      targetPort: 3000
  type: ClusterIP`,
        },
        {
          kind: "bullets",
          heading: "What's actually happening",
          bullets: [
            "selector: app: web-app is the same label-matching mechanism from the Deployment — the Service continuously tracks which Pods currently carry that label.",
            "A Service exists independently of any Deployment — it happily matches Pods from two different Deployments, or Pods created by hand, as long as the labels line up.",
            "Other things in the cluster reach this Service at a stable DNS name (web-app) and it load-balances across whichever Pods are healthy right now — callers never need a Pod's actual IP.",
            "port is what callers connect to; targetPort is the port the container actually listens on — they don't have to match, same as `docker run -p`.",
            "A Service load-balances at the connection/packet level via kube-proxy, using a simple round-robin-ish algorithm — it has no concept of one Pod being slower or more loaded than another.",
          ],
        },
        {
          kind: "diagram",
          heading: "A request's path through a Service",
          description: "Callers never target a Pod directly — the Service picks a healthy one every time.",
          steps: [
            { label: "Client", detail: "Connects to web-app:80" },
            { label: "Service (ClusterIP)", detail: "Load-balances across Pods matching app: web-app" },
            { label: "Pod (any of 3)", detail: "Whichever is currently healthy and labeled correctly" },
          ],
        },
        {
          kind: "bullets",
          heading: "The three Service types that matter",
          bullets: [
            "ClusterIP (the default) — reachable only from inside the cluster. Right for internal services like a database or an internal API.",
            "NodePort — opens a fixed port on every cluster node, reachable from outside. Simple, but rarely what you want in production.",
            "LoadBalancer — asks the cloud provider to provision a real external load balancer in front of the Service. The standard way to expose something to the internet on a managed cluster.",
          ],
        },
        {
          kind: "text",
          heading: "How the DNS name actually resolves",
          body: [
            "That stable `web-app` name isn't magic — Kubernetes runs a cluster DNS server (CoreDNS) that every Pod is configured to use. It registers a record for every Service automatically, at the full form `<service>.<namespace>.svc.cluster.local`. Inside the same namespace, the short name `web-app` resolves fine; reaching a Service in a different namespace requires either the namespaced form (`web-app.billing.svc.cluster.local`) or the shorter `web-app.billing`. Get this wrong and the failure mode is a DNS lookup error, not a connection error — worth knowing when you're debugging which layer actually failed, since \"could not resolve host\" and \"connection refused\" point at entirely different fixes.",
          ],
        },
        {
          kind: "terminal",
          heading: "A Service with zero endpoints — the most common Service bug",
          description: "The Service exists and has an IP, but nothing is behind it. This is almost always a selector/label mismatch, not a networking problem.",
          lines: [
            { text: "kubectl get endpoints web-app" },
            { text: "NAME      ENDPOINTS   AGE", output: true },
            { text: "web-app   <none>      2m", output: true },
            { text: "kubectl get pods --show-labels" },
            { text: "NAME              READY   STATUS    LABELS", output: true },
            { text: "web-app-4kx2p     1/1     Running   app=web,tier=frontend", output: true },
            { text: "# Service selector is app=web-app — no Pod actually carries that label" },
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "\"Running\" Pods aren't automatically endpoints",
          body: "A Service only adds a Pod to its Endpoints once that Pod also passes its readinessProbe (covered a couple lessons from now). A Pod stuck at 0/1 Ready shows up in `kubectl get pods` but never shows up in `kubectl get endpoints` — which is exactly the point, since a Service should never route live traffic to something that isn't ready to handle it.",
        },
        {
          kind: "example",
          heading: "Reaching a Service from outside the cluster, for local debugging",
          body: "port-forward is the fastest way to poke at an internal, ClusterIP-only Service from your own machine without exposing it publicly.",
          language: "bash",
          code: `kubectl port-forward svc/web-app 8080:80
# Forwarding from 127.0.0.1:8080 -> 3000
# now http://localhost:8080 reaches the Service exactly
# as any in-cluster caller would, load-balanced across
# whichever Pods are currently healthy`,
        },
        {
          kind: "bullets",
          heading: "Headless Services: when you actually want the individual Pod IPs",
          intro: "Setting clusterIP: None on a Service opts out of the load-balancing behavior entirely, and it's a deliberate, named pattern rather than a misconfiguration:",
          bullets: [
            "Instead of one virtual IP that load-balances across Pods, a headless Service's DNS name resolves directly to the IP addresses of every matching, ready Pod — the caller gets the full list and decides what to do with it.",
            "This matters for StatefulSets in particular (each replica of a database cluster, say, needs to be addressed individually — replica-0, replica-1 — not load-balanced interchangeably, since they aren't interchangeable), and for client-side load balancing, where the application itself picks which endpoint to use rather than relying on kube-proxy's round-robin.",
            "A regular Service's DNS name is one A record; a headless Service's DNS name returns multiple A records, one per healthy Pod — the same underlying label-selector mechanism, just exposed differently to whatever's doing the lookup.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "A Service's ClusterIP doesn't change even when every Pod behind it does",
          body: "This is the whole point, worth stating explicitly: the Service's IP and DNS name are allocated once and stay fixed for the Service's lifetime, completely independent of the constant churn of Pods being created and destroyed behind it. Anything that hardcodes a Pod's IP instead of a Service's name will break the next time that Pod gets replaced — which, given rolling updates and self-healing, is a matter of when, not if. This is also why application config should always reference a Service's DNS name, never an IP address copied out of `kubectl get pods` during local testing.",
        },
      ],
    },
    {
      title: "Ingress: Routing Traffic Into the Cluster",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Ingress: Routing Traffic Into the Cluster",
          subheading:
            "A LoadBalancer Service per app gets expensive and hard to manage fast. Ingress lets many services share one entry point, routed by hostname or path.",
        },
        {
          kind: "example",
          heading: "Routing two services through one Ingress",
          language: "yaml",
          code: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: main-ingress
spec:
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: api-service
                port:
                  number: 80
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web-app
                port:
                  number: 80`,
        },
        {
          kind: "bullets",
          heading: "Reading the rule",
          bullets: [
            "Requests to myapp.example.com/api/* get routed to api-service; everything else on that host goes to web-app.",
            "Both backends are ordinary ClusterIP Services — Ingress sits in front of them, so neither needs its own external load balancer.",
            "New services added later just mean adding another rule to the same Ingress object — no new external IP, no new DNS record to provision.",
            "In practice, one LoadBalancer Service fronts the Ingress controller itself, and every app in the cluster can share that single entry point — so a cluster typically has exactly one or two LoadBalancer Services total, not one per application.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "An Ingress object alone does nothing",
          body: "Ingress is a spec that a separate piece of software — an Ingress controller (commonly nginx-ingress or a cloud provider's own) — has to be running in the cluster to actually implement. Writing Ingress YAML with no controller installed produces a routing rule nothing is reading.",
        },
        {
          kind: "text",
          heading: "Why not just give every Service a LoadBalancer?",
          body: [
            "You can — nothing stops you from setting `type: LoadBalancer` on ten different Services. The problem shows up on the bill and in your DNS zone: most cloud providers charge per load balancer, so ten Services means ten load balancers, each with its own external IP that something has to point a DNS record at. Ingress collapses all of that into one external IP and one load balancer, with routing decided by hostname and path inside the cluster instead of by provisioning a new piece of cloud infrastructure for every service you ship.",
          ],
        },
        {
          kind: "example",
          heading: "TLS termination at the Ingress layer",
          body: "The controller handles the HTTPS handshake using a cert stored as a Secret — backend Services and Pods only ever see plain HTTP, which simplifies certificate management to one place instead of per-app. In practice most teams automate issuing and renewing that Secret with cert-manager rather than uploading certificates by hand.",
          language: "yaml",
          code: `spec:
  tls:
    - hosts:
        - myapp.example.com
      secretName: myapp-tls-cert
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web-app
                port:
                  number: 80`,
        },
        {
          kind: "terminal",
          heading: "Checking whether a controller is actually installed",
          description: "Before debugging Ingress rules, confirm something is implementing them at all.",
          lines: [
            { text: "kubectl get pods -n ingress-nginx" },
            { text: "NAME                                        READY   STATUS    AGE", output: true },
            { text: "ingress-nginx-controller-7c9f8b6d5-2xqvz     1/1     Running   14d", output: true },
            { text: "kubectl get ingress main-ingress" },
            { text: "NAME            CLASS   HOSTS                  ADDRESS         PORTS", output: true },
            { text: "main-ingress    nginx   myapp.example.com     34.120.11.203   80, 443", output: true },
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "The ingressClassName ties an Ingress to a specific controller",
          body: "A cluster can run more than one Ingress controller at once (nginx for public traffic, a different one for internal-only routes, say). `spec.ingressClassName` on the Ingress object is what tells Kubernetes which controller should pick up a given rule — leave it unset in a cluster with several controllers installed and the routing rule may simply never get implemented by anything, the same silent failure as having no controller at all.",
        },
        {
          kind: "bullets",
          heading: "Path matching, in the order it actually gets evaluated",
          bullets: [
            "pathType: Exact — matches only that literal path, nothing else.",
            "pathType: Prefix — matches that path and everything under it (/api matches /api/users and /api/users/42).",
            "Most controllers pick the most specific matching rule regardless of the order the rules are written in — don't rely on ordering to break ties between two overlapping paths.",
          ],
        },
        {
          kind: "bullets",
          heading: "Controller-specific annotations: the part the Ingress spec itself doesn't cover",
          intro: "The core Ingress spec covers routing by host and path — almost everything else useful in practice is added through annotations specific to whichever controller is installed:",
          bullets: [
            "nginx.ingress.kubernetes.io/rewrite-target rewrites the matched path before forwarding it to the backend — routing /api/orders to a service that itself expects requests at just /orders, without the backend needing to know about the /api prefix at all.",
            "nginx.ingress.kubernetes.io/limit-rps sets a per-IP rate limit at the Ingress layer, stopping abusive traffic before it ever reaches a backend Pod, rather than every service having to implement its own rate limiting independently.",
            "Because these are controller-specific rather than part of the core Kubernetes API, the exact annotation names differ across nginx-ingress, Traefik, and a cloud provider's own controller — migrating from one Ingress controller to another usually means rewriting every annotation, even when the underlying routing behavior stays conceptually identical.",
            "This is the practical tradeoff behind Ingress's portability: the routing rules themselves are portable Kubernetes API objects, but a non-trivial Ingress setup often has more configuration living in annotations than in the portable part of the spec.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Ingress load-balances at the HTTP layer, not the TCP layer",
          body: "An Ingress controller terminates the HTTP request and makes its own routing decision on every single request based on host and path — it isn't just forwarding a raw connection. That matters for things like WebSockets and gRPC, which need specific controller annotations or configuration to work correctly through an Ingress at all, and it's why an Ingress can't route based on anything below the HTTP layer, like raw TCP or UDP traffic — that still needs a plain LoadBalancer Service. A database or message broker exposed outside the cluster, for instance, goes through a LoadBalancer Service directly, never through Ingress.",
        },
      ],
    },
    {
      title: "A Mental Model for a Basic Cluster",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "A Mental Model for a Basic Cluster",
          subheading:
            "Every object from this course runs somewhere concrete. This lesson puts the pieces together into one picture of what a cluster physically is.",
        },
        {
          kind: "bullets",
          heading: "The control plane — the brain",
          bullets: [
            "API server — the front door. Every kubectl command and every internal component talks to the cluster only through here.",
            "etcd — the cluster's database, storing the desired state of every object (your Deployments, Services, and so on).",
            "Scheduler — decides which node a new Pod should run on, based on resource requests and current node capacity.",
            "Controller manager — runs the reconciliation loops (Deployment, replica count, and more) that keep actual state matching desired state.",
            "Cloud controller manager — on managed clusters, the piece that talks to the cloud provider's API to provision things like LoadBalancer Services and cloud disks on your behalf.",
          ],
        },
        {
          kind: "bullets",
          heading: "The worker nodes — where things run",
          bullets: [
            "kubelet — the agent on each node that actually starts, stops, and monitors containers, taking instructions from the control plane.",
            "Container runtime — the software that runs containers (commonly containerd) — the same layer Docker itself sits on.",
            "kube-proxy — implements the networking rules that let Services actually route traffic to the right Pods on this node.",
          ],
        },
        {
          kind: "text",
          heading: "Tying it back to the objects you've already seen",
          body: [
            "You write a Deployment. The API server stores it in etcd. The controller manager notices it wants 3 Pods and creates them. The scheduler assigns each to a node. Each node's kubelet actually starts the containers via the container runtime. A Service's selector picks those Pods up automatically because of their labels, and kube-proxy on every node makes that Service's address route correctly. Nothing here is magic — it's the same declarative loop from lesson one, running at every layer.",
          ],
        },
        {
          kind: "diagram",
          heading: "One Deployment, from kubectl apply to a running container",
          steps: [
            { label: "kubectl apply", detail: "Sent to the API server" },
            { label: "etcd", detail: "Desired state stored: 3 replicas" },
            { label: "Controller manager", detail: "Notices 0 of 3 Pods exist, creates them" },
            { label: "Scheduler", detail: "Assigns each Pod to a node" },
            { label: "kubelet", detail: "Starts the container via the runtime" },
          ],
        },
        {
          kind: "terminal",
          heading: "Looking at real node capacity",
          description: "Every scheduling decision comes down to comparing this against what a Pod requests.",
          lines: [
            { text: "kubectl get nodes -o wide" },
            { text: "NAME     STATUS   ROLES    AGE   VERSION", output: true },
            { text: "node-1   Ready    <none>   40d   v1.29.2", output: true },
            { text: "node-2   Ready    <none>   40d   v1.29.2", output: true },
            { text: "kubectl describe node node-2" },
            { text: "Capacity:      cpu: 4    memory: 16026868Ki", output: true },
            { text: "Allocatable:   cpu: 3800m  memory: 14930Mi", output: true },
            { text: "Non-terminated Pods: (11 in total) — 3200m cpu requested, 6144Mi memory requested", output: true },
          ],
        },
        {
          kind: "text",
          heading: "Namespaces: the organizational boundary, not a security one",
          body: [
            "One more piece that fits into this picture: a namespace is a way to partition objects within one cluster — `kubectl get pods -n billing` versus `kubectl get pods -n checkout` are entirely separate sets of Pods, Services, and Deployments, even though they're scheduled onto the exact same nodes. It's useful for organizing teams or environments (staging vs. production namespaces in one cluster) and for applying resource quotas per team. It is not a hard security boundary by default — Pods in different namespaces can still reach each other over the network unless a NetworkPolicy says otherwise.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "What happens if the control plane goes down",
          body: "Existing Pods keep running — kubelet on each node doesn't need to reach the API server to keep a container alive that's already started. What stops working is anything that requires reconciliation: a crashed Pod won't be replaced, `kubectl apply` has nothing to talk to, and a node failure during the outage means those Pods are genuinely gone until the control plane is back. This is exactly why managed offerings (EKS, GKE, AKS) run the control plane redundantly across multiple machines on the provider's side — you never SSH into it, but its availability is still the foundation everything else depends on.",
        },
        {
          kind: "bullets",
          heading: "What \"managed\" actually means in practice",
          bullets: [
            "On EKS, GKE, and AKS you never see or operate the API server, etcd, scheduler, or controller manager directly — the provider runs and patches them, and you interact only through kubectl and the provider's own dashboard.",
            "What you do still operate: the worker nodes (or a serverless variant that hides those too), the workloads you deploy, and networking/IAM glue connecting the cluster to the rest of the cloud account.",
            "Self-hosting the control plane yourself (kubeadm, k3s on your own hardware) is common for learning, on-prem requirements, or cost at very large scale — but it means you now own etcd backups and control plane upgrades, not just application deploys.",
          ],
        },
        {
          kind: "bullets",
          heading: "Node pools, taints, and tolerations: not every node is identical",
          intro: "A production cluster is rarely one uniform pool of identical machines — this is how Kubernetes lets different workloads land on the right hardware:",
          bullets: [
            "A node pool (or node group) is a set of nodes with the same instance type and configuration — a cluster commonly runs several: a general-purpose pool, a GPU pool for ML workloads, a spot-instance pool for fault-tolerant batch jobs.",
            "A taint on a node repels Pods by default — kubectl taint nodes gpu-1 workload=ml:NoSchedule means nothing gets scheduled there unless it explicitly tolerates that taint, keeping general workloads off expensive GPU nodes they don't need.",
            "A toleration on a Pod spec is what lets it land on a tainted node despite the taint — the ML workload's Pod spec declares a toleration matching the GPU pool's taint, and only Pods that declare it can be scheduled there.",
            "nodeSelector and nodeAffinity work the other direction — pulling a Pod toward specific nodes based on labels, rather than a taint pushing other Pods away — and the two mechanisms are commonly used together: a taint keeps the wrong workloads off, and a matching nodeSelector or toleration is what lets the right one on.",
          ],
        },
        {
          kind: "summary",
          heading: "What to remember",
          bullets: [
            "You describe desired state; controllers continuously reconcile actual state to match it.",
            "Pods are the unit that runs; Deployments manage Pods; Services give a stable address to a changing set of Pods; Ingress routes external traffic to Services.",
            "The control plane decides and tracks; the nodes' kubelets and container runtimes are what actually execute anything.",
          ],
        },
      ],
    },
    {
      title: "Health Checks: Liveness, Readiness, and Startup Probes",
      durationMinutes: 8,
      slides: [
        {
          kind: "title",
          heading: "Health Checks: Liveness, Readiness, and Startup Probes",
          subheading:
            "Kubernetes replacing a dead Pod only works if it can actually tell the Pod is dead. Probes are how it knows — without them, a hung process just keeps serving broken responses indefinitely.",
        },
        {
          kind: "text",
          heading: "The gap self-healing alone doesn't cover",
          body: [
            "By default, kubelet only notices a container if its main process actually exits or crashes. A process that's still running but deadlocked, stuck retrying a dependency forever, or wedged in some other way looks perfectly healthy to Kubernetes — the container's still there, it's just not doing anything useful.",
          ],
        },
        {
          kind: "bullets",
          heading: "The three probe types",
          bullets: [
            "livenessProbe — \"is this container still working?\" Repeated failures get the container killed and restarted by kubelet.",
            "readinessProbe — \"is this container ready for traffic right now?\" A failure removes the Pod from a Service's routing rotation without restarting it — meant for slow startup or temporary overload the Pod can recover from on its own.",
            "startupProbe — gives a slow-starting container (a JVM app with a long init, say) a grace period before liveness probing even begins, so a legitimately slow start isn't mistaken for a hang.",
            "All three probes support the same check mechanisms — httpGet, tcpSocket, or exec — the distinction between them is what Kubernetes does with a failure, not how the check itself works.",
          ],
        },
        {
          kind: "example",
          heading: "Probes on a real Deployment",
          language: "yaml",
          code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
        - name: web
          image: myregistry/web-app:1.4
          ports:
            - containerPort: 3000
          readinessProbe:
            httpGet:
              path: /healthz
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /healthz
              port: 3000
            initialDelaySeconds: 15
            periodSeconds: 20
            failureThreshold: 3`,
        },
        {
          kind: "terminal",
          heading: "A readiness failure, from kubectl's point of view",
          description: "The Pod is Running, but not Ready — the Service will not send it traffic until this clears.",
          lines: [
            { text: "kubectl get pods" },
            { text: "NAME                       READY   STATUS    RESTARTS   AGE", output: true },
            { text: "web-app-7d9f6c5b8d-4kx2p   0/1     Running   0          12s", output: true },
            { text: "kubectl describe pod web-app-7d9f6c5b8d-4kx2p" },
            {
              text: "Warning  Unhealthy  8s (x2 over 18s)  kubelet  Readiness probe failed: HTTP probe failed with statuscode: 503",
              output: true,
            },
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "This is what actually enforces \"never remove an old Pod until a new one is healthy\"",
          body: "The rolling update behavior from the Deployments lesson depends entirely on readinessProbe to know what \"healthy\" means. Without one, \"healthy\" only means \"the container process started\" — a much weaker guarantee that lets a rollout route traffic to a Pod that started fine but can't actually serve requests yet.",
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Liveness and readiness answer different questions — don't collapse them into one",
          body: "A Pod overwhelmed by a traffic spike should fail readiness (stop receiving new traffic, recover on its own) — restarting it via liveness just adds cold-start delay on top of the overload. A genuinely deadlocked process should fail liveness so kubelet actually replaces it. Pointing both probes at the same check with the same thresholds is a common way to lose this distinction entirely.",
        },
        {
          kind: "text",
          heading: "Probes for things that don't speak HTTP",
          body: [
            "Not every container is a web server. A database, a message queue, or a batch worker often has no HTTP endpoint to poll — Kubernetes supports two other probe mechanisms for exactly this. A `tcpSocket` probe just checks whether a port accepts a connection, useful as a minimal liveness check for something like Redis. An `exec` probe runs an actual command inside the container and treats exit code 0 as healthy — this is how most people probe Postgres, using the database's own client tool rather than reinventing a health check from outside.",
          ],
        },
        {
          kind: "example",
          heading: "An exec probe for a Postgres container",
          language: "yaml",
          code: `livenessProbe:
  exec:
    command:
      - pg_isready
      - -U
      - postgres
  initialDelaySeconds: 10
  periodSeconds: 15
  timeoutSeconds: 5`,
        },
        {
          kind: "terminal",
          heading: "Watching a restart happen in real time",
          description: "RESTARTS climbing is the first sign a livenessProbe is failing — describe shows exactly why.",
          lines: [
            { text: "kubectl get pods -w" },
            { text: "NAME                       READY   STATUS    RESTARTS   AGE", output: true },
            { text: "web-app-7d9f6c5b8d-4kx2p   1/1     Running   0          3m", output: true },
            { text: "web-app-7d9f6c5b8d-4kx2p   0/1     Running   1          5m", output: true },
            { text: "web-app-7d9f6c5b8d-4kx2p   1/1     Running   1          5m", output: true },
            { text: "kubectl describe pod web-app-7d9f6c5b8d-4kx2p | grep -A2 Liveness" },
            { text: "Liveness:  http-get http://:3000/healthz delay=15s timeout=1s period=20s #health check", output: true },
            { text: "Warning  Unhealthy  Liveness probe failed: Get \"http://10.4.2.9:3000/healthz\": context deadline exceeded", output: true },
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Tuning thresholds is a real trade-off, not a default to leave alone",
          body: "A short periodSeconds with a low failureThreshold catches real hangs fast but also restarts a container that's just momentarily slow under load — a self-inflicted outage. A long, lenient config is safe but means a genuinely hung Pod keeps serving errors for minutes before anything notices. There's no universal right answer; it depends on how expensive a false-positive restart is for that specific service versus how expensive a few extra minutes of a hung Pod would be.",
        },
        {
          kind: "bullets",
          heading: "Probe fields worth knowing, beyond the basics",
          bullets: [
            "failureThreshold — consecutive failures before the probe counts as failed overall; default 3.",
            "successThreshold — consecutive successes needed to flip back to healthy after a failure; almost always left at 1 for liveness, sometimes raised for readiness to avoid flapping.",
            "timeoutSeconds — how long a single probe attempt waits before counting as a failure, not the interval between attempts.",
          ],
        },
        {
          kind: "text",
          heading: "Probe overhead is a real, if usually small, cost",
          body: [
            "Every probe is a real request the kubelet has to make, on a real interval, against every single replica — a Deployment with 50 replicas and a periodSeconds: 5 readinessProbe means 10 requests per second just for health checking, before counting real traffic at all. For a cheap /healthz endpoint this is negligible; for a probe that (against the earlier warning) queries a database, it's 10 extra database connections a second that exist purely to answer \"are you okay,\" competing with real queries for the same connection pool.",
            "This is one more reason readiness and liveness probes should be as cheap as the container can make them — a lightweight in-process check, not a deep dependency check — and it's also why periodSeconds shouldn't be set unnecessarily low: tighter than needed for the failure mode you're actually trying to catch just multiplies overhead across every replica for no real benefit.",
          ],
        },
        {
          kind: "bullets",
          heading: "gRPC and TCP-only services: probing without an HTTP endpoint",
          bullets: [
            "Kubernetes 1.24+ supports a native grpc probe type, checking the standard gRPC health-checking protocol directly — before this existed, gRPC services typically needed a small sidecar or an exec probe running grpc-health-probe as a workaround just to get a proper health check.",
            "A pure TCP service with no application-level health semantics at all — a raw socket server, say — is usually best served by a tcpSocket probe for liveness (can the port even be connected to) and simply skipping readiness, since there's often no cheap way to express \"ready\" more precisely than \"the port is open.\"",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "A probe that depends on something outside the container is a trap",
          body: "It's tempting to make a readinessProbe check \"can I reach the database\" — but that couples one Pod's readiness to another service's availability entirely outside its control. If the database blips for ten seconds, every Pod behind that check fails readiness simultaneously, the Service loses all its endpoints at once, and a brief database hiccup turns into a full outage of a service that was otherwise fine. Readiness should generally reflect whether this container itself can serve a request, not the health of everything it happens to depend on.",
        },
        {
          kind: "summary",
          heading: "What to remember",
          bullets: [
            "Kubernetes' self-healing only reacts to crashes by default — probes are what catch a container that's running but broken.",
            "readinessProbe controls traffic; livenessProbe controls restarts — mixing up which one a symptom calls for makes outages worse, not better.",
            "startupProbe exists specifically so a slow, legitimate startup isn't mistaken for a hang.",
          ],
        },
      ],
    },
    {
      title: "Practice: Debugging and Configuring Pod Health",
      durationMinutes: 14,
      slides: [
        {
          kind: "title",
          heading: "Practice: Debugging and Configuring Pod Health",
          subheading: "Three exercises using kubectl output and manifests you'd actually see — work through each before checking the solution.",
        },
        {
          kind: "practice",
          heading: "Debug a CrashLoopBackOff",
          prompt:
            "This Pod is stuck in CrashLoopBackOff. `kubectl describe pod` shows `Last State: Terminated, Reason: OOMKilled, Exit Code: 137`, and the app's logs show it loading a large in-memory cache on startup. Diagnose the problem and fix the manifest:\n\napiVersion: v1\nkind: Pod\nmetadata:\n  name: cache-warmer\nspec:\n  containers:\n    - name: app\n      image: myregistry/cache-warmer:2.1\n      resources:\n        limits:\n          memory: \"128Mi\"\n        requests:\n          memory: \"64Mi\"",
          hint: "OOMKilled with exit code 137 means the container hit its memory limit and the kernel killed it — this is a resource configuration problem, not a bug to go looking for in application code. Compare the limit to what the workload plausibly needs before touching anything else.",
          solution: `apiVersion: v1
kind: Pod
metadata:
  name: cache-warmer
spec:
  containers:
    - name: app
      image: myregistry/cache-warmer:2.1
      resources:
        limits:
          memory: "512Mi"   # was 128Mi — too small for the startup cache, causing OOMKilled
        requests:
          memory: "256Mi"   # requests should scale up alongside the raised limit
# CrashLoopBackOff + OOMKilled (exit 137) almost always means the memory
# limit is set below what the process actually needs — check "kubectl
# describe pod" for the exit reason before assuming it's an application bug.`,
        },
        {
          kind: "practice",
          heading: "Add probes without breaking a slow startup",
          prompt:
            "Add a readinessProbe and a livenessProbe to this Deployment for an HTTP service with a health endpoint at /health on port 8080. The app takes about 20 seconds to warm up a DB connection pool before /health returns 200, so a naive probe would restart it during normal startup:\n\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: orders-api\nspec:\n  replicas: 2\n  selector:\n    matchLabels:\n      app: orders-api\n  template:\n    metadata:\n      labels:\n        app: orders-api\n    spec:\n      containers:\n        - name: api\n          image: myregistry/orders-api:3.2\n          ports:\n            - containerPort: 8080",
          hint: "Give livenessProbe enough initialDelaySeconds to cover the ~20-second warm-up, or the container will be killed for taking exactly as long to start as it's supposed to.",
          solution: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: orders-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: orders-api
  template:
    metadata:
      labels:
        app: orders-api
    spec:
      containers:
        - name: api
          image: myregistry/orders-api:3.2
          ports:
            - containerPort: 8080
          readinessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 25   # covers the ~20s DB warm-up so it isn't mistaken for a hang
            periodSeconds: 20
            failureThreshold: 3`,
        },
        {
          kind: "text",
          heading: "A systematic way to read kubectl describe pod",
          body: [
            "Before touching any of the exercises below, it helps to read `kubectl describe pod` the same way every time instead of scanning randomly. Check Status first — Pending, Running, CrashLoopBackOff, and ImagePullBackOff each point at a completely different layer of the problem. Then check Last State for a Terminated container — the Reason and Exit Code there (OOMKilled/137, Error/1, Completed/0) usually tell you what actually happened without needing to read a single log line. Only after that do the Events at the bottom matter, which show the scheduler's and kubelet's real-time commentary in order — the most recent, most specific event is almost always the one worth reading first.",
          ],
        },
        {
          kind: "practice",
          heading: "Diagnose an ImagePullBackOff",
          prompt:
            "A teammate's Deployment has been stuck for ten minutes. `kubectl get pods` shows STATUS: ImagePullBackOff, and `kubectl describe pod` shows: `Failed to pull image \"myregisty/orders-api:3.2\": rpc error: code = NotFound`. Find the bug and fix the manifest:\n\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: orders-api\nspec:\n  replicas: 2\n  selector:\n    matchLabels:\n      app: orders-api\n  template:\n    metadata:\n      labels:\n        app: orders-api\n    spec:\n      containers:\n        - name: api\n          image: myregisty/orders-api:3.2",
          hint: "ImagePullBackOff almost always means the registry, repository name, or tag in `image:` doesn't actually exist as written — read the error message character by character before assuming it's a permissions or network issue.",
          solution: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: orders-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: orders-api
  template:
    metadata:
      labels:
        app: orders-api
    spec:
      containers:
        - name: api
          image: myregistry/orders-api:3.2   # was "myregisty" — missing an "r", a typo the registry read literally
# ImagePullBackOff with "NotFound" is a spelling/tag problem, not a
# permissions problem — kubectl would show "Unauthorized" or "403" for
# a real private-registry auth failure instead.`,
        },
        {
          kind: "practice",
          heading: "Explain a Pod stuck in Pending",
          prompt:
            "Three replicas of a Deployment are stuck Pending for over five minutes. `kubectl describe pod` shows this event: `0/3 nodes are available: 3 Insufficient cpu.` Each node has 4 allocatable CPUs and is already running other workloads requesting 3.5 CPUs total. Here's the container spec:\n\nresources:\n  requests:\n    cpu: \"1500m\"\n  limits:\n    cpu: \"1500m\"",
          hint: "Pending with an 'Insufficient cpu' event is a scheduling problem, not a crash — the scheduler is refusing to place the Pod anywhere because no single node currently has room for what it's requesting, no matter how many nodes exist in total.",
          solution:
            "The scheduler needs one node with 1500m of CPU free, and none exists — three separate nodes each having a little spare capacity doesn't help, since a single Pod can't be split across nodes. Two real fixes, not mutually exclusive: lower the CPU request if 1500m was a guess rather than a measured need (check actual usage with `kubectl top pod` on a running instance first), or add cluster capacity — a new node, or letting a cluster autoscaler add one. Simply retrying `kubectl apply` changes nothing, since the resource shortage doesn't go away on its own.",
        },
        {
          kind: "practice",
          heading: "Fix a readinessProbe that's too aggressive",
          prompt:
            "orders-api Pods flap between Ready and NotReady every couple of minutes under normal load, briefly dropping out of the Service's endpoints each time even though the app itself never errors. The probe:\n\nreadinessProbe:\n  httpGet:\n    path: /health\n    port: 8080\n  periodSeconds: 5\n  timeoutSeconds: 1\n  failureThreshold: 1\n\nThe /health endpoint does a real DB query and normally responds in 200-400ms, but occasionally takes up to 1.5s under load.",
          hint: "With timeoutSeconds: 1 and failureThreshold: 1, a single slightly-slow response — well within what the app considers normal — is treated as total failure. Nothing about the app is actually broken.",
          solution: `readinessProbe:
  httpGet:
    path: /health
    port: 8080
  periodSeconds: 5
  timeoutSeconds: 3        # was 1s — too tight for a query that can take up to 1.5s
  failureThreshold: 3      # was 1 — requires 3 consecutive slow/failed checks, not one
# The Pod was never actually broken — the probe's thresholds
# were tighter than the endpoint's own normal response-time
# variance, so ordinary load looked like a failure.`,
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Pending vs. CrashLoopBackOff: know which failure mode you're looking at",
          body: "It's easy to lump every stuck Deployment into \"it's broken\" and start reading logs — but Pending means the Pod was never even scheduled, so there are no container logs to read yet; the answer lives in the scheduler's events, not the application. CrashLoopBackOff means the opposite: the container did start, ran, and exited, so `kubectl logs --previous` is exactly where the answer lives. Confusing the two wastes real debugging time chasing the wrong artifact.",
        },
        {
          kind: "practice",
          heading: "Find why a Service isn't routing traffic",
          prompt:
            "Requests to Service `orders-api` return connection errors even though `kubectl get pods` shows 2/2 Pods Running. Find the mismatch:\n\napiVersion: v1\nkind: Service\nmetadata:\n  name: orders-api\nspec:\n  selector:\n    app: order-api\n  ports:\n    - port: 80\n      targetPort: 8080\n---\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: orders-api\nspec:\n  replicas: 2\n  selector:\n    matchLabels:\n      app: orders-api\n  template:\n    metadata:\n      labels:\n        app: orders-api\n    spec:\n      containers:\n        - name: api\n          image: myregistry/orders-api:3.2\n          ports:\n            - containerPort: 8080",
          hint: "Services find Pods purely by label match — compare the Service's selector to the Pod template's labels character by character, not to the Deployment's name.",
          solution:
            "The Service's selector is `app: order-api` (missing the \"s\") while the Pod template's label is `app: orders-api` — they don't match, so the Service has zero matching endpoints even though the Pods themselves are perfectly healthy. Fix: correct the Service's selector to `app: orders-api`, matching the Deployment's template.metadata.labels exactly (the Deployment's own name, also \"orders-api\", is irrelevant to routing — only the Pod template's labels matter).",
        },
        {
          kind: "terminal",
          heading: "A debugging cheat sheet worth memorizing",
          description: "Five commands that cover the large majority of real Pod incidents, roughly in the order you'd reach for them.",
          lines: [
            { text: "kubectl get pods -o wide          # status, node, restart count at a glance" },
            { text: "kubectl describe pod <name>       # events, exit reason, resource config" },
            { text: "kubectl logs <name>               # current container's stdout/stderr" },
            { text: "kubectl logs <name> --previous    # the CRASHED container's logs, not the new one" },
            { text: "kubectl exec -it <name> -- sh     # a shell inside the container, for live inspection" },
            { text: "kubectl top pod <name>            # actual CPU/memory usage vs. requests and limits" },
          ],
        },
        {
          kind: "summary",
          heading: "What a correct solution demonstrates",
          bullets: [
            "Reading kubectl describe pod's exit reason instead of assuming a crash means an application bug.",
            "Distinguishing what a livenessProbe should protect against (a genuine hang) from what a readinessProbe should protect against (temporary unavailability, like a slow warm-up).",
            "Remembering that Services match on labels, not names — a one-character typo in a selector silently breaks routing while every Pod still reports Running.",
            "Telling ImagePullBackOff (a registry/image name problem) apart from Pending with Insufficient cpu (a scheduling/capacity problem) — they look similar in kubectl get pods but need completely different fixes.",
            "Reaching for `kubectl logs --previous` on a crashed container instead of the current one, which usually shows nothing useful since it just started.",
            "Setting probe timeouts and thresholds against a service's actual observed response-time variance, not an arbitrary guess — a probe tighter than normal latency will manufacture outages out of healthy Pods.",
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
          heading: "Bare Pods",
          question: "A Pod's node crashes. That Pod was created directly with `kind: Pod`, not through a Deployment. What happens?",
          options: [
            "Kubernetes automatically reschedules it onto a healthy node",
            "Nothing recreates it — a bare Pod has no controller watching it that would replace it",
            "It restarts automatically on the same node once that node recovers",
            "The Service in front of it creates a replacement automatically",
          ],
          correctIndex: 1,
          explanation:
            "Pods created directly, with no Deployment (or similar controller) managing them, are genuinely disposable — if the node holding one dies, it's simply gone, which is exactly why real usage almost never creates bare Pods.",
        },
        {
          kind: "quiz",
          heading: "Liveness vs. readiness",
          question: "What's the actual difference between a Pod failing its readinessProbe versus its livenessProbe?",
          options: [
            "They do the same thing — readinessProbe is just the newer name for it",
            "Failing readiness removes the Pod from Service routing without restarting it; failing liveness gets the container restarted",
            "Failing liveness removes the Pod from Service routing; failing readiness restarts the container",
            "Both failing readiness and failing liveness immediately delete the Pod",
          ],
          correctIndex: 1,
          explanation:
            "readinessProbe controls traffic routing; livenessProbe controls whether kubelet restarts the container. Confusing the two means restarting Pods that just needed a moment to recover, or leaving genuinely hung ones running.",
        },
        {
          kind: "quiz",
          heading: "Ingress without a controller",
          question:
            "You apply an Ingress resource routing myapp.example.com to a Service, and it applies without error, but requests to that hostname go nowhere. What's the most likely missing piece?",
          options: [
            "The Service needs to be type LoadBalancer instead of ClusterIP",
            "No Ingress controller is actually running in the cluster to implement the routing rule",
            "Ingress objects require a matching NetworkPolicy before they route any traffic",
            "DNS propagation for any new Ingress always takes 48 hours",
          ],
          correctIndex: 1,
          explanation:
            "An Ingress object is only a spec — a separate piece of software (an Ingress controller) has to be running in the cluster to actually read it and configure real routing. Applying valid YAML with no controller installed does nothing.",
        },
        {
          kind: "quiz",
          heading: "Manual Pod deletion",
          question: "A Deployment has replicas: 3. One of its Pods is deleted manually with kubectl delete pod. What happens next?",
          options: [
            "The Deployment now runs with 2 replicas until someone manually restores it",
            "The Deployment's controller notices the running count dropped below 3 and creates a replacement Pod",
            "Kubernetes blocks the delete, since the Deployment requires exactly 3 replicas",
            "The Service in front of it creates the replacement, not the Deployment",
          ],
          correctIndex: 1,
          explanation:
            "replicas: 3 is a continuously enforced target, not a one-time instruction — the same reconciliation loop that recreates a Pod after a node failure recreates one after a manual delete, with no special-casing.",
        },
        {
          kind: "quiz",
          heading: "Control plane components",
          question: "Which control plane component is responsible for deciding which node a new Pod should run on?",
          options: ["kubelet", "kube-proxy", "The scheduler", "etcd"],
          correctIndex: 2,
          explanation:
            "The scheduler assigns Pods to nodes based on resource requests and available capacity. kubelet then actually starts the container on the assigned node; kube-proxy handles routing; etcd just stores the cluster's state.",
        },
        {
          kind: "quiz",
          heading: "Zero endpoints",
          question: "kubectl get endpoints for a Service returns <none>, but kubectl get pods shows the matching Pods as Running. What's the most likely cause?",
          options: [
            "The Service's selector doesn't match the Pods' labels, or the matching Pods haven't passed their readinessProbe yet",
            "The cluster's DNS server is down",
            "The Deployment needs more replicas",
            "The Service type needs to be changed to LoadBalancer",
          ],
          correctIndex: 0,
          explanation:
            "A Service only lists Pods as endpoints when their labels match its selector AND they're passing readiness — Running alone doesn't guarantee either. A selector typo is the single most common cause of a Service with zero endpoints despite healthy-looking Pods.",
        },
        {
          kind: "quiz",
          heading: "Deployments and ReplicaSets",
          question: "Why does kubectl rollout undo work almost instantly instead of taking as long as the original rollout did?",
          options: [
            "It doesn't actually roll back — it just restarts the current Pods",
            "The previous ReplicaSet is kept around at 0 replicas, so rolling back is just shifting replica counts between two ReplicaSets that already exist",
            "Kubernetes caches the old container images locally for instant redeployment",
            "Rollback always requires re-running kubectl apply with the old YAML file",
          ],
          correctIndex: 1,
          explanation:
            "A Deployment creates a new ReplicaSet for each Pod template change but doesn't delete old ones — it scales them to 0 instead. Rolling back is the same replica-shifting mechanism as a rollout, just pointed at a ReplicaSet that already exists rather than one being created from scratch.",
        },
        {
          kind: "summary",
          heading: "The course, in six takeaways",
          bullets: [
            "Kubernetes works by continuously reconciling actual state to match a declared desired state — the same loop underlies scaling, self-healing, and rollouts.",
            "Pods are disposable and shouldn't be created directly — Deployments manage them and replace them automatically.",
            "Services give a stable address to a constantly-changing set of Pods by matching on labels, not identity.",
            "Ingress needs a controller actually running in the cluster — the YAML alone does nothing.",
            "Probes distinguish a Pod that needs a restart (liveness) from one that just needs to stop receiving traffic temporarily (readiness).",
            "The control plane (API server, etcd, scheduler, controller manager) decides and tracks; kubelet and the container runtime on each node actually execute it.",
          ],
        },
      ],
    },
  ],
};
