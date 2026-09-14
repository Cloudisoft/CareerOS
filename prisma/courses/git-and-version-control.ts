import type { CourseSeed } from "../course-types";

export const course: CourseSeed = {
  slug: "git-and-version-control",
  title: "Git and Version Control",
  description:
    "The everyday git workflow explained from first principles — commits, branches, staging, merge conflicts, and how a team actually collaborates on one codebase without stepping on each other.",
  category: "Developer Tools",
  level: "BEGINNER",
  order: 16,
  lessons: [
    {
      title: "What Version Control Actually Solves",
      durationMinutes: 5,
      slides: [
        {
          kind: "title",
          heading: "What Version Control Actually Solves",
          subheading:
            "Before you learn a single git command, it helps to understand exactly what problem it's replacing — because the replaced version is worse than most people remember.",
        },
        {
          kind: "bullets",
          heading: "Life before version control",
          bullets: [
            "final.js, final_v2.js, final_ACTUALLY_final.js — filename-based versioning that breaks down the moment two people touch the same file.",
            "No safe way to try something risky — if an experiment goes wrong, there's no clean path back to \"before.\"",
            "Two people editing the same file means someone's changes get overwritten, often silently.",
            "No record of why a change was made — just the current state, with no history behind it.",
          ],
        },
        {
          kind: "bullets",
          heading: "What git actually gives you",
          bullets: [
            "A complete, searchable history of every change, who made it, and why (via the commit message).",
            "The ability to work on something risky in isolation (a branch) without touching the working version.",
            "A defined process for combining two people's changes to the same file — including catching the cases where they conflict.",
            "A full backup of the entire project history on every collaborator's machine, not just one server.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Git tracks changes, not files",
          body: "The mental shift that makes git click: it's not really versioning individual files, it's recording snapshots of your entire project at each commit. That's why moving or renaming a file rarely breaks git's understanding of its history — it's reasoning about the whole project state, not chasing individual file paths.",
        },
        {
          kind: "text",
          heading: "Why \"distributed\" is the detail that made git win",
          body: [
            "Git wasn't the first version control system — tools like SVN and Perforce came earlier and solved some of the same problems. What set git apart is that it's distributed: every developer's clone contains the complete history of the project, not just the current files. With a centralized system, committing, viewing history, and even seeing who changed a line all require a live connection to one central server — if that server is down, or you're on a flight, you're stuck. With git, cloning the repository once gives you the entire history locally; you can commit, branch, and browse history completely offline, then sync with a remote (like GitHub) whenever you're back online.",
          ],
        },
        {
          kind: "chart",
          heading: "Time a small team loses to version-control problems, per month",
          description: "Illustrative estimates from a team survey — lost work, overwritten files, and time spent reconstructing what actually changed.",
          chartType: "bar",
          unit: "hours lost per month",
          data: [
            { label: "No version control (shared drive)", value: 14 },
            { label: "Filename-based versioning", value: 7 },
            { label: "Centralized VCS (SVN-style)", value: 3 },
            { label: "Git", value: 0.5 },
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "History as institutional memory, not just a safety net",
          body: "The most underrated use of git history isn't undoing mistakes — it's answering \"why does this code do this?\" months later, when the person who wrote it has moved teams or forgotten. `git blame <file>` shows which commit last touched each line; `git log -p <file>` shows the full history of changes to one file with their messages. A team that writes real commit messages is leaving notes for its future self, not just satisfying a process requirement — \"fix bug\" tells a future reader nothing, while \"fix off-by-one error dropping the last cart item\" answers the question before it's even asked.",
        },
      ],
    },
    {
      title: "The Core Model: Commits, Branches, and Staging",
      durationMinutes: 8,
      slides: [
        {
          kind: "title",
          heading: "The Core Model: Commits, Branches, and Staging",
          subheading:
            "Three concepts explain almost everything else in git. Get these solid and the commands stop feeling like magic.",
        },
        {
          kind: "bullets",
          heading: "A commit is a snapshot, not a diff",
          intro: "Under the hood, git stores the full state of your project at each commit, plus a pointer to the commit before it:",
          bullets: [
            "Each commit has a unique ID (a hash like a1b2c3d), an author, a timestamp, and a message.",
            "Commits form a chain — each one points to its parent, which is what makes \"history\" possible at all.",
            "A commit is meant to be a complete, working checkpoint — not a random point mid-edit.",
          ],
        },
        {
          kind: "bullets",
          heading: "The staging area — the part that confuses people first",
          intro: "Git has three places your changes can be, and the middle one is the one nobody expects:",
          bullets: [
            "Working directory — your actual files, edited normally, as you'd expect.",
            "Staging area (the \"index\") — a holding area for changes you've chosen to include in the next commit.",
            "Repository — the permanent history of commits already made.",
            "git add moves changes from working directory to staging; git commit takes what's staged and turns it into a permanent snapshot.",
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Why staging exists at all",
          body: "Staging lets you build one clean, focused commit out of a messier set of edits — you can change five files but only stage and commit the two that belong together, then stage and commit the rest separately. It's what makes git log readable months later instead of a wall of \"various fixes.\"",
        },
        {
          kind: "terminal",
          heading: "Seeing the three areas at once",
          description: "git status names exactly these three areas in its own output — staged, unstaged, and untracked.",
          lines: [
            { text: "git status" },
            { text: "On branch main", output: true },
            { text: "Changes to be committed:", output: true },
            { text: "  (use \"git restore --staged <file>...\" to unstage)", output: true },
            { text: "        modified:   src/auth.ts", output: true },
            { text: "", output: true },
            { text: "Changes not staged for commit:", output: true },
            { text: "  (use \"git add <file>...\" to update what will be committed)", output: true },
            { text: "        modified:   src/routes.ts", output: true },
            { text: "", output: true },
            { text: "Untracked files:", output: true },
            { text: "  (use \"git add <file>...\" to include in what will be committed)", output: true },
            { text: "        src/new-feature.ts", output: true },
          ],
        },
        {
          kind: "bullets",
          heading: "A branch is just a movable pointer",
          bullets: [
            "A branch is a lightweight, named pointer to a specific commit — not a copy of the project.",
            "main (or master) is simply the conventional name for the primary branch — nothing about it is technically special.",
            "Creating a branch is near-instant because git isn't duplicating files, just adding a new pointer.",
            "Switching branches changes which commit your working directory reflects — this is what makes isolated, parallel work possible.",
          ],
        },
        {
          kind: "diagram",
          heading: "HEAD: the pointer to your pointer",
          description: "There's one more moving piece worth naming explicitly, since every git error message assumes you already know it.",
          steps: [
            { label: "HEAD", detail: "Points at whichever branch you currently have checked out" },
            { label: "main", detail: "Points at the latest commit on that branch" },
            { label: "Commit a1b2c3d", detail: "The actual snapshot main currently points to" },
          ],
        },
        {
          kind: "text",
          heading: "Why commits form a chain instead of a flat list",
          body: [
            "Each commit stores a pointer to its parent commit, and only its parent — not the whole history explicitly. That single link is what makes `git log` able to walk backward through your entire project history from any starting point, and it's also what a branch actually is: just a label on one commit in that chain. When you commit, git creates a new commit whose parent is whatever your current branch was pointing at, then moves the branch pointer forward to the new commit. Nothing about the old commits changes — history only grows, it doesn't get rewritten by ordinary commits.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "\"Detached HEAD\" explained, so it stops being scary",
          body: "Checking out a specific commit hash instead of a branch name (`git checkout a1b2c3d`) puts you in what git calls a \"detached HEAD\" state — HEAD now points directly at a commit instead of at a branch. You can look around and even make new commits here, but nothing points to them once you switch away, so they become unreachable and eventually get garbage-collected. If you want to keep work made in this state, create a branch from it immediately with `git checkout -b new-branch-name` before switching away.",
        },
        {
          kind: "bullets",
          heading: "Three commit references worth being able to read on sight",
          bullets: [
            "HEAD — whatever commit you currently have checked out.",
            "HEAD~1 (or HEAD^) — the commit one step before HEAD; HEAD~3 goes back three commits.",
            "origin/main — where the remote's main branch was, as of your last fetch; not necessarily the same as your local main until you pull.",
          ],
        },
      ],
    },
    {
      title: "The Everyday Commands",
      durationMinutes: 9,
      slides: [
        {
          kind: "title",
          heading: "The Everyday Commands",
          subheading:
            "A short, fixed set of commands covers nearly all day-to-day git usage. Learn this loop and you can operate comfortably in almost any repository.",
        },
        {
          kind: "example",
          heading: "Getting a project and checking its state",
          language: "bash",
          code: `git clone https://github.com/org/project.git
cd project

git status        # what's changed, staged, or untracked right now
git log --oneline # a compact history of commits`,
        },
        {
          kind: "example",
          heading: "The stage-and-commit loop",
          body: "This is the cycle you'll run dozens of times a day: make a change, stage it, describe it, commit it.",
          language: "bash",
          code: `git add src/auth.ts        # stage one specific file
git add .                   # stage everything changed (use with care)

git commit -m "Fix token refresh timing bug"

git push                    # send your commits to the remote (e.g. GitHub)
git pull                    # fetch and merge in others' commits`,
        },
        {
          kind: "terminal",
          heading: "What git log looks like after that commit",
          description: "Each commit gets its own hash, author, and message — exactly the chain the earlier lesson described.",
          lines: [
            { text: "git log --oneline" },
            { text: "a1b2c3d (HEAD -> main, origin/main) Fix token refresh timing bug", output: true },
            { text: "e4f5g6h Add retry logic to API client", output: true },
            { text: "h7i8j9k Initial commit", output: true },
          ],
        },
        {
          kind: "example",
          heading: "Branching for isolated work",
          language: "bash",
          code: `git branch                          # list local branches
git checkout -b feature/dark-mode   # create AND switch to a new branch
git checkout main                   # switch back to main

git merge feature/dark-mode         # bring those changes into main`,
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "git switch and git restore are the newer, clearer commands",
          body: "Older git used checkout for almost everything — switching branches, discarding file changes, even creating branches — which made it confusing. Newer git versions split this into git switch (change branches) and git restore (discard file changes). Both still work; checkout just does more than one job, so many people still default to it out of habit.",
        },
        {
          kind: "bullets",
          heading: "Commands worth knowing exist, even before you need them",
          bullets: [
            "git diff — see exactly what changed, line by line, before staging.",
            "git stash — temporarily shelve uncommitted changes to switch tasks, then git stash pop to bring them back.",
            "git log --oneline --graph — a visual view of how branches diverged and merged.",
            "git revert — undo a commit by creating a new commit that reverses it (safe on shared history, unlike rewriting the past).",
          ],
        },
        {
          kind: "example",
          heading: "git diff, before you stage anything",
          body: "This is the command to run before git add, not after — once something is staged, plain git diff stops showing it.",
          language: "bash",
          code: `git diff
diff --git a/src/auth.ts b/src/auth.ts
index 3a4f5c1..8b2e9d0 100644
--- a/src/auth.ts
+++ b/src/auth.ts
@@ -12,7 +12,7 @@ export function refreshToken(token: string) {
-  const expiresIn = 3600;
+  const expiresIn = 1800;
   return issueToken(token, expiresIn);`,
        },
        {
          kind: "text",
          heading: "git diff has two modes, and mixing them up wastes time",
          body: [
            "Plain `git diff` shows unstaged changes — what's different between your working directory and the staging area. Once you `git add` a file, that same `git diff` goes quiet for it, because there's nothing unstaged left to show. `git diff --staged` (or `--cached`) shows the opposite: what's staged and about to be committed, compared to the last commit. Checking `git diff --staged` right before `git commit` is a cheap habit that catches an accidentally staged debug line or a half-finished change before it becomes permanent history.",
          ],
        },
        {
          kind: "terminal",
          heading: "Stashing mid-task to switch context",
          description: "A stash is a temporary, unnamed save point for uncommitted work — not a commit, and not shared with anyone else.",
          lines: [
            { text: "git stash" },
            { text: "Saved working directory and index state WIP on feature/search: a1b2c3d Add filters", output: true },
            { text: "git status" },
            { text: "nothing to commit, working tree clean", output: true },
            { text: "# ...switch branches, fix an urgent bug, come back..." },
            { text: "git stash pop" },
            { text: "On branch feature/search", output: true },
            { text: "Changes not staged for commit:", output: true },
            { text: "        modified:   src/search.ts", output: true },
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "git pull is actually two commands wearing a trench coat",
          body: "git pull runs git fetch (download new commits from the remote) immediately followed by git merge (combine them into your current branch) — which is convenient until the merge step produces a conflict you weren't expecting in the middle of what felt like a simple sync. Running git fetch alone, then looking at git log origin/main before deciding how to merge, gives you the same result with more control — worth knowing as an option even if you use plain git pull most of the time.",
        },
        {
          kind: "example",
          heading: "A realistic .gitignore",
          body: "Not every file belongs in version control — build output, dependencies, and local secrets should never be committed. .gitignore tells git to stop tracking specific paths entirely.",
          language: "bash",
          code: `# .gitignore
node_modules/
dist/
.env
*.log
.DS_Store`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Adding .gitignore after a file is already tracked does nothing",
          body: ".gitignore only stops git from tracking new files that match its patterns — if node_modules/ or .env was already committed before you added the rule, it stays tracked forever until you explicitly remove it with `git rm --cached <path>`. This is also why a secret committed once, even if deleted in the very next commit, is still sitting in the project's history and should be treated as compromised, not just deleted going forward.",
        },
        {
          kind: "text",
          heading: "Writing a commit message that's actually useful later",
          body: [
            "The convention most teams converge on is a short summary line (under ~50 characters, imperative mood — \"Fix token refresh timing bug,\" not \"Fixed\" or \"Fixes\") followed by a blank line and, if needed, a longer explanation of why the change was made. The subject line shows up everywhere — `git log --oneline`, GitHub's commit list, a squash-merge summary — so it's worth being able to read at a glance. The body is where \"why,\" not \"what,\" belongs; the diff already shows what changed, but nothing else records why a particular approach was chosen over an obvious alternative.",
          ],
        },
        {
          kind: "example",
          heading: "A commit message with a real body",
          language: "bash",
          code: `git commit -m "Cap retry attempts at 3" -m "Unbounded retries were
causing a thundering-herd effect against the payments API during
its Tuesday outage. Capping at 3 with exponential backoff matches
what the payments team recommends in their integration docs."`,
        },
      ],
    },
    {
      title: "Resolving a Merge Conflict",
      durationMinutes: 8,
      slides: [
        {
          kind: "title",
          heading: "Resolving a Merge Conflict",
          subheading:
            "A merge conflict isn't a sign something's broken — it's git correctly refusing to guess when two people changed the same lines differently. It's routine, not a crisis.",
        },
        {
          kind: "text",
          heading: "Why conflicts happen",
          body: [
            "Git merges automatically whenever it can — if two branches changed different parts of a file, or different files entirely, it combines them without asking.",
            "A conflict only occurs when the same lines were changed differently on both sides. Git has no way to know which change you actually want, so it stops and asks you.",
          ],
        },
        {
          kind: "example",
          heading: "What a conflict looks like inside the file",
          body: "Git edits the file directly, marking both versions so you can see exactly what's in dispute.",
          language: "bash",
          code: `<<<<<<< HEAD
const MAX_RETRIES = 3;
=======
const MAX_RETRIES = 5;
>>>>>>> feature/retry-logic`,
        },
        {
          kind: "terminal",
          heading: "What git tells you mid-conflict",
          description: "git status names the exact file in conflict and reminds you how to proceed — it isn't just the markers inside the file.",
          lines: [
            { text: "git merge feature/retry-logic" },
            { text: "Auto-merging config.ts", output: true },
            { text: "CONFLICT (content): Merge conflict in config.ts", output: true },
            { text: "Automatic merge failed; fix conflicts and then commit the result.", output: true },
            { text: "git status" },
            { text: "On branch main", output: true },
            { text: "You have unmerged paths.", output: true },
            { text: "  (fix conflicts and run \"git commit\")", output: true },
            { text: "", output: true },
            { text: "Unmerged paths:", output: true },
            { text: "        both modified:   config.ts", output: true },
          ],
        },
        {
          kind: "bullets",
          heading: "The resolution steps",
          bullets: [
            "Open the file and find every block marked with <<<<<<<, =======, and >>>>>>>.",
            "Decide the correct final content — keep one side, keep the other, or write something new that combines both intents.",
            "Delete the conflict markers themselves (<<<<<<<, =======, >>>>>>>) — they're not part of the file, just git's way of flagging the spot.",
            "Stage the resolved file (git add) and finish with git commit — git already knows you're completing a merge.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "The most common conflict-resolution mistake",
          body: "Committing a file with the <<<<<<< and >>>>>>> markers still in it. This happens most often under time pressure — you resolve the logic but forget to delete the markers themselves, and now they're a permanent, broken part of the file's history. Always re-read the whole file before staging a conflict resolution, not just the lines you touched.",
        },
        {
          kind: "text",
          heading: "Why HEAD and the other branch's name label the two sides",
          body: [
            "The labels inside the conflict markers aren't arbitrary — <<<<<<< HEAD is always your current branch's version, the one you were on when you ran git merge, and >>>>>>> feature/retry-logic is the incoming branch you're merging in. This matters because it tells you which side is \"yours\" and which is \"theirs\" without having to guess — genuinely useful on a conflict spanning many files, where remembering which branch changed what gets hard to hold in your head.",
          ],
        },
        {
          kind: "bullets",
          heading: "Tools that make resolution faster than reading raw markers",
          bullets: [
            "git diff during a conflict shows a three-way diff, marking which lines came from which side — clearer than scanning the file for markers by eye.",
            "git checkout --ours <file> or --theirs <file> takes one side's version of a file wholesale — useful when you know an entire file should just be one branch's version, not a line-by-line merge.",
            "Most editors (VS Code included) render conflict markers as clickable \"Accept Current / Accept Incoming / Accept Both\" buttons — worth using once you understand what the raw markers mean, not before.",
          ],
        },
        {
          kind: "example",
          heading: "Backing out of a conflict entirely",
          body: "If a merge goes sideways and you'd rather start over than resolve it, abort returns everything to exactly how it was before you ran merge.",
          language: "bash",
          code: `git merge --abort
# working directory and staging area are restored to their
# pre-merge state — as if git merge had never been run`,
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "A rebase conflict looks the same but resolves differently",
          body: "git rebase can also produce conflicts, with the identical <<<<<<< markers — but where a merge conflict is resolved once and committed once, a rebase replays your commits one at a time onto the new base, so a conflict can recur on the second commit even after you've fixed the first. Resolve it the same way (edit, remove markers, stage), but run `git rebase --continue` instead of `git commit` to move to the next commit in the sequence, or `git rebase --abort` to bail out entirely.",
        },
        {
          kind: "bullets",
          heading: "Conflicts that aren't about code logic",
          bullets: [
            "Deleted on one side, edited on the other — git flags this explicitly rather than guessing whether the edit or the deletion should win.",
            "Binary files (images, compiled assets) can't be merged line by line at all — git just asks you to pick one side's whole version.",
            "package-lock.json / yarn.lock conflicts are common and usually best resolved by deleting the file and regenerating it (`npm install`) rather than hand-editing a machine-generated file.",
          ],
        },
      ],
    },
    {
      title: "Feature Branches and Pull Requests",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Feature Branches and Pull Requests",
          subheading:
            "This is the workflow almost every professional team runs on top of raw git — and it's less about the commands and more about how a team reviews and merges work safely.",
        },
        {
          kind: "bullets",
          heading: "The feature branch workflow",
          bullets: [
            "main always reflects working, deployable code — nobody commits directly to it.",
            "Every piece of work — a feature, a fix, an experiment — gets its own branch, cut from main.",
            "Small, focused branches are far easier to review and far less likely to conflict with someone else's work than one giant branch touching everything.",
            "When the work is done, it's proposed for merging back into main through a pull request (sometimes called a merge request), not merged directly.",
          ],
        },
        {
          kind: "example",
          heading: "A typical feature branch lifecycle",
          language: "bash",
          code: `git checkout main
git pull                              # start from the latest main

git checkout -b feature/add-search
# ...make changes, commit along the way...
git push -u origin feature/add-search # publish the branch to the remote

# Open a pull request on GitHub/GitLab from here — review happens there

git checkout main
git pull                              # after the PR merges, catch main up
git branch -d feature/add-search      # delete the now-merged local branch`,
        },
        {
          kind: "terminal",
          heading: "What git prints when you publish a branch",
          description: "The -u flag is what makes plain git push and git pull work on this branch afterward, without naming origin/feature/add-search every time.",
          lines: [
            { text: "git push -u origin feature/add-search" },
            { text: "Enumerating objects: 9, done.", output: true },
            { text: "Counting objects: 100% (9/9), done.", output: true },
            { text: "Delta compression using up to 8 threads", output: true },
            { text: "Compressing objects: 100% (5/5), done.", output: true },
            { text: "Writing objects: 100% (6/6), 1.42 KiB | 1.42 MiB/s, done.", output: true },
            { text: "To github.com:org/project.git", output: true },
            { text: " * [new branch]      feature/add-search -> feature/add-search", output: true },
            { text: "branch 'feature/add-search' set up to track 'origin/feature/add-search'.", output: true },
          ],
        },
        {
          kind: "bullets",
          heading: "Why a pull request, not a direct merge",
          bullets: [
            "It's a natural checkpoint for code review — a teammate reads the diff before it becomes part of main.",
            "CI (automated tests, linters, builds) typically runs against the pull request before it's allowed to merge.",
            "It creates a permanent, linkable record of why a change was made — the discussion lives alongside the code, not lost in a chat log.",
            "It gives everyone a chance to catch a conflict or a design problem before it's permanent, rather than after.",
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Keep main current, keep branches short-lived",
          body: "The single habit that prevents most painful merge conflicts: pull main into your branch regularly while you work, rather than only at the very end. A branch that lives for two days and merges cleanly is far more common than one that lives for three weeks and fights with everything else that happened in the meantime.",
        },
        {
          kind: "bullets",
          heading: "What a good pull request description actually includes",
          bullets: [
            "What changed and why — not just a restatement of the diff a reviewer can already see, but the reasoning behind the approach.",
            "How to test it — the specific steps or scenario a reviewer should check, especially for anything that isn't obvious from reading the code.",
            "Anything deliberately left out of scope — so a reviewer doesn't waste time asking about it or assume it was missed by accident.",
          ],
        },
        {
          kind: "text",
          heading: "Merge, squash, or rebase — the three ways a PR actually lands",
          body: [
            "GitHub and similar tools offer three different merge strategies, and they produce meaningfully different history. A regular merge keeps every commit from the branch plus a merge commit tying them together — most accurate, but noisy on a branch with a lot of \"wip\" commits. Squash and merge combines the entire branch into a single commit on main, trading the branch's internal history for a clean, one-line summary — the most common default on teams that don't want rebase habits enforced on every contributor. Rebase and merge replays the branch's commits individually onto main with no merge commit at all, producing the cleanest linear history but requiring every commit on the branch to already be reasonable on its own.",
          ],
        },
        {
          kind: "summary",
          heading: "What to carry forward",
          bullets: [
            "Git tracks snapshots of your whole project, chained together as commit history.",
            "Staging lets you shape a messy set of edits into clean, focused commits.",
            "A branch is a cheap, movable pointer — that's what makes isolated work practical.",
            "A merge conflict means git needs a human decision, not that something's broken — resolve it, remove the markers, commit.",
            "Small feature branches plus pull requests is how real teams keep main always deployable.",
          ],
        },
      ],
    },
    {
      title: "Rewriting History: Interactive Rebase and Amending Commits",
      durationMinutes: 8,
      slides: [
        {
          kind: "title",
          heading: "Rewriting History: Interactive Rebase and Amending Commits",
          subheading:
            "Sometimes the commit you just made isn't the one you want in the permanent record. Git gives you real tools to clean that up — as long as you follow the one rule that keeps it safe.",
        },
        {
          kind: "example",
          heading: "git commit --amend fixes the last commit, not a new one",
          body: "Forgot a file, or wrote a bad message? --amend replaces the most recent commit entirely, instead of adding a second commit on top of the mistake.",
          language: "bash",
          code: `git commit -m "Fix bug"
# oops — forgot to stage a file, and the message could be clearer

git add forgotten-file.ts
git commit --amend -m "Fix token refresh bug"
# the previous commit is replaced entirely — git log still shows one commit here`,
        },
        {
          kind: "example",
          heading: "Interactive rebase cleans up a string of messy commits",
          body: "git rebase -i opens an editable list of the last N commits, letting you reorder, combine, reword, or drop them before anyone else sees them.",
          language: "bash",
          code: `git log --oneline
# h7i8j9k Add login form
# e4f5g6h fix typo
# a1b2c3d actually fix typo

git rebase -i HEAD~3

# The editor that opens shows:
#   pick h7i8j9k Add login form
#   pick e4f5g6h fix typo
#   pick a1b2c3d actually fix typo
#
# Changing the last two "pick" to "squash" combines all three into
# one commit, then opens a second editor to write its final message.`,
        },
        {
          kind: "diagram",
          heading: "Three commits become one",
          description: "Squashing folds each later commit's changes into the one above it, then asks for a single combined message.",
          steps: [
            { label: "Add login form", detail: "pick — kept as the base commit" },
            { label: "fix typo", detail: "squash — folded into the commit above" },
            { label: "actually fix typo", detail: "squash — folded in as well" },
            { label: "One commit", detail: "\"Add login form\" — with one new combined message" },
          ],
        },
        {
          kind: "bullets",
          heading: "The interactive rebase vocabulary",
          bullets: [
            "pick — keep this commit exactly as it is.",
            "reword — keep the commit's changes, but edit its message.",
            "squash — merge this commit into the one directly above it, combining their changes and prompting for one new message.",
            "fixup — like squash, but silently discards this commit's own message instead of prompting for a combined one.",
            "drop — remove this commit entirely, as if it had never happened.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Never rewrite history that's already been pushed and shared",
          body: "Amending or rebasing changes a commit's hash — as far as git is concerned, it's now a different commit, not an edited version of the old one. If a teammate already pulled the original, rewriting it and force-pushing creates a mismatch between your history and theirs that's genuinely painful to untangle. Rewrite freely on commits that are still local and only yours; once something is pushed and someone else might have it, prefer git revert instead.",
        },
        {
          kind: "example",
          heading: "Force-pushing safely, when you genuinely need to",
          body: "If you're certain a rewritten branch is only yours (your own feature branch, nobody else pulled it), --force-with-lease is the safer version of --force — it refuses to overwrite work on the remote you haven't seen locally.",
          language: "bash",
          code: `git push --force-with-lease origin feature/add-search
# fails loudly instead of silently overwriting someone else's
# commits, if the remote branch moved since you last fetched it —
# plain --force would overwrite them with no warning at all`,
        },
        {
          kind: "text",
          heading: "Rebase vs. merge: replaying commits vs. tying histories together",
          body: [
            "Interactive rebase is the editing tool from this lesson, but plain `git rebase main` from a feature branch is also a way to bring main's new commits into your branch — as an alternative to `git merge main`. The difference is what the resulting history looks like: merging creates a merge commit that ties the two histories together, preserving exactly what happened; rebasing replays your branch's commits one by one on top of main's latest commit, producing a straight line with no merge commit at all, as if you'd started your branch from today's main. Cleaner history is the appeal; the same shared-history rule applies — never rebase a branch other people are actively also working on.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "git reflog is the safety net under all of this",
          body: "Even a rewritten or seemingly \"lost\" commit isn't usually gone — git keeps a local log of every place HEAD has pointed, including commits no branch references anymore. `git reflog` lists them with their hashes; `git checkout <hash>` (or creating a branch from it) recovers work that looks deleted after a bad rebase or reset. This log is local-only and typically expires after 90 days, but it's the reason a botched interactive rebase is almost always recoverable if you catch it soon.",
        },
        {
          kind: "summary",
          heading: "What to carry forward",
          bullets: [
            "git commit --amend replaces the most recent commit — new message, new staged files, or both.",
            "git rebase -i HEAD~N opens an editable list of the last N commits; pick, reword, squash, and drop are the everyday commands.",
            "Rewriting history changes commit hashes — safe on purely local, unpushed commits; risky on anything already shared.",
            "Squashing a noisy string of \"wip\" and \"fix typo\" commits into one clean commit before opening a pull request is the single most common real-world use of interactive rebase.",
          ],
        },
      ],
    },
    {
      title: "Practice: Rebasing and Resolving Conflicts",
      durationMinutes: 13,
      slides: [
        {
          kind: "title",
          heading: "Practice: Rebasing and Resolving Conflicts",
          subheading:
            "Three scenarios — amending a commit, squashing a messy history, and resolving a conflict that needs pieces of both sides.",
        },
        {
          kind: "practice",
          heading: "Amend a Commit's Message and Add a Missed File",
          prompt:
            "You just ran git commit -m \"Add search feature\", then noticed you forgot to stage search.test.ts, and the message should say \"Add search feature with tests\". Write the commands to fix both, ending with one clean commit — not a second commit on top of the first.",
          hint: "Stage the missed file normally with git add. --amend replaces the most recent commit rather than creating a new one, and accepts a new -m at the same time.",
          solution: `git add search.test.ts
git commit --amend -m "Add search feature with tests"
# the previous commit is replaced entirely — git log shows one commit here, not two`,
        },
        {
          kind: "practice",
          heading: "Squash Three Commits into One",
          prompt:
            "Your branch has three commits, oldest to newest: \"Add login form\", \"fix typo\", \"actually fix typo\". Write the command to start an interactive rebase covering all three, then describe what you'd change in the editor to squash the last two into the first.",
          hint: "You need to go back far enough to include all three commits — HEAD~3. Change \"pick\" to \"squash\" (or \"s\") on the two commits you want folded into the one above them.",
          solution: `git rebase -i HEAD~3

# In the editor, change:
#   pick a1b2c3d Add login form
#   pick e4f5g6h fix typo
#   pick h7i8j9k actually fix typo
# to:
#   pick a1b2c3d Add login form
#   squash e4f5g6h fix typo
#   squash h7i8j9k actually fix typo
#
# Save and close — git combines all three, then opens a second
# editor to write one final commit message for the group.`,
        },
        {
          kind: "practice",
          heading: "Recover a Commit After a Bad Rebase",
          prompt:
            "You ran an interactive rebase, dropped a commit you actually needed by mistake, and already closed the editor. git log no longer shows it. Write the command to find it, and the command to get its changes back onto your current branch.",
          hint: "The commit isn't gone — git's reflog tracks every place HEAD has pointed, including commits no branch or tag currently references. Find its hash there first.",
          solution: `git reflog
# a1b2c3d HEAD@{2}: commit: Add rate limit config   <- the dropped commit
# e4f5g6h HEAD@{1}: rebase (start): checkout HEAD~3
# ...

git cherry-pick a1b2c3d
# replays just that one commit's changes onto your current
# branch as a new commit — the dropped work is back`,
        },
        {
          kind: "practice",
          heading: "Reword an Old Commit Without Touching the Ones After It",
          prompt:
            "Your branch has four commits, oldest to newest: \"Add cart page\", \"fix cart bug\", \"Add checkout flow\", \"Add payment validation\". You need to fix the second commit's message to \"Fix cart total miscalculation\" — and only that one, leaving the other three's content untouched. Write the rebase command and describe what you'd change in the editor.",
          hint: "You need all four commits in the interactive rebase list even though you're only editing one — go back HEAD~4. Change \"pick\" to \"reword\" only on the commit whose message needs to change; leave the rest as \"pick\".",
          solution: `git rebase -i HEAD~4

# In the editor, change:
#   pick h1 Add cart page
#   pick h2 fix cart bug
#   pick h3 Add checkout flow
#   pick h4 Add payment validation
# to:
#   pick   h1 Add cart page
#   reword h2 fix cart bug
#   pick   h3 Add checkout flow
#   pick   h4 Add payment validation
#
# Save and close — git stops on h2 and opens a second editor
# for its new message. Type "Fix cart total miscalculation",
# save, and the rebase continues automatically through h3 and h4
# unchanged (though their hashes do change, since h2 changed).`,
        },
        {
          kind: "practice",
          heading: "Resolve a Conflict That Needs Both Sides",
          prompt:
            "git merge feature/pricing produces this conflict in config.ts:\n\n<<<<<<< HEAD\nexport const TAX_RATE = 0.07;\nexport const FREE_SHIPPING_THRESHOLD = 50;\n=======\nexport const TAX_RATE = 0.0725;\nexport const FREE_SHIPPING_THRESHOLD = 75;\n>>>>>>> feature/pricing\n\nFinance confirmed the new tax rate (0.0725) is correct, but the shipping threshold should stay at 50 — the 75 on the feature branch was a mistake. Write the resolved file content, then the commands to finish the merge.",
          hint: "Resolving a conflict is a per-line decision, not an all-or-nothing pick of one whole side — you can take TAX_RATE from one side and FREE_SHIPPING_THRESHOLD from the other, as long as every marker is gone before you stage.",
          solution: `// config.ts, after resolving — markers removed, correct value kept from each side
export const TAX_RATE = 0.0725;             // taken from feature/pricing
export const FREE_SHIPPING_THRESHOLD = 50;  // kept from HEAD — 75 was a mistake

// then, to finish the merge:
git add config.ts
git commit
// git already knows this commit completes the merge and pre-fills a merge message`,
        },
        {
          kind: "terminal",
          heading: "A quick sanity check after any rebase",
          description: "Comparing commit counts and running the test suite before pushing catches a botched rebase before it becomes someone else's problem.",
          lines: [
            { text: "git log --oneline main..HEAD | wc -l" },
            { text: "4", output: true },
            { text: "# matches the number of commits you expected on the branch" },
            { text: "npm test" },
            { text: "Tests: 48 passed, 48 total", output: true },
          ],
        },
        {
          kind: "summary",
          heading: "What a correct solution demonstrates",
          bullets: [
            "--amend replaces the last commit outright rather than piling a fix on top of it — useful right up until you've shared that commit with anyone else.",
            "Interactive rebase's pick, reword, and squash turn a messy, incremental history into the clean set of commits a teammate actually wants to read.",
            "git reflog is the real safety net — a commit that's disappeared from git log after a rebase is almost always recoverable, not permanently lost.",
            "Resolving a conflict is a per-line decision — take what's correct from each side, not an all-or-nothing pick between branches.",
            "Every conflict marker (<<<<<<<, =======, >>>>>>>) must be gone before staging the resolution — leaving one in is the single most common mistake.",
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
          subheading:
            "Five questions across the whole course — staging, branches, conflicts, and the history-rewriting tools you just covered.",
        },
        {
          kind: "quiz",
          heading: "Staging Specific Files",
          question: "You've edited five files but only want two of them in your next commit. What's the correct sequence?",
          options: [
            "git add the two specific files, then git commit",
            "git commit -m \"...\" then manually remove the other three files' changes",
            "git stash the other three, git commit -m \"...\", then git stash pop",
            "There's no way to do this — a commit always includes every changed file",
          ],
          correctIndex: 0,
          explanation:
            "The staging area exists exactly for this — git add <file> stages only the changes you name, and git commit turns only what's staged into a snapshot. The other three files stay changed but uncommitted in your working directory.",
        },
        {
          kind: "quiz",
          heading: "What a Branch Actually Is",
          question: "What is a git branch, technically?",
          options: [
            "A full copy of every file in the project at that point",
            "A separate repository linked to the main one",
            "A lightweight, movable pointer to a specific commit",
            "A saved diff between two points in history",
          ],
          correctIndex: 2,
          explanation:
            "A branch is just a named pointer to a commit — nothing is duplicated when you create one, which is why branching is near-instant even in a huge repository. Switching branches just changes which commit that pointer, and your working directory, currently reflects.",
        },
        {
          kind: "quiz",
          heading: "When a Merge Conflict Happens",
          question: "A merge conflict occurs when...",
          options: [
            "Two branches changed different files",
            "Two branches changed the same lines of the same file in different ways",
            "You run git merge without first running git fetch",
            "A commit message is missing",
          ],
          correctIndex: 1,
          explanation:
            "Git merges automatically whenever it safely can — different files, or even different parts of the same file. A conflict only happens when both sides changed the exact same lines differently, and git has no way to guess which change you actually want.",
        },
        {
          kind: "quiz",
          heading: "The Risk of Rewriting Shared History",
          question: "Why is it risky to rebase (and force-push) commits a teammate has already pulled?",
          options: [
            "Rebasing deletes the file contents of those commits",
            "Rebase only works on the main branch, never on feature branches",
            "git rebase requires admin permissions on the remote",
            "Rebasing changes each commit's hash, so your rewritten history no longer matches the copy your teammate already has",
          ],
          correctIndex: 3,
          explanation:
            "A rebased commit is technically a brand-new commit with a new hash, even if its content looks identical. Once a teammate has pulled the original, force-pushing the rewritten version creates two diverging histories that are genuinely painful to reconcile — which is why revert, not rebase, is the safer tool once something is shared.",
        },
        {
          kind: "quiz",
          heading: "Why Pull Requests, Not Direct Pushes",
          question: "Why do most teams require a pull request instead of pushing directly to main?",
          options: [
            "Direct pushes to main are technically disabled by git itself",
            "It's slower, which discourages too many changes",
            "It creates a review checkpoint and a place for CI to run before the change becomes permanent",
            "Pull requests are required for git to track file history at all",
          ],
          correctIndex: 2,
          explanation:
            "Nothing in git itself prevents pushing straight to main — the pull request is a team process built on top of git, not a git feature. It gives a teammate a chance to read the diff and automated checks a chance to run before the change is merged, catching problems while they're still cheap to fix.",
        },
        {
          kind: "summary",
          heading: "Course recap",
          bullets: [
            "Git records snapshots of the whole project at each commit, chained together as history — not per-file diffs.",
            "The staging area lets you shape a messy set of edits into one or more clean, focused commits.",
            "A branch is a cheap, movable pointer — that's what makes isolated, parallel work practical.",
            "A merge conflict means git needs a human decision on lines both sides changed differently — resolve it, delete the markers, commit.",
            "git commit --amend and git rebase -i clean up commit history, but only for commits that haven't been shared yet — use git revert once something is already pushed.",
            "Small feature branches plus pull requests keep main always deployable and give the team a checkpoint for review.",
          ],
        },
      ],
    },
  ],
};
