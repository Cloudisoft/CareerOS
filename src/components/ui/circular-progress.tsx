"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface CircularProgressProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
}

/** The animated Career Readiness ring — Career OS's signature score visualization. */
export function CircularProgress({
  value,
  size = 120,
  strokeWidth = 10,
  className,
  label,
}: CircularProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  // Unique per ring, so several rings on one page don't share (or lose) a gradient.
  const gradientId = `career-readiness-${useId().replace(/:/g, "")}`;
  // The number scales with the ring so it always fits inside it (a fixed size overflowed small rings).
  const inner = size - strokeWidth * 2;
  const numberPx = Math.round(inner * (label ? 0.27 : 0.3));
  const labelPx = Math.max(10, Math.round(inner * 0.1));

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF862D" />
            <stop offset="100%" stopColor="#DF4C2C" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="stroke-muted fill-none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={`url(#${gradientId})`}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 800ms cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ padding: strokeWidth }}>
        <span className="font-bold leading-none tracking-tight text-foreground tabular-nums" style={{ fontSize: numberPx }}>
          {Math.round(clamped)}
          <span style={{ fontSize: "0.55em" }} className="ml-px align-top font-semibold">%</span>
        </span>
        {label ? (
          <span className="mt-1 max-w-full truncate text-center leading-tight text-muted-foreground" style={{ fontSize: labelPx }}>
            {label}
          </span>
        ) : null}
      </div>
    </div>
  );
}
