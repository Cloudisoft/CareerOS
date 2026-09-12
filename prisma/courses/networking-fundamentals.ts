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
          kind: "text",
          heading: "Ports: which service on that device",
          body: [
            "A port number (0-65535) identifies which service traffic is for. Well-known ports: 80 (HTTP), 443 (HTTPS), 22 (SSH), 53 (DNS).",
          ],
        },
        {
          kind: "summary",
          heading: "Putting it together",
          bullets: [
            "A web request is a TCP connection to a specific IP on port 443, carrying an HTTP request.",
            "It's broken into packets routed independently and reassembled in order at the destination.",
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
      ],
    },
  ],
};
