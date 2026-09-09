import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getResume } from "@/lib/resume/service";
import { requireCandidate } from "@/lib/auth/guards";
import { resumeContentSchema } from "@/lib/validations/resume";
import { ResumeEditor } from "@/components/resume/resume-editor";

export default async function ResumeEditorPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { profile } = await requireCandidate();
  const resume = await getResume(profile.id, params.id).catch(() => null);
  if (!resume) redirect("/resume-studio");

  const content = resumeContentSchema.parse(resume.content);

  return (
    <ResumeEditor
      resumeId={resume.id}
      initialName={resume.name}
      initialIsPrimary={resume.isPrimary}
      initialContent={content}
    />
  );
}
