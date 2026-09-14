"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, MapPin, Briefcase, UserPlus, Check, Clock, Link2, Code2, Globe, Award, Languages, Pencil, Camera, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImagePickerButton } from "@/components/network/image-picker-button";
import { initials } from "@/lib/utils";

interface PublicProfile {
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  coverUrl: string | null;
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
  certifications: { name: string; issuer: string | null; issueDate: string | null; credentialUrl: string | null }[];
  languages: { language: string; proficiency: string }[];
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
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

  async function saveImage(endpoint: string, field: "avatarUrl" | "coverUrl", dataUrl: string) {
    setProfile((prev) => (prev ? { ...prev, [field]: dataUrl } : prev));
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataUrl }),
    });
  }

  async function removeImage(endpoint: string, field: "avatarUrl" | "coverUrl") {
    setProfile((prev) => (prev ? { ...prev, [field]: null } : prev));
    await fetch(endpoint, { method: "DELETE" });
  }

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

      <Card className="overflow-hidden">
        <div className="relative h-28 bg-brand-gradient sm:h-32">
          {profile.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- stored upload, not an optimizable remote asset
            <img src={profile.coverUrl} alt="" className="h-full w-full object-cover" />
          )}
          {profile.isOwner && (
            <div className="absolute right-3 top-3 flex items-center gap-1.5">
              <ImagePickerButton
                maxDimension={1600}
                onPicked={(dataUrl) => saveImage("/api/profile/cover", "coverUrl", dataUrl)}
                className="flex items-center gap-1.5 rounded-md bg-background/80 px-2.5 py-1.5 text-xs font-medium text-foreground backdrop-blur transition-colors hover:bg-background"
              >
                <Camera className="h-3.5 w-3.5" /> {profile.coverUrl ? "Change cover" : "Add cover photo"}
              </ImagePickerButton>
              {profile.coverUrl && (
                <button
                  type="button"
                  onClick={() => removeImage("/api/profile/cover", "coverUrl")}
                  className="flex items-center rounded-md bg-background/80 p-1.5 text-foreground backdrop-blur transition-colors hover:bg-background"
                  aria-label="Remove cover photo"
                  title="Remove cover photo"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="-mt-12 h-16 w-16 border-4 border-surface">
                  {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} />}
                  <AvatarFallback className="text-lg">{initials(profile.firstName, profile.lastName)}</AvatarFallback>
                </Avatar>
                {profile.isOwner && (
                  <>
                    <ImagePickerButton
                      maxDimension={400}
                      onPicked={(dataUrl) => saveImage("/api/profile/avatar", "avatarUrl", dataUrl)}
                      className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface bg-primary text-primary-foreground"
                    >
                      <Camera className="h-3 w-3" />
                    </ImagePickerButton>
                    {profile.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => removeImage("/api/profile/avatar", "avatarUrl")}
                        className="absolute -right-1 -top-4 flex h-5 w-5 items-center justify-center rounded-full border-2 border-surface bg-destructive text-destructive-foreground"
                        aria-label="Remove profile photo"
                        title="Remove profile photo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </>
                )}
              </div>
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
            {profile.isOwner ? (
              <Link href="/profile">
                <Button size="sm" variant="outline">
                  <Pencil className="h-4 w-4" /> Edit profile
                </Button>
              </Link>
            ) : (
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

          {(profile.currentCompany || profile.careerLevel || profile.totalExperienceYears != null) && (
            <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {profile.currentCompany && <span>at {profile.currentCompany}</span>}
              {profile.careerLevel && <span>{profile.careerLevel.charAt(0) + profile.careerLevel.slice(1).toLowerCase()} level</span>}
              {profile.totalExperienceYears != null && <span>{profile.totalExperienceYears} yrs experience</span>}
            </p>
          )}

          {(profile.linkedinUrl || profile.githubUrl || profile.portfolioUrl) && (
            <div className="mt-3 flex gap-3">
              {profile.linkedinUrl && (
                <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <Link2 className="h-3.5 w-3.5" /> LinkedIn
                </a>
              )}
              {profile.githubUrl && (
                <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <Code2 className="h-3.5 w-3.5" /> GitHub
                </a>
              )}
              {profile.portfolioUrl && (
                <a href={profile.portfolioUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <Globe className="h-3.5 w-3.5" /> Portfolio
                </a>
              )}
            </div>
          )}

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

      {profile.certifications.length > 0 && (
        <div className="mt-4">
          <h2 className="mb-2 text-sm font-semibold text-foreground">Certifications</h2>
          <div className="space-y-2">
            {profile.certifications.map((c, i) => (
              <Card key={i}>
                <CardContent className="flex items-start gap-3 p-4">
                  <Award className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {c.credentialUrl ? (
                        <a href={c.credentialUrl} target="_blank" rel="noreferrer" className="hover:underline">
                          {c.name}
                        </a>
                      ) : (
                        c.name
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {[c.issuer, c.issueDate ? new Date(c.issueDate).getFullYear() : null].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {profile.languages.length > 0 && (
        <div className="mt-4">
          <h2 className="mb-2 text-sm font-semibold text-foreground">Languages</h2>
          <Card>
            <CardContent className="flex flex-wrap gap-2 p-4">
              {profile.languages.map((l, i) => (
                <Badge key={i} variant="outline" className="gap-1">
                  <Languages className="h-3 w-3" /> {l.language} · {l.proficiency.charAt(0) + l.proficiency.slice(1).toLowerCase().replace(/_/g, " ")}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
