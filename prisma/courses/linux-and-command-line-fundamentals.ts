import type { CourseSeed } from "../course-types";

export const course: CourseSeed = {
  slug: "linux-and-command-line-fundamentals",
  title: "Linux and the Command Line",
  description:
    "The filesystem model, file operations, permissions, piping and redirection, and process management — the everyday commands and habits that make the terminal feel less opaque.",
  category: "Developer Tools",
  level: "BEGINNER",
  order: 24,
  lessons: [
    {
      title: "The Filesystem Model and Navigation",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "The Filesystem Model and Navigation",
          subheading:
            "Almost everything else in Linux builds on one idea: a single tree of directories, starting at one root, that every file and device lives somewhere inside.",
        },
        {
          kind: "text",
          heading: "Everything is one tree",
          body: [
            "Unlike systems with separate drive letters (C:, D:), Linux has exactly one filesystem tree, starting at the root directory, written as a single forward slash: /. Every other directory — including where a USB drive or a second disk gets attached — is mounted somewhere inside that same tree.",
            "A path describes a location in that tree. An absolute path starts from the root (/home/alice/notes.txt); a relative path starts from wherever you currently are (notes.txt, or ../notes.txt for \"up one level, then notes.txt\").",
          ],
        },
        {
          kind: "example",
          heading: "The three commands you'll use constantly",
          body: "These three cover the vast majority of everyday navigation.",
          language: "bash",
          code: `pwd
# /home/alice/projects

ls
# notes.txt   src/   README.md

cd src
pwd
# /home/alice/projects/src

cd ..
pwd
# /home/alice/projects`,
        },
        {
          kind: "bullets",
          heading: "A few navigation shortcuts worth knowing immediately",
          bullets: [
            "~ always means your home directory — cd ~ (or just cd with no argument) takes you straight there from anywhere.",
            ". means \"the current directory,\" .. means \"one directory up\" — ./script.sh runs a script in the current folder explicitly.",
            "cd - jumps back to whatever directory you were in before your last cd — genuinely useful when bouncing between two folders.",
            "ls -la shows hidden files (anything starting with a dot) plus permissions, size, and owner in one view — the flag combination most people reach for by default.",
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Tab completion is not optional",
          body: "Typing cd /ho then pressing Tab completes it to /home/ automatically, and does the same for filenames, commands, and options. It's the single biggest speed and accuracy improvement available in any shell, and it also prevents typos in long paths.",
        },
        {
          kind: "summary",
          heading: "The navigation model, briefly",
          bullets: [
            "One tree, rooted at /, no separate drive letters.",
            "pwd shows where you are, ls shows what's there, cd moves you.",
            "Absolute paths start with /; relative paths are read from your current location.",
          ],
        },
      ],
    },
    {
      title: "File Operations",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "File Operations",
          subheading:
            "Creating, copying, moving, and deleting files and directories is where most day-to-day command-line work actually happens.",
        },
        {
          kind: "example",
          heading: "The core operations",
          body: "Each of these has a directory-aware version — recursive (-r) for cp and rm — and mkdir simply works on directories directly.",
          language: "bash",
          code: `mkdir reports                     # create a new directory
cp draft.txt reports/             # copy a file into it
cp -r project/ project-backup/    # copy an entire directory tree

mv draft.txt reports/final.txt    # move AND rename in one step
mv old-name.txt new-name.txt      # mv with no path change = rename

rm old-notes.txt                  # delete a file
rm -r old-project/                # delete a directory and everything in it`,
        },
        {
          kind: "bullets",
          heading: "The details that trip people up",
          bullets: [
            "mv does double duty: moving a file to a new location and renaming a file are the exact same operation to Linux — mv notes.txt notes-final.txt just \"moves\" it to a new name in the same place.",
            "rm has no undo and no trash can by default. A deleted file is gone — there's no equivalent of an OS-level recycle bin unless one has been separately configured.",
            "rm -rf (recursive, force) skips confirmation prompts entirely and deletes silently — it's the single most dangerous common command, especially combined with a wrong path or a stray space.",
            "cp and mv fail safely if the destination directory doesn't exist; mkdir -p creates any missing parent directories in one step rather than one at a time.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "The classic rm disaster",
          body: "rm -rf ./ and rm -rf ./* mean very different things depending on what's actually inside that directory, and a mistyped command — especially one run with elevated privileges — can delete far more than intended with no warning and no way back. Many experienced users deliberately pause and re-read any rm -rf command before pressing enter, every time.",
        },
        {
          kind: "bullets",
          heading: "Safer habits worth building",
          bullets: [
            "Use ls on a path before running rm on it, to confirm you're looking at what you think you are.",
            "For anything destructive and unfamiliar, add -i (interactive) to get a confirmation prompt per file: rm -i, cp -i, mv -i.",
            "When in doubt, mv something to a backup location instead of deleting it outright — a wrong rm is unrecoverable; a wrong mv is just another mv to undo.",
          ],
        },
        {
          kind: "summary",
          heading: "File operations, briefly",
          bullets: [
            "mkdir, cp, mv, and rm cover the vast majority of everyday file management.",
            "mv both moves and renames — same command either way.",
            "rm is permanent — treat any rm -rf command as if it has no undo, because it doesn't.",
          ],
        },
      ],
    },
    {
      title: "Permissions: The Read/Write/Execute Model",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Permissions: The Read/Write/Execute Model",
          subheading:
            "Every file and directory carries permission information answering one question three times over: who can read it, who can change it, and who can run it.",
        },
        {
          kind: "text",
          heading: "The three permissions, and the three who's",
          body: [
            "Every file has three permission types — read (r), write (w), and execute (x) — and those permissions are set separately for three groups: the owner, the owner's group, and everyone else.",
            "That's nine possible permission bits total (3 permissions x 3 groups), and they're what ls -l shows you compactly at the start of every file listing.",
          ],
        },
        {
          kind: "example",
          heading: "Reading a permissions string",
          body: "The 10-character string breaks down cleanly once you know the pattern.",
          language: "bash",
          code: `$ ls -l deploy.sh
-rwxr-xr-- 1 alice engineering 812 Mar 14 deploy.sh

-rwxr-xr--
 │└┬┘└┬┘└┬┘
 │ │  │  └─ others: r--  (read only)
 │ │  └──── group:  r-x  (read + execute, no write)
 │ └─────── owner:  rwx  (read + write + execute)
 └───────── file type: - means regular file (d would mean directory)`,
        },
        {
          kind: "example",
          heading: "Changing permissions and ownership",
          body: "chmod is most often used with a symbolic form (u/g/o + rwx) or a numeric shorthand (r=4, w=2, x=1, summed per group).",
          language: "bash",
          code: `chmod +x deploy.sh              # add execute permission for everyone
chmod u+x,g-w deploy.sh         # owner gets execute, group loses write
chmod 754 deploy.sh             # owner: rwx(7), group: r-x(5), others: r--(4)

chown alice:engineering deploy.sh   # change owner and group`,
        },
        {
          kind: "bullets",
          heading: "Why execute matters differently for directories",
          intro: "The execute bit means something distinct on a directory versus a file — a common source of confusion.",
          bullets: [
            "On a file, execute (x) means: can this be run as a program or script.",
            "On a directory, execute (x) means: can you enter it and access files inside by name — without it, even a directory you can \"read\" (list) may not let you cd into it or open a specific file inside.",
            "This is why a directory with permissions like r--r--r-- (no execute) can be frustratingly listable but not actually usable.",
          ],
        },
        {
          kind: "summary",
          heading: "Permissions, briefly",
          bullets: [
            "Three permissions (read/write/execute) for three groups (owner/group/others) — nine bits in total.",
            "chmod changes what's allowed; chown changes who owns it.",
            "Execute on a directory means \"can enter and access contents,\" not \"can run this directory.\"",
          ],
        },
      ],
    },
    {
      title: "Piping and Redirection",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Piping and Redirection",
          subheading:
            "Individually, Linux commands are simple and narrow on purpose. Piping and redirection are what let you combine them into something much more powerful than any single command alone.",
        },
        {
          kind: "text",
          heading: "The Unix philosophy behind this",
          body: [
            "Most core Linux commands do exactly one small thing well — list files, filter text, count lines, sort output — rather than trying to do everything themselves. Pipes and redirection are the connective tissue that lets those small, focused tools be chained into a real solution.",
          ],
        },
        {
          kind: "example",
          heading: "Redirection: sending output to a file instead of the screen",
          body: "> overwrites the file; >> appends to it without erasing what's there.",
          language: "bash",
          code: `ls -la > file-list.txt              # write output to a new file (overwrite)
echo "build complete" >> log.txt    # append a line to an existing file
sort names.txt > sorted-names.txt   # save sorted output to a new file`,
        },
        {
          kind: "example",
          heading: "Piping: sending one command's output into another command's input",
          body: "The | symbol connects them — each command in the chain only has to do its own small job.",
          language: "bash",
          code: `ps aux | grep node
# lists all processes, then filters to lines containing "node"

cat access.log | grep "ERROR" | wc -l
# counts how many lines in the log contain the word ERROR

ls -la | sort -k5 -n
# lists files, then sorts that listing numerically by size (column 5)`,
        },
        {
          kind: "bullets",
          heading: "A few patterns worth having ready",
          bullets: [
            "grep searches text for a pattern — grep -i is case-insensitive, grep -v inverts the match (lines that don't contain the pattern).",
            "wc -l counts lines — often used at the end of a pipe chain just to get a count of matching results.",
            "head and tail show just the first or last N lines — tail -f keeps following a file as new lines are appended, which is the standard way to watch a log file live.",
            "2>&1 redirects error output (stderr) into the same stream as normal output (stdout) — useful when you want a command's errors captured in the same log file as its regular output.",
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Build a pipe chain one stage at a time",
          body: "When a long pipeline isn't giving the expected result, run it one command at a time from the left, checking the output at each stage before adding the next |. It's much faster to find which single stage is wrong than to debug the whole chain at once.",
        },
        {
          kind: "summary",
          heading: "Piping and redirection, briefly",
          bullets: [
            "> and >> send output to a file (overwrite vs. append); | sends output into another command.",
            "Small, focused commands chained together can solve problems no single command handles alone.",
            "When a pipeline misbehaves, test it one stage at a time.",
          ],
        },
      ],
    },
    {
      title: "Process Management Basics",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Process Management Basics",
          subheading:
            "Every running program on a Linux system is a process with an identity, a state, and a lifecycle — inspecting and controlling that is core to operating a system, not just using it.",
        },
        {
          kind: "example",
          heading: "Seeing what's running",
          body: "ps aux is the classic full-system snapshot; top gives a live, continuously updating view.",
          language: "bash",
          code: `ps aux | head -5
# USER   PID  %CPU %MEM COMMAND
# alice  1821  0.3  1.2 node server.js
# alice  1902  0.0  0.4 nginx: worker process
# root      1  0.0  0.1 /sbin/init

top
# live, auto-refreshing view of CPU/memory usage by process
# (press q to quit)`,
        },
        {
          kind: "bullets",
          heading: "The PID is the key to controlling a process",
          intro: "Once you know a process's PID (process ID), most process management is a single command away.",
          bullets: [
            "kill <PID> sends a termination signal (technically SIGTERM), asking the process to shut down cleanly — it can, in principle, ignore or handle this signal.",
            "kill -9 <PID> sends SIGKILL, an unconditional, immediate stop that the process cannot intercept or ignore — a last resort when a process won't respond to a normal kill.",
            "pkill <name> finds and kills processes by name, without needing to look up the PID manually first — convenient, but riskier if the name pattern matches more than intended.",
          ],
        },
        {
          kind: "example",
          heading: "Foreground, background, and staying alive after logout",
          body: "By default a command runs in the foreground and blocks your terminal until it finishes.",
          language: "bash",
          code: `long-running-task.sh &
# runs in the background; you get your prompt back immediately

jobs
# [1]+  Running    long-running-task.sh &

fg %1
# brings job 1 back to the foreground

nohup long-running-task.sh &
# keeps running even if the terminal session itself closes`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "kill -9 is a blunt instrument",
          body: "SIGKILL doesn't give a process any chance to close open files, save state, or clean up gracefully — it's stopped mid-instruction. Reach for a plain kill first, and only escalate to -9 if the process genuinely isn't responding, since an abruptly killed process can occasionally leave things (a lock file, a partial write) in a bad state.",
        },
        {
          kind: "summary",
          heading: "Process management, briefly",
          bullets: [
            "ps aux and top show what's running; a process's PID is how you target it.",
            "kill asks a process to stop; kill -9 forces it immediately, with no cleanup.",
            "& backgrounds a command, jobs lists background jobs, and nohup keeps one alive after you disconnect.",
          ],
        },
      ],
    },
    {
      title: "Putting It Together: A Real Troubleshooting Workflow",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Putting It Together: A Real Troubleshooting Workflow",
          subheading:
            "The commands in this course are rarely used one at a time in practice — real troubleshooting chains navigation, permissions, piping, and process management together.",
        },
        {
          kind: "text",
          heading: "A realistic scenario",
          body: [
            "A web application's log file is growing suspiciously fast, and a teammate reports the site feels slow. Nothing here is a single command — it's a short sequence of the tools from this course used in order.",
          ],
        },
        {
          kind: "example",
          heading: "Step by step",
          body: "Each command answers one specific question before moving to the next.",
          language: "bash",
          code: `# 1. Where are we, and how big is the log directory?
pwd
du -sh /var/log/myapp/

# 2. What's actually filling the log?
tail -n 20 /var/log/myapp/access.log

# 3. How many errors have there been in the log?
grep "ERROR" /var/log/myapp/access.log | wc -l

# 4. Is a runaway process actually the cause?
ps aux | grep myapp

# 5. The process is stuck — stop it cleanly, then confirm it's gone
kill 4821
ps aux | grep myapp`,
        },
        {
          kind: "bullets",
          heading: "What this walkthrough actually demonstrates",
          bullets: [
            "Navigation (pwd) and inspection (du, tail) come first — you look before you act.",
            "Piping (grep, wc -l) turns a giant log file into a single, useful number in one line.",
            "Process management (ps, kill) is the last step, only reached once the earlier steps identified a real cause.",
            "Permissions matter throughout this too — reading application logs or killing another user's process may require elevated privileges depending on how the system is configured.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "The real skill isn't memorizing commands",
          body: "It's knowing which small tool answers which small question, and being comfortable chaining several of them in sequence rather than looking for one command that does everything at once. That instinct — break the problem into small, checkable steps — is the actual command-line skill, more than any specific flag.",
        },
        {
          kind: "summary",
          heading: "Course recap",
          bullets: [
            "Navigate the single filesystem tree with pwd, ls, and cd.",
            "Manage files with mkdir, cp, mv, and rm — carefully, especially with rm -rf.",
            "Understand permissions as three access types across three groups, adjustable with chmod and chown.",
            "Combine small commands with pipes (|) and redirect output with > and >>.",
            "Inspect and control running processes with ps, top, kill, and background jobs.",
          ],
        },
      ],
    },
    {
      title: "Finding Things: find, locate, and grep -r",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Finding Things: find, locate, and grep -r",
          subheading:
            "Piping, from the last lesson, filters text you already have in front of you. This is the other half — actually locating files and content across a filesystem you're not already looking at.",
        },
        {
          kind: "example",
          heading: "find searches by name, type, and recency",
          body: "find walks a directory tree and matches files against whatever conditions you give it — starting from wherever you point it.",
          language: "bash",
          code: `find . -name "*.log"
# recursively finds files ending in .log, starting from the current directory

find /var/log -name "*.log" -mtime -1
# same, but only files modified in the last day

find . -type d -name "node_modules"
# find directories (-type d) specifically named node_modules`,
        },
        {
          kind: "example",
          heading: "Combining find with an action",
          body: "find can act on every match directly — with real caution, since -delete has no confirmation prompt.",
          language: "bash",
          code: `find . -type f -size +100M
# regular files (-type f) larger than 100 megabytes

find . -name "*.tmp" -delete
# finds AND deletes every match in one command

find . -name "*.log" -exec rm {} \\;
# runs rm on each match individually; {} is replaced with the matched filename`,
        },
        {
          kind: "bullets",
          heading: "find vs. locate vs. grep -r",
          bullets: [
            "find searches the live filesystem right now, by name, type, size, or modification time — slower per run, but always current.",
            "locate searches a prebuilt index instead of the live filesystem — much faster, but can miss a file created moments ago until the index (usually rebuilt daily via updatedb) catches up.",
            "grep -r \"TODO\" . searches inside file contents recursively, rather than searching filenames — find locates files by metadata, grep -r locates files by what's written inside them.",
            "grep -rl \"TODO\" . adds -l to print just the matching filenames instead of every matching line — useful when you only need to know which files, not where.",
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Combine find with xargs for real power",
          body: "find . -name \"*.log\" | xargs rm removes every matching file in one line, and find . -name \"*.test.ts\" | xargs grep -l \"skip\" finds every test file that mentions \"skip\". Piping find's output into another command is one of the most common real-world patterns for anything that needs to act on many files at once.",
        },
        {
          kind: "summary",
          heading: "What to carry forward",
          bullets: [
            "find searches the live filesystem by name, type, size, or modification time; locate searches a fast but possibly-stale prebuilt index.",
            "grep -r searches inside file contents recursively — a different job from find, and often chained right after it.",
            "-exec and piping into xargs both let you run another command against everything find turns up, instead of handling matches one by one by hand.",
          ],
        },
      ],
    },
    {
      title: "Practice: Locating Files and Content",
      durationMinutes: 12,
      slides: [
        {
          kind: "title",
          heading: "Practice: Locating Files and Content",
          subheading:
            "Three exercises with find and grep -r — narrowing by name and recency, checking before deleting, and searching file contents instead of filenames.",
        },
        {
          kind: "practice",
          heading: "Find Recently Modified Files by Extension",
          prompt:
            "Write a single command to find every .py file inside the scripts/ directory that was modified in the last 7 days.",
          hint: "-name filters by filename pattern; -mtime -7 means modified less than 7 days ago (the minus sign means \"less than\").",
          solution: `find scripts/ -name "*.py" -mtime -7`,
        },
        {
          kind: "practice",
          heading: "Check Before You Delete",
          prompt:
            "Find every file under /tmp/build larger than 500MB. Write the command to list them first, then the separate command you'd only run after confirming that list looks right, to actually delete them.",
          hint: "Run the search alone first to see what matches, then add -delete as a second step — the same \"look before you act\" habit that applies to any destructive command.",
          solution: `# Step 1: see what would match
find /tmp/build -type f -size +500M

# Step 2: only after confirming the list is what you expect
find /tmp/build -type f -size +500M -delete`,
        },
        {
          kind: "practice",
          heading: "Search File Contents, Not Filenames",
          prompt:
            "Search every file under src/ for the text \"DEPRECATED\", and print only the filenames that contain it — not every matching line.",
          hint: "grep -r searches recursively through file contents; add -l to print matching filenames only, instead of the matching lines themselves.",
          solution: `grep -rl "DEPRECATED" src/`,
        },
        {
          kind: "summary",
          heading: "What a correct solution demonstrates",
          bullets: [
            "-name, -mtime, and -size are find's everyday filters, and they combine — narrowing by name and recency together is a common, realistic search.",
            "Running a search once to review matches before adding -delete is the same look-before-you-act habit that applies to any destructive command, like rm -rf.",
            "grep -r searches file contents, not filenames; -l narrows its output to just the matching files when you don't need to see every line that matched.",
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
            "Five questions across the whole course — navigation, permissions, redirection, processes, and the search tools you just covered.",
        },
        {
          kind: "quiz",
          heading: "Relative Paths",
          question: "From /home/alice/projects, what does cd ../shared/docs actually move you to?",
          options: ["/home/alice/shared/docs", "/home/alice/projects/shared/docs", "/home/shared/docs", "It causes an error — relative paths can't use .."],
          correctIndex: 0,
          explanation:
            ".. moves up one level, from /home/alice/projects to /home/alice, and then shared/docs is read from there — landing at /home/alice/shared/docs. Relative paths are always resolved from your current directory, and .. is a completely normal part of one.",
        },
        {
          kind: "quiz",
          heading: "Execute on a Directory",
          question: "A directory has permissions r--r--r-- (read-only, no execute, for everyone). What happens when a user tries to cd into it?",
          options: [
            "It works normally, since read access is enough to enter a directory",
            "It works, but only the owner can see the file names inside",
            "Directories ignore the execute bit entirely; only files use it",
            "It fails — without execute, you can't enter the directory or access files inside it by name, even though you can list it",
          ],
          correctIndex: 3,
          explanation:
            "Execute means something different on a directory than on a file — there, it controls whether you can enter it and reach files inside by name. Read alone lets you list what's in a directory, but not cd into it or open a specific file inside.",
        },
        {
          kind: "quiz",
          heading: "Redirection Operators",
          question: "What's the difference between command > file.txt and command >> file.txt?",
          options: [
            "> appends, >> overwrites",
            "> overwrites the file's contents, >> appends without erasing what's there",
            "They're identical; >> is just an older alias for >",
            "> only works with text files, >> works with any file type",
          ],
          correctIndex: 1,
          explanation:
            "> always replaces the file's entire contents with the command's output. >> adds the new output to the end of whatever is already there — the one to reach for when you don't want to lose an existing log or file.",
        },
        {
          kind: "quiz",
          heading: "kill vs. kill -9",
          question: "Why would you use kill -9 instead of a plain kill?",
          options: [
            "kill -9 is the default and safest way to stop any process",
            "kill -9 only works on background jobs started with &",
            "kill -9 (SIGKILL) is a last resort, unconditional stop for a process that isn't responding to a normal termination request — it skips any cleanup the process would otherwise do",
            "kill -9 pauses a process instead of stopping it",
          ],
          correctIndex: 2,
          explanation:
            "A plain kill sends SIGTERM, a polite request the process can catch and respond to by cleaning up before exiting. kill -9 sends SIGKILL, which the process cannot intercept or ignore — appropriate only once a normal kill has failed to stop something unresponsive.",
        },
        {
          kind: "quiz",
          heading: "find vs. grep -r",
          question: "You want every file under logs/ whose name contains \"error\" — not the lines inside files that mention it. Which command actually answers that?",
          options: [
            "find logs/ -name \"*error*\"",
            "grep -r \"error\" logs/",
            "ps aux | grep error",
            "cat logs/* | grep error",
          ],
          correctIndex: 0,
          explanation:
            "find matches on file metadata like the name itself — -name \"*error*\" finds files whose filename contains that text. grep -r searches inside file contents instead, which answers a different question: which files mention \"error\" somewhere in their text, regardless of what they're named.",
        },
        {
          kind: "summary",
          heading: "Course recap",
          bullets: [
            "One filesystem tree rooted at /; pwd, ls, and cd are the everyday navigation trio, and absolute paths always start with /.",
            "mkdir, cp, mv, and rm handle everyday file management — rm has no undo, so treat rm -rf with real caution.",
            "Permissions are three types (read/write/execute) across three groups (owner/group/others); execute on a directory means \"can enter it,\" not \"can run it.\"",
            "| chains small commands together; > and >> redirect output to a file, overwriting or appending respectively.",
            "ps, top, and kill inspect and control running processes; find and grep -r locate files by metadata and by content, respectively.",
          ],
        },
      ],
    },
  ],
};
