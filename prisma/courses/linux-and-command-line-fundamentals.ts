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
          kind: "terminal",
          heading: "Putting the shortcuts to use",
          description: "cd ~ jumps home, cd - jumps right back, and ls -la shows what's actually in the directory you land in.",
          lines: [
            { text: "pwd" },
            { text: "/home/alice/projects/src", output: true },
            { text: "cd ~" },
            { text: "pwd" },
            { text: "/home/alice", output: true },
            { text: "cd -" },
            { text: "/home/alice/projects/src", output: true },
            { text: "ls -la" },
            { text: "drwxr-xr-x  4 alice alice  128 Mar 14 10:02 .", output: true },
            { text: "drwxr-xr-x  6 alice alice  192 Mar 14 09:40 ..", output: true },
            { text: "-rw-r--r--  1 alice alice   45 Mar 14 09:55 .env", output: true },
            { text: "-rw-r--r--  1 alice alice 1.2K Mar 14 10:02 index.js", output: true },
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Tab completion is not optional",
          body: "Typing cd /ho then pressing Tab completes it to /home/ automatically, and does the same for filenames, commands, and options. It's the single biggest speed and accuracy improvement available in any shell, and it also prevents typos in long paths.",
        },
        {
          kind: "text",
          heading: "Where things live: the standard layout",
          body: [
            "Every Linux distribution follows roughly the same top-level layout, called the Filesystem Hierarchy Standard, so once you know it, an unfamiliar server stops feeling like a totally new place. /etc holds system-wide configuration files. /var holds data that changes while the system runs — logs in /var/log, spool files, caches. /usr holds installed software and libraries, not personal data despite the name; /home holds the actual home directories for each user, and /tmp holds temporary files that are typically cleared on reboot.",
            "/bin and /usr/bin hold the executable programs behind the most common commands, /opt is where third-party software that doesn't fit the standard layout often gets installed, and /root is the home directory for the root superuser — kept separate from /home so a full /home partition can't lock an administrator out of their own system.",
          ],
        },
        {
          kind: "bullets",
          heading: "A few paths worth recognizing on sight",
          bullets: [
            "/etc/hosts maps hostnames to IP addresses locally, and /etc/passwd lists every user account on the system — both plain text, both worth being able to open and read without hesitation.",
            "/var/log is where most application and system logs land by default — it's usually the first place to look when something has gone wrong.",
            "/proc is a virtual filesystem, not real files on disk — it exposes live kernel and process information, so cat /proc/cpuinfo or cat /proc/meminfo reads current system state directly, no separate monitoring tool required.",
            "~/.bashrc (or ~/.zshrc) runs every time you open a new shell — it's where personal aliases, environment variables, and prompt customizations usually live, and editing it is one of the first things people do to make a new machine feel like home.",
          ],
        },
        {
          kind: "terminal",
          heading: "Checking how full the disk actually is",
          description: "df -h summarizes every mounted filesystem; du -sh totals the size of one specific directory — the two commands people reach for once \"the disk is full\" becomes somebody's actual problem.",
          lines: [
            { text: "df -h" },
            { text: "Filesystem      Size  Used Avail Use% Mounted on", output: true },
            { text: "/dev/sda1        50G   32G   16G  67% /", output: true },
            { text: "/dev/sdb1       200G  180G   10G  95% /data", output: true },
            { text: "du -sh /var/log" },
            { text: "1.2G    /var/log", output: true },
            { text: "du -sh /var/log/*  | sort -rh | head -3" },
            { text: "980M    /var/log/myapp", output: true },
            { text: "150M    /var/log/nginx", output: true },
            { text: "40M     /var/log/journal", output: true },
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Absolute paths in scripts, always",
          body: "Relative paths are fine to type interactively, but inside a script or a cron job they're a common bug source — the working directory a script runs from isn't guaranteed, so a script that does cd config/ or reads ./settings.json can break the moment it's invoked from somewhere else. Production scripts almost always use absolute paths, or compute their own directory explicitly at the top rather than trusting where they happened to be launched from.",
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
          kind: "text",
          heading: "Symbolic links: a file that points to another file",
          body: [
            "ln -s target linkname creates a symbolic link — a small file that just points at another path, similar to a shortcut on Windows or an alias on macOS. Opening, reading, or running the link transparently follows it through to the real target, and ls -l shows the arrow explicitly: linkname -> target.",
            "Symlinks are everywhere in real systems. /usr/bin/python often just links to one specific installed version, and version managers like nvm switch Node versions by repointing a single symlink rather than moving any actual files. Delete the link and the target file is completely untouched; delete or move the target and the link becomes \"broken,\" pointing at nothing — which is exactly the failure mode in the terminal example below.",
          ],
        },
        {
          kind: "terminal",
          heading: "A symlink, and what happens when its target moves",
          description: "The link itself never changes — it just stops resolving to anything once the path it points at is gone.",
          lines: [
            { text: "ln -s /opt/app/current/server.js server.js" },
            { text: "ls -l server.js" },
            { text: "lrwxrwxrwx 1 alice alice 29 Mar 14 10:20 server.js -> /opt/app/current/server.js", output: true },
            { text: "mv /opt/app/current /opt/app/old" },
            { text: "cat server.js" },
            { text: "cat: server.js: No such file or directory", output: true },
          ],
        },
        {
          kind: "bullets",
          heading: "A few more file-operation patterns worth having ready",
          bullets: [
            "cp -a preserves permissions, timestamps, and symlinks exactly as they are — the flag to reach for when copying something like a full backup or a cloned repository, rather than plain cp -r, which can quietly normalize some of that.",
            "touch filename.txt creates an empty file if it doesn't exist, or just updates its modification timestamp if it does — commonly used to create placeholder files, or to force a build step that only checks file timestamps to think something changed.",
            "mkdir -p a/b/c creates all three nested directories in one call even though none of them exist yet — without -p, mkdir fails immediately at the first missing parent instead of creating the whole chain.",
            "Wildcards expand before a command ever runs: rm *.log matches every file ending in .log in the current directory. That's powerful, and it's exactly why a stray unquoted * sitting next to rm deserves a second look before you press enter.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Why cp and rm both require -r for directories",
          body: "Neither command touches a directory's contents by default, because operating on a directory and everything nested inside it is a meaningfully bigger, riskier action than operating on a single file — the shell won't silently do that unless you explicitly opt in with -r (or -R). It's a small design choice that prevents an entire class of \"I only meant to touch one file\" accidents.",
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
          kind: "terminal",
          heading: "Watching chmod change the string",
          description: "The same file, before and after — the permissions string in ls -l is exactly what chmod edits.",
          lines: [
            { text: "ls -l deploy.sh" },
            { text: "-rw-r--r-- 1 alice engineering 812 Mar 14 deploy.sh", output: true },
            { text: "chmod +x deploy.sh" },
            { text: "ls -l deploy.sh" },
            { text: "-rwxr-xr-x 1 alice engineering 812 Mar 14 deploy.sh", output: true },
          ],
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
          kind: "text",
          heading: "Special permission bits: setuid, setgid, and the sticky bit",
          body: [
            "Beyond the basic nine bits, three special permissions handle less common but important cases. setuid on an executable makes it run with the file's owner's privileges rather than the invoking user's — it's how passwd lets an ordinary user change their own password despite that requiring write access to a root-owned file. setgid on a directory makes new files created inside it inherit the directory's group automatically, instead of the creating user's default group, which is useful for a shared team directory where everyone's files need the same group.",
            "The sticky bit, set on a directory like /tmp, means users can create files there but can only delete or rename their own files — even though everyone technically has write access to the directory itself. All three show up in ls -l as an s or t in place of an x: drwxrwxrwt on /tmp is the sticky bit in action, and -rwsr-xr-x is setuid.",
          ],
        },
        {
          kind: "example",
          heading: "Setting the special bits",
          body: "Symbolic mode handles these the same way as the basic bits, just with u+s, g+s, or +t.",
          language: "bash",
          code: `chmod u+s /usr/bin/passwd     # setuid — runs as the file's owner (root)
chmod g+s shared-project/     # setgid — new files inherit the directory's group
chmod +t /tmp                 # sticky bit — users can only delete their own files

ls -l /usr/bin/passwd
# -rwsr-xr-x 1 root root 68208 ... /usr/bin/passwd
#     ^ s here means setuid is active`,
        },
        {
          kind: "bullets",
          heading: "Permissions problems you'll actually run into",
          bullets: [
            "\"Permission denied\" on a script you just made executable almost always means you forgot chmod +x, or you're running it as ./script.sh (which needs execute) instead of via an interpreter like bash script.sh (which only needs read).",
            "A file owned by root that you can't edit as a normal user needs either sudo for a one-off edit, or — better long-term — a chown handing ownership to the right user or group, instead of routing every future edit through sudo.",
            "Web servers commonly refuse to serve a file with overly permissive permissions like 777 on purpose — some configurations treat a world-writable file as a security red flag and reject it outright rather than serve it.",
            "chmod -R applies a change recursively through an entire directory tree — powerful, and worth double-checking the target path on, the same way you'd double-check an rm -r before running it.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "chmod 777 is not a fix, it's a workaround",
          body: "Setting a file or directory to 777 (read/write/execute for everyone) makes a permissions error go away, but it also means any user or process on the system can modify or execute it — including a compromised process running as a different, less trusted user. It's a common shortcut under deadline pressure, and a common finding in a security review. The better fix is almost always figuring out which specific owner or group actually needs the access, and granting just that.",
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
          kind: "terminal",
          heading: "What that pipeline actually prints",
          description: "ps aux | grep node in a real terminal — note that grep even matches its own process line, a common first surprise.",
          lines: [
            { text: "ps aux | grep node" },
            { text: "alice     1821  0.3  1.2  912344  98212 ?  Sl  09:41   0:12 node server.js", output: true },
            { text: "alice     2290  0.0  0.0    6408     712 pts/0  S+  10:15   0:00 grep --color=auto node", output: true },
          ],
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
          kind: "example",
          heading: "Input redirection and here-strings",
          body: "< feeds a file in as input instead of the keyboard; a here-string feeds a variable's value in directly, without needing a separate file at all.",
          language: "bash",
          code: `sort < unsorted-names.txt           # read input FROM a file instead of typing it
wc -l < access.log                  # count lines, reading directly from the file

mysql mydb < schema.sql             # common pattern: feed a whole script file into a program
grep "ERROR" <<< "$LOG_LINE"        # here-string: feed a variable's value in directly`,
        },
        {
          kind: "text",
          heading: "tee: writing to a file and the screen at the same time",
          body: [
            "Piping output into a file with > means you no longer see it on screen — often fine, but sometimes you want both: to watch a long command run live and also keep a permanent record of what it printed. tee sits in the middle of a pipeline and does exactly that, writing its input to a file while also passing it straight through, unchanged, to whatever comes next in the chain.",
            "npm run build | tee build.log runs the build, shows the output as it happens, and saves that same output to build.log at the same time — a pattern worth knowing before the first time you need to debug a build that already finished and scrolled off the screen five minutes ago.",
          ],
        },
        {
          kind: "bullets",
          heading: "A few more redirection details worth having",
          bullets: [
            "/dev/null is a special file that discards anything written to it — command > /dev/null 2>&1 silences a command's normal output and its errors completely, useful in scripts and cron jobs where you only care whether it succeeded.",
            "Order matters with 2>&1: command > file.txt 2>&1 sends both streams into the file, while command 2>&1 > file.txt only sends stdout there, because stderr was redirected to wherever stdout was pointing (the screen) before stdout itself got moved to the file.",
            "xargs turns a list of lines into arguments for another command. find . -name \"*.log\" | xargs rm behaves differently from piping straight into rm, because rm doesn't read filenames from standard input at all — it only accepts arguments, which is exactly the gap xargs fills.",
          ],
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
          kind: "diagram",
          heading: "What kill and kill -9 actually do",
          description: "A plain kill asks; SIGKILL doesn't — this is why one is the default and the other is a last resort.",
          steps: [
            { label: "kill <PID>", detail: "Sends SIGTERM — a polite request" },
            { label: "Process handles it", detail: "Closes files, saves state, exits cleanly (if it chooses to)" },
            { label: "Still running?", detail: "If it ignored SIGTERM, escalate" },
            { label: "kill -9 <PID>", detail: "Sends SIGKILL — the kernel stops it immediately, no cleanup" },
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "kill -9 is a blunt instrument",
          body: "SIGKILL doesn't give a process any chance to close open files, save state, or clean up gracefully — it's stopped mid-instruction. Reach for a plain kill first, and only escalate to -9 if the process genuinely isn't responding, since an abruptly killed process can occasionally leave things (a lock file, a partial write) in a bad state.",
        },
        {
          kind: "text",
          heading: "Process states, and what a runaway process looks like",
          body: [
            "Every process is in one of a handful of states at any moment: running (actively using the CPU right now), sleeping (waiting on something — input, a timer, a lock — the state most idle processes sit in), stopped (paused, usually by a signal), or a zombie (finished, but its exit status hasn't been collected yet by its parent process). Both ps and top show this in a STAT column, and it's often the first thing worth checking when a process seems stuck.",
            "A single process pinned near 100% CPU for an extended stretch, or one whose memory usage keeps climbing without ever leveling off, is usually the sign something's actually wrong — a runaway loop, a memory leak, or a process stuck retrying something that keeps failing. Neither is normal for a healthy, idle service.",
          ],
        },
        {
          kind: "terminal",
          heading: "Spotting a runaway process in top",
          description: "Sorted by CPU (top's default), the offender is usually obvious within a few seconds of the view refreshing.",
          lines: [
            { text: "top" },
            { text: "Tasks: 212 total,   2 running, 209 sleeping,   1 zombie", output: true },
            { text: "%Cpu(s): 91.2 us,  2.1 sy,  0.0 ni,  6.0 id", output: true },
            { text: "MiB Mem :  7891.4 total,   340.1 free", output: true },
            { text: "" },
            { text: "  PID USER   %CPU  %MEM  COMMAND", output: true },
            { text: " 1821 alice  87.3  12.1  node worker.js", output: true },
            { text: " 1902 alice   2.0   3.4  nginx: worker process", output: true },
            { text: "    1 root    0.0   0.1  /sbin/init", output: true },
          ],
        },
        {
          kind: "bullets",
          heading: "A few more process commands worth knowing",
          bullets: [
            "pgrep node finds PIDs by process name without going through ps and grep yourself — it's what pkill uses internally, and it's handy on its own when you just need the number.",
            "renice lets you lower a background process's scheduling priority so it doesn't compete as aggressively for CPU with whatever you're actively doing — useful for a long compression or backup job running alongside real work.",
            "kill -l lists every signal name kill can send, not just SIGTERM and SIGKILL — SIGHUP and SIGSTOP are two others you'll occasionally see referenced in service configuration or documentation.",
            "A process's parent PID (PPID) matters too: killing a parent process can also terminate or orphan its children, which is often the actual cause of a service that mysteriously stops when an unrelated-looking process is killed.",
          ],
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
          kind: "chart",
          heading: "Why it got everyone's attention",
          description: "access.log's size over the last few hours — the growth rate alone was enough to start digging.",
          chartType: "line",
          unit: " MB",
          data: [
            { label: "9am", value: 40 },
            { label: "10am", value: 52 },
            { label: "11am", value: 70 },
            { label: "12pm", value: 410 },
            { label: "1pm", value: 960 },
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
          kind: "text",
          heading: "A second scenario: \"permission denied\" out of nowhere",
          body: [
            "A deploy script that's run the same way for months suddenly fails with Permission denied, right after a teammate copied the project to a new server using a plain file transfer instead of git. Nothing about the script's own content changed — so the cause has to be something about how the new server's copy of it got there.",
            "The fix itself — chmod +x — takes about two seconds once you know it's needed. Getting to the point of knowing that's the fix takes a couple of read-only checks first, and that ordering isn't incidental: it's what keeps a troubleshooting session from turning into changing things at random and hoping one of them helps.",
          ],
        },
        {
          kind: "terminal",
          heading: "Diagnosing it in three commands",
          description: "whoami confirms who you're actually running as; ls -l shows what the file allows; chmod fixes the specific gap once it's identified.",
          lines: [
            { text: "whoami" },
            { text: "deploy", output: true },
            { text: "ls -l deploy.sh" },
            { text: "-rw-r--r-- 1 deploy deploy 812 Mar 14 deploy.sh", output: true },
            { text: "chmod +x deploy.sh" },
            { text: "./deploy.sh" },
            { text: "Deploying build 4821...", output: true },
          ],
        },
        {
          kind: "bullets",
          heading: "The pattern underneath both scenarios",
          bullets: [
            "Neither problem was solved by memorizing a fix — it was solved by checking one small, specific thing at a time until the actual cause was visible, not guessed at.",
            "A plain file copy doesn't preserve execute permissions the same way git does for a file already tracked as executable — which is exactly why the second scenario surfaced only after switching how the project got onto the new server.",
            "In both cases the very first diagnostic step was read-only: du, tail, ls -l, whoami. None of that risks making things worse, which is exactly why it comes before anything that changes state.",
            "The last step in both scenarios — kill or chmod — is also the smallest one. Nearly all of the real work in troubleshooting is narrowing down what's actually wrong; fixing it, once you know that, is often one line.",
          ],
        },
        {
          kind: "diagram",
          heading: "A general shape for troubleshooting anything",
          description: "The same five steps apply whether the symptom is a full disk, a slow site, or a script that suddenly won't run.",
          steps: [
            { label: "Observe", detail: "What's the actual symptom — slow, failing, growing, silent?" },
            { label: "Look, don't act", detail: "pwd, ls, tail, du, ps — read-only commands that cost nothing to run" },
            { label: "Narrow it down", detail: "grep, wc -l, ls -l — turn a vague symptom into a specific fact" },
            { label: "Make the smallest safe change", detail: "kill, chmod, mv — the actual fix, informed by everything above it" },
            { label: "Confirm it worked", detail: "Re-run the same read-only check from step 2 and see the number change" },
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
          kind: "text",
          heading: "grep's real power: patterns, not just plain text",
          body: [
            "grep's search term is a regular expression by default, not just a literal string. grep \"^ERROR\" matches lines starting with ERROR, grep \"[0-9]\\{3\\}\" matches any three consecutive digits, and grep -E turns on extended regular expression syntax so patterns like (ERROR|WARN) work without needing to escape every parenthesis and pipe individually.",
            "That regex support is what makes grep -r so much more than a plain text search — it's a pattern search across every file in a tree, and a well-built pattern can pull exactly the lines worth seeing out of a codebase with thousands of files, in well under a second.",
          ],
        },
        {
          kind: "bullets",
          heading: "grep flags worth memorizing",
          bullets: [
            "-i makes the search case-insensitive — grep -i \"error\" matches ERROR, Error, and error alike, which is the default you usually want unless case is actually meaningful.",
            "-n prints the line number alongside each match, so you can jump straight to it in an editor instead of searching the file again by hand.",
            "-c prints a count of matching lines per file instead of the lines themselves — useful for a quick \"how many places\" before diving in.",
            "-v inverts the match, printing every line that does NOT contain the pattern — handy for filtering noise out of a log before reading what's left.",
            "-A 3 and -B 3 print 3 lines of context after and before each match — often the difference between seeing an error and actually understanding it.",
          ],
        },
        {
          kind: "example",
          heading: "Combining find's conditions with logic",
          body: "find's conditions combine with -and (the default), -or, and -not, and case-insensitive name matching uses -iname instead of -name.",
          language: "bash",
          code: `find . -iname "*.LOG"                                # case-insensitive name match
find . -name "*.js" -not -path "*/node_modules/*"    # exclude a whole directory
find . -type f \\( -name "*.jpg" -or -name "*.png" \\)   # match either extension
find . -newer reference-file.txt                     # modified more recently than reference-file.txt`,
        },
        {
          kind: "bullets",
          heading: "When to reach for find, grep -r, or both together",
          bullets: [
            "Looking for a file you know exists somewhere, but can't remember where — find is the tool, searching by name or type.",
            "Looking for a specific string across a codebase you don't have memorized — grep -r is the tool, searching by content.",
            "Looking for a specific string, but only within a certain kind of file — combine them: find . -name \"*.py\" | xargs grep -l \"import requests\" narrows by file type first, then by content.",
            "Not sure the file even still exists, only that something like it existed recently — find . -mtime -3 narrows by recency first, before you've even decided what to search inside it for.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Both commands will happily crawl into directories you don't want",
          body: "Run grep -r or find without excluding anything inside a real project, and both will crawl into .git, node_modules, or a vendor directory holding tens of thousands of files — slow, and full of irrelevant matches. grep -r --exclude-dir=node_modules and find . -path \"*/node_modules\" -prune -o -print are the patterns worth having ready, and tools like ripgrep (rg) skip directories like these by default for exactly this reason.",
        },
        {
          kind: "terminal",
          heading: "A realistic search session",
          description: "Narrowing from \"somewhere in this codebase\" to one exact line, two commands in.",
          lines: [
            { text: "grep -rc \"TODO\" src/" },
            { text: "src/api/routes.js:4", output: true },
            { text: "src/utils/format.js:1", output: true },
            { text: "grep -rn \"TODO\" src/api/routes.js" },
            { text: "src/api/routes.js:22:  // TODO: paginate this response", output: true },
            { text: "src/api/routes.js:41:  // TODO: validate input shape", output: true },
            { text: "src/api/routes.js:58:  // TODO: rate limit this endpoint", output: true },
            { text: "src/api/routes.js:63:  // TODO: add auth check", output: true },
          ],
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
            "Nine exercises with find, grep -r, locate, and xargs — narrowing by name and recency, checking before deleting, searching file contents instead of filenames, and chaining several of them into real multi-step searches.",
        },
        {
          kind: "text",
          heading: "Before you start",
          body: [
            "Real search tasks rarely have exactly one right command — these nine exercises build from a single find flag up through combining find, grep -r, and xargs into the kind of multi-step search you'd actually run against a real codebase or a production server. Work through the hint before looking at the solution: the goal here is building the instinct for which tool answers which question, not memorizing nine specific commands.",
          ],
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
          kind: "practice",
          heading: "Exclude a Noisy Directory",
          prompt:
            "You want every .ts file under a project, but the project also has a node_modules directory containing thousands of matching files you don't care about, plus a dist/ build output directory in the same state. Write a single find command that searches for *.ts files while excluding anything under node_modules or dist.",
          hint: "-not -path excludes a path pattern from matching; you can repeat it for more than one excluded directory, and it combines with -name using find's implicit AND.",
          solution: `find . -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*"`,
        },
        {
          kind: "practice",
          heading: "Find Files by Content, Not Name, Case-Insensitively",
          prompt:
            "Search every file under config/ for any spelling of the word \"password\" — Password, PASSWORD, password, or PaSsWoRd — and print both the filename and the line number for every match, so you can jump straight to each one in an editor.",
          hint: "grep -i ignores case entirely; -n adds line numbers to the output. Both combine with -r, which makes the search recursive through every file under the directory.",
          solution: `grep -rni "password" config/`,
        },
        {
          kind: "practice",
          heading: "Narrow By Recency, Then Search Inside",
          prompt:
            "Of every file modified in the last 2 days anywhere under /var/log, find only the ones that actually contain the text \"CRITICAL\". Do this as a single pipeline, rather than eyeballing a list of recent files and opening each one by hand.",
          hint: "find can filter by -mtime to get the recent files first; piping that list into xargs grep -l then searches inside only those specific files, instead of the entire log directory.",
          solution: `find /var/log -mtime -2 -type f | xargs grep -l "CRITICAL"`,
        },
        {
          kind: "practice",
          heading: "locate vs. find for a File Created Seconds Ago",
          prompt:
            "A teammate just ran touch new-config.yaml and is confused that locate new-config.yaml finds nothing, even though the file is sitting right there in ls. Explain what's actually happening, and write the command that would find the file reliably right now, without waiting.",
          hint: "locate searches a prebuilt index, not the live filesystem — a file created after the last index build (usually run once a day via updatedb) simply isn't in that index yet, even though it genuinely exists on disk.",
          solution: `# locate searches a prebuilt index (rebuilt roughly once a day via updatedb),
# not the live filesystem — a file created seconds ago isn't in that index yet,
# even though "ls" proves it's really there.
#
# find always walks the live filesystem, so it finds it immediately:
find . -name "new-config.yaml"`,
        },
        {
          kind: "practice",
          heading: "Find the Largest Offenders in a Directory Tree",
          prompt:
            "A deploy pipeline is failing because a build artifact directory has ballooned in size, and nobody knows which files are responsible. Write a command that finds every file over 50MB anywhere under build/, and prints them sorted from largest to smallest with a human-readable size.",
          hint: "find's -size filters by size, but doesn't sort. Pipe matches into du -h, then into sort -rh (reverse, human-numeric) to get them ordered largest first.",
          solution: `find build/ -type f -size +50M -exec du -h {} \\; | sort -rh`,
        },
        {
          kind: "practice",
          heading: "Turn a Multi-Step Investigation Into One Pipeline",
          prompt:
            "You suspect a specific deploy broke something: every file under src/ that was both modified in the last 24 hours AND still contains a leftover console.log statement. Write one command that finds exactly those files.",
          hint: "Chain two filters: find narrows to recently modified files first, then pipe that list into xargs grep -l to keep only the ones that still contain the pattern.",
          solution: `find src/ -mtime -1 -name "*.js" | xargs grep -l "console.log"`,
        },
        {
          kind: "practice",
          heading: "Search Content While Ignoring Binary Files",
          prompt:
            "A recursive grep -r \"config\" . against a project that includes a few compiled binaries and images is printing garbled, unreadable lines mixed in with the real text matches. Write a version of the search that skips binary files and reports only that a binary file matched, instead of dumping its raw bytes to the terminal.",
          hint: "grep has a flag specifically for this: -I skips binary files entirely, and -l alone (without -I) would still open and scan them, just suppressing the unreadable output — -I is the one that avoids reading them at all.",
          solution: `grep -rI "config" .
# -I tells grep to treat binary files as if they had no matching text at all,
# instead of scanning their raw bytes and printing whatever garbage happens
# to look like a match. Combine with -l if you only want the filenames:
grep -rIl "config" .`,
        },
        {
          kind: "practice",
          heading: "Find Empty Directories Left Behind by a Cleanup Script",
          prompt:
            "A cleanup job deletes old report files but leaves the now-empty directories behind, and over months they've accumulated by the hundreds under archive/. Write a command that finds every empty directory under archive/ so they can be reviewed before removal.",
          hint: "find has a dedicated -empty flag that matches files or directories with no contents — combine it with -type d to match only directories, not empty files.",
          solution: `find archive/ -type d -empty
# review the list first, then remove them once you're confident it's safe:
find archive/ -type d -empty -delete`,
        },
        {
          kind: "bullets",
          heading: "Mistakes worth avoiding in real search tasks",
          bullets: [
            "Forgetting to exclude node_modules, .git, or a build output directory turns a two-second search into a slow, noisy one — get in the habit of excluding them by default in any project-wide search.",
            "Running -delete or -exec rm on a find command before running the same find without it first, just to see what would actually match — the review step costs nothing and prevents almost every accidental deletion.",
            "Reaching for locate on a system where updatedb hasn't run recently (or at all, in a fresh container) and concluding the file doesn't exist, when find would have found it immediately.",
            "Writing a grep pattern that's technically correct but too broad — grep \"error\" without -i will silently skip every Error and ERROR, giving false confidence that a codebase is cleaner than it actually is.",
          ],
        },
        {
          kind: "summary",
          heading: "What a correct solution demonstrates",
          bullets: [
            "-name, -mtime, and -size are find's everyday filters, and they combine — narrowing by name and recency together is a common, realistic search.",
            "Running a search once to review matches before adding -delete is the same look-before-you-act habit that applies to any destructive command, like rm -rf.",
            "grep -r searches file contents, not filenames; -l narrows its output to just the matching files when you don't need to see every line that matched, and -i and -n make it case-insensitive and line-numbered respectively.",
            "find and xargs (or -exec) combine to turn a search into an action — sorting by size, searching inside only the files that match a prior filter, or chaining recency and content together in one pipeline.",
            "locate is fast but reads from a stale index; find is slower but always current — for anything created or changed moments ago, find is the one that won't lie to you.",
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
          kind: "quiz",
          heading: "Numeric chmod",
          question: "chmod 640 file.txt sets which permissions?",
          options: [
            "owner: rwx, group: rwx, others: rwx",
            "owner: rw-, group: r--, others: ---",
            "owner: r--, group: rw-, others: r--",
            "owner: rwx, group: r--, others: ---",
          ],
          correctIndex: 1,
          explanation:
            "6 = 4+2 = read+write for the owner, 4 = read only for the group, and 0 = nothing at all for others. Numeric chmod is just the sum of read(4), write(2), and execute(1), applied per group in owner-group-others order — 640 reads as owner rw-, group r--, others ---.",
        },
        {
          kind: "quiz",
          heading: "tee vs. Plain Redirection",
          question: "You need to watch a long build's output live in your terminal AND save the same output to build.log. Which command actually does both?",
          options: [
            "npm run build > build.log",
            "npm run build | tee build.log",
            "npm run build >> build.log 2>&1",
            "npm run build < build.log",
          ],
          correctIndex: 1,
          explanation:
            "> and >> both send output only to the file, hiding it from the screen entirely. tee sits in the middle of a pipeline, writing its input to a file while also passing it straight through, unchanged, to the terminal — exactly the \"both at once\" behavior this needs.",
        },
        {
          kind: "quiz",
          heading: "Excluding node_modules from a Search",
          question: "grep -r \"TODO\" . is crawling into node_modules and returning thousands of irrelevant matches from installed packages. Which change fixes that without switching to a different tool entirely?",
          options: [
            "Nothing can be done — grep -r always searches every subdirectory",
            "grep -r \"TODO\" . --exclude-dir=node_modules",
            "Switch -r to -R, which behaves identically but skips dependency folders",
            "Add -i to the command to ignore installed packages",
          ],
          correctIndex: 1,
          explanation:
            "--exclude-dir names a specific directory (by basename) to skip entirely during the recursive walk, and it can be repeated for more than one directory. -R and -r are functionally the same recursive flag, and -i only affects case sensitivity — neither has anything to do with which directories get searched.",
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
