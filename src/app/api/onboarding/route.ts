import { requireCandidate } from "@/lib/auth/guards";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function GET() {
  try {
    const { user, profile } = await requireCandidate();
    return apiOk({
      user: { firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone },
      profile: {
        onboardingStep: profile.onboardingStep,
        onboardingCompletedAt: profile.onboardingCompletedAt,
        location: profile.location,
        headline: profile.headline,
        bio: profile.bio,
        currentTitle: profile.currentTitle,
        currentCompany: profile.currentCompany,
        totalExperienceYears: profile.totalExperienceYears,
        careerLevel: profile.careerLevel,
        industry: profile.industry,
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
        workAuthorization: profile.workAuthorization,
        sponsorshipStatus: profile.sponsorshipStatus,
        willingToRelocate: profile.willingToRelocate,
        targetTitles: profile.targetTitles,
        targetCompanies: profile.targetCompanies,
        careerGoals: profile.careerGoals,
      },
    });
  } catch (error) {
    return apiCatch(error);
  }
}
