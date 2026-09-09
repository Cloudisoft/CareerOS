import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getOrCreateCandidateProfile } from "@/lib/profile/service";
import { OnboardingWizard, type OnboardingData } from "@/components/onboarding/wizard";

export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const profile = await getOrCreateCandidateProfile(user.id);
  if (profile.onboardingCompletedAt) {
    redirect("/dashboard");
  }

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

  return <OnboardingWizard initialStep={profile.onboardingStep} initialData={initialData} />;
}
