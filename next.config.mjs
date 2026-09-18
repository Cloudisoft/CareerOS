/** @type {import('next').NextConfig} */

// Deliberately not a strict per-page CSP with nonces — Next.js's own inline
// bootstrap scripts and Tailwind's injected styles would need extra plumbing
// for that. This is a real, meaningful baseline (no framing, no sniffing, no
// third-party script origins) rather than a nonce-perfect policy.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.paypal.com https://www.paypalobjects.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.anthropic.com https://www.paypal.com",
  "frame-src https://www.paypal.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // microphone=(self) allows this same origin to request mic access (Interview
  // AI and Job GPT voice input rely on it) — camera and geolocation stay fully
  // disabled since nothing in the product uses either.
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
  { key: "Content-Security-Policy", value: CSP },
];

const nextConfig = {
  // pdf-parse (via pdfjs-dist) loads its worker script from a path relative
  // to its own package directory at runtime. Webpack-bundling it into the
  // API route moves that code out of node_modules, so the worker path no
  // longer resolves ("Cannot find module '.../pdf.worker.mjs'"). Excluding
  // it from bundling makes Next require() it straight from node_modules
  // instead, where its relative paths are correct. (Next 14.2 still calls
  // this experimental — it isn't stable until Next 15.)
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse", "pdfjs-dist"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
