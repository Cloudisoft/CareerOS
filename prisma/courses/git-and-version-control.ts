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
          kind: "bullets",
          heading: "A branch is just a movable pointer",
          bullets: [
            "A branch is a lightweight, named pointer to a specific commit — not a copy of the project.",
            "main (or master) is simply the conventional name for the primary branch — nothing about it is technically special.",
            "Creating a branch is near-instant because git isn't duplicating files, just adding a new pointer.",
            "Switching branches changes which commit your working directory reflects — this is what makes isolated, parallel work possible.",
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
  ],
};
