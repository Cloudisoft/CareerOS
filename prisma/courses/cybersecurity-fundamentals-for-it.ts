import type { CourseSeed } from "../course-types";

export const course: CourseSeed = {
  slug: "cybersecurity-fundamentals-for-it",
  title: "Cybersecurity Fundamentals for IT Professionals",
  description:
    "The core security principles, common attack vectors, and practical habits that apply across almost every IT role — not just dedicated security positions.",
  category: "Security",
  level: "BEGINNER",
  order: 7,
  lessons: [
    {
      title: "The CIA Triad and Why It's the Starting Point",
      durationMinutes: 5,
      slides: [
        {
          kind: "title",
          heading: "The CIA Triad and Why It's the Starting Point",
          subheading:
            "Nearly every security decision can be framed against three properties: Confidentiality, Integrity, and Availability.",
        },
        {
          kind: "bullets",
          heading: "The three properties",
          bullets: [
            "Confidentiality — only authorized people/systems can access the data. A data breach is a confidentiality failure.",
            "Integrity — data hasn't been tampered with. A system that lets anyone silently modify financial records has an integrity failure, even if access is otherwise well-controlled.",
            "Availability — authorized users can actually access the system when they need to. A denial-of-service attack is purely an availability failure.",
          ],
        },
        {
          kind: "text",
          heading: "Why thinking in these terms is useful",
          body: [
            "Different systems weight these differently. A public status page cares enormously about availability and barely about confidentiality. A system holding medical records cares enormously about confidentiality and integrity.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "A concrete example",
          body: "Encrypting a database protects confidentiality but does nothing for availability — a ransomware attack can still lock you out of your own encrypted data. Real security posture layers multiple protections.",
        },
        {
          kind: "example",
          heading: "Classifying three real incidents by which property failed",
          body: "The same skill used throughout this course: naming precisely what broke, instead of a vague \"we got hacked.\"",
          code: `Incident 1: An attacker steals a database export containing
customer emails and hashed passwords. Nothing is changed or
taken offline.
  -> Confidentiality failure. Data that should have stayed
     private did not.

Incident 2: An attacker doesn't steal anything, but silently
alters shipping addresses in an orders database so future
shipments get redirected.
  -> Integrity failure. The data itself became untrustworthy,
     even though nobody's access was ever "breached" in the
     traditional sense.

Incident 3: An attacker floods a company's login page with
traffic until legitimate users can't reach it.
  -> Availability failure. Nothing was read or changed — the
     system just stopped being usable by the people who
     needed it.`,
        },
        {
          kind: "bullets",
          heading: "A common mistake: treating \"more security\" as always meaning \"more confidentiality\"",
          intro:
            "Confidentiality gets the most attention (breaches make headlines), which quietly biases some teams to over-invest there.",
          bullets: [
            "Locking data down so aggressively that legitimate employees can't do their jobs efficiently is a self-inflicted availability problem — security that makes a system unusable pushes people toward risky workarounds (shared passwords, data copied to personal devices) that undermine confidentiality anyway.",
            "A system can be technically airtight on confidentiality (perfect encryption, strict access control) and still fail badly on integrity if it never checks whether stored data was tampered with by someone who did have legitimate access.",
            "The useful habit: for any proposed security control, ask which of the three properties it actually improves, and whether it comes at a real cost to one of the other two — a genuinely good control rarely helps all three equally.",
          ],
        },
        {
          kind: "summary",
          heading: "The CIA triad, in short",
          bullets: [
            "Confidentiality, integrity, and availability are three separate properties — a real incident usually violates one specifically, not all three at once, and naming which one clarifies what actually needs fixing.",
            "Different systems legitimately weight the three differently — a public status page and a medical records system have very different right answers for how much each property matters.",
            "A security control that strengthens one property can come at a real cost to another — genuine security posture balances all three deliberately, rather than maximizing confidentiality alone.",
          ],
        },
      ],
    },
    {
      title: "Common Attack Vectors",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Common Attack Vectors",
          subheading:
            "Understanding how systems actually get compromised makes every other security practice make more sense.",
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Phishing and social engineering",
          body: "The overwhelming majority of real breaches start with a human, not a technical vulnerability. No firewall stops this; it's addressed through awareness and systems designed so one person's mistake doesn't cascade into full compromise.",
        },
        {
          kind: "bullets",
          heading: "Credential-based attacks",
          bullets: [
            "Credential stuffing — attackers use leaked username/password pairs from one breach to try other services, betting on password reuse.",
            "Brute force — systematically trying passwords, mitigated by rate limiting, lockouts, and MFA.",
          ],
        },
        {
          kind: "bullets",
          heading: "Injection attacks",
          bullets: [
            "SQL injection — untrusted input concatenated directly into a database query. Prevented by parameterized queries.",
            "Cross-site scripting (XSS) — untrusted input rendered as executable code in another user's browser. Prevented by properly escaping output.",
          ],
        },
        {
          kind: "example",
          heading: "What SQL injection actually looks like",
          body: "The vulnerable version trusts whatever the user typed enough to paste it directly into a query — the fixed version never lets user input become part of the query's structure at all.",
          language: "sql",
          code: `Vulnerable (string concatenation):
  query = "SELECT * FROM users WHERE username = '" + input + "'"

  If input is:  ' OR '1'='1
  The query becomes:
  SELECT * FROM users WHERE username = '' OR '1'='1'
  -- '1'='1' is always true, so this returns every user row —
  -- an attacker just bypassed the login check entirely.

Fixed (parameterized query):
  query = "SELECT * FROM users WHERE username = ?"
  db.execute(query, [input])
  -- The database treats input strictly as a data value being
  -- compared, never as part of the query's own logic — the
  -- same malicious string just fails to match any real username.`,
        },
        {
          kind: "bullets",
          heading: "Malware, ransomware, and the supply chain",
          bullets: [
            "Malware — software installed without informed consent to spy, damage, or gain unauthorized access; ransomware is the subset that encrypts a victim's own data and demands payment for the key.",
            "Ransomware specifically targets backups as part of the attack, which is exactly why a tested, offline or immutable backup (covered in the hygiene lesson) is the difference between a bad day and an existential one.",
            "Supply-chain attacks compromise a trusted vendor or software dependency instead of the target directly — a malicious update pushed through a widely-used library or IT management tool can compromise thousands of downstream organizations that never did anything wrong themselves.",
            "This is why patching quickly matters even for software you trust completely — the vulnerability being patched might be in a dependency three layers deep that your own team never directly chose or reviewed.",
          ],
        },
        {
          kind: "text",
          heading: "Misconfiguration",
          body: [
            "A publicly exposed storage bucket, an admin panel with default credentials, an overly permissive firewall rule — not sophisticated exploits, just mistakes an attacker only has to find.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "A common mistake: assuming a firewall makes internal systems safe to leave unpatched",
          body: "A vulnerability inside the network perimeter is often treated as low-priority — \"an attacker would need to already be inside to exploit it.\" But a single successful phishing email (the single most common entry vector) puts an attacker exactly there. Internal systems need to be patched and hardened as if they'll eventually be reached directly, not just as a second line of defense behind a firewall nobody expects to fail — this thinking is also the practical bridge to the next lesson's defense-in-depth principle.",
        },
        {
          kind: "chart",
          heading: "Breaches by initial vector",
          description: "The human vector dwarfs the purely technical ones — which is exactly why awareness training is treated as a real control, not a formality.",
          chartType: "bar",
          unit: "% of breaches",
          data: [
            { label: "Phishing / social engineering", value: 36 },
            { label: "Misconfiguration", value: 18 },
            { label: "Credential stuffing / brute force", value: 20 },
            { label: "Injection (SQLi / XSS)", value: 15 },
            { label: "Other", value: 11 },
          ],
        },
        {
          kind: "summary",
          heading: "The practical implication",
          bullets: [
            "Most real breaches exploit a known category of weakness that a fairly standard security practice would have prevented.",
          ],
        },
      ],
    },
    {
      title: "Least Privilege and Defense in Depth",
      durationMinutes: 5,
      slides: [
        {
          kind: "title",
          heading: "Least Privilege and Defense in Depth",
          subheading:
            "Two principles do more real-world security work than almost any specific tool.",
        },
        {
          kind: "bullets",
          heading: "Least privilege",
          intro: "Grant the minimum access required to do a job. If a marketing analyst's account only has read access to a dashboard, a phished password there can't reach customer payment data.",
          bullets: [
            "Application service accounts get only the specific database permissions they need.",
            "Temporary elevated access beats permanent elevated access \"in case.\"",
            "Regularly review who has access to what.",
          ],
        },
        {
          kind: "bullets",
          heading: "Defense in depth",
          intro: "No single security control is perfect, so real security posture layers multiple independent controls. Example layering for a web application:",
          bullets: [
            "Network level — firewall rules.",
            "Application level — input validation, authentication, authorization.",
            "Data level — encryption at rest.",
            "Monitoring — logging and alerting.",
          ],
        },
        {
          kind: "diagram",
          heading: "Defense in depth, layer by layer",
          description: "An attacker has to get through every layer, not just one, before reaching the actual data.",
          steps: [
            { label: "Network", detail: "Firewall rules" },
            { label: "Application", detail: "Input validation, authentication, authorization" },
            { label: "Data", detail: "Encryption at rest" },
            { label: "Monitoring", detail: "Logging and alerting" },
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Why both principles together matter",
          body: "Least privilege limits how much any single compromised point can reach. Defense in depth ensures no single compromised point is enough on its own.",
        },
        {
          kind: "bullets",
          heading: "A common mistake: privilege creep",
          intro:
            "Least privilege is usually implemented correctly on day one — the failure mode is what happens over the following years.",
          bullets: [
            "An employee who moves between three roles over five years typically accumulates the access each role needed, without anyone removing what the previous roles required — nobody's job is explicitly \"take access away,\" so it just doesn't happen without a deliberate process.",
            "This is called privilege creep, and it means tenure, not current job function, ends up determining how much damage a compromised account can do — a long-tenured employee's account is often a far bigger prize for an attacker than their current role would suggest.",
            "Role-based access control (RBAC) — defining access by role rather than granting it person by person — helps, but only if role definitions are actually kept current and access is reviewed periodically, not just assigned once and forgotten.",
            "A practical fix: a recurring access review (quarterly is common) where a manager has to actively re-affirm that each direct report still needs each permission they currently hold, rather than access silently persisting by default.",
          ],
        },
        {
          kind: "example",
          heading: "Privilege creep, traced through one employee's history",
          body: "Nobody made a single bad decision here — each individual grant was reasonable at the time it was made.",
          code: `Year 1: Hired as Support Rep
  -> granted read access to customer support tickets

Year 2: Promoted to Support Team Lead
  -> granted access to team performance dashboards (kept ticket access)

Year 3: Moved to a Product role
  -> granted access to the product roadmap tool and analytics
     (nobody removed the support-ticket or dashboard access,
      since "it might still be useful")

Year 5 — account compromised via phishing:
  attacker inherits ticket data, team performance data, AND
  product roadmap access — far more than the current Product
  role would ever justify on its own.`,
        },
        {
          kind: "summary",
          heading: "Least privilege and defense in depth, in short",
          bullets: [
            "Least privilege limits how far any single compromised account can reach; defense in depth ensures no single failed control is catastrophic on its own.",
            "Privilege creep — access accumulating across role changes without being removed — is the most common way least privilege quietly erodes over time.",
            "A recurring access review, not just a correct policy at hire time, is what actually keeps least privilege true years into an employee's tenure.",
          ],
        },
      ],
    },
    {
      title: "Practical Security Hygiene",
      durationMinutes: 5,
      slides: [
        {
          kind: "title",
          heading: "Practical Security Hygiene",
          subheading:
            "Most of the security value in day-to-day IT work comes from a small set of unglamorous, consistently-applied habits.",
        },
        {
          kind: "bullets",
          heading: "The habits that matter most",
          bullets: [
            "Patching — unpatched software is one of the most common real causes of breaches, because known vulnerabilities are publicly documented.",
            "Multi-factor authentication (MFA) — a stolen password alone shouldn't be enough. MFA stops the overwhelming majority of credential-based attacks even when a password is compromised.",
            "Backups, tested — a backup never tested for restoration isn't reliable, it's an assumption. Ransomware specifically targets backups, which is why an offline or immutable backup copy matters.",
            "Logging and monitoring — a breach not noticed for months does far more damage than one caught within hours. Centralized logging and basic alerting turns \"we found out three months later\" into \"we caught this within the hour.\"",
          ],
        },
        {
          kind: "chart",
          heading: "Mean time to detect a breach",
          description: "\"We found out three months later\" versus \"we caught this within the hour\" — the difference is centralized logging and alerting, not luck.",
          chartType: "bar",
          unit: "days",
          data: [
            { label: "No centralized logging", value: 90 },
            { label: "With logging & alerting", value: 1 },
          ],
        },
        {
          kind: "bullets",
          heading: "Making patching actually happen, not just agreeing it matters",
          intro:
            "Almost every IT team already agrees patching is important — the gap is usually process, not awareness.",
          bullets: [
            "Severity-based timelines work better than \"patch everything eventually\": a critical, actively-exploited vulnerability gets patched within days (sometimes hours), while a low-severity one might reasonably wait for the next regular maintenance window.",
            "A vulnerability scanner that reports issues nobody acts on provides a false sense of security that's arguably worse than not scanning at all — it creates a paper trail showing the organization knew, and did nothing.",
            "Password managers turn \"use a long, unique password on every account\" from an unrealistic ask into an actually achievable habit — the realistic alternative to a password manager isn't perfect unique passwords, it's password reuse, which is exactly what makes credential stuffing effective.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "A common mistake: dismissing a low-severity finding in isolation",
          body: "A single low-severity misconfiguration — a verbose error message revealing a software version, a slightly too-permissive internal API — is often deprioritized on its own, reasonably. The real risk is chaining: an attacker combines that version disclosure with a known vulnerability for that exact version, then uses the overly permissive API to move further than a single well-configured control would have allowed. Treating each finding in total isolation, rather than asking what it enables in combination with everything else already known about the system, is how a list of individually-minor issues adds up to a real breach path.",
        },
        {
          kind: "summary",
          heading: "The unifying theme",
          bullets: [
            "A sophisticated architecture with unpatched systems and no MFA is weaker in practice than a simple architecture where the basics are actually, reliably applied.",
            "Patching works when it has a severity-based timeline attached to it, not just a general policy that vulnerabilities should eventually be fixed.",
            "Small, individually low-severity issues can chain together into a real breach path — evaluate findings in combination, not purely one at a time.",
          ],
        },
      ],
    },
    {
      title: "Encryption Fundamentals: Symmetric, Asymmetric, and Hashing",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Encryption Fundamentals: Symmetric, Asymmetric, and Hashing",
          subheading:
            "The CIA triad named confidentiality as a goal. Encryption is the primary tool that actually delivers it — and it comes in three distinct flavors that get used for different jobs.",
        },
        {
          kind: "bullets",
          heading: "Symmetric encryption: one key, both directions",
          intro: "The same key encrypts and decrypts. AES is the standard in wide use today.",
          bullets: [
            "Fast, and well-suited to encrypting large amounts of data (a full disk, a database, a big file).",
            "The catch: both parties need the same secret key before they can communicate — securely getting that key to the other party without it being intercepted is the hard problem.",
          ],
        },
        {
          kind: "bullets",
          heading: "Asymmetric encryption: a public key and a private key",
          intro:
            "Two mathematically linked keys — anything encrypted with the public key can only be decrypted with the matching private key (RSA is a common example).",
          bullets: [
            "Solves the key-distribution problem: the public key can be shared openly, since only the private key (kept secret, never transmitted) can decrypt what it encrypts.",
            "Much slower than symmetric encryption for large amounts of data, which is why it's rarely used to encrypt bulk data directly.",
          ],
        },
        {
          kind: "example",
          heading: "How HTTPS actually uses both",
          body: "TLS (the encryption behind HTTPS) doesn't pick one — it uses asymmetric encryption briefly, only to safely exchange a key, then switches to fast symmetric encryption for everything else.",
          code: `1. Your browser connects to a server and gets its public key
   (via a certificate).
2. Browser generates a random symmetric session key, encrypts it
   with the server's public key, and sends it.
3. Only the server's private key can decrypt that message — so
   only the real server ever learns the session key.
4. Both sides now share a symmetric key and use fast AES-style
   encryption for the rest of the session's actual data.`,
        },
        {
          kind: "bullets",
          heading: "Hashing: one-way, and a different job entirely",
          intro:
            "A hash function turns input of any size into a fixed-size output, and — unlike encryption — is not meant to be reversed.",
          bullets: [
            "Used for password storage: a system stores a hash of a password, not the password itself, so even a full database breach doesn't directly hand over usable passwords.",
            "A salt (random data added before hashing) is added specifically so two identical passwords don't produce identical hashes, defeating precomputed lookup-table attacks.",
            "Also used to verify a file wasn't altered — the same input always produces the same hash, so a changed file produces a detectably different one.",
          ],
        },
        {
          kind: "terminal",
          heading: "Hashing vs. encrypting from the command line",
          description:
            "The hash below can never be turned back into the original password — only compared against. The encrypted file below can be decrypted back, but only by someone who has the same symmetric key.",
          lines: [
            { text: "openssl dgst -sha256 <<< 'CorrectHorseBatteryStaple'" },
            {
              text: "SHA2-256(stdin)= 2c624232cdd221771294dfbb310aca000a0df6ac8b66b696d90ef06fdefb64a",
              output: true,
            },
            { text: "openssl enc -aes-256-cbc -salt -in report.csv -out report.csv.enc -k SecretKey123" },
            { text: "openssl enc -d -aes-256-cbc -in report.csv.enc -out report.csv.dec -k SecretKey123" },
            { text: "diff report.csv report.csv.dec" },
            { text: "(no output — the decrypted file is byte-for-byte identical)", output: true },
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Hashing and encryption are not interchangeable",
          body: "A system that \"encrypts\" stored passwords (reversibly) rather than hashing them is a real, common design flaw — anyone who obtains the decryption key (an attacker who breaches the server, or a malicious insider) can recover every plaintext password at once. Passwords should be hashed, since there's never a legitimate reason to need the original password back — a lost password should be reset, never \"looked up.\"",
        },
        {
          kind: "bullets",
          heading: "Not all hashes are built for the same job — and using the wrong one is a real mistake",
          intro:
            "\"Hashing\" isn't one interchangeable operation — a hash function fast enough for checking file integrity is the wrong choice for passwords specifically.",
          bullets: [
            "MD5 and SHA-1 are fast, general-purpose hash functions, and both are considered broken for security purposes — fast enough that an attacker with stolen hashes can try billions of password guesses per second, and both have known collision weaknesses (two different inputs producing the same hash).",
            "Password-specific hash functions (bcrypt, scrypt, Argon2) are deliberately slow and tunable — that slowness is a feature, not a flaw, since it's exactly what makes guessing billions of candidate passwords against a stolen hash impractical.",
            "Using a general-purpose fast hash (even SHA-256, which isn't \"broken\" the way MD5 is) for password storage is still a common real-world mistake — fast is the wrong property to optimize for when the whole point is making guessing expensive.",
          ],
        },
        {
          kind: "summary",
          heading: "Three tools, three jobs",
          bullets: [
            "Symmetric encryption: fast, one shared key — used for bulk data once both sides already have the key.",
            "Asymmetric encryption: public/private key pair — used to safely establish a shared key or verify identity, not to encrypt large amounts of data directly.",
            "Hashing: one-way, no key to share — used for password storage and integrity checks, never for anything that needs to be decrypted back.",
          ],
        },
      ],
    },
    {
      title: "Practice: Spotting Threats and Choosing the Right Control",
      durationMinutes: 13,
      slides: [
        {
          kind: "title",
          heading: "Practice: Spotting Threats and Choosing the Right Control",
          subheading:
            "Three exercises: read a phishing email, match a cryptographic tool to a job, and apply least privilege to a real breach.",
        },
        {
          kind: "practice",
          heading: "Find the red flags",
          prompt:
            "An email arrives, subject \"URGENT: Your Account Will Be Suspended in 24 Hours.\" Body: \"Dear Valued Customer, We detected unusual activity on your account. Click here to verify your identity immediately: http://accounts-secure-verify.com/login. Failure to respond within 24 hours will result in permanent suspension. — The Security Team.\" List every red flag in this email, and what each one indicates.",
          hint: "Look at urgency, greeting, sender specificity, and the link itself — not just whether it 'looks official.'",
          solution:
            "Red flags: (1) Artificial urgency (\"24 hours,\" \"immediately\") — a manufactured time pressure designed to short-circuit careful thinking, a hallmark of phishing rather than a routine account notice. (2) Generic greeting (\"Dear Valued Customer\") — a real account-specific alert from a company you have an account with typically addresses you by name or account detail; mass phishing campaigns can't personalize this. (3) The domain \"accounts-secure-verify.com\" is not the company's actual domain — it's designed to look official (\"secure,\" \"verify\") while being an entirely different, attacker-controlled domain; hovering over the link (without clicking) would reveal this mismatch. (4) A vague threat with no specific detail about the account or the \"unusual activity\" — legitimate security alerts usually reference something specific (a device, location, or action) that a generic phishing template can't fake convincingly. (5) The generic sign-off (\"The Security Team\") rather than a named person or the company's actual branding pattern. The right response is to not click the link at all, and instead navigate to the real site directly (typing the known URL or using a saved bookmark) to check for any actual account issue.",
        },
        {
          kind: "practice",
          heading: "Match the control to the job",
          prompt:
            "Three situations: (a) A company needs to store 50,000 user passwords securely. (b) Two servers need to establish a shared secret key over an untrusted network before exchanging bulk data. (c) A company wants to verify a downloaded software installer hasn't been tampered with since it was published. For each, name the right cryptographic tool (symmetric encryption, asymmetric encryption, or hashing) and briefly say why the other two are a worse fit.",
          hint: "Ask whether the data needs to be recovered later (encryption) or never needs to come back at all (hashing), and whether a shared secret already exists.",
          solution:
            "(a) Hashing (with a salt) — passwords never need to be decrypted back to their original form, only checked for a match, so a one-way function is the right fit; encrypting them (symmetric or asymmetric) would mean a stolen key recovers every plaintext password at once. (b) Asymmetric encryption — the servers don't yet share a secret, and asymmetric encryption is exactly the tool for safely establishing one over a network an attacker might be watching; symmetric encryption can't be used yet since there's no shared key, and hashing doesn't produce something you can share a secret through at all. (c) Hashing — publish the installer's hash alongside it; anyone can hash their downloaded copy and compare it to the published value, and any tampering — even a single changed byte — produces a completely different hash. Encryption isn't the right tool here either, since the goal is detecting change, not keeping the installer's contents secret.",
        },
        {
          kind: "practice",
          heading: "Apply least privilege and defense in depth",
          prompt:
            "A marketing analyst's laptop gets compromised via a phishing email, and the attacker obtains her login credentials. She has read-only access to a marketing dashboard, but her account is also a member of a shared \"All Staff\" group that has read access to a company-wide file share containing HR and finance documents. Using least privilege and defense in depth, identify what went wrong architecturally, and recommend two specific fixes — not just 'don't click phishing links.'",
          hint: "The phishing click is the trigger, but least privilege is about limiting what a compromised account can reach regardless of how it got compromised.",
          solution:
            "What went wrong: the analyst's account has far more access than her job requires — a marketing role has no legitimate need to read HR and finance documents, but the broad \"All Staff\" group grants it anyway. This is a least-privilege failure, not just a phishing failure — the phishing email is only the trigger; the actual damage (reach into HR/finance data) came from over-broad access that had nothing to do with her actual job. Fixes: (1) Restructure group membership so \"All Staff\" grants only what every employee genuinely needs (e.g., the company directory, HR self-service for their own records) and move sensitive document access to narrower, role-specific groups — this directly limits the blast radius of any single compromised account, regardless of how it's compromised. (2) Add MFA on top of the password, so a phished password alone isn't sufficient to log in at all — this is a defense-in-depth layer independent of the access-scoping fix, so even if the least-privilege fix were somehow incomplete, this second control still blocks the specific attack described.",
        },
        {
          kind: "diagram",
          heading: "Responding to the compromised account above",
          description: "The same five stages apply whether the trigger was phishing, a leaked credential, or a misconfiguration.",
          steps: [
            { label: "Detect", detail: "Alert fires on an unusual login or access pattern" },
            { label: "Contain", detail: "Disable the account, revoke active sessions" },
            { label: "Eradicate", detail: "Reset credentials, close the phishing/access gap" },
            { label: "Recover", detail: "Restore access scoped to least privilege, not the old broad grant" },
            { label: "Review", detail: "Audit group membership so the same over-broad access can't recur" },
          ],
        },
        {
          kind: "summary",
          heading: "What this practice demonstrates",
          bullets: [
            "Reading a phishing email for its actual tells — urgency, generic greeting, mismatched domain, vague threat — rather than a gut 'looks official' reaction.",
            "Matching symmetric encryption, asymmetric encryption, and hashing to the job each is actually built for, instead of treating 'crypto' as one interchangeable tool.",
            "Applying least privilege and defense in depth together to reduce both how far a single compromised account can reach and how much a single control failure actually costs.",
          ],
        },
      ],
    },
    {
      title: "Knowledge Check",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Knowledge Check",
          subheading:
            "Five questions across the whole course — the kind of understanding that should survive being asked a different way than the lesson asked it.",
        },
        {
          kind: "quiz",
          heading: "The CIA triad",
          question:
            "A company's website goes down for six hours due to a denial-of-service attack, but no data is stolen or altered. Which part of the CIA triad was violated?",
          options: ["Confidentiality", "Integrity", "Availability", "All three equally"],
          correctIndex: 2,
          explanation:
            "A denial-of-service attack prevents authorized users from accessing a system when they need to — that's specifically an availability failure. No data was read (confidentiality) or altered (integrity) in this scenario, which is exactly why the CIA triad is useful: it lets you name precisely which property failed instead of just saying 'we got attacked.'",
        },
        {
          kind: "quiz",
          heading: "Where breaches start",
          question:
            "According to this course, what's the most common starting point for real-world security breaches?",
          options: [
            "A zero-day software vulnerability nobody knew about",
            "A human being tricked — phishing or social engineering",
            "A brute-force password attack",
            "A physical break-in to a data center",
          ],
          correctIndex: 1,
          explanation:
            "The overwhelming majority of real breaches start with a human being tricked, not a sophisticated technical exploit — which is why awareness and systems designed so one person's mistake doesn't cascade into full compromise matter as much as any firewall or patch.",
        },
        {
          kind: "quiz",
          heading: "Least privilege",
          question:
            "Why is 'temporary elevated access, granted only when needed' generally preferred over 'permanent elevated access, granted in case it's needed later'?",
          options: [
            "Temporary access is technically impossible to phish",
            "It limits how much any single compromised account can reach, and for how long, at any given moment",
            "It's required by most encryption standards",
            "Permanent access is always more expensive to maintain",
          ],
          correctIndex: 1,
          explanation:
            "This is least privilege in practice: minimizing standing access means that if an account is compromised, the attacker only gets whatever access happens to be active at that moment — not a permanently open door to elevated permissions that were only ever needed occasionally.",
        },
        {
          kind: "quiz",
          heading: "Hashing vs. encrypting passwords",
          question:
            "A company stores user passwords using a reversible encryption scheme rather than a one-way hash, so that a lost password can technically be 'looked up' and returned to the user. What's the real risk this creates?",
          options: [
            "Reversible encryption is always slower than hashing, hurting login performance",
            "Anyone who obtains the decryption key can recover every user's plaintext password at once",
            "This approach only works for passwords under 12 characters",
            "There's no real risk — reversible encryption is just as secure as hashing",
          ],
          correctIndex: 1,
          explanation:
            "Hashing is one-way by design specifically because a password never legitimately needs to be recovered — only checked for a match. Reversible encryption means a single compromised key (a server breach, a malicious insider) can unlock every stored password at once, which is exactly the scenario hashing with a salt is designed to prevent.",
        },
        {
          kind: "quiz",
          heading: "Defense in depth",
          question:
            "A web application has strong input validation and authentication, but no firewall rules, no encryption at rest, and no logging. What does this describe?",
          options: [
            "Good security, since the application layer is the only layer that matters",
            "A single-layer defense — if that one control is ever bypassed or has a flaw, nothing else stands in the way",
            "An example of least privilege done correctly",
            "A CIA triad violation specifically",
          ],
          correctIndex: 1,
          explanation:
            "This is the opposite of defense in depth: real protection comes from layering independent controls (network, application, data, monitoring) so that no single failure is catastrophic on its own. Strong application-layer controls are good, but relying on just one layer means any flaw or bypass there has nothing else backing it up.",
        },
        {
          kind: "summary",
          heading: "The course's core takeaways",
          bullets: [
            "The CIA triad — confidentiality, integrity, availability — gives you precise language for naming what a given security failure actually violated.",
            "Most real breaches start with a person being tricked, not an exotic technical exploit — awareness and blast-radius limiting matter as much as firewalls.",
            "Least privilege limits how far any single compromised account can reach; defense in depth ensures no single failed control is catastrophic alone.",
            "Symmetric encryption, asymmetric encryption, and hashing solve three different problems — matching the right one to the job matters more than using 'more crypto.'",
            "Patching, MFA, tested backups, and real logging are unglamorous, but they prevent or limit more real incidents than almost any advanced control.",
          ],
        },
      ],
    },
  ],
};
