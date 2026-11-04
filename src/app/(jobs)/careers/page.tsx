import Link from "next/link";
import { Search, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { listPublicListings, isCareersPublisher } from "@/lib/careers/service";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Career OS Careers", description: "Open roles curated by Career OS." };

export default async function CareersPage({ searchParams }: { searchParams: { q?: string; unavailable?: string } }) {
  const q = searchParams.q?.trim().slice(0, 100) || undefined;
  const [listings, user] = await Promise.all([listPublicListings(q), getSessionUser()]);
  const publisher = user ? await isCareersPublisher(user.id) : false;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-0 sm:py-4">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Career OS Careers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {listings.length} open role{listings.length === 1 ? "" : "s"}
          </p>
        </div>
        {publisher && (
          <Button asChild variant="secondary" size="sm">
            <Link href="/careers/manage">Manage listings</Link>
          </Button>
        )}
      </div>
      {searchParams.unavailable && (
        <p className="mb-4 rounded-lg border border-border bg-surface-raised px-4 py-3 text-sm text-muted-foreground">That role is no longer open.</p>
      )}
      <form className="mb-6 flex gap-2" action="/careers">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={q} className="pl-9" placeholder="Search roles" />
        </div>
        <Button type="submit">Search</Button>
      </form>
      {listings.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">{q ? "No roles match your search." : "No open roles right now. Check back soon."}</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {listings.map((l) => (
            <Card key={l.id} className="transition-colors hover:border-primary/40">
              <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
                <Link href={`/careers/${l.id}`} className="min-w-0">
                  <p className="font-semibold text-foreground">{l.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{l.description}</p>
                </Link>
                <Button asChild size="sm" className="shrink-0">
                  <a href={`/careers/apply/${l.id}`} target="_blank" rel="noopener noreferrer">
                    Apply now <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
