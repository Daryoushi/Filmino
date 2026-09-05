"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  href?: string;
  actionLabel?: string;
  className?: string;
  children?: React.ReactNode;
}

export function SectionHeader({
  title,
  subtitle,
  href,
  actionLabel = "مشاهده همه",
  className,
  children,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 mb-4 transition-colors",
        className
      )}
    >
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-0.5">
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground font-normal">
              {subtitle}
            </p>
          )}
        </div>

        {href && (
          <Link
            href={href}
            className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 shrink-0 pb-0.5"
          >
            <span>{actionLabel}</span>
            <ChevronLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
          </Link>
        )}

        {children}
      </div>
    </div>
  );
}
