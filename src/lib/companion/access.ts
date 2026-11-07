/** Pure candidate-only download policy shared by page and download endpoint. */
export type CompanionAccess = "login" | "candidate-only" | "subscribe" | "allowed";

export function companionAccess(role: string | null | undefined, interviewAi: boolean): CompanionAccess {
  if (!role) return "login";
  if (role !== "CANDIDATE") return "candidate-only";
  return interviewAi ? "allowed" : "subscribe";
}
