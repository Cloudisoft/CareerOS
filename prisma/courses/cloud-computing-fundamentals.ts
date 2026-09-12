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
    {
      title: "High Availability: Regions, Availability Zones, and Redundancy",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "High Availability: Regions, Availability Zones, and Redundancy",
          subheading:
            "Every cloud provider will happily let you run everything in one place — the outage that follows is not the provider's failure, it's an architecture that never spread the risk around.",
        },
        {
          kind: "text",
          heading: "Regions and Availability Zones, precisely",
          body: [
            "A region is a geographic area (e.g., us-east-1, West Europe) containing multiple Availability Zones (AZs) — physically separate data centers with independent power, cooling, and networking, close enough for low-latency links between them but far enough apart that one physical disaster doesn't take out the others.",
            "\"Multi-AZ\" and \"multi-region\" solve different problems: multi-AZ protects against a single data center failing; multi-region protects against an entire geographic area failing, or reduces latency for users far from your primary region. Multi-region costs and complicates far more, and most teams need multi-AZ long before they need multi-region.",
          ],
        },
        {
          kind: "bullets",
          heading: "Where redundancy actually gets built in",
          bullets: [
            "Spreading compute across at least two AZs, behind a load balancer that only routes to instances passing a health check — one AZ going down removes its instances from rotation instead of taking the app down.",
            "Managed databases with multi-AZ replication (e.g., RDS Multi-AZ) that fail over to a synced standby in a different AZ automatically, instead of a single-AZ database with a nightly backup and hours of recovery time.",
            "Auto Scaling Groups that replace a failed instance and can add capacity under load — the same self-healing pattern as a Kubernetes Deployment, applied at the VM level.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Single points of failure hide in ordinary-looking setups",
          body: "A single EC2 instance with no load balancer in front of it, a NAT gateway with no standby, a database in one AZ with backups but no live standby — none of these look wrong day to day. They only reveal themselves the moment that one AZ has a bad day, which is exactly why they get built by accident rather than on purpose.",
        },
        {
          kind: "summary",
          heading: "The practical takeaway",
          bullets: [
            "High availability isn't a setting you turn on — it's the sum of every place you did or didn't add redundancy.",
            "Default to spreading across AZs for anything user-facing; reach for multi-region only when the requirement (compliance, latency, disaster recovery) actually calls for it.",
          ],
        },
      ],
    },
    {
      title: "Practice: Choosing Cloud Architecture and Controlling Cost",
      durationMinutes: 13,
      slides: [
        {
          kind: "title",
          heading: "Practice: Choosing Cloud Architecture and Controlling Cost",
          subheading:
            "Three scenarios, the kind that actually show up in an interview or on the job — work through each before checking the solution.",
        },
        {
          kind: "practice",
          heading: "Pick the right service model",
          prompt:
            "A three-person startup is building an internal admin tool used by about 15 employees. It needs to ship in a week, nobody on the team wants to manage servers or patch operating systems, and traffic will always be small and predictable. Decide which service model — IaaS, PaaS, or serverless/FaaS — fits best, and justify it in 2-3 sentences covering what you give up in exchange for what you gain.",
          hint: "\"Nobody wants to manage servers\" rules a whole option out immediately. Between what's left, think about which one's downsides (cold starts, per-invocation billing) matter more when traffic is small and steady rather than spiky.",
          solution:
            "PaaS. It rules out IaaS immediately (no OS/server management), and serverless's main advantages — scaling to zero and paying only per-invocation — matter most for spiky, unpredictable traffic, which this isn't. PaaS gives a supported runtime with no server management, without taking on the cold-start latency and execution-time limits serverless introduces for comparatively little benefit here. The tradeoff: less low-level control than IaaS, and constrained to whatever runtimes/versions the platform supports.",
        },
        {
          kind: "practice",
          heading: "Find the cost trap",
          prompt:
            "Your team's monthly AWS bill jumped 40% with no new features shipped. In the console you find: 12 running t3.large EC2 instances, but only 4 are registered behind the load balancer and receiving traffic; 30 EBS volumes exist even though only 18 instances (running + stopped) do; and there's new cross-AZ data transfer between an app tier in us-east-1a and a database in us-east-1b that wasn't there last month. Identify the concrete cost traps and what you'd do about each.",
          hint: "Match each symptom back to a specific trap from the cost lesson: idle compute, orphaned storage, and unplanned cross-AZ transfer are three separate problems, not one.",
          solution:
            "1) Eight of the 12 running instances aren't receiving any traffic through the load balancer — likely leftover or over-provisioned capacity. Terminate or right-size them after confirming nothing else depends on them directly. 2) 30 EBS volumes against 18 instances means at least 12 volumes are orphaned (detached from any instance) and billing for storage nobody is using — find and delete volumes not attached to a running or stopped instance. 3) The new cross-AZ transfer between app and database tiers is a direct, ongoing cost from splitting those tiers across AZs — either colocate latency-sensitive tiers in the same AZ where the redundancy isn't needed, or accept the cost deliberately as the price of the availability it buys, rather than let it show up as a surprise.",
        },
        {
          kind: "practice",
          heading: "Design for high availability",
          prompt:
            "A web app currently runs as a single EC2 instance in one Availability Zone, backed by a single-AZ RDS database with nightly backups. Describe, as a short bullet list, exactly what you'd change and which specific single point of failure each change removes.",
          hint: "There are three separate single points of failure here — the compute layer, the database layer, and the fact that only one AZ is involved at all. Address each on its own.",
          solution:
            "- Put at least 2 EC2 instances across 2+ AZs behind an Application Load Balancer with health checks, in an Auto Scaling Group — removes the single-instance and single-AZ compute failure, and the ASG replaces any instance that fails automatically. - Switch RDS to Multi-AZ, which keeps a synchronously replicated standby in a different AZ and fails over automatically — removes the single-AZ database failure, and cuts recovery time from 'restore last night's backup' to an automatic failover. - Nightly backups stay, but now as protection against data corruption or accidental deletion, not as the primary availability mechanism — Multi-AZ handles the infrastructure failure case; backups handle the 'someone dropped a table' case.",
        },
        {
          kind: "summary",
          heading: "What a correct solution demonstrates",
          bullets: [
            "Matching a service model to actual constraints (team size, ops appetite, traffic shape) instead of picking whatever's trendy.",
            "Recognizing that idle compute, orphaned storage, and unplanned data transfer are three distinct cost traps, not one fuzzy 'cloud costs went up' problem.",
            "Naming the specific single point of failure each architecture change removes, rather than adding redundancy in general.",
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
          heading: "Service models",
          question:
            "Your team deploys code to a platform that automatically handles OS patching and runtime updates, but you never touch the underlying servers directly. Which service model is this?",
          options: ["IaaS", "PaaS", "SaaS", "On-premises virtualization"],
          correctIndex: 1,
          explanation:
            "This is PaaS: the provider manages the OS and runtime, you deploy code. IaaS would still leave OS patching to you; SaaS would mean you're using a finished application, not deploying your own code to it.",
        },
        {
          kind: "quiz",
          heading: "Cost traps",
          question:
            "Which of these is most likely to keep silently costing money after the resource that originally used it is gone?",
          options: [
            "A reserved instance purchased upfront for 1-3 years",
            "An EBS volume left behind after its EC2 instance was terminated without delete-on-termination enabled",
            "A load balancer actively routing production traffic",
            "A VPC with no resources inside it",
          ],
          correctIndex: 1,
          explanation:
            "Orphaned storage is one of the most common real cost traps — a detached EBS volume keeps billing indefinitely until someone notices, because nothing forces you to look at unattached volumes the way you'd notice a running, obviously-in-use instance.",
        },
        {
          kind: "quiz",
          heading: "Shared responsibility",
          question:
            "Under the shared responsibility model, which of these is always the customer's job, regardless of provider or service model?",
          options: [
            "Physical security of the data center",
            "Patching the hypervisor",
            "Configuring IAM permissions and who can access what",
            "Maintaining the physical network hardware",
          ],
          correctIndex: 2,
          explanation:
            "The provider secures the cloud (physical/hypervisor/hardware); you secure what's in the cloud — and IAM configuration is squarely on your side of that line no matter which service model you're using.",
        },
        {
          kind: "quiz",
          heading: "High availability",
          question:
            "An application runs as a single EC2 instance in one Availability Zone with no load balancer in front of it. What's the most direct risk this creates?",
          options: [
            "It will automatically fail over to another AZ if the instance goes down",
            "The whole application becomes unavailable if that instance fails or its AZ has an outage, with nothing to replace it automatically",
            "It will start incurring unexpected cross-AZ data transfer charges",
            "It cannot be used with any managed database service",
          ],
          correctIndex: 1,
          explanation:
            "Without a load balancer, an Auto Scaling Group, or a second AZ involved, there's no mechanism watching this instance or ready to replace it — a single failure is a full outage until a human intervenes.",
        },
        {
          kind: "quiz",
          heading: "Provider mapping",
          question: "Which pairing correctly matches managed Kubernetes across the three major providers?",
          options: [
            "AWS EKS, Azure AKS, GCP GKE",
            "AWS ECS, Azure AKS, GCP Cloud Run",
            "AWS EKS, Azure Functions, GCP GKE",
            "AWS Lambda, Azure AKS, GCP Compute Engine",
          ],
          correctIndex: 0,
          explanation:
            "EKS, AKS, and GKE are each provider's managed Kubernetes offering. ECS is AWS's own non-Kubernetes container orchestrator; Cloud Run and Lambda are serverless/FaaS-style products, a different layer entirely.",
        },
        {
          kind: "summary",
          heading: "The course, in six takeaways",
          bullets: [
            "IaaS, PaaS, and SaaS mainly differ in how much operational responsibility you take on versus hand to the provider.",
            "Learn the concept once (compute, storage, networking, databases) and the provider-specific names follow easily.",
            "Cost surprises come from a small set of recurring traps: idle compute, orphaned storage, and unplanned data transfer.",
            "The shared responsibility model always leaves IAM, network configuration, encryption, and data exposure on you.",
            "High availability means deliberately removing single points of failure across AZs — not a setting you enable once.",
          ],
        },
      ],
    },
  ],
};
