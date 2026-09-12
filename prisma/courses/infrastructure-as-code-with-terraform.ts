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
  ],
};
