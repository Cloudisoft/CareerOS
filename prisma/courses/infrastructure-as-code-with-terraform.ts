import type { CourseSeed } from "../course-types";

export const course: CourseSeed = {
  slug: "infrastructure-as-code-with-terraform",
  title: "Infrastructure as Code with Terraform",
  description:
    "Why treating infrastructure as code beats clicking through a console, and the real Terraform workflow — providers, resources, state, and modules.",
  category: "Cloud",
  level: "INTERMEDIATE",
  order: 19,
  lessons: [
    {
      title: "Why Infrastructure as Code",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Why Infrastructure as Code",
          subheading:
            "Clicking through a cloud console works right up until you need to do it twice, correctly, under pressure, or explain exactly what changed and why.",
        },
        {
          kind: "bullets",
          heading: "What manual console changes cost you",
          bullets: [
            "No record of what changed, when, or who did it — beyond whatever the provider's own audit log happens to capture.",
            "No way to reliably reproduce an environment — \"staging\" and \"production\" drift apart the moment someone clicks a setting in one and not the other.",
            "Recovery from a deleted resource means someone remembering every setting it had, by hand, under time pressure.",
            "Review before a change ships means someone describing what they're about to click — not looking at an actual diff.",
          ],
        },
        {
          kind: "text",
          heading: "The core idea",
          body: [
            "Infrastructure as code means your servers, networks, databases, and permissions are described in files, checked into version control, exactly like application code. Terraform is one tool for doing this: you write what you want infrastructure to look like, and Terraform figures out the API calls to a cloud provider needed to make reality match.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "The real advantage isn't automation for its own sake",
          body: "It's that a pull request against a .tf file gets reviewed like any other code change — a teammate can read the diff, see exactly what resource is being created or changed, and catch a mistake before it touches a real account. A console click has no diff to review.",
        },
      ],
    },
    {
      title: "The Terraform Workflow: Write, Plan, Apply",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "The Terraform Workflow: Write, Plan, Apply",
          subheading:
            "Three commands cover almost everything you do day to day. The middle one — plan — is what makes Terraform trustworthy to run against real infrastructure.",
        },
        {
          kind: "example",
          heading: "The core loop",
          code: `terraform init    # download providers, set up the working directory
terraform plan    # show exactly what would change — nothing is touched yet
terraform apply   # make the changes shown in the plan, after you confirm
terraform destroy # tear down everything this configuration manages`,
        },
        {
          kind: "bullets",
          heading: "What each step is really doing",
          bullets: [
            "init — reads your configuration, downloads the provider plugins it references (AWS, GCP, and hundreds of others), and prepares local working files.",
            "plan — compares your configuration against the last known state and against real infrastructure, and prints a preview: what would be created, changed, or destroyed, and why.",
            "apply — re-runs that same comparison and, after you type \"yes,\" executes the actual API calls to make infrastructure match your configuration.",
          ],
        },
        {
          kind: "example",
          heading: "Reading a plan's output",
          code: `Terraform will perform the following actions:

  # aws_instance.web will be created
  + resource "aws_instance" "web" {
      + ami           = "ami-0c55b159cbfafe1f0"
      + instance_type = "t3.micro"
      + tags          = {
          + "Name" = "web-server"
        }
    }

Plan: 1 to add, 0 to change, 0 to destroy.`,
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Read every plan before you type yes",
          body: "The symbols matter: + creates, ~ modifies in place, and -/+ destroys and recreates — the last one means downtime for that resource. A one-line config change can silently turn into \"destroy and recreate the production database.\" The plan is telling you that in advance; skimming past it is how avoidable outages happen.",
        },
      ],
    },
    {
      title: "Providers and Resources",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Providers and Resources",
          subheading:
            "Providers are how Terraform talks to a specific platform; resources are the actual things you want that platform to have.",
        },
        {
          kind: "example",
          heading: "A real, minimal configuration",
          language: "hcl",
          code: `terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

resource "aws_s3_bucket" "reports" {
  bucket = "acme-monthly-reports"
}

resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"

  tags = {
    Name = "web-server"
  }
}`,
        },
        {
          kind: "bullets",
          heading: "The pieces, named",
          bullets: [
            "provider \"aws\" — configures which cloud (and which region, account, credentials) the following resources belong to.",
            "resource \"aws_s3_bucket\" \"reports\" — the resource type (what kind of thing), then a local name (reports) you use to refer to it elsewhere in your own configuration — not the bucket's real name.",
            "Everything inside the braces is that resource's arguments — for aws_instance, the AMI (a machine image ID) and instance type are the two that matter most.",
          ],
        },
        {
          kind: "example",
          heading: "Referencing one resource from another",
          language: "hcl",
          code: `resource "aws_security_group" "web_sg" {
  name = "web-sg"
}

resource "aws_instance" "web" {
  ami                    = "ami-0c55b159cbfafe1f0"
  instance_type          = "t3.micro"
  vpc_security_group_ids = [aws_security_group.web_sg.id]
}`,
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "This reference is the actual power of the language",
          body: "aws_security_group.web_sg.id isn't a string you copy-pasted from the console after creating the group by hand — Terraform creates the security group first, reads its real generated ID, and wires it into the instance automatically. Change the security group's config and every resource referencing it gets updated in the right order, without you tracking the dependency yourself.",
        },
      ],
    },
    {
      title: "State: Why It Matters and How It Breaks",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "State: Why It Matters and How It Breaks",
          subheading:
            "Terraform's state file is what lets it know what it already created. Losing track of it — or letting it drift from reality — is where most real Terraform incidents come from.",
        },
        {
          kind: "text",
          heading: "What the state file actually is",
          body: [
            "After every apply, Terraform writes a terraform.tfstate file recording every resource it manages and the real-world IDs it got back from the provider. This is the only way `terraform plan` knows the difference between \"a resource I haven't created yet\" and \"a resource I already created that now needs updating\" — your .tf files alone don't say which resources already exist.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Drift: when reality and state disagree",
          body: "If someone manually changes a resource in the console — resizes an instance, edits a security group rule — Terraform's state doesn't know. The next plan will show Terraform \"fixing\" that change back to whatever the .tf file says, which looks like Terraform breaking something a person intentionally changed. The actual bug is the manual change, not the plan — once infrastructure is managed by Terraform, changes belong in the config, not the console.",
        },
        {
          kind: "bullets",
          heading: "Why local state files are dangerous on a team",
          bullets: [
            "Two people running apply from their own laptops, each holding their own local state file, can each think they have the current picture while acting on stale information.",
            "A state file lost with a laptop means Terraform no longer knows what it created — it doesn't delete the real infrastructure, but it can no longer safely manage it either.",
            "State files can contain sensitive values (database passwords, keys) in plain text — committing one to a public repo is a real, common security incident.",
          ],
        },
        {
          kind: "example",
          heading: "Remote state, the standard fix",
          language: "hcl",
          code: `terraform {
  backend "s3" {
    bucket         = "acme-terraform-state"
    key            = "prod/network.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
  }
}`,
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "What remote state buys you",
          body: "The state lives in one shared location every teammate and CI job reads from, so everyone sees the same picture. The dynamodb_table adds locking — while one apply is running, a second one is blocked from starting, instead of two applies racing each other and corrupting the state.",
        },
      ],
    },
    {
      title: "Modules for Reuse",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Modules for Reuse",
          subheading:
            "Copy-pasting the same 40 lines of HCL for a third \"web server + security group\" setup is exactly the kind of duplication modules exist to remove.",
        },
        {
          kind: "example",
          heading: "A module's own files",
          language: "hcl",
          code: `# modules/web-server/variables.tf
variable "instance_type" {
  type    = string
  default = "t3.micro"
}
variable "name" {
  type = string
}

# modules/web-server/main.tf
resource "aws_instance" "this" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = var.instance_type
  tags = {
    Name = var.name
  }
}

# modules/web-server/outputs.tf
output "instance_id" {
  value = aws_instance.this.id
}`,
        },
        {
          kind: "example",
          heading: "Using that module twice",
          language: "hcl",
          code: `module "staging_web" {
  source        = "./modules/web-server"
  name          = "staging"
  instance_type = "t3.micro"
}

module "production_web" {
  source        = "./modules/web-server"
  name          = "production"
  instance_type = "t3.large"
}`,
        },
        {
          kind: "bullets",
          heading: "What this actually buys you",
          bullets: [
            "The instance configuration is written once, in the module, instead of duplicated everywhere it's used.",
            "variables.tf defines the module's inputs, with sensible defaults where they make sense; outputs.tf defines what it hands back to whoever uses it (module.staging_web.instance_id, reachable from outside the module).",
            "A bug fix or a security-group tweak in the module benefits every environment using it the next time someone runs apply — instead of needing to be copy-pasted into every duplicated copy.",
          ],
        },
        {
          kind: "summary",
          heading: "What to take away",
          bullets: [
            "Infrastructure as code turns infrastructure changes into reviewable diffs, not console clicks nobody can see afterward.",
            "Always read the plan — the +/~/- symbols tell you exactly what's about to happen, including anything that means real downtime.",
            "Use remote state with locking the moment more than one person touches an environment — a local state file does not scale past one person.",
            "Reach for a module once you've written the same resource pattern twice — the third copy-paste is one too many.",
          ],
        },
      ],
    },
    {
      title: "Data Sources and Importing Existing Infrastructure",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Data Sources and Importing Existing Infrastructure",
          subheading:
            "Not everything your configuration needs to know about was created by that configuration. Data sources and terraform import are how Terraform deals with infrastructure it doesn't own.",
        },
        {
          kind: "text",
          heading: "The problem a resource block can't solve",
          body: [
            "Sometimes you need to reference something that already exists and genuinely shouldn't be managed by this configuration — a VPC another team's Terraform created, an AMI published by a separate image-build pipeline, a DNS zone that predates any of your Terraform. Writing a resource block for it would try to create a duplicate, or fight the config that already owns it.",
          ],
        },
        {
          kind: "example",
          heading: "A data source, in practice",
          language: "hcl",
          code: `data "aws_vpc" "default" {
  default = true
}

resource "aws_subnet" "app" {
  vpc_id     = data.aws_vpc.default.id
  cidr_block = "10.0.1.0/24"
}`,
        },
        {
          kind: "bullets",
          heading: "How this differs from a resource block",
          bullets: [
            "data \"aws_vpc\" \"default\" queries the provider for something matching the filter — it doesn't create, modify, or destroy anything, ever, no matter what happens in plan or apply.",
            "data.aws_vpc.default.id is read the same way you'd read a resource's attribute, but it's read-only — there's nothing to change from Terraform's side.",
            "This is the mechanism for referencing infrastructure another team, another Terraform configuration, or a human created — without adopting responsibility for it.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "terraform import: adopting infrastructure you didn't create with Terraform",
          body: "A resource created by hand years ago — an S3 bucket, say — can be brought under Terraform's management with `terraform import aws_s3_bucket.reports acme-monthly-reports`. This adds it to the state file so Terraform knows it already exists, but it does not write the matching .tf configuration for you (older Terraform versions) — you still have to hand-author a resource block whose arguments match reality, or the next plan will show Terraform trying to \"fix\" it back to whatever your incomplete config says.",
        },
        {
          kind: "summary",
          heading: "What this closes",
          bullets: [
            "Not every real-world dependency originates from your own resource blocks — data sources read what already exists without claiming ownership of it.",
            "terraform import lets you bring existing, manually-created infrastructure under management without destroying and recreating it — but only once your config actually matches its real settings.",
          ],
        },
      ],
    },
    {
      title: "Practice: Writing Terraform Configuration",
      durationMinutes: 14,
      slides: [
        {
          kind: "title",
          heading: "Practice: Writing Terraform Configuration",
          subheading: "Three exercises using exactly what this course has covered — write the HCL yourself before checking the solution.",
        },
        {
          kind: "practice",
          heading: "An S3 bucket with versioning enabled",
          prompt:
            "Write the Terraform resource block(s) for a private S3 bucket named \"acme-user-uploads\" with versioning enabled. In the AWS provider, versioning is not an inline argument on the bucket resource itself — it's a separate resource linked to the bucket by ID.",
          hint: "You need two resource blocks: aws_s3_bucket for the bucket itself, and aws_s3_bucket_versioning referencing the bucket's id.",
          solution: `resource "aws_s3_bucket" "uploads" {
  bucket = "acme-user-uploads"
}

# Versioning is configured on a separate resource, linked by the bucket's id —
# this is why you can't just add a "versioning = true" line to aws_s3_bucket.
resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  versioning_configuration {
    status = "Enabled"
  }
}`,
        },
        {
          kind: "practice",
          heading: "Reference infrastructure you don't own",
          prompt:
            "Your AWS account already has a default VPC that was never created through Terraform, and it shouldn't be adopted into this configuration. Write a data source that looks up that default VPC, and a subnet resource inside it using CIDR block 10.0.5.0/24.",
          hint: "Use a data \"aws_vpc\" block filtered by default = true, then reference its .id as the subnet's vpc_id — don't write a resource block for the VPC itself.",
          solution: `data "aws_vpc" "default" {
  default = true
}

resource "aws_subnet" "app" {
  vpc_id     = data.aws_vpc.default.id   # reads the existing VPC's id, doesn't create one
  cidr_block = "10.0.5.0/24"
}`,
        },
        {
          kind: "practice",
          heading: "Validate a variable instead of finding out mid-apply",
          prompt:
            "This variable has no type and no validation, so a typo like instance_type = \"t3.mikro\" would only surface once Terraform tries to call the AWS API mid-apply:\n\nvariable \"instance_type\" {\n  default = \"t3.micro\"\n}\n\nRewrite it with an explicit type and a validation block that only allows \"t3.micro\", \"t3.small\", or \"t3.medium\".",
          hint: "A validation block takes a condition (often using contains() against a list) and an error_message shown when the condition is false.",
          solution: `variable "instance_type" {
  type    = string
  default = "t3.micro"

  validation {
    # contains() checks the value against an explicit allow-list at plan time,
    # instead of letting a typo reach the AWS API mid-apply
    condition     = contains(["t3.micro", "t3.small", "t3.medium"], var.instance_type)
    error_message = "instance_type must be one of: t3.micro, t3.small, t3.medium."
  }
}`,
        },
        {
          kind: "summary",
          heading: "What a correct solution demonstrates",
          bullets: [
            "Recognizing when a setting (like versioning) is actually a separate linked resource rather than an inline argument.",
            "Reaching for a data source instead of a resource block when infrastructure already exists and isn't yours to manage.",
            "Catching bad input at plan time with variable validation, instead of letting it fail mid-apply against a real API.",
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
          heading: "Reading a plan",
          question: "In `terraform plan` output, a resource is marked with -/+. What does that mean?",
          options: [
            "It will be modified in place with no downtime",
            "It will be destroyed and recreated",
            "It will only be destroyed, with nothing recreated",
            "Terraform detected drift but will take no action",
          ],
          correctIndex: 1,
          explanation:
            "-/+ means destroy-then-recreate — for a stateful resource like a database, this usually means real downtime and possibly data loss, which is exactly why reading the plan's symbols before typing yes matters.",
        },
        {
          kind: "quiz",
          heading: "Local state on a team",
          question:
            "Two engineers each run terraform apply from their own laptop against the same environment, each holding only a local state file. What's the real risk?",
          options: [
            "Terraform automatically refuses to let a second apply run",
            "Each engineer may be acting on a stale picture of what already exists, and concurrent applies can race and corrupt state",
            "Local state files sync automatically between machines, so this is safe",
            "This is only a problem if they're using different Terraform versions",
          ],
          correctIndex: 1,
          explanation:
            "Without remote state and locking, nothing prevents two applies from running at once or from each engineer working off an out-of-date picture — this is exactly what remote state with a lock (like the S3 + DynamoDB backend) exists to prevent.",
        },
        {
          kind: "quiz",
          heading: "Drift",
          question:
            "A teammate manually resizes an EC2 instance in the AWS console that's already managed by Terraform. What happens on the next terraform plan?",
          options: [
            "Terraform silently adopts the new size as the desired state",
            "Terraform shows a plan to change the instance back to whatever the .tf file specifies, since state doesn't know about the manual change",
            "Terraform refuses to run until the state file is deleted",
            "Terraform automatically rewrites the .tf file to match the console change",
          ],
          correctIndex: 1,
          explanation:
            "Terraform's state only knows what it last applied — a manual console change isn't reflected there, so the next plan looks like Terraform \"reverting\" someone's change, when the real issue is the manual change bypassing Terraform in the first place.",
        },
        {
          kind: "quiz",
          heading: "Data sources",
          question: "What is a `data` block for in a Terraform configuration?",
          options: [
            "Creating a new resource with default argument values",
            "Reading information about infrastructure Terraform doesn't manage or create, without being able to modify it",
            "Storing output values for other modules to consume",
            "Defining a variable's default value",
          ],
          correctIndex: 1,
          explanation:
            "A data source is strictly read-only — it queries the provider for something that already exists so your configuration can reference it, but Terraform never creates, changes, or destroys it.",
        },
        {
          kind: "quiz",
          heading: "Modules",
          question:
            "A root configuration calls the same module twice — module \"staging_web\" and module \"production_web\" — passing a different instance_type to each. What does this achieve?",
          options: [
            "The module's resource code gets duplicated at runtime into two separate copies of a .tf file",
            "A single reusable resource pattern, written once inside the module, gets instantiated twice with different inputs",
            "Both calls always produce identical infrastructure regardless of the variables passed",
            "Modules can only be called once per configuration, so this would fail",
          ],
          correctIndex: 1,
          explanation:
            "That's the entire point of a module: write the pattern once, call it as many times as needed with different variable values, and a bug fix inside the module benefits every environment using it.",
        },
        {
          kind: "summary",
          heading: "The course, in six takeaways",
          bullets: [
            "Infrastructure as code turns infrastructure changes into reviewable diffs instead of unrecorded console clicks.",
            "Always read the plan — +, ~, and -/+ tell you exactly what's about to happen, including anything that means real downtime.",
            "Use remote state with locking the moment more than one person touches an environment.",
            "Reach for a module once you've written the same resource pattern twice.",
            "Data sources reference infrastructure you don't own; terraform import adopts infrastructure you do, without recreating it.",
          ],
        },
      ],
    },
  ],
};
