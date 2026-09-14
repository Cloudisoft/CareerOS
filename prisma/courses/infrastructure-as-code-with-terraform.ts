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
            "\"Declarative\" is the key word — you describe the end state you want, not the sequence of steps to get there. A shell script that calls aws ec2 run-instances is imperative: run it twice and you get two instances. A Terraform resource block is declarative: run terraform apply twice against no changes and nothing happens, because Terraform compares desired state against what already exists before acting.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "The real advantage isn't automation for its own sake",
          body: "It's that a pull request against a .tf file gets reviewed like any other code change — a teammate can read the diff, see exactly what resource is being created or changed, and catch a mistake before it touches a real account. A console click has no diff to review.",
        },
        {
          kind: "bullets",
          heading: "Terraform isn't the only option",
          intro: "Worth knowing the landscape, even if this course focuses on Terraform:",
          bullets: [
            "CloudFormation (AWS-only) and ARM/Bicep (Azure-only) — provider-native, tightly integrated, but locked to one cloud. Terraform's provider model covers AWS, Azure, GCP, and hundreds of other systems (Datadog, GitHub, Kubernetes itself) with one tool and one workflow.",
            "Pulumi — infrastructure as code in a general-purpose language (TypeScript, Python, Go) instead of HCL, trading Terraform's declarative-only simplicity for real loops, functions, and your existing language tooling.",
            "Ansible and similar config-management tools solve a related but different problem — configuring software on servers that already exist, not provisioning the servers themselves. Terraform and Ansible are frequently used together, not as alternatives to each other.",
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Why Terraform specifically tends to win by default",
          body: "Multi-cloud support without rewriting your tooling per provider, a huge existing library of community and provider-maintained modules, and a plan step that shows you a preview before anything touches real infrastructure — that combination is why it's become the default choice for teams that don't already have a hard reason to pick something else.",
        },
        {
          kind: "bullets",
          heading: "What \"IaC\" gets you beyond the diff itself",
          bullets: [
            "Disaster recovery becomes mechanical instead of heroic — if a region-level outage takes out your whole VPC, \"rebuild it\" means terraform apply against the same config in a new region, not a person trying to remember every setting from memory under pressure.",
            "Onboarding a new engineer to \"how is production actually set up\" means reading the .tf files, not a wiki page that's been stale since the last unrecorded console change.",
            "Consistent environments stop being an aspiration — staging and production come from the same module with different variable values, instead of drifting apart because someone clicked a setting in one and not the other.",
            "Compliance and audit questions (\"prove that encryption was enabled the whole time\") get answered by git history and a diff, not by someone's memory of what they clicked in March.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "A familiar story: the security group nobody remembers opening",
          body: "A common real incident shape: a security group briefly opened to 0.0.0.0/0 for a five-minute debugging session in the console, then never closed again because nobody wrote down that it happened. Six months later a security audit finds it, and nobody on the team — including whoever made the change — can say when it happened, why, or whether it's still needed. With Terraform, the same debugging need would have shown up as a one-line .tf change, reviewed in a pull request, with a git blame pointing straight at who made it and why, and a natural, obvious place to revert it once the debugging session actually ended.",
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
          kind: "terminal",
          heading: "Running the loop for real",
          description: "The three commands from the core loop, actually run against the configuration from the previous slide.",
          lines: [
            { text: "terraform init" },
            { text: "Initializing the backend...", output: true },
            { text: "Initializing provider plugins...", output: true },
            { text: "- Installing hashicorp/aws v5.31.0...", output: true },
            { text: "Terraform has been successfully initialized!", output: true },
            { text: "terraform plan" },
            { text: "Plan: 1 to add, 0 to change, 0 to destroy.", output: true },
            { text: "terraform apply" },
            { text: "  Enter a value: yes", output: true },
            { text: "aws_instance.web: Creating...", output: true },
            { text: "aws_instance.web: Creation complete after 32s [id=i-0a1b2c3d4e5f6g7h8]", output: true },
            { text: "Apply complete! Resources: 1 added, 0 changed, 0 destroyed.", output: true },
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Read every plan before you type yes",
          body: "The symbols matter: + creates, ~ modifies in place, and -/+ destroys and recreates — the last one means downtime for that resource. A one-line config change can silently turn into \"destroy and recreate the production database.\" The plan is telling you that in advance; skimming past it is how avoidable outages happen.",
        },
        {
          kind: "bullets",
          heading: "Flags that change what plan and apply actually do",
          bullets: [
            "terraform plan -out=tfplan saves the exact plan to a file. terraform apply tfplan then applies precisely that plan — no re-evaluation, no risk of infrastructure changing between plan and apply. This is the standard pattern in CI, not two loosely-connected commands.",
            "terraform apply -auto-approve skips the interactive yes/no prompt — necessary for CI, dangerous run by hand, since it removes the last human checkpoint before a destroy.",
            "terraform apply -target=aws_instance.web applies changes to only that resource and its dependencies, skipping everything else in the plan. It's an escape hatch for a genuine emergency, not a routine workflow — used habitually, it lets your applied state and your full configuration quietly diverge.",
            "terraform plan -destroy previews a full teardown without running it — the safe way to sanity-check terraform destroy before you actually run it.",
          ],
        },
        {
          kind: "text",
          heading: "fmt and validate: the pre-commit hygiene layer",
          body: [
            "terraform fmt rewrites your files to Terraform's canonical formatting (indentation, alignment of = signs) — run it before every commit so diffs show actual changes, not whitespace noise. terraform validate checks the configuration is syntactically valid and internally consistent (references resolve, required arguments are present) without touching any real infrastructure or even needing valid cloud credentials, which makes it cheap to run in CI on every push, well before a plan step that does need credentials.",
            "Most teams wire both into a pre-commit hook and a CI check — catching a typo in fmt or validate takes seconds; catching the same typo three minutes into a plan against production credentials wastes a CI slot and a teammate's patience.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Idempotency is the property that makes any of this safe",
          body: "Run terraform apply against a configuration with no changes, and Terraform does nothing — plan reports zero changes because reality already matches desired state. This is what makes it safe to run apply repeatedly, in CI, on a schedule, or by hand without worrying about duplicating resources — the opposite of running a shell script that calls a cloud API's \"create\" action, where running it twice creates two of everything. Every resource type in Terraform is built to compare-then-act rather than always-act, and that guarantee is the entire reason a plan step can be trusted before you type yes.",
        },
        {
          kind: "example",
          heading: "terraform output and terraform show: inspecting what's already applied",
          body: "Once resources exist, two more commands answer \"what do I actually have\" without touching anything. terraform output prints every declared output value from the current state — useful for grabbing a generated resource ID or endpoint URL to paste into another tool or script. terraform show prints the full current state in a readable form, including every attribute Terraform recorded, not just the ones your config explicitly set.",
          code: `terraform output
# instance_id = "i-0a1b2c3d4e5f6g7h8"
# bucket_url  = "acme-user-uploads.s3.amazonaws.com"

terraform output -json instance_id
# "i-0a1b2c3d4e5f6g7h8"   — machine-readable, common in CI scripts

terraform show
# aws_instance.web: shows every recorded attribute, including ones
# never set explicitly, like the AMI's actual resolved architecture`,
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "terraform console: a REPL for testing expressions against real state",
          body: "Before committing to a tricky expression — a for loop transforming a variable, a lookup() with a fallback — terraform console opens an interactive prompt where you can evaluate Terraform expressions directly against your current state and variables, without running plan or apply at all. It's the fastest way to sanity-check something like [for s in var.subnets : s.cidr_block] actually produces the list you expect, before it ends up wrong inside a real resource block.",
        },
        {
          kind: "bullets",
          heading: "-refresh-only: updating state to match reality without changing anything",
          bullets: [
            "terraform plan -refresh-only compares state against real infrastructure and shows any drift, without proposing to fix it — useful for auditing what's changed outside Terraform before deciding what to do about it.",
            "terraform apply -refresh-only updates state to match what plan -refresh-only found, again without touching real infrastructure — it accepts reality as the new baseline instead of fighting to revert it.",
            "This is the deliberate, reviewed way to handle a manual change you've decided to keep, instead of state and reality silently disagreeing on every plan from then on.",
          ],
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
        {
          kind: "diagram",
          heading: "How Terraform orders these creates",
          description: "Terraform builds a dependency graph from resource references, not from the order they appear in the file.",
          steps: [
            { label: "Parse config", detail: "Read every resource and provider block" },
            { label: "Build dependency graph", detail: "aws_instance.web references aws_security_group.web_sg.id" },
            { label: "Create web_sg", detail: "No dependencies of its own — created first" },
            { label: "Create web instance", detail: "Waits for the security group's real ID before it can be created" },
          ],
        },
        {
          kind: "bullets",
          heading: "Meta-arguments: options every resource block accepts",
          bullets: [
            "count = 3 creates three copies of a resource, addressed by index (aws_instance.web[0], [1], [2]) — simple, but fragile: deleting the middle item shifts every index after it, and Terraform reads that as destroying and recreating them.",
            "for_each over a map or set creates one resource per key, addressed by that key (aws_instance.web[\"staging\"]) — removing one entry only affects that one resource, which is why for_each is generally preferred over count once you're managing more than a couple of near-identical resources.",
            "lifecycle { prevent_destroy = true } makes Terraform refuse to destroy that resource even if a plan calls for it — a guardrail worth putting on anything genuinely catastrophic to lose, like a production database.",
            "lifecycle { create_before_destroy = true } flips the default order on a replace: the new resource is created first and the old one destroyed only after, avoiding a gap where neither exists.",
          ],
        },
        {
          kind: "example",
          heading: "for_each in practice: one bucket per environment",
          language: "hcl",
          code: `resource "aws_s3_bucket" "reports" {
  for_each = toset(["staging", "production"])
  bucket   = "acme-reports-\${each.key}"
}

# Referenced elsewhere as aws_s3_bucket.reports["staging"].id
# and aws_s3_bucket.reports["production"].id`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "count's index-shifting is a real production gotcha",
          body: "With count = 3 addressing servers as [0], [1], [2] by list position, removing the second entry from that list doesn't just delete one server — Terraform sees [1] and [2] as changed identities and plans to destroy and recreate both, not just drop the one you removed. for_each avoids this entirely because each resource is keyed by a stable value, not a position that shifts when the list does.",
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Provider version pinning matters as much as module version pinning",
          body: "The required_providers block's version = \"~> 5.0\" allows any 5.x release but blocks 6.0 — the ~> operator pins the left-most non-zero component you specify. Leaving version unconstrained means a fresh terraform init on a new machine or in CI can silently pull a newer major provider version with breaking changes to resource schemas, which is how \"it works on my machine\" turns into a broken pipeline on someone else's.",
        },
        {
          kind: "text",
          heading: "Aliased providers: talking to more than one account or region at once",
          body: [
            "A single provider \"aws\" block configures one region and one set of credentials by default — but real setups often need a second one, most commonly to put a CloudFront distribution's ACM certificate in us-east-1 while the rest of the stack lives in eu-west-1, or to replicate a resource into a second account entirely.",
            "The pattern: a second provider block with alias = \"us_east_1\", then any resource that needs it adds provider = aws.us_east_1 as an argument. Without the alias, Terraform has no way to know which of two same-type provider configurations a given resource should use — it isn't inferred from context.",
          ],
        },
        {
          kind: "example",
          heading: "locals: naming a computed value once, used many times",
          body: "A locals block defines a named expression once, computed at plan time, and reused anywhere in the configuration — the Terraform equivalent of a local variable, as distinct from var.* input variables that come from outside the module or root configuration.",
          language: "hcl",
          code: `locals {
  environment  = "production"
  service_name = "acme-web"
  common_tags = {
    Environment = local.environment
    Service     = local.service_name
    ManagedBy   = "terraform"
  }
}

resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"
  tags          = local.common_tags
}`,
        },
        {
          kind: "bullets",
          heading: "depends_on: forcing an ordering Terraform can't infer on its own",
          intro: "Terraform infers most ordering automatically from references like aws_security_group.web_sg.id, but not every real dependency shows up as a reference:",
          bullets: [
            "A resource might depend on another purely through side effects — an IAM policy that needs to exist before a Lambda function can actually execute successfully, with no direct attribute reference between the two blocks at all.",
            "depends_on = [aws_iam_role_policy.lambda_exec] makes that ordering explicit, telling Terraform to create the policy first even though nothing in the Lambda resource's arguments references it directly.",
            "Reach for depends_on only when a real reference genuinely isn't possible — an explicit attribute reference is almost always preferable, since it documents the actual data dependency instead of just an ordering rule with no data behind it.",
          ],
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
          kind: "terminal",
          heading: "What drift actually looks like in a plan",
          description:
            "Someone resized the instance by hand in the console. The next plan doesn't know that was intentional — it just sees a mismatch.",
          lines: [
            { text: "terraform plan" },
            { text: "aws_instance.web: Refreshing state... [id=i-0a1b2c3d4e5f6g7h8]", output: true },
            { text: "Terraform will perform the following actions:", output: true },
            { text: "  # aws_instance.web will be updated in-place", output: true },
            { text: "  ~ resource \"aws_instance\" \"web\" {", output: true },
            { text: "      ~ instance_type = \"t3.large\" -> \"t3.micro\"", output: true },
            { text: "    }", output: true },
            { text: "Plan: 0 to add, 1 to change, 0 to destroy.", output: true },
          ],
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
        {
          kind: "bullets",
          heading: "Editing state directly — rare, but you'll need it eventually",
          bullets: [
            "terraform state list — prints every resource currently tracked in state, useful for confirming what Terraform thinks it manages before a risky change.",
            "terraform state show aws_instance.web — prints every attribute Terraform has recorded for that resource, including ones not in your config, like the real generated ID.",
            "terraform state mv — renames a resource in state without destroying and recreating it, essential after refactoring a resource's name or moving it into a module without an actual infrastructure change.",
            "terraform state rm — removes a resource from state without destroying the real infrastructure, the correct way to stop managing something without deleting it.",
          ],
        },
        {
          kind: "text",
          heading: "Workspaces: one configuration, multiple state files",
          body: [
            "terraform workspace new staging creates a separate, isolated state file for that workspace while reusing the same .tf configuration — terraform workspace select switches between them. This lets one set of Terraform files manage staging and production as genuinely separate infrastructure, each with its own state, instead of copy-pasting the whole configuration per environment.",
            "The common gotcha: workspaces isolate state, not variable values — you still need a mechanism (a .tfvars file per workspace, or a lookup keyed on terraform.workspace) to give staging a smaller instance size than production. Forgetting that step means workspaces silently deploy identical infrastructure to both environments.",
          ],
        },
        {
          kind: "terminal",
          heading: "The lock in action",
          description:
            "What a teammate sees if they run apply while your apply is still in progress — instead of two applies racing.",
          lines: [
            { text: "terraform apply" },
            { text: "Error: Error acquiring the state lock", output: true },
            { text: "Lock Info:", output: true },
            { text: "  ID:        7c1a9e3d-2b44-4f1a-9c6e-5a0d8b2f1c33", output: true },
            { text: "  Path:      acme-terraform-state/prod/network.tfstate", output: true },
            { text: "  Operation: OperationTypeApply", output: true },
            { text: "  Who:       jordan@acme-eng-laptop", output: true },
            { text: "  Created:   2024-03-11 14:22:03 UTC", output: true },
          ],
        },
        {
          kind: "example",
          heading: "The moved block: the modern, reviewable alternative to terraform state mv",
          body: "Renaming a resource or moving it into a module used to require running terraform state mv as a separate, easy-to-forget manual step around the actual code change. A moved block declares the rename as configuration itself, so plan can show it — and a reviewer can approve it — before anyone applies.",
          language: "hcl",
          code: `moved {
  from = aws_instance.web
  to   = aws_instance.app_server
}

resource "aws_instance" "app_server" {
  # ...same arguments as the old aws_instance.web
}`,
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "A single giant state file eventually becomes its own problem",
          body: "A state file tracking a few hundred resources plans in seconds; one tracking several thousand can take minutes just to refresh, since Terraform checks most tracked resources against the real provider on every plan by default. Splitting one enormous configuration into several smaller ones — network, data layer, application layer, each with its own state — keeps any single plan fast and limits the blast radius of a mistake to the one state file actually being changed, at the cost of needing terraform_remote_state or a similar mechanism to pass values between them.",
        },
        {
          kind: "bullets",
          heading: "Reading and writing state programmatically",
          bullets: [
            "terraform state pull prints the current remote state as raw JSON to stdout — the building block behind custom tooling that needs to inspect state without going through terraform state show one resource at a time.",
            "terraform state push writes a local state file back to the configured remote backend — a genuinely rare, deliberate operation, mostly reserved for disaster recovery after a backend migration goes wrong, not something reached for casually.",
            "-json output on plan, apply, and state commands turns Terraform's output into machine-readable data a CI pipeline can parse programmatically, instead of scraping human-formatted terminal text — the standard way to build automation (a Slack notification summarizing a plan's changes, say) around Terraform's own commands.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Never edit terraform.tfstate by hand in a text editor",
          body: "The state file is JSON, technically editable with any text editor, but doing so directly is one of the fastest ways to corrupt it beyond what Terraform's own commands can safely fix — a single misplaced field, and the next plan can misbehave in ways that are genuinely hard to diagnose. terraform state mv, terraform state rm, and the moved block above cover the vast majority of legitimate reasons to change what's recorded in state; reach for one of those, or terraform state pull piped through a script for something genuinely unusual, rather than opening the file directly.",
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
          kind: "example",
          heading: "Sourcing a module from a git tag, pinned",
          language: "hcl",
          code: `module "vpc" {
  source = "git::https://github.com/acme-eng/tf-modules.git//vpc?ref=v2.3.0"

  cidr_block = "10.0.0.0/16"
}

# Or from the public Terraform Registry, also pinned:
module "vpc_registry" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.8.1"

  cidr = "10.0.0.0/16"
}`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "An unpinned module source is a silent supply chain risk",
          body: "source = \"git::https://...//vpc\" with no ?ref, or version = \">= 5.0\" instead of an exact version, means the next terraform init can pull in changes nobody on your team reviewed — including a breaking change, or in the worst case a compromised module. Pin to an exact tag or version, and bump it deliberately, the same way you'd pin a package dependency rather than let npm install grab whatever's newest.",
        },
        {
          kind: "bullets",
          heading: "What makes a module worth extracting",
          bullets: [
            "A module should do one thing well — \"our standard web server\" or \"our standard VPC,\" not \"every possible AWS resource we might ever need,\" which turns into an unmaintainable pile of optional toggles nobody fully understands.",
            "Extract a module the second or third time you write the same resource pattern, not preemptively on the first — a module built before you know its real variations tends to guess wrong about what should be configurable.",
            "Sensible defaults in variables.tf matter as much as the resources themselves — a module that requires 15 inputs to use at all defeats the point of making it reusable.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Changing a published module is a versioned, backward-compatible change — or it should be",
          body: "Once a module is used by more than one team, treat its inputs and outputs like a public API: renaming a variable or removing an output breaks every caller silently at their next terraform init, often long after you've forgotten the change. Add new optional variables with defaults rather than renaming existing required ones, deprecate before removing, and bump the module's major version (following semver) on any breaking change so callers pinned to an older version aren't affected until they choose to upgrade.",
        },
        {
          kind: "example",
          heading: "Modules composing other modules",
          body: "A root configuration isn't the only place a module can be called from — a higher-level module can call a lower-level one internally, passing its own outputs down as the inner module's inputs. A \"standard-app\" module might call the vpc module and the web-server module from earlier in this lesson, wiring the VPC's output subnet ID straight into the server's input, so a caller of standard-app only has to think about application-level inputs, not the network plumbing underneath it.",
          language: "hcl",
          code: `module "vpc" {
  source = "./modules/vpc"
  cidr   = "10.0.0.0/16"
}

module "web" {
  source    = "./modules/web-server"
  subnet_id = module.vpc.subnet_id   # one module's output feeds another's input
  name      = "production"
}`,
        },
        {
          kind: "bullets",
          heading: "Testing a module before other teams depend on it",
          bullets: [
            "terraform validate and terraform plan against a small example configuration that calls the module are the cheapest first check — do they even run without errors, does the plan look like what you'd expect.",
            "Tools like Terratest (Go) or terraform-compliance (Gherkin-style policy tests) actually apply a module against real, usually short-lived, throwaway infrastructure and assert on the result — closer to an integration test than validate and plan alone provide.",
            "A README with a minimal usage example inside the module's own directory does double duty: it documents the module for humans, and it's the first thing worth keeping working as the module changes, since it's the example every new caller copies from.",
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
          kind: "terminal",
          heading: "Importing the bucket for real",
          description: "The exact command from the callout above, run against a bucket that already exists.",
          lines: [
            { text: "terraform import aws_s3_bucket.reports acme-monthly-reports" },
            { text: "aws_s3_bucket.reports: Importing from ID \"acme-monthly-reports\"...", output: true },
            { text: "aws_s3_bucket.reports: Import prepared!", output: true },
            { text: "aws_s3_bucket.reports: Refreshing state... [id=acme-monthly-reports]", output: true },
            { text: "Import successful!", output: true },
            { text: "terraform plan" },
            { text: "  # aws_s3_bucket.reports will be updated in-place", output: true },
            { text: "  ~ resource \"aws_s3_bucket\" \"reports\" {", output: true },
            { text: "      ~ acl = \"private\" -> \"public-read\"", output: true },
            { text: "    }", output: true },
            { text: "Plan: 0 to add, 1 to change, 0 to destroy.", output: true },
          ],
        },
        {
          kind: "example",
          heading: "The modern alternative: a declarative import block",
          body: "Terraform 1.5+ lets you write the import as configuration instead of a one-off CLI command — reviewable in a pull request like everything else:",
          language: "hcl",
          code: `import {
  to = aws_s3_bucket.reports
  id = "acme-monthly-reports"
}

resource "aws_s3_bucket" "reports" {
  bucket = "acme-monthly-reports"
}

# terraform plan -generate-config-out=generated.tf
# generates a best-effort resource block for you from the real
# resource's current settings — a starting point, not a finished config`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Data sources are re-queried on every plan, and can fail plan-time",
          body: "A data \"aws_vpc\" block isn't cached after the first read — Terraform calls out to the provider again on every plan and apply. If the thing it's filtering for doesn't exist yet (a VPC not created until earlier in the same apply, or deleted out from under you), the data source lookup fails and the whole plan fails with it — before Terraform gets anywhere near the resources that actually depend on it. This is why a data source referencing something another Terraform config manages needs that other config's resource to already exist and be stable, not mid-flight.",
        },
        {
          kind: "example",
          heading: "Reading another team's outputs with terraform_remote_state",
          body: "When infrastructure is split across multiple Terraform configurations — one team owns networking, another owns the application layer — the terraform_remote_state data source lets one configuration read another's outputs directly from its remote state backend, without either team needing to touch the other's code.",
          language: "hcl",
          code: `data "terraform_remote_state" "network" {
  backend = "s3"
  config = {
    bucket = "acme-terraform-state"
    key    = "prod/network.tfstate"
    region = "us-east-1"
  }
}

resource "aws_instance" "web" {
  subnet_id = data.terraform_remote_state.network.outputs.subnet_id
}`,
        },
        {
          kind: "bullets",
          heading: "A couple of less common but genuinely useful data source patterns",
          bullets: [
            "A data block accepts for_each and count just like a resource block — data \"aws_ami\" \"app\" { for_each = toset(var.regions) ... } looks up the latest matching AMI once per region, useful when the same configuration deploys across several regions and each needs its own region-specific image ID.",
            "The external data source can shell out to any script and use its JSON stdout as data inside Terraform — a genuine escape hatch for a value only computable outside Terraform's own expression language, though it's worth treating as a last resort, since it also means the plan now depends on some external script actually being present and working wherever Terraform runs.",
            "data \"aws_caller_identity\" \"current\" needs no filter arguments at all — it simply returns the AWS account ID, user ARN, and user ID of whichever credentials Terraform is currently running with, a common building block for constructing an ARN string that includes the current account ID without hardcoding it.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "terraform_remote_state couples two configurations to each other's output names",
          body: "This works well, but it creates a real dependency: renaming or removing an output in the network configuration silently breaks the application configuration's next plan, with no compile-time warning that it's about to happen — only a plan-time error, potentially discovered by whichever team applies next. Some organizations prefer a more explicit contract instead, like publishing values through a parameter store (SSM, Secrets Manager) or a dedicated data-sharing module, specifically to avoid two Terraform configurations depending directly on each other's internal output names.",
        },
        {
          kind: "bullets",
          heading: "Deciding between data source, import, and a fresh resource",
          bullets: [
            "Something another team's Terraform (or a different tool entirely) owns and will keep managing — use a data source. You read it; you never touch it.",
            "Something created by hand or by a retired tool, that your configuration should own going forward — use import (or the import block) to adopt it, then hand-write a matching resource block.",
            "Something that doesn't exist yet — write a plain resource block; there's nothing to look up or adopt.",
            "Getting this wrong in the data-source direction (writing a resource block for something another team already manages) is the more dangerous mistake: Terraform will try to create a duplicate, or fight the configuration that already owns it, on every apply from then on.",
            "Splitting infrastructure across multiple Terraform configurations owned by different teams is itself a deliberate choice, not a default — terraform_remote_state (or a parameter store) is how they read from each other without merging into one giant, slow-to-plan configuration.",
          ],
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
          kind: "practice",
          heading: "Convert a count-based resource to for_each",
          prompt:
            "This configuration creates three near-identical S3 buckets using count, indexed by position:\n\nresource \"aws_s3_bucket\" \"region_buckets\" {\n  count  = 3\n  bucket = \"acme-backups-${count.index}\"\n}\n\nRewrite it using for_each instead, keyed by a stable, meaningful name (\"us-east-1\", \"us-west-2\", \"eu-west-1\") rather than a numeric index, so that removing one region later doesn't force Terraform to destroy and recreate the others.",
          hint:
            "for_each takes a set or map, not a list — toset([\"us-east-1\", \"us-west-2\", \"eu-west-1\"]) turns a plain list of strings into the set for_each expects. Reference the current key inside the resource with each.key.",
          solution:
            "```hcl\nresource \"aws_s3_bucket\" \"region_buckets\" {\n  for_each = toset([\"us-east-1\", \"us-west-2\", \"eu-west-1\"])\n  bucket   = \"acme-backups-${each.key}\"\n}\n\n# Referenced elsewhere as:\n# aws_s3_bucket.region_buckets[\"us-east-1\"].id\n# aws_s3_bucket.region_buckets[\"eu-west-1\"].id\n```\nKey decision: each.key is a stable string tied to the actual region name, not a position in a list — removing \"us-west-2\" from the set now only affects that one bucket, instead of shifting every bucket after it the way the old count-indexed version would.",
        },
        {
          kind: "example",
          heading: "The migration-safe version: moved blocks alongside the for_each rewrite",
          body: "Even though the underlying infrastructure doesn't need to change, aws_s3_bucket.region_buckets[0] and aws_s3_bucket.region_buckets[\"us-east-1\"] are different addresses to Terraform — a plan run right after the previous slide's rewrite, with no moved blocks, would show every bucket being destroyed and recreated, not just relabeled. A moved block per bucket tells Terraform \"this is the same resource, just renamed,\" so plan shows zero destructive changes instead.",
          language: "hcl",
          code: `moved {
  from = aws_s3_bucket.region_buckets[0]
  to   = aws_s3_bucket.region_buckets["us-east-1"]
}
moved {
  from = aws_s3_bucket.region_buckets[1]
  to   = aws_s3_bucket.region_buckets["us-west-2"]
}
moved {
  from = aws_s3_bucket.region_buckets[2]
  to   = aws_s3_bucket.region_buckets["eu-west-1"]
}`,
        },
        {
          kind: "practice",
          heading: "Wire a module's output into another resource",
          prompt:
            "Given a vpc module that outputs subnet_id, write the module call plus an aws_instance resource that launches inside that subnet, without hardcoding any subnet ID copied from the console.",
          hint:
            "Call the module first, then reference module.<name>.subnet_id directly as the instance's subnet_id argument — Terraform sequences the create order correctly because of that reference, the same way it does between two plain resource blocks.",
          solution:
            "```hcl\nmodule \"vpc\" {\n  source = \"./modules/vpc\"\n  cidr   = \"10.0.0.0/16\"\n}\n\nresource \"aws_instance\" \"web\" {\n  ami           = \"ami-0c55b159cbfafe1f0\"\n  instance_type = \"t3.micro\"\n  subnet_id     = module.vpc.subnet_id\n}\n```\nKey decision: referencing module.vpc.subnet_id directly, rather than hardcoding a subnet ID copied from the console, is what lets Terraform build the correct dependency graph — the VPC module's subnet is guaranteed to exist and have a real id before the instance is created, and the reference survives if the subnet's id ever changes.",
        },
        {
          kind: "practice",
          heading: "Protect a production database from accidental destruction",
          prompt:
            "A shared production RDS instance was accidentally destroyed last quarter when a teammate ran terraform destroy against the wrong workspace. Add the configuration that would have prevented Terraform from ever destroying this specific resource, even if a plan called for it.",
          hint: "This is a lifecycle meta-argument, not a provider-specific setting — it works the same way on any resource type, not just databases.",
          solution:
            "```hcl\nresource \"aws_db_instance\" \"production\" {\n  identifier     = \"acme-production-db\"\n  engine         = \"postgres\"\n  instance_class = \"db.t3.medium\"\n  # ...other required arguments\n\n  lifecycle {\n    prevent_destroy = true\n  }\n}\n```\nKey decision: prevent_destroy = true makes any plan that would destroy this resource fail outright, including one triggered by an accidental terraform destroy run against the wrong target — it's a guardrail specifically for the \"wrong workspace, wrong environment\" class of mistake, not a substitute for using workspaces or separate state files correctly in the first place.",
        },
        {
          kind: "practice",
          heading: "Write a remote state backend with locking",
          prompt:
            "This configuration currently has no backend block at all, so state is stored locally as terraform.tfstate in the project directory — the exact setup flagged as dangerous for team use earlier in this course. Write the backend block for S3-backed state with DynamoDB locking, storing this configuration's state at the key \"prod/app.tfstate\" in a bucket called \"acme-terraform-state\", region us-east-1, using a lock table called \"terraform-locks\".",
          hint: "This is a terraform { backend \"s3\" { ... } } block, not a resource — it configures Terraform itself, not any cloud infrastructure it manages.",
          solution:
            "```hcl\nterraform {\n  backend \"s3\" {\n    bucket         = \"acme-terraform-state\"\n    key            = \"prod/app.tfstate\"\n    region         = \"us-east-1\"\n    dynamodb_table = \"terraform-locks\"\n  }\n}\n```\nKey decision: this block has no dependency on any resource in the rest of the configuration — it's read before anything else, during terraform init, which is also why changing it requires re-running init to migrate existing state into the new backend, rather than just re-running plan.",
        },
        {
          kind: "practice",
          heading: "Expose the right outputs from a module",
          prompt:
            "The web-server module from earlier in this course only outputs instance_id. A monitoring setup being added needs the instance's public IP and its security group ID too. Add the two missing outputs to modules/web-server/outputs.tf, assuming the module's resources are named aws_instance.this and aws_security_group.this.",
          hint: "An output block just needs a name and a value expression — reference the resource's attribute the same way you would anywhere else in the module.",
          solution:
            "```hcl\n# modules/web-server/outputs.tf\noutput \"instance_id\" {\n  value = aws_instance.this.id\n}\n\noutput \"public_ip\" {\n  value = aws_instance.this.public_ip\n}\n\noutput \"security_group_id\" {\n  value = aws_security_group.this.id\n}\n```\nKey decision: each output is a thin, direct pass-through of a resource attribute already available inside the module — outputs.tf's job is exposing exactly what callers need, not computing anything new, so keeping it this simple makes the module's public surface easy to read at a glance.",
        },
        {
          kind: "diagram",
          heading: "How these exercises map onto a real onboarding week",
          description: "The same skills, roughly in the order a new engineer on an infra team actually needs them.",
          steps: [
            { label: "Day 1", detail: "Write the versioned S3 bucket and the data-sourced VPC subnet — get comfortable with resource vs. data blocks" },
            { label: "Day 2", detail: "Add variable validation and a lifecycle guard — start thinking about what could go wrong, not just what should happen" },
            { label: "Day 3", detail: "Convert an existing count resource to for_each with moved blocks — the kind of refactor real production configs eventually need" },
            { label: "Day 4", detail: "Wire a module's output into another resource, and add the outputs a caller actually needs" },
            { label: "Day 5", detail: "Set up the S3 + DynamoDB remote state backend — the step that makes everything above safe for a team, not just one person" },
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "What a reviewer actually checks for in a Terraform pull request",
          body: "The patterns across the exercises above are exactly what an experienced reviewer scans a Terraform PR for: does a setting that looks like a simple argument actually need a separate linked resource, is a data source used instead of writing a resource block for infrastructure that isn't yours, does risky input get validated instead of trusted blindly, does a refactor come with moved blocks instead of a silent destroy-and-recreate, and is anything genuinely catastrophic — a production database, a shared VPC — protected with prevent_destroy before it ships. None of it is exotic; it's the checklist a plan's output alone can't fully replace, because a plan tells you what will happen, not whether it should.",
        },
        {
          kind: "summary",
          heading: "What a correct solution demonstrates",
          bullets: [
            "Recognizing when a setting (like versioning) is actually a separate linked resource rather than an inline argument.",
            "Reaching for a data source instead of a resource block when infrastructure already exists and isn't yours to manage.",
            "Catching bad input at plan time with variable validation, instead of letting it fail mid-apply against a real API.",
            "Converting count to for_each safely with moved blocks, instead of accidentally destroying and recreating every resource just to rename how Terraform addresses them.",
            "Guarding a genuinely catastrophic resource with prevent_destroy, and standing up remote state with locking before more than one person touches an environment.",
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
          kind: "quiz",
          heading: "Reading the ~ symbol",
          question:
            "A `terraform plan` shows a resource marked with `~`, changing only its `acl` attribute from \"private\" to \"public-read\". What does this mean, and what should you check before typing yes?",
          options: [
            "The resource will be destroyed and recreated from scratch",
            "The resource will be updated in place — worth confirming this specific attribute change is actually intended, since it's about to take effect",
            "Terraform detected drift and will revert the change automatically with no plan needed",
            "This symbol only appears for resources that don't yet exist",
          ],
          correctIndex: 1,
          explanation:
            "`~` means an in-place update — no destroy, no recreate, just this one attribute changing on the existing resource. That's lower risk than a `-/+` replacement, but it's still a real change about to be applied — here, making a resource publicly readable is exactly the kind of one-line diff worth pausing on before approving, not just skimming past because it's not a destroy.",
        },
        {
          kind: "quiz",
          heading: "Adopting existing infrastructure",
          question:
            "An S3 bucket was created by hand in the AWS console two years ago and now needs to come under Terraform management, without being destroyed and recreated. What's the right approach?",
          options: [
            "Write a resource block for it and run terraform apply — Terraform will detect the existing bucket and adopt it automatically",
            "Delete the bucket, then create a new one via terraform apply",
            "Run terraform import to add it to state, and hand-write (or generate) a matching resource block so the configuration reflects its real settings",
            "Reference it with a data block, since it wasn't originally created by Terraform",
          ],
          correctIndex: 2,
          explanation:
            "terraform import brings an existing resource into Terraform's state without destroying or recreating it — but it doesn't write the .tf configuration for you on its own; the resource block still has to be hand-authored (or generated) to actually match the bucket's real settings, or the next plan will try to \"fix\" it back to a mismatched, incomplete config. A data block would only let you read the bucket, not manage it going forward, which the scenario specifically rules out.",
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
