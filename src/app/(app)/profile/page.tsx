import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getOrCreateCandidateProfile } from "@/lib/profile/service";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { VisibilityCard } from "@/components/profile/visibility-card";
import type { OnboardingData } from "@/components/onboarding/wizard";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "CANDIDATE") redirect("/dashboard");

  const profile = await getOrCreateCandidateProfile(user.id);

  const initialData: OnboardingData = {
    location: profile.location ?? "",
    phone: user.phone ?? "",
    headline: profile.headline ?? "",
    bio: profile.bio ?? "",
    currentTitle: profile.currentTitle ?? "",
    currentCompany: profile.currentCompany ?? "",
    totalExperienceYears: profile.totalExperienceYears ?? null,
    careerLevel: profile.careerLevel,
    industry: profile.industry ?? "",
    skills: profile.skills.map((s) => ({ name: s.skill.name, type: s.type, level: s.level })),
    languages: profile.languages.map((l) => ({ language: l.language, proficiency: l.proficiency })),
    desiredTitles: profile.desiredTitles,
    desiredIndustries: profile.desiredIndustries,
    desiredLocations: profile.desiredLocations,
    workplaceTypes: profile.workplaceTypes,
    employmentTypes: profile.employmentTypes,
    desiredSalaryMin: profile.desiredSalaryMin,
    desiredSalaryMax: profile.desiredSalaryMax,
    noticePeriodDays: profile.noticePeriodDays,
    workAuthorization: profile.workAuthorization ?? "",
    sponsorshipStatus: profile.sponsorshipStatus,
    willingToRelocate: profile.willingToRelocate,
    targetTitles: profile.targetTitles,
    targetCompanies: profile.targetCompanies,
    careerGoals: profile.careerGoals ?? "",
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Career Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This is the source of truth Career OS uses for matching, resumes, and applications.
        </p>
      </div>
      <div className="mb-6">
        <VisibilityCard initialVisibility={profile.visibility} />
      </div>
      <ProfileEditor
        initialData={initialData}
        initialExperiences={profile.experiences.map((e) => ({
          id: e.id,
          title: e.title,
          company: e.company,
          location: e.location,
          startDate: e.startDate.toISOString(),
          endDate: e.endDate?.toISOString() ?? null,
          isCurrent: e.isCurrent,
          description: e.description,
        }))}
        initialEducation={profile.education.map((e) => ({
          id: e.id,
          school: e.school,
          degree: e.degree,
          fieldOfStudy: e.fieldOfStudy,
          startDate: e.startDate?.toISOString() ?? null,
          endDate: e.endDate?.toISOString() ?? null,
          isCurrent: e.isCurrent,
          description: e.description,
        }))}
      />
    </div>
  );
}
