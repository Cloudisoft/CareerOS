"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, MapPin, Briefcase, UserPlus, Check, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";

interface PublicProfile {
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  currentTitle: string | null;
  currentCompany: string | null;
  careerLevel: string | null;
  totalExperienceYears: number | null;
  experiences: { title: string; company: string; location: string | null; startDate: string; endDate: string | null; isCurrent: boolean; description: string | null }[];
  education: { school: string; degree: string | null; fieldOfStudy: string | null; endDate: string | null }[];
  skills: string[];
  isOwner: boolean;
  connectionStatus: "PENDING" | "ACCEPTED" | "DECLINED" | null;
}

export default function PublicProfilePage() {
  const params = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetch(`/api/network/profile/${params.userId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data?.profile) setProfile(json.data.profile);
        else setError(json.error?.message ?? "This profile could not be found.");
      })
      .finally(() => setLoading(false));
  }, [params.userId]);

  async function connect() {
    setSent(true);
    await fetch("/api/network/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId: params.userId }),
    });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          {error ?? "This profile could not be found."}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/network" className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to network
      </Link>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} />}
                <AvatarFallback className="text-lg">{initials(profile.firstName, profile.lastName)}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  {profile.firstName} {profile.lastName}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {profile.headline || profile.currentTitle || "Career OS member"}
                </p>
                {profile.location && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {profile.location}
                  </p>
                )}
              </div>
            </div>
            {!profile.isOwner && (
              <div>
                {profile.connectionStatus === "ACCEPTED" ? (
                  <Badge variant="outline" className="gap-1">
                    <Check className="h-3.5 w-3.5" /> Connected
                  </Badge>
                ) : profile.connectionStatus === "PENDING" || sent ? (
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3.5 w-3.5" /> Pending
                  </Badge>
                ) : (
                  <Button size="sm" onClick={connect}>
                    <UserPlus className="h-4 w-4" /> Connect
                  </Button>
                )}
              </div>
            )}
          </div>

          {profile.bio && <p className="mt-4 whitespace-pre-line text-sm text-foreground">{profile.bio}</p>}

          {profile.skills.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {profile.skills.map((s) => (
                <Badge key={s} variant="outline">
                  {s}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {profile.experiences.length > 0 && (
        <div className="mt-4">
          <h2 className="mb-2 text-sm font-semibold text-foreground">Experience</h2>
          <div className="space-y-2">
            {profile.experiences.map((e, i) => (
              <Card key={i}>
                <CardContent className="flex items-start gap-3 p-4">
                  <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{e.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.company}
                      {e.location ? ` · ${e.location}` : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(e.startDate).toLocaleDateString(undefined, { year: "numeric", month: "short" })} –{" "}
                      {e.isCurrent ? "Present" : e.endDate ? new Date(e.endDate).toLocaleDateString(undefined, { year: "numeric", month: "short" }) : ""}
                    </p>
                    {e.description && <p className="mt-1 whitespace-pre-line text-xs text-foreground">{e.description}</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {profile.education.length > 0 && (
        <div className="mt-4">
          <h2 className="mb-2 text-sm font-semibold text-foreground">Education</h2>
          <div className="space-y-2">
            {profile.education.map((e, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-foreground">{e.school}</p>
                  <p className="text-xs text-muted-foreground">
                    {[e.degree, e.fieldOfStudy].filter(Boolean).join(", ")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
