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
          kind: "bullets",
          heading: "What Kubernetes takes over",
          bullets: [
            "Scheduling — deciding which machine in the cluster each container should run on, based on available resources.",
            "Self-healing — noticing a container died and starting a replacement, automatically, without a human paging anyone.",
            "Scaling — running more or fewer copies of something in response to a declared target or load.",
            "Service discovery — giving a moving, scaling set of containers a stable way to find and talk to each other.",
            "Rolling updates — replacing old containers with new ones gradually, so the app keeps serving traffic the whole time.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "The core idea: declarative, not imperative",
          body: "You don't tell Kubernetes the steps to take. You describe the end state you want — \"3 copies of this container, always running\" — and a set of controllers continuously compare that desired state to what's actually running, taking action to close any gap. This loop, run over and over, is the mechanism behind both self-healing and scaling.",
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
          kind: "bullets",
          heading: "Why a wrapper around containers at all",
          bullets: [
            "A Pod is one or more containers that are always scheduled together, on the same machine, sharing the same network namespace and, optionally, storage.",
            "Most Pods run exactly one container — the wrapper exists for the cases where a second, tightly coupled container genuinely needs to travel with the first.",
            "The classic case is a \"sidecar\": a log-shipping or service-mesh proxy container that runs alongside your app container, reachable at localhost because they share a network namespace.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Pods are disposable — don't create them directly",
          body: "A bare Pod, if its node dies, is simply gone — nothing recreates it. In real usage you almost never write `kind: Pod` yourself; you describe a Deployment (next lesson), and Kubernetes creates and manages the Pods for you, replacing them automatically when they disappear.",
        },
        {
          kind: "text",
          heading: "What labels are for",
          body: [
            "The `labels: app: web-app` block isn't decoration — labels are how every other Kubernetes object finds this Pod. A Service finds the Pods it should send traffic to by matching labels, not by name or IP. That indirection is what lets Pods be replaced constantly without anything that depends on them needing to change.",
          ],
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
          kind: "callout",
          tone: "tip",
          heading: "Rolling updates, under the hood",
          body: "By default a Deployment replaces old Pods with new ones a few at a time, only removing an old Pod once a new one is confirmed healthy — never all at once. That's what lets `kubectl set image` ship a new version with zero downtime, and what makes `kubectl rollout undo` a fast, safe way to reverse a bad deploy.",
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
            "Other things in the cluster reach this Service at a stable DNS name (web-app) and it load-balances across whichever Pods are healthy right now — callers never need a Pod's actual IP.",
            "port is what callers connect to; targetPort is the port the container actually listens on — they don't have to match, same as `docker run -p`.",
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
            "In practice, one LoadBalancer Service fronts the Ingress controller itself, and every app in the cluster can share that single entry point.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "An Ingress object alone does nothing",
          body: "Ingress is a spec that a separate piece of software — an Ingress controller (commonly nginx-ingress or a cloud provider's own) — has to be running in the cluster to actually implement. Writing Ingress YAML with no controller installed produces a routing rule nothing is reading.",
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
          hint: "OOMKilled with exit code 137 means the container hit its memory limit and the kernel killed it — this is a resource configuration problem, not a bug to go looking for in application code.",
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
          kind: "practice",
          heading: "Find why a Service isn't routing traffic",
          prompt:
            "Requests to Service `orders-api` return connection errors even though `kubectl get pods` shows 2/2 Pods Running. Find the mismatch:\n\napiVersion: v1\nkind: Service\nmetadata:\n  name: orders-api\nspec:\n  selector:\n    app: order-api\n  ports:\n    - port: 80\n      targetPort: 8080\n---\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: orders-api\nspec:\n  replicas: 2\n  selector:\n    matchLabels:\n      app: orders-api\n  template:\n    metadata:\n      labels:\n        app: orders-api\n    spec:\n      containers:\n        - name: api\n          image: myregistry/orders-api:3.2\n          ports:\n            - containerPort: 8080",
          hint: "Services find Pods purely by label match — compare the Service's selector to the Pod template's labels character by character, not to the Deployment's name.",
          solution:
            "The Service's selector is `app: order-api` (missing the \"s\") while the Pod template's label is `app: orders-api` — they don't match, so the Service has zero matching endpoints even though the Pods themselves are perfectly healthy. Fix: correct the Service's selector to `app: orders-api`, matching the Deployment's template.metadata.labels exactly (the Deployment's own name, also \"orders-api\", is irrelevant to routing — only the Pod template's labels matter).",
        },
        {
          kind: "summary",
          heading: "What a correct solution demonstrates",
          bullets: [
            "Reading kubectl describe pod's exit reason instead of assuming a crash means an application bug.",
            "Distinguishing what a livenessProbe should protect against (a genuine hang) from what a readinessProbe should protect against (temporary unavailability, like a slow warm-up).",
            "Remembering that Services match on labels, not names — a one-character typo in a selector silently breaks routing while every Pod still reports Running.",
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
