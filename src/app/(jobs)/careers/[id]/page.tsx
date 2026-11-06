import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicListing } from "@/lib/careers/service";
import { AutoApplyButton } from "@/components/jobs/auto-apply-button";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const listing = await getPublicListing(params.id);
  return { title: listing ? `${listing.title} · Career OS Careers` : "Career OS Careers" };
}

export default async function CareersListingPage({ params }: { params: { id: string } }) {
  const listing = await getPublicListing(params.id);
  if (!listing) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-0 sm:py-4">
      <Link href="/careers" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All roles
      </Link>
      <Card>
        <CardContent className="p-6">
          <h1 className="text-2xl font-semibold text-foreground">{listing.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Posted {listing.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
          <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{listing.description}</div>
          {/* Opens the employer's form in a new tab; with the CareerOS extension it's filled there too. */}
          <AutoApplyButton
            className="mt-6"
            job={{ id: `careers-${listing.id}`, url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://careeros.silverspringstaffing.com"}/careers/apply/${listing.id}`, title: listing.title, company: "" }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
