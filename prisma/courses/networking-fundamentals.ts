import type { CourseSeed } from "../course-types";

export const course: CourseSeed = {
  slug: "networking-fundamentals",
  title: "Networking Fundamentals",
  description:
    "How data actually moves between systems — the model, the protocols, and the troubleshooting instincts that make networking issues less opaque.",
  category: "Networking",
  level: "BEGINNER",
  order: 8,
  lessons: [
    {
      title: "The OSI Model, Practically",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "The OSI Model, Practically",
          subheading:
            "The seven-layer OSI model is often taught as something to memorize. It's more useful as a mental checklist for isolating where a networking problem actually lives.",
        },
        {
          kind: "bullets",
          heading: "The layers, briefly (bottom to top)",
          bullets: [
            "Physical — actual cables, radio signals, electrical signals.",
            "Data Link — how devices on the same local network address each other (MAC addresses, switches).",
            "Network — how data finds its way across different networks (IP addresses, routers).",
            "Transport — reliable (TCP) or fast-but-unreliable (UDP) delivery, including ports.",
            "Session — managing a connection's lifecycle.",
            "Presentation — data format/encoding (TLS encryption often discussed here).",
            "Application — the user-facing protocol (HTTP, DNS, SMTP).",
          ],
        },
        {
          kind: "diagram",
          heading: "The seven layers, bottom to top",
          description: "Troubleshooting works the same direction — confirm the bottom layer works before assuming a failure further up.",
          steps: [
            { label: "Physical", detail: "Cables, radio, electrical signals" },
            { label: "Data Link", detail: "MAC addresses, switches" },
            { label: "Network", detail: "IP addresses, routers" },
            { label: "Transport", detail: "TCP/UDP, ports" },
            { label: "Session", detail: "Connection lifecycle" },
            { label: "Presentation", detail: "Data format, TLS encryption" },
            { label: "Application", detail: "HTTP, DNS, SMTP" },
          ],
        },
        {
          kind: "text",
          heading: "Why this ordering is the practically useful part",
          body: [
            "When something's broken, working through the layers bottom to top is efficient: Is the cable/wifi connected? Does the device have a valid IP? Can it reach the destination port? Is the application-level request succeeding?",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "A concrete example",
          body: "\"I can't reach this website\" could mean: no physical connection, no IP address (DHCP failure), DNS isn't resolving, the server's port isn't reachable, or the server returns an error. Each is diagnosable with a specific tool (ping, ipconfig/ifconfig, nslookup/dig, telnet/curl).",
        },
        {
          kind: "bullets",
          heading: "A common mistake: treating the seven layers as how real software is actually built",
          intro:
            "The OSI model is a teaching reference, not a literal blueprint every protocol follows layer-by-layer.",
          bullets: [
            "The protocols you actually work with day to day are usually described with the simpler, four-layer TCP/IP model instead: Network Access (Physical + Data Link combined), Internet (Network), Transport, and Application (Session + Presentation + Application combined) — OSI's extra layers rarely appear as distinct pieces of real software.",
            "TLS, for example, doesn't cleanly live \"at\" the Presentation layer the way the OSI chart suggests — in practice it sits between Transport and Application, and plenty of real protocol stacks blur OSI's boundaries the same way.",
            "The value of OSI isn't perfect layer-by-layer accuracy against real implementations — it's the discipline of asking \"which layer's job would have to be failing to produce this symptom,\" which is exactly as useful whether you're picturing seven layers or four.",
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Why layers matter even when a tool tells you the wrong thing",
          body: "A browser's generic \"This site can't be reached\" error looks identical whether the problem is a dead cable, a DHCP failure, a DNS outage, or the server itself being down — the application layer's error message can't distinguish between causes several layers below it. Working the layers bottom-up is what actually distinguishes them, since each layer's tools (link status, ipconfig, ping, nslookup) test something the layer above it can't see into.",
        },
        {
          kind: "bullets",
          heading: "Encapsulation: what actually happens at each layer",
          intro:
            "The layers aren't just a mental checklist — data physically gets wrapped in a new header at each layer on the way out, and unwrapped in reverse on the way in.",
          bullets: [
            "At the Application layer, your HTTP request is just the request itself — headers, method, body. The Transport layer wraps that in a TCP segment, adding source and destination ports.",
            "The Network layer wraps the TCP segment in an IP packet, adding source and destination IP addresses. The Data Link layer wraps that in a frame, adding source and destination MAC addresses for the local hop.",
            "Each layer only reads and acts on its own header — a switch forwarding a frame never looks at the IP addresses inside it, and a router forwarding a packet never looks at the TCP ports inside that. This separation is exactly what lets a switch built in one decade keep working with protocols invented in a later one.",
            "On the receiving end, the process runs in reverse — each layer strips off its own header and hands the remainder up to the layer above, until the original HTTP request arrives intact at the application.",
          ],
        },
        {
          kind: "example",
          heading: "Walking one symptom through the checklist",
          body: "\"The app is down\" turns into a specific, ordered set of checks — each one either clears a layer or points straight at the culprit.",
          code: `Symptom: "I can't load the internal dashboard."

1. Physical/Data Link: is wifi connected? (yes — connected to office SSID)
2. Network: does ipconfig show a real IP, not 169.254.x.x? (yes — 10.2.4.18)
3. Transport/Network beyond local: can I ping the gateway, then 8.8.8.8?
   (both succeed — internet-bound traffic works)
4. Application (DNS): does nslookup dashboard.internal resolve?
   (FAILS — "server can't find dashboard.internal")

Conclusion: everything below DNS resolution is confirmed working.
The problem is isolated to one specific thing — an internal DNS
record — not "the network," which is what it felt like at first.`,
        },
        {
          kind: "summary",
          heading: "The OSI model, in short",
          bullets: [
            "Use it as a bottom-to-top checklist for isolating a failure, not a literal description of how every real protocol is implemented.",
            "Confirming each lower layer works before assuming a higher-layer failure turns a vague \"the network is broken\" into a specific, testable claim.",
            "The four-layer TCP/IP model is what most real troubleshooting and protocol discussions actually reference — OSI's extra granularity is a teaching tool layered on top of it.",
          ],
        },
      ],
    },
    {
      title: "TCP/IP and How Data Actually Travels",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "TCP/IP and How Data Actually Travels",
          subheading:
            "Beneath every web request is the same underlying model: data broken into packets, addressed, and routed using TCP/IP.",
        },
        {
          kind: "text",
          heading: "IP addresses: where something is",
          body: [
            "An IP address identifies a device on a network — IPv4 addresses (like 192.168.1.1) are most common, with a gradual transition to IPv6. Private IP ranges aren't directly reachable from the public internet, which is what NAT bridges.",
          ],
        },
        {
          kind: "bullets",
          heading: "TCP vs. UDP: how reliably it travels",
          bullets: [
            "TCP — establishes a connection, guarantees delivery and ordering, retransmits lost packets. Used for web browsing, file transfer, email.",
            "UDP — no connection setup, no delivery guarantee. Faster, used for video calls, live streaming, gaming.",
          ],
        },
        {
          kind: "chart",
          heading: "Why a video call prefers UDP",
          description:
            "TCP's retransmissions add real latency when a packet is lost; UDP just drops it and moves on — better for a live call, worse for a file that must arrive intact.",
          chartType: "bar",
          unit: "ms",
          data: [
            { label: "UDP (packet dropped, call continues)", value: 40 },
            { label: "TCP (packet lost, waits for retransmit)", value: 220 },
          ],
        },
        {
          kind: "text",
          heading: "Ports: which service on that device",
          body: [
            "A port number (0-65535) identifies which service traffic is for. Well-known ports: 80 (HTTP), 443 (HTTPS), 22 (SSH), 53 (DNS).",
          ],
        },
        {
          kind: "diagram",
          heading: "The TCP three-way handshake",
          description: "This exchange happens before a single byte of the actual request is sent — it's what makes TCP a \"connection\" rather than just a stream of unrelated packets.",
          steps: [
            { label: "SYN", detail: "Client: \"I'd like to connect, here's my starting sequence number\"" },
            { label: "SYN-ACK", detail: "Server: \"Acknowledged, here's mine\"" },
            { label: "ACK", detail: "Client: \"Acknowledged — connection established\"" },
          ],
        },
        {
          kind: "bullets",
          heading: "NAT: how a whole office shares one public IP",
          intro:
            "Private IP ranges (like 192.168.x.x) aren't routable on the public internet — NAT (Network Address Translation) is the router-level trick that lets them still reach it.",
          bullets: [
            "The router rewrites each outgoing packet's private source IP to its own single public IP, and remembers the mapping (private IP + port) so it knows which internal device a reply belongs to.",
            "This is also why an unsolicited inbound connection generally can't reach a device behind NAT by default — there's no existing mapping for the router to route it through, which incidentally works as a basic filter against unsolicited traffic.",
            "Port forwarding is the deliberate exception: manually telling the router \"anything arriving on public port 8080 goes to 192.168.1.50 port 80\" for a specific internal service that needs to be reachable from outside.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "A common mistake: blaming \"the network\" for a blocked port",
          body: "A service that works fine locally but is unreachable from another network is very often a firewall rule blocking a specific port, not a routing or DNS problem — the IP resolves fine, the ping to the host might even succeed, but the specific port the service listens on never gets a response. This is exactly why the troubleshooting checklist later in this course tests connectivity at the port/service level (via telnet or curl) as its own explicit step, separate from just confirming the host is reachable at all.",
        },
        {
          kind: "text",
          heading: "Packet fragmentation: another way a connection stalls without an obvious error",
          body: [
            "Every network link has a maximum transmission unit (MTU) — the largest packet size it can carry without splitting it up, typically 1500 bytes on standard Ethernet. A packet larger than the MTU of some link along the path either gets fragmented into smaller pieces (adding overhead) or, if a router along the way is configured to not fragment, silently dropped.",
            "This shows up in practice as a connection that establishes fine (the three-way handshake succeeds, since those packets are small) but then hangs on any request carrying a larger payload — a classic, hard-to-diagnose symptom on VPN connections specifically, since a VPN's own encapsulation overhead can push an otherwise normal-sized packet just over the path's real MTU.",
          ],
        },
        {
          kind: "bullets",
          heading: "How a connection actually ends: the four-way close",
          intro:
            "The three-way handshake gets most of the attention, but TCP also has a defined, deliberate way of tearing a connection down — and skipping it has real consequences.",
          bullets: [
            "Either side can initiate a close by sending a FIN (\"finish\") segment; the other side acknowledges it, then sends its own FIN once it's also done sending, which the original side acknowledges — four segments total, since the connection is closed independently in each direction.",
            "This is why a connection can be \"half-closed\": one side has said it's done sending but can still receive, which matters for protocols where one side finishes uploading well before the other finishes responding.",
            "A connection that's abruptly killed (a crashed process, a hard network drop) instead of cleanly closed leaves the other side waiting on a socket that will never receive its FIN — this is part of why long-lived connections often need an independent keepalive or timeout mechanism, rather than relying on a clean close to always happen.",
          ],
        },
        {
          kind: "summary",
          heading: "Putting it together",
          bullets: [
            "A web request is a TCP connection to a specific IP on port 443, carrying an HTTP request.",
            "It's broken into packets routed independently and reassembled in order at the destination.",
            "The three-way handshake (SYN, SYN-ACK, ACK) establishes a TCP connection before any real data is sent — this is part of why TCP has more overhead than UDP for a single small exchange.",
            "NAT lets many private-IP devices share one public IP, which is why an internal service usually needs explicit port forwarding to be reachable from outside the network.",
          ],
        },
      ],
    },
    {
      title: "DNS: How Names Become Addresses",
      durationMinutes: 5,
      slides: [
        {
          kind: "title",
          heading: "DNS: How Names Become Addresses",
          subheading:
            "DNS turns a human-readable domain name into the IP address a computer needs. It's also one of the most common sources of \"mysterious\" connectivity problems.",
        },
        {
          kind: "bullets",
          heading: "The resolution process, simplified",
          bullets: [
            "Your device asks a DNS resolver to resolve a domain.",
            "If not cached, the resolver queries the authoritative chain: root servers → TLD servers → the domain's own nameservers.",
            "The authoritative nameserver returns the IP address, cached at various points for a duration set by the record's TTL.",
          ],
        },
        {
          kind: "bullets",
          heading: "Common DNS record types",
          bullets: [
            "A record — maps a domain to an IPv4 address.",
            "AAAA record — maps a domain to an IPv6 address.",
            "CNAME record — maps a domain to another domain name.",
            "MX record — specifies mail servers for a domain.",
            "TXT record — arbitrary text, used for domain verification and email security (SPF/DKIM/DMARC).",
          ],
        },
        {
          kind: "terminal",
          heading: "Resolving a domain from the command line",
          description: "dig returns exactly the record type you ask for — here an A record, then an MX record.",
          lines: [
            { text: "dig example.com +short" },
            { text: "93.184.216.34", output: true },
            { text: "dig example.com MX +short" },
            { text: "10 mail.example.com.", output: true },
            { text: "dig example.com NS +short" },
            { text: "a.iana-servers.net.", output: true },
            { text: "b.iana-servers.net.", output: true },
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Why DNS problems are so often misdiagnosed",
          body: "If DNS fails, the symptom looks identical to the server being down. This is why \"check DNS\" (nslookup or dig) is one of the first real troubleshooting steps.",
        },
        {
          kind: "text",
          heading: "TTL and propagation delay",
          body: [
            "When a DNS record changes, cached copies persist until their TTL expires — changes can take minutes to a day or more to be visible everywhere.",
          ],
        },
        {
          kind: "diagram",
          heading: "Where a DNS answer gets cached along the way",
          description: "A cached answer at any of these points means the resolution never reaches the authoritative nameserver at all — which is usually good for speed, and occasionally the reason a change isn't visible yet.",
          steps: [
            { label: "Browser cache", detail: "Often seconds to minutes" },
            { label: "OS resolver cache", detail: "Follows the record's TTL" },
            { label: "ISP / public resolver (e.g. 8.8.8.8)", detail: "Also follows TTL, shared across many users" },
            { label: "Authoritative nameserver", detail: "The source of truth, only queried on a real cache miss" },
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "A common mistake: forgetting to lower TTL before a planned migration",
          body: "If a domain's A record has a TTL of 24 hours, cutting over to a new server and immediately decommissioning the old one means anyone whose resolver cached the old answer in the last 24 hours gets nothing until their cache expires. The standard practice is lowering the TTL (to something like 300 seconds) a day or more before a planned migration, waiting for that shorter TTL to fully propagate, making the cutover, and only then raising the TTL back up and decommissioning the old server — skipping this step is one of the most common causes of a migration that looks broken for a subset of users for no obvious reason.",
        },
        {
          kind: "bullets",
          heading: "Recursive vs. authoritative: two different jobs, often confused",
          intro:
            "\"DNS server\" gets used loosely, but a recursive resolver and an authoritative nameserver do genuinely different jobs in the resolution process.",
          bullets: [
            "A recursive resolver (like your ISP's DNS, or a public one like 8.8.8.8 or 1.1.1.1) does the legwork on your behalf — it walks the chain from root to TLD to the domain's own nameservers so your device doesn't have to, and caches the result for other users behind the same resolver.",
            "An authoritative nameserver is the actual source of truth for one specific domain — it's the only place that genuinely knows what example.com's A record is, and every recursive resolver eventually has to ask it directly on a real cache miss.",
            "This distinction matters operationally: changing your own domain's DNS records means updating your authoritative nameservers, but you have zero control over how long a random recursive resolver out in the world chooses to hold onto a cached answer past its stated TTL — most respect it faithfully, but it's a convention, not an absolute guarantee.",
          ],
        },
        {
          kind: "example",
          heading: "Checking a record's TTL directly",
          body: "The TTL is right there in the dig output — no guessing needed before deciding whether it's safe to make a change.",
          code: `dig example.com +noall +answer

example.com.  300  IN  A  93.184.216.34

The "300" is the TTL in seconds (5 minutes) — a resolver that
already cached this answer will re-query the authoritative
nameserver again once those 5 minutes are up, not before.`,
        },
        {
          kind: "summary",
          heading: "DNS, in short",
          bullets: [
            "Resolution walks from a local cache up through the authoritative chain (root → TLD → domain nameservers) only when there's a cache miss at every level above it.",
            "Different record types serve different jobs — A/AAAA for addresses, CNAME for aliases, MX for mail routing, TXT for verification and email security.",
            "A record's TTL controls how long a stale answer can keep being served after a change — lower it in advance of a planned migration, not after.",
          ],
        },
      ],
    },
    {
      title: "Troubleshooting Connectivity Like a Checklist",
      durationMinutes: 5,
      slides: [
        {
          kind: "title",
          heading: "Troubleshooting Connectivity Like a Checklist",
          subheading:
            "Networking problems feel overwhelming mostly because people try to reason about them all at once.",
        },
        {
          kind: "bullets",
          heading: "A practical troubleshooting order",
          bullets: [
            "Is there a physical/link-level connection? Cable plugged in, wifi connected.",
            "Does the device have a valid IP address? A fallback address (like 169.254.x.x) means DHCP failed.",
            "Can it reach the local gateway? Ping the default gateway.",
            "Can it reach something outside the local network? Ping a known public IP (8.8.8.8).",
            "Does DNS resolve? Run nslookup or dig against the domain.",
            "Is the specific port/service reachable? telnet to the host on the target port, or curl -v against the URL.",
          ],
        },
        {
          kind: "terminal",
          heading: "Running the checklist against a real connection",
          description: "Each command tests the next step down the list — gateway, then internet, then DNS, then the actual service.",
          lines: [
            { text: "ping -c 1 192.168.1.1" },
            { text: "1 packets transmitted, 1 received, 0% packet loss", output: true },
            { text: "ping -c 1 8.8.8.8" },
            { text: "1 packets transmitted, 1 received, 0% packet loss", output: true },
            { text: "nslookup example.com" },
            { text: "Server:  8.8.8.8", output: true },
            { text: "Address: 93.184.216.34", output: true },
            { text: "curl -v https://example.com" },
            { text: "* Connected to example.com (93.184.216.34) port 443", output: true },
            { text: "< HTTP/1.1 200 OK", output: true },
          ],
        },
        {
          kind: "text",
          heading: "Why this order specifically",
          body: [
            "Each step assumes everything before it works — a failure at any given step tells you precisely where to focus.",
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "The habit worth building",
          body: "Running through this order mentally before diving deep saves real time — most \"network is broken\" problems resolve by identifying which of these six steps actually fails.",
        },
        {
          kind: "bullets",
          heading: "Two more tools worth knowing: traceroute and DNS-over-HTTPS quirks",
          intro:
            "The six-step checklist covers most situations, but two additional tools come up often enough in real troubleshooting to be worth naming.",
          bullets: [
            "traceroute (or tracert on Windows) shows every router hop between you and the destination, with the round-trip time at each one — useful specifically when ping to the destination fails or is slow, since it shows where along the path things start going wrong rather than just whether the endpoint is reachable at all.",
            "A hop that shows no response in traceroute isn't always a problem — some routers are configured not to reply to the diagnostic packets traceroute uses, so a silent hop with working hops on either side of it is usually fine to ignore, while a chain of failures starting at a specific hop and continuing to the destination is the real signal.",
            "Modern browsers increasingly use DNS-over-HTTPS by default, which can resolve a domain successfully through an encrypted path even when the OS-level resolver (the one nslookup or dig actually queries) is failing — a real source of confusing \"it works in the browser but dig can't resolve it\" reports that's worth knowing about before assuming your troubleshooting tool is lying to you.",
          ],
        },
        {
          kind: "bullets",
          heading: "A common mistake: skipping straight to the layer you assume is guilty",
          intro:
            "It's tempting to jump straight to \"it's probably DNS\" or \"it's probably the firewall\" based on a hunch — the checklist exists precisely because hunches are often wrong.",
          bullets: [
            "Jumping straight to an application-level fix (restarting the app, clearing a browser cache) when the real problem is a lower layer (no IP address at all) wastes time and sometimes masks the real cause temporarily.",
            "Working the checklist in order costs almost nothing when everything's fine — each step that passes takes seconds — and it means the step that fails is found directly instead of guessed at.",
            "The order matters specifically because each step assumes the ones before it: there's no point troubleshooting DNS if the device doesn't have a valid IP address yet, since DNS queries themselves depend on basic IP connectivity working first.",
          ],
        },
        {
          kind: "example",
          heading: "A second scenario: intermittent, not total, failure",
          body: "Not every problem is a clean pass/fail at one step — packet loss partway through the checklist looks different from a hard failure and points to a different kind of cause.",
          code: `ping -c 20 8.8.8.8
20 packets transmitted, 14 received, 30% packet loss
round-trip min/avg/max = 18.2/94.6/310.4 ms

30% loss and a wide swing between the fastest and slowest
reply (18ms to 310ms) suggests congestion or a flaky link
somewhere between the device and the destination — not a
clean "broken" or "working" step like a DNS failure would be.
This calls for a different next move than the binary checklist:
testing from a different network (isolate whether it's local),
and checking for a saturated wifi channel or a failing cable
rather than re-running nslookup or curl, which aren't the
right tools for an intermittent, partial failure.`,
        },
        {
          kind: "summary",
          heading: "Troubleshooting, in short",
          bullets: [
            "Work bottom to top: link, IP, gateway, wider internet, DNS, then the specific port/service — each step assumes the ones before it already work.",
            "A clean pass/fail at one step is the easy case; intermittent or partial failure (packet loss, wide latency swings) points toward congestion or a flaky link rather than a single broken layer.",
            "Resist jumping straight to a hunch about which layer is guilty — the checklist is cheap to run in order and avoids wasted effort chasing the wrong layer.",
          ],
        },
      ],
    },
    {
      title: "Subnetting and CIDR: How Networks Get Divided",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Subnetting and CIDR: How Networks Get Divided",
          subheading:
            "IP addresses were covered as \"where something is\" — subnetting is how a single address range gets split into smaller, manageable, isolated networks.",
        },
        {
          kind: "text",
          heading: "Why one flat network doesn't scale",
          body: [
            "Every device on the same network segment can see broadcast traffic from every other device on it, and typically needs to be trusted at a similar level. Putting the entire company — finance, guest wifi, IoT devices, servers — on one flat network means a compromised guest laptop can potentially see traffic meant for finance.",
            "Subnetting splits one IP range into smaller ranges (subnets), each its own broadcast domain, which can then be separated by routers and firewall rules.",
          ],
        },
        {
          kind: "example",
          heading: "Reading CIDR notation",
          body: "The /24 in 192.168.1.0/24 means the first 24 bits are the fixed network portion — the remaining 8 bits identify individual hosts.",
          code: `192.168.1.0/24
  Network bits: 24    Host bits: 32 - 24 = 8
  Total addresses: 2^8 = 256
  Usable host addresses: 254
    (one address reserved for the network itself: 192.168.1.0
     one reserved for the broadcast address: 192.168.1.255)

Common prefixes:
  /24 -> 256 addresses (254 usable)
  /28 -> 16 addresses  (14 usable)
  /30 -> 4 addresses   (2 usable — just enough for two routers)`,
        },
        {
          kind: "example",
          heading: "Splitting one network into four",
          body: "Borrowing 2 extra bits from a /24 (making it a /26) creates four smaller subnets, each with 62 usable addresses — useful for separating four departments on one office network.",
          code: `192.168.1.0/24 split into four /26 subnets:

192.168.1.0/26    (192.168.1.1   - 192.168.1.62)   - Engineering
192.168.1.64/26   (192.168.1.65  - 192.168.1.126)  - Sales
192.168.1.128/26  (192.168.1.129 - 192.168.1.190)  - Guest wifi
192.168.1.192/26  (192.168.1.193 - 192.168.1.254)  - Servers

Each /26 = 64 addresses total, 62 usable (2 reserved per subnet).`,
        },
        {
          kind: "diagram",
          heading: "One /24 split into four department subnets",
          description: "Each /26 is its own broadcast domain — a router or firewall between them enforces the isolation.",
          steps: [
            { label: "192.168.1.0/26", detail: "Engineering — 62 usable" },
            { label: "192.168.1.64/26", detail: "Sales — 62 usable" },
            { label: "192.168.1.128/26", detail: "Guest wifi — 62 usable" },
            { label: "192.168.1.192/26", detail: "Servers — 62 usable" },
          ],
        },
        {
          kind: "bullets",
          heading: "The private ranges you'll see constantly",
          bullets: [
            "10.0.0.0/8 — a huge private range (16.7 million addresses), common in large corporate networks.",
            "172.16.0.0/12 — a mid-sized private range, common in medium networks and some cloud VPC defaults.",
            "192.168.0.0/16 — the range most home routers default to, usually seen as 192.168.0.x or 192.168.1.x.",
            "None of these are directly reachable from the public internet — NAT (covered earlier) is what lets devices on them still reach the internet.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Subnetting is a security tool, not just an addressing tool",
          body: "Splitting a network into subnets lets you put a firewall or router between them — so guest wifi traffic never reaches the finance subnet at the network level, regardless of any application-level permissions. This is the practical reason subnetting comes up as often in security discussions as in pure networking ones.",
        },
        {
          kind: "bullets",
          heading: "A common mistake: sizing every subnet the same regardless of actual need",
          intro:
            "Splitting a /24 into four equal /26s is simple, but real departments rarely need exactly the same number of addresses.",
          bullets: [
            "Variable Length Subnet Masking (VLSM) allows different-sized subnets carved from the same address block — a 400-person office floor gets a /23 (510 usable), while a 2-device server closet gets a /30 (2 usable), instead of forcing both into the same fixed size.",
            "Sizing every subnet identically either wastes large amounts of address space on small subnets, or under-provisions a subnet that turns out to need more devices than expected — both are avoidable with a little upfront planning.",
            "The planning question that actually matters: list each subnet's expected device count (with reasonable headroom for growth) before picking prefix lengths, rather than dividing evenly and hoping it fits.",
          ],
        },
        {
          kind: "example",
          heading: "VLSM: right-sizing three very different needs from one /24",
          body: "The same 192.168.1.0/24 block, split unevenly this time based on what each group actually needs.",
          code: `192.168.1.0/24 split with VLSM:

192.168.1.0/25    (126 usable) - Main office floor (est. 100 devices)
192.168.1.128/28  (14 usable)  - Server rack (est. 10 devices)
192.168.1.144/28  (14 usable)  - Network equipment (est. 8 devices)
192.168.1.160/27  (30 usable)  - Guest wifi (est. 20 devices)
192.168.1.192/26  (62 usable)  - Unallocated, reserved for growth

Compare to splitting evenly into four /26s (62 usable each):
the server rack and network equipment subnets would each waste
around 50 addresses they'll never use, while still leaving no
clean room to grow the main office floor later.`,
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "The special case: /31 for point-to-point links",
          body: "A /31 breaks the \"always 2 reserved addresses\" rule on purpose — RFC 3021 permits a /31 (2 total addresses, both usable) specifically for links with exactly two devices on them, like two routers connected back to back. Since there's no broadcast domain to speak of with only one other device on the wire, dedicating an address to a broadcast address is pure waste — a real, if narrow, exception worth recognizing rather than assuming every subnet reserves two addresses without exception.",
        },
        {
          kind: "text",
          heading: "CIDR isn't only for splitting — it's also how routes get summarized",
          body: [
            "Everything so far has been about dividing one block into smaller ones, but CIDR notation works the same way in reverse: a router with routes to 10.20.0.0/24, 10.20.1.0/24, 10.20.2.0/24, and 10.20.3.0/24 can advertise all four as a single route, 10.20.0.0/22, to anything upstream of it. This is route summarization (or aggregation), and it's the reason the global internet's routing tables aren't millions of individual /24 entries — ISPs summarize huge blocks of customer address space into as few routes as possible before advertising them onward.",
            "The same idea shows up at office-network scale: a core router summarizing four /26 department subnets as one /24 route toward the internet gateway keeps that gateway's routing table simpler, at the cost of that gateway no longer being able to see which specific department a packet is ultimately headed to — it just knows \"somewhere in this /24.\"",
          ],
        },
        {
          kind: "summary",
          heading: "Subnetting, briefly",
          bullets: [
            "CIDR notation (/24, /26, /30...) states how many bits are fixed as the network portion — fewer host bits means fewer usable addresses per subnet.",
            "Splitting a network into subnets isolates broadcast domains and lets different groups of devices be separated by a router or firewall.",
            "Two addresses per subnet are always reserved — the network address and the broadcast address — except for the special-cased /31 used on two-device point-to-point links.",
            "The same notation runs in reverse for route summarization, which is what keeps internet-scale routing tables from needing one entry per individual customer subnet.",
          ],
        },
      ],
    },
    {
      title: "Practice: Subnetting and Reading Connectivity Symptoms",
      durationMinutes: 12,
      slides: [
        {
          kind: "title",
          heading: "Practice: Subnetting and Reading Connectivity Symptoms",
          subheading:
            "Five exercises: calculate host counts, design two subnetting schemes, and diagnose two real connectivity symptoms.",
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "How to use this practice",
          body: "The design exercises expect you to actually work the CIDR math, not just eyeball a reasonable-looking answer — get in the habit of writing out host bits, total addresses, and usable addresses explicitly. The diagnostic exercises are graded the same way a real troubleshooting conversation is: the specific symptom is the clue, and the goal is naming exactly what it rules in and out, not just guessing the right-sounding cause.",
        },
        {
          kind: "practice",
          heading: "Calculate usable hosts",
          prompt:
            "A network is assigned 10.0.5.0/27. How many total addresses does this range contain, and how many are usable for actual devices?",
          hint: "Host bits = 32 minus the prefix length. Total addresses = 2^(host bits). Usable = total minus 2 reserved addresses.",
          solution:
            "Host bits = 32 - 27 = 5. Total addresses = 2^5 = 32. Usable addresses = 32 - 2 = 30 (subtracting the network address 10.0.5.0 and the broadcast address 10.0.5.31). So a /27 supports up to 30 devices — enough for a single small office floor, but not much more. If that floor were expected to grow past 30 devices within the next year or two, the right move is picking a larger block up front (a /26, 62 usable) rather than re-subnetting later, which usually means re-addressing every device on it.",
        },
        {
          kind: "practice",
          heading: "Design a subnetting scheme",
          prompt:
            "You have 192.168.10.0/24 to work with and need to support 4 departments, each with up to 50 devices. Propose a subnetting scheme, and justify the prefix length you chose.",
          hint: "Find the smallest prefix length that gives at least 50 usable addresses per subnet, then check that /24 can be split into at least 4 of that size.",
          solution:
            "A /26 gives 64 total addresses (62 usable) per subnet — enough for 50 devices with headroom, and a /24 splits cleanly into exactly four /26 subnets. A /25 (126 usable) would also fit 50 devices but wastes far more address space per department for no real benefit, and only allows 2 subnets from a /24, which isn't enough for 4 departments anyway. A /27 (30 usable) is too small outright — it doesn't even clear the 50-device requirement. Scheme: 192.168.10.0/26 (Dept 1), 192.168.10.64/26 (Dept 2), 192.168.10.128/26 (Dept 3), 192.168.10.192/26 (Dept 4).",
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Reading a subnet mask as fast as CIDR notation",
          body: "A prefix length and a dotted-decimal subnet mask are the exact same information written two different ways — /24 is 255.255.255.0, /26 is 255.255.255.192, /27 is 255.255.255.224. Older tooling and some router configs still show the dotted-decimal form instead of the slash notation, so it's worth being able to convert one to the other without reaching for a calculator: each network bit beyond the last full 255 byte adds a power of two to that byte, counting from 128 down (a /25 sets just the top bit of the last byte — 128 — a /26 sets the top two — 192 — and so on).",
        },
        {
          kind: "practice",
          heading: "Design with VLSM for uneven needs",
          prompt:
            "A new office site is assigned 10.20.0.0/22. It needs to support: an open floor with up to 400 devices, a server room with up to 40 devices, a network equipment closet with up to 10 devices, and some address space reserved for future growth. Design a VLSM scheme, sized appropriately for each — not split evenly.",
          hint: "Start with the largest requirement first (it needs the fewest host bits reserved for others to still fit), then carve the smaller subnets out of what's left over.",
          solution:
            "A /22 is 1,024 total addresses (10.20.0.0 - 10.20.3.255). The 400-device floor needs a /23 (510 usable) — a /24 (254 usable) wouldn't clear 400 with any headroom. Carving that off first: 10.20.0.0/23 (10.20.0.0 - 10.20.1.255) for the floor. That leaves 10.20.2.0/23 (512 addresses) to split further: 10.20.2.0/26 (62 usable) for the server room, and 10.20.2.64/28 (14 usable) for the equipment closet, both comfortably covering their device counts. Everything from 10.20.2.80 through 10.20.3.255 is left unallocated for future growth — roughly 460 addresses, enough to add another sizeable subnet later without touching anything already assigned. Splitting the /22 evenly into four /24s instead would have wasted most of the floor's growth room and still left the server room and equipment closet massively over-provisioned.",
        },
        {
          kind: "practice",
          heading: "Diagnose from the symptom: APIPA",
          prompt:
            "A user reports their laptop can't reach any website. Running ipconfig shows the laptop's IP address is 169.254.34.12. Using the troubleshooting order from this course, what's actually wrong, and what's the next step?",
          hint: "169.254.x.x is not a normal address a router hands out — it's what an OS assigns itself when a specific earlier step fails.",
          solution:
            "A 169.254.x.x address is an APIPA (link-local) address — the OS assigns itself one automatically when it can't reach a DHCP server to get a real address. This means the failure is happening very early in the troubleshooting order, before the device even has a valid IP address, which rules out DNS, gateway, or port-level problems entirely for now. The next step is checking the physical/link-level connection (cable seated, wifi actually associated with the access point) and whether the DHCP server itself is reachable and functioning — not running nslookup or trying to ping an external site, both of which would fail for an unrelated reason at this stage and would waste time investigating the wrong layer.",
        },
        {
          kind: "practice",
          heading: "Diagnose from the symptom: unreachable from outside",
          prompt:
            "A team deploys an internal API on 192.168.50.20, port 8080. Every device on the office network reaches it fine. A partner company trying to reach it from the public internet, using your office's public IP and port 8080, gets a connection timeout every single time. Nothing about the server itself has changed recently. What's actually going on, and what's the fix?",
          hint: "192.168.50.20 is a private address. Recall what NAT does — and doesn't do — for unsolicited traffic arriving from outside the network.",
          solution:
            "This isn't a server problem — 192.168.50.20 is a private IP address, unreachable directly from the public internet by design. NAT only creates a mapping for traffic the private-side device initiated; there's no existing mapping for an unsolicited inbound connection from the partner company to route through, so the router has nothing telling it what to do with that traffic and it simply times out. The fix is explicit port forwarding on the router/firewall: a rule mapping the public IP's port 8080 to 192.168.50.20:8080, so an inbound connection on that public port is deliberately routed to the internal server instead of being dropped by default. Worth flagging to the team at the same time: opening a port forward exposes that internal service directly to the internet, so it should also be reviewed for authentication and TLS before being made reachable this way, not just for reachability. It's also worth checking the OSI layer this actually sits at before troubleshooting further — this is strictly a Network-layer routing/translation gap, not a DNS, application, or firewall-rule problem, even though a misconfigured firewall rule could produce an identical symptom and would need to be ruled out separately.",
        },
        {
          kind: "practice",
          heading: "Diagnose from the symptom: propagation, not an outage",
          prompt:
            "A company migrates its API to a new server and updates the A record to point at the new IP, planning to decommission the old server an hour later since \"DNS changes are basically instant.\" For the rest of that day, roughly a third of API clients intermittently get connection errors, even though the new server is healthy, correctly configured, and receiving traffic fine from most clients. What actually went wrong, and what should the team have done differently before the cutover?",
          hint: "This isn't a server-side problem at all — revisit what this course said about TTLs, caching, and what \"lower the TTL before a migration\" is actually protecting against.",
          solution:
            "The team skipped lowering the A record's TTL ahead of the migration. If the record's TTL was, say, 24 hours, then every resolver that had already cached the old IP before the change keeps serving that stale answer to its clients until its own copy expires — regardless of when the actual DNS record was updated. Decommissioning the old server an hour later means every client stuck with a cached old answer starts getting connection errors the moment that old server actually goes away, and those errors persist unevenly across the day as different resolvers' caches expire at different times, which is exactly the intermittent, partial pattern described. The fix isn't something to do after the fact — it's lowering the TTL to something short (like 300 seconds) a day or more before the planned cutover, waiting for that shorter TTL to fully propagate, then making the change and only decommissioning the old server once enough time has passed for confidence that stale caches have expired.",
        },
        {
          kind: "summary",
          heading: "What this practice demonstrates",
          bullets: [
            "Converting a CIDR prefix into total and usable host counts, and recognizing when a prefix is genuinely too small for a stated requirement.",
            "Choosing a subnet size — including with VLSM — that fits real, uneven capacity requirements without wasting address space or under-provisioning room to grow.",
            "Recognizing a 169.254.x.x address as a DHCP failure symptom and knowing where that places you in the troubleshooting order.",
            "Distinguishing a NAT/port-forwarding gap (reachable internally, unreachable from outside) from a genuine server-side failure, and knowing the specific fix.",
            "Tracing an intermittent, partial-outage symptom back to DNS caching and TTLs rather than assuming the new server itself is broken.",
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
          heading: "Isolating the layer",
          question:
            "A user's request fails. Ping to the gateway succeeds, but nslookup on the destination domain returns nothing. Which OSI layer does this point to as the likely problem?",
          options: [
            "Physical — the cable or wifi connection",
            "Data Link — MAC address resolution",
            "Application — the DNS resolution process specifically",
            "Transport — TCP port availability",
          ],
          correctIndex: 2,
          explanation:
            "Since the physical connection and reaching the gateway both work (ruling out the lower layers), and nslookup — a direct test of DNS — comes back empty, the problem is isolated to DNS resolution, an application-layer protocol. This is exactly the layer-by-layer isolation the OSI model is useful for in practice.",
        },
        {
          kind: "quiz",
          heading: "TCP vs. UDP",
          question:
            "A video call app is designed to use UDP rather than TCP for the live audio/video stream. Why?",
          options: [
            "UDP is more secure than TCP",
            "UDP doesn't use IP addresses, so it's simpler to route",
            "UDP has no delivery/ordering guarantees, but is faster — worth it for a live stream where retransmitting old audio would just cause more lag",
            "UDP is required for any traffic on port 443",
          ],
          correctIndex: 2,
          explanation:
            "TCP guarantees delivery and order by retransmitting lost packets, which adds latency — fine for a file download but actively bad for a live call, where a lost half-second of audio is better skipped than delayed for a retransmit. UDP's lack of guarantees is a deliberate tradeoff for speed, not a security or addressing property.",
        },
        {
          kind: "quiz",
          heading: "DNS propagation",
          question:
            "A company changes its website's A record to point to a new server, but some users still reach the old server for the next day. What's the most likely explanation?",
          options: [
            "DNS propagation/caching — the old IP is still cached somewhere until its TTL expires",
            "The new server is misconfigured",
            "A records can't be changed once set",
            "The company needs to also update its MX record",
          ],
          correctIndex: 0,
          explanation:
            "DNS answers are cached at resolvers and sometimes on end-user devices for the duration set by the record's TTL. Until each cached copy expires, that resolver keeps serving the old (now stale) answer — this is normal, expected behavior, not a sign of misconfiguration, and is why DNS changes are given time to propagate rather than expected to be instant everywhere.",
        },
        {
          kind: "quiz",
          heading: "Reserved addresses",
          question:
            "Why does a /24 subnet provide only 254 usable host addresses instead of the full 256 the range contains?",
          options: [
            "256 is rounded down for technical simplicity",
            "Two addresses are reserved: the network address and the broadcast address",
            "IPv4 always reserves 2 addresses per network for routers",
            "A firewall rule blocks the first and last address by default",
          ],
          correctIndex: 1,
          explanation:
            "Every subnet reserves its lowest address as the network address (identifying the subnet itself) and its highest address as the broadcast address (used to reach every host on that subnet at once) — neither can be assigned to an individual device. That reservation, not rounding or firewall behavior, is why 256 total addresses yield 254 usable ones.",
        },
        {
          kind: "quiz",
          heading: "Where the problem lives",
          question:
            "Following the troubleshooting checklist in this course, if a device has a valid IP address and can ping its default gateway but can't ping 8.8.8.8, where does the problem most likely lie?",
          options: [
            "Between the local network and the wider internet — beyond the gateway (routing, ISP, or a broader outage)",
            "The device's own network card",
            "DNS resolution",
            "The specific application being used",
          ],
          correctIndex: 0,
          explanation:
            "Since the device already has a valid IP and can reach its own gateway, the local network segment is working fine. Failing to reach an external IP (8.8.8.8, tested by address so DNS isn't even a factor yet) points to something beyond the gateway — routing upstream, the ISP connection, or a wider outage — not the local device or DNS.",
        },
        {
          kind: "summary",
          heading: "The course's core takeaways",
          bullets: [
            "The OSI model is most useful as a bottom-to-top checklist for isolating where a connectivity problem actually lives.",
            "TCP trades speed for guaranteed, ordered delivery; UDP trades guarantees for speed — the right choice depends on whether a late retransmit is better or worse than a gap.",
            "DNS failures look identical to a server being down, and cached answers persist until their TTL expires — which is why checking DNS is an early troubleshooting step, not a last resort.",
            "Subnetting divides one address range into smaller, isolated broadcast domains, and doubles as a network-level security boundary.",
            "A structured, bottom-to-top troubleshooting order turns \"the network is broken\" into a specific, findable failure point.",
          ],
        },
      ],
    },
  ],
};
