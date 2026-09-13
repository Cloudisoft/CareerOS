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
          kind: "bullets",
          heading: "A concrete decision framework",
          intro: "Same Node.js API, three layers — the right one depends on the shape of the traffic and the team, not on which is \"more modern\":",
          bullets: [
            "Steady, predictable traffic and a team that wants full control over the runtime (custom system packages, a specific kernel tuning) — IaaS (EC2). You own patching, but nothing about the environment is guessed at.",
            "Steady traffic, no need for OS-level control, and a team that wants to stop thinking about servers — PaaS (Elastic Beanstalk, App Engine). You deploy code and the platform keeps the instances patched and running.",
            "Spiky or unpredictable traffic — bursts a few times a day, long idle stretches overnight — FaaS (Lambda). You pay only for the milliseconds of actual execution, instead of an EC2 instance idling at 2am.",
            "A live video-processing pipeline with strict, consistent low-latency requirements — usually IaaS or containers on Kubernetes, because cold starts and per-invocation overhead make serverless a poor fit for sustained, latency-sensitive workloads.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Moving up the stack trades control for lock-in",
          body: "A Lambda function written against AWS's event and context objects, IAM execution role, and API Gateway integration doesn't move to Azure Functions with a find-and-replace — the surrounding plumbing is provider-specific. An EC2 instance running a standard Linux distro migrates to another cloud (or on-prem) far more easily, because there's less proprietary surface area between your code and the raw compute. Neither choice is wrong, but \"just use serverless, it's easier\" quietly signs you up for a harder exit later.",
        },
        {
          kind: "text",
          heading: "Where the math on serverless flips",
          body: [
            "Serverless pricing looks cheap because idle time is free — but at sustained high volume, per-invocation billing can cost more than a reserved instance running the same workload continuously. A function handling 50 million invocations a month, each running for a few hundred milliseconds, can easily cost more on Lambda than a couple of reserved t3.large instances handling the same steady load.",
            "The rule of thumb: serverless wins on spiky or low-volume traffic where you'd otherwise pay for idle capacity; reserved or on-demand compute wins once traffic is high enough and steady enough that you'd be running near-continuously anyway.",
          ],
        },
        {
          kind: "diagram",
          heading: "Increasing abstraction, decreasing control",
          description:
            "Each step hands more operational responsibility to the provider — and takes away a corresponding amount of low-level control.",
          steps: [
            { label: "IaaS", detail: "You manage the OS, runtime, and everything above it" },
            { label: "PaaS", detail: "Provider manages the OS and runtime; you deploy code" },
            { label: "FaaS", detail: "Provider manages everything except individual functions" },
            { label: "SaaS", detail: "Provider manages the entire application" },
          ],
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
          kind: "terminal",
          heading: "The same operation, three CLIs",
          description:
            "Listing object storage buckets looks different on each provider's CLI, but it's the same underlying concept — this is the pattern that repeats across almost every service.",
          lines: [
            { text: "aws s3 ls" },
            { text: "2024-01-15 09:32:11 acme-monthly-reports", output: true },
            { text: "2024-02-03 14:07:45 acme-app-assets", output: true },
            { text: "az storage account list --output table" },
            { text: "Name              ResourceGroup    Location    Kind", output: true },
            { text: "acmestorage001    acme-rg          eastus      StorageV2", output: true },
            { text: "gcloud storage buckets list --format='value(name)'" },
            { text: "acme-monthly-reports-gcs", output: true },
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
          kind: "bullets",
          heading: "Storage tiers: the same cost lever, three names",
          intro: "Object storage isn't one price — every provider lets you pick a tier based on how often you'll actually read the data, and picking the wrong one is a recurring, easy-to-miss cost mistake:",
          bullets: [
            "AWS S3: Standard (frequent access) → Standard-IA (infrequent, cheaper storage, per-GB retrieval fee) → Glacier (archival, retrieval takes minutes to hours).",
            "Azure Blob Storage: Hot → Cool → Archive — same shape, same tradeoff: cheaper storage in exchange for a retrieval cost and, for Archive, a rehydration delay.",
            "GCP Cloud Storage: Standard → Nearline → Coldline → Archive, with the same pattern extended one tier further.",
            "The trap: leaving rarely-accessed data (old logs, backups) in the default \"Standard\" tier indefinitely — a lifecycle policy that auto-transitions objects after N days is the fix, not manually reviewing buckets.",
          ],
        },
        {
          kind: "bullets",
          heading: "Messaging and eventing",
          intro: "Decoupling services with a queue or event bus follows the same mapping as everything else:",
          bullets: [
            "Message queues (point-to-point, one consumer processes each message): SQS (AWS), Service Bus Queues (Azure), Pub/Sub with a single subscriber (GCP).",
            "Pub/sub fan-out (one event, many independent consumers): SNS (AWS, usually paired with SQS per subscriber), Event Grid (Azure), Pub/Sub (GCP, natively many-subscriber).",
            "The concept that matters more than any product name: decoupling a producer from a consumer through a durable broker, so a downstream service being slow or down doesn't block or lose the request that triggered it.",
          ],
        },
        {
          kind: "text",
          heading: "IAM and identity — the part most people skim past",
          body: [
            "Every provider has an identity and access layer controlling who (or what service) can do what: IAM (AWS), Azure AD/Entra ID with role-based access control (Azure), Cloud IAM (GCP). The concepts map directly — a user or service identity, a role or policy defining allowed actions, and a binding attaching that role to that identity on a specific resource.",
            "The default failure mode is identical across all three: attaching a broad, pre-built \"admin\" or \"contributor\" role to a service account because scoping a custom policy down to the three actions it actually needs takes more effort. That gap between granted and needed permission is where most real cloud breaches start — not from the provider's IAM system being weak.",
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
          kind: "chart",
          heading: "Reserved vs. on-demand pricing, roughly",
          description:
            "Committing to a term cuts the hourly rate substantially — the tradeoff is flexibility, not risk of a worse deal.",
          chartType: "bar",
          unit: "$/month (equivalent instance)",
          data: [
            { label: "On-Demand", value: 70 },
            { label: "1-Year Reserved", value: 49 },
            { label: "3-Year Reserved", value: 21 },
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
          kind: "terminal",
          heading: "Finding orphaned EBS volumes",
          description:
            "The exact command that turns \"orphaned storage\" from a vague warning into a concrete, billable list.",
          lines: [
            {
              text: "aws ec2 describe-volumes --filters Name=status,Values=available --query 'Volumes[].[VolumeId,Size,CreateTime]' --output table",
            },
            { text: "----------------------------------------------------------------", output: true },
            { text: "|  vol-0a1b2c3d4e5f6g7h8  |  100  |  2023-11-02T03:14:22Z  |", output: true },
            { text: "|  vol-0f9e8d7c6b5a4321f  |   50  |  2024-01-19T22:41:07Z  |", output: true },
            { text: "|  vol-0123abc456def7890  |  200  |  2024-02-27T11:05:53Z  |", output: true },
            { text: "----------------------------------------------------------------", output: true },
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
          kind: "terminal",
          heading: "Checking target health across Availability Zones",
          description:
            "This is what \"only routes to instances passing a health check\" looks like from the command line — one AZ's instance dropping out of rotation without anyone paging.",
          lines: [
            {
              text: "aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/web-app/6d0ecf831eec9f09",
            },
            { text: "TargetHealthDescriptions:", output: true },
            { text: "  - Target: i-0a1b2c3d4e5f6g7h8 (us-east-1a)  State: healthy", output: true },
            { text: "  - Target: i-0f9e8d7c6b5a4321f (us-east-1a)  State: healthy", output: true },
            {
              text: "  - Target: i-0123abc456def7890 (us-east-1b)  State: unhealthy  Reason: Target.Timeout",
              output: true,
            },
            { text: "  - Target: i-0987fed654cba3210 (us-east-1b)  State: healthy", output: true },
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
