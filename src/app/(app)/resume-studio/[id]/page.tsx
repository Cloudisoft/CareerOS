import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getResume } from "@/lib/resume/service";
import { requireCandidate } from "@/lib/auth/guards";
import { resumeContentSchema } from "@/lib/validations/resume";
import { closeExpiredJobs } from "@/lib/jobs/lifecycle";
import { prisma } from "@/lib/prisma";
import { ResumeEditor } from "@/components/resume/resume-editor";

export default async function ResumeEditorPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { profile } = await requireCandidate();
  await closeExpiredJobs();
  const resume = await getResume(profile.id, params.id).catch(() => null);
  if (!resume) redirect("/resume-studio");

  const content = resumeContentSchema.parse(resume.content);

  let initialTargetJob = null;
  if (resume.targetJobId) {
    const job = await prisma.job.findUnique({ where: { id: resume.targetJobId }, include: { company: true } });
    initialTargetJob = job ? { id: job.id, title: job.title, company: job.company.name, status: job.status } : null;
  }

  return (
    <ResumeEditor
      resumeId={resume.id}
      initialName={resume.name}
      initialIsPrimary={resume.isPrimary}
      initialContent={content}
      initialTargetJob={initialTargetJob}
    />
  );
}
