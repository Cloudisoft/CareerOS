import {
  LayoutDashboard,
  Briefcase,
  Bot,
  Send,
  FileText,
  MessageSquare,
  MessageCircle,
  Mail,
  GraduationCap,
  Users,
  ClipboardList,
  Building2,
  Search,
  ShieldCheck,
  Users2,
  Sparkles,
  Globe,
  Activity,
  Cpu,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Flips to true as each phase ships the real page behind this link. */
  available: boolean;
  /** Items sharing a section are grouped under that heading in the sidebar. */
  section?: string;
}

export const CANDIDATE_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, available: true },
  { href: "/jobs", label: "Jobs", icon: Briefcase, available: true },
  { href: "/applications", label: "Applications", icon: ClipboardList, available: true },
  { href: "/messages", label: "Messages", icon: MessageCircle, available: true },
  { href: "/ai-work", label: "AI Work", icon: Cpu, available: true, section: "Earn" },
  { href: "/network", label: "Network", icon: Users, available: true, section: "Connect" },
  { href: "/careers", label: "Career OS Careers", icon: Globe, available: true, section: "Connect" },
  { href: "/job-gpt", label: "Job GPT", icon: Bot, available: true, section: "AI tools" },
  { href: "/auto-apply", label: "Auto Apply", icon: Send, available: true, section: "AI tools" },
  { href: "/resume-studio", label: "Resume", icon: FileText, available: true, section: "AI tools" },
  { href: "/cover-letter-studio", label: "Cover Letters", icon: Mail, available: true, section: "AI tools" },
  { href: "/interview-ai", label: "Interview", icon: MessageSquare, available: true, section: "AI tools" },
  { href: "/learning", label: "Learning", icon: GraduationCap, available: true, section: "AI tools" },
];

export const EMPLOYER_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, available: true },
  { href: "/employer/jobs", label: "Jobs", icon: Briefcase, available: true },
  { href: "/employer/talent", label: "Talent Search", icon: Search, available: true },
  { href: "/messages", label: "Messages", icon: MessageCircle, available: true },
  { href: "/employer/enterprise", label: "Recruiter Suite", icon: Sparkles, available: true, section: "Grow" },
  { href: "/employer/company", label: "Company", icon: Building2, available: true, section: "Grow" },
  { href: "/careers", label: "Career OS Careers", icon: Globe, available: true, section: "Grow" },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: ShieldCheck, available: true },
  { href: "/admin/insights", label: "Insights", icon: Activity, available: true },
  { href: "/admin/users", label: "Users", icon: Users2, available: true },
  { href: "/admin/accounts", label: "Accounts & plans", icon: UserPlus, available: true },
  { href: "/admin/enterprise", label: "Enterprise & Careers", icon: Sparkles, available: true },
  { href: "/admin/ai-work", label: "AI Work", icon: Cpu, available: true },
  { href: "/careers", label: "Career OS Careers", icon: Globe, available: true },
];
