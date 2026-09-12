import type { CourseSeed } from "../course-types";

export const course: CourseSeed = {
  slug: "cloud-computing-fundamentals",
  title: "Cloud Computing Fundamentals",
  description:
    "What cloud computing actually is, the core service models, and how to reason about AWS, Azure, and GCP without vendor-specific tunnel vision.",
  category: "Cloud",
  level: "BEGINNER",
  order: 5,
  lessons: [
    {
      title: "IaaS, PaaS, and SaaS — What You're Actually Renting",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "IaaS, PaaS, and SaaS — What You're Actually Renting",
          subheading:
            "\"Cloud computing\" covers a wide range of what you're actually responsible for versus what the provider manages. Understanding the layers is the foundation everything else builds on.",
        },
        {
          kind: "bullets",
          heading: "The three core models",
          bullets: [
            "IaaS (Infrastructure as a Service) — you get raw compute, storage, and networking (e.g., AWS EC2, Azure VMs, GCP Compute Engine). You manage the OS, runtime, and everything above it. Maximum control, maximum responsibility.",
            "PaaS (Platform as a Service) — the provider manages the OS and runtime; you deploy code (e.g., AWS Elastic Beanstalk, Heroku, Google App Engine). Less to manage, less control over the underlying environment.",
            "SaaS (Software as a Service) — a fully managed application you just use (e.g., Salesforce, Gmail, Slack). No infrastructure decisions at all.",
          ],
        },
        {
          kind: "text",
          heading: "Why this distinction matters day to day",
          body: [
            "The model you're operating in determines what \"your problem\" actually means. On IaaS, an OS-level security patch is your responsibility. On PaaS, the provider handles it, but you're constrained to their supported runtimes and versions.",
            "Picking the wrong model creates either unnecessary operational burden or unnecessary constraints.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Serverless is a further step, not a separate category",
          body: "Functions-as-a-Service (AWS Lambda, Azure Functions, Google Cloud Functions) takes PaaS further: you deploy individual functions, the platform handles provisioning, scaling, and teardown entirely, and you pay per invocation rather than for idle capacity. The tradeoff is cold-start latency and execution time limits.",
        },
        {
          kind: "summary",
          heading: "The practical takeaway",
          bullets: [
            "When evaluating a new cloud service, the first real question isn't \"which provider.\"",
            "It's \"which layer am I operating at, and does that match how much operational responsibility I actually want to own for this workload.\"",
          ],
        },
      ],
    },
    {
      title: "Core Services Across AWS, Azure, and GCP",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Core Services Across AWS, Azure, and GCP",
          subheading:
            "Once you understand one major cloud provider's core services, the others map onto the same concepts with different names. Learning the mapping is more useful than memorizing any one provider's console.",
        },
        {
          kind: "bullets",
          heading: "Compute",
          bullets: [
            "AWS: EC2 (VMs), Lambda (serverless), ECS/EKS (containers)",
            "Azure: Virtual Machines, Azure Functions, AKS (Kubernetes)",
            "GCP: Compute Engine, Cloud Functions, GKE (Kubernetes)",
          ],
        },
        {
          kind: "bullets",
          heading: "Storage",
          bullets: [
            "Object storage (unstructured files, accessed via API): S3 (AWS), Blob Storage (Azure), Cloud Storage (GCP).",
            "Block storage (attached disks for VMs): EBS (AWS), Managed Disks (Azure), Persistent Disk (GCP).",
            "File storage (shared network filesystems): EFS (AWS), Azure Files, Filestore (GCP).",
          ],
        },
        {
          kind: "text",
          heading: "Databases and networking",
          body: [
            "Each provider offers managed relational databases (AWS RDS, Azure SQL Database, Cloud SQL) and managed NoSQL options (DynamoDB, Cosmos DB, Firestore/Bigtable) — the managed part is the key value: automated backups, patching, and failover without running the database software yourself.",
            "All three share the same core networking concepts under different names: a virtual private network (VPC in AWS/GCP, VNet in Azure), subnets, security groups/firewall rules, load balancers, and a managed DNS service (Route 53, Azure DNS, Cloud DNS).",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Why the mapping matters more than any single provider",
          body: "Employers rarely care which specific provider you've used most — they care whether you understand what a load balancer, a managed database, and a VPC actually do.",
        },
      ],
    },
    {
      title: "Reasoning About Cost",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Reasoning About Cost",
          subheading:
            "Cloud cost surprises are one of the most common operational failures for teams new to cloud infrastructure — not because pricing is secret, but because the pay-for-what-you-use model shifts the failure mode.",
        },
        {
          kind: "bullets",
          heading: "The core pricing levers",
          bullets: [
            "Compute — pay per hour/second for the size of instance running, whether or not it's doing useful work.",
            "Storage — pay per GB stored, plus often per-request charges for object storage.",
            "Data transfer (egress) — moving data out of a cloud provider's network is usually billed; moving data in usually isn't.",
            "Reserved vs. on-demand — committing to a specific instance type for 1-3 years can cut compute costs 30-70% versus on-demand, at the cost of flexibility.",
          ],
        },
        {
          kind: "bullets",
          heading: "Common cost traps",
          bullets: [
            "Orphaned resources. A deleted VM's attached storage volume keeps billing indefinitely until someone notices.",
            "Over-provisioned instances. Defaulting to a large instance \"to be safe\" when a smaller one would fit.",
            "Cross-region or cross-AZ data transfer inside your own architecture, often billed even though it feels \"internal.\"",
          ],
        },
        {
          kind: "summary",
          heading: "Practical habits",
          bullets: [
            "Tag resources by project/team from day one.",
            "Set up billing alerts before you need them.",
            "Review a cost breakdown by service monthly, even briefly.",
          ],
        },
      ],
    },
    {
      title: "Security Basics: Shared Responsibility",
      durationMinutes: 5,
      slides: [
        {
          kind: "title",
          heading: "Security Basics: Shared Responsibility",
          subheading:
            "Every major cloud provider operates on a \"shared responsibility model\" — and misunderstanding where the line falls is one of the most common causes of real cloud security incidents.",
        },
        {
          kind: "text",
          heading: "What the provider secures",
          body: [
            "The provider secures the cloud: physical data center security, hardware, the hypervisor, and managed services' underlying infrastructure.",
          ],
        },
        {
          kind: "bullets",
          heading: "What you're responsible for",
          intro: "You secure what's in the cloud:",
          bullets: [
            "Identity and access management (IAM). Overly broad permissions are one of the most common real-world causes of cloud breaches.",
            "Network configuration. Whether something that should be private is accidentally exposed to the public internet.",
            "Data encryption. Whether data at rest and in transit is actually encrypted — rarely on by default for everything.",
            "Publicly exposed storage. Misconfigured buckets left publicly readable is one of the single most common real-world cloud data exposure incidents.",
          ],
        },
        {
          kind: "bullets",
          heading: "The practical baseline",
          bullets: [
            "Grant minimum permissions a role actually needs.",
            "Never use root/owner-level credentials for day-to-day work.",
            "Enable MFA on any account with meaningful access.",
            "Fix \"quick test\" permissions before deploying, not after.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "The takeaway",
          body: "Cloud security failures are overwhelmingly configuration failures, not provider failures.",
        },
      ],
    },
  ],
};
