import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider, themeInitScript } from "@/components/theme-provider";
import { BRAND, SITE_URL } from "@/config/brand";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND.fullName} — AI Job Search & Recruiter Suite`,
    template: `%s | ${BRAND.name} by ${BRAND.parent.name}`,
  },
  description:
    "CareerOS by Silver Springs Staffing: discover jobs, build better resumes, prepare for interviews, learn new skills, and connect with the people who can move your career forward — all in one career operating system.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? SITE_URL),
  applicationName: BRAND.name,
  authors: [{ name: BRAND.parent.name, url: BRAND.parent.url }],
  creator: BRAND.parent.name,
  publisher: BRAND.parent.name,
  openGraph: { siteName: BRAND.fullName, type: "website", locale: "en_US" },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  // Ownership proof for Google Search Console / Bing Webmaster Tools, set in the environment.
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION } : undefined,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
