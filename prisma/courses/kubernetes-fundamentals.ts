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
  ],
};
