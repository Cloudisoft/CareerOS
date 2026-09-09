import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "full" | "icon";
  className?: string;
  href?: string | null;
  priority?: boolean;
}

export function Logo({ variant = "full", className, href = "/", priority }: LogoProps) {
  const image =
    variant === "full" ? (
      <Image
        src="/brand/logo-full-transparent.png"
        alt="Career OS — Your Career. Optimized."
        width={520}
        height={140}
        priority={priority}
        className={cn("h-8 w-auto object-contain", className)}
      />
    ) : (
      <Image
        src="/brand/icon-transparent.png"
        alt="Career OS"
        width={375}
        height={374}
        priority={priority}
        className={cn("h-8 w-8 object-contain", className)}
      />
    );

  if (href === null) return image;

  return (
    <Link href={href} className="inline-flex items-center" aria-label="Career OS home">
      {image}
    </Link>
  );
}
