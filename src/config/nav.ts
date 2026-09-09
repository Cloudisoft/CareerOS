import {
  LayoutDashboard,
  Briefcase,
  Bot,
  Send,
  FileText,
  MessageSquare,
  GraduationCap,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Flips to true as each phase ships the real page behind this link. */
  available: boolean;
}

export const CANDIDATE_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, available: true },
  { href: "/jobs", label: "Jobs", icon: Briefcase, available: false },
  { href: "/job-gpt", label: "Job GPT", icon: Bot, available: false },
  { href: "/auto-apply", label: "Auto Apply", icon: Send, available: false },
  { href: "/resume-studio", label: "Resume", icon: FileText, available: false },
  { href: "/interview-ai", label: "Interview", icon: MessageSquare, available: false },
  { href: "/learning", label: "Learning", icon: GraduationCap, available: false },
  { href: "/network", label: "Network", icon: Users, available: false },
];
