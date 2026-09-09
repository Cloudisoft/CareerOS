import {
  LayoutDashboard,
  Briefcase,
  Bot,
  Send,
  FileText,
  MessageSquare,
  MessageCircle,
  GraduationCap,
  Users,
  ClipboardList,
  Building2,
  Search,
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
  { href: "/jobs", label: "Jobs", icon: Briefcase, available: true },
  { href: "/applications", label: "Applications", icon: ClipboardList, available: true },
  { href: "/job-gpt", label: "Job GPT", icon: Bot, available: true },
  { href: "/auto-apply", label: "Auto Apply", icon: Send, available: false },
  { href: "/resume-studio", label: "Resume", icon: FileText, available: true },
  { href: "/interview-ai", label: "Interview", icon: MessageSquare, available: true },
  { href: "/learning", label: "Learning", icon: GraduationCap, available: true },
  { href: "/network", label: "Network", icon: Users, available: true },
  { href: "/messages", label: "Messages", icon: MessageCircle, available: true },
];

export const EMPLOYER_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, available: true },
  { href: "/employer/jobs", label: "Jobs", icon: Briefcase, available: true },
  { href: "/employer/talent", label: "Talent Search", icon: Search, available: true },
  { href: "/employer/company", label: "Company", icon: Building2, available: true },
  { href: "/messages", label: "Messages", icon: MessageCircle, available: false },
];
