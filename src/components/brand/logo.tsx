import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "full" | "icon";
  className?: string;
  href?: string | null;
  priority?: boolean;
  tagline?: boolean;
}

/**
 * Renders as icon + real text (not a flat raster wordmark) so "career" picks
 * up `text-foreground` and stays legible in both light and dark mode — the
 * original logo-full-transparent.png baked its wordmark in near-white,
 * which vanished on a light background.
 */
export function Logo({ variant = "full", className, href = "/", priority, tagline = false }: LogoProps) {
  const icon = (
    <Image
      src="/brand/icon-transparent.png"
      alt="Career OS"
      width={375}
      height={374}
      priority={priority}
      className="h-8 w-8 shrink-0 object-contain"
    />
  );

  const content =
    variant === "icon" ? (
      icon
    ) : (
      <span className={cn("inline-flex items-center gap-2", className)}>
        {icon}
        <span className="flex flex-col leading-none">
          <span className="text-xl font-bold tracking-tight text-foreground">
            career<span className="brand-gradient-text">OS</span>
          </span>
          {tagline && (
            <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
              Your career. <span className="text-primary">Optimized.</span>
            </span>
          )}
        </span>
      </span>
    );

  if (href === null) return content;

  return (
    <Link href={href} className="inline-flex items-center" aria-label="Career OS home">
      {content}
    </Link>
  );
}
