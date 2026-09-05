"use client";

import * as React from "react";
import { Film } from "lucide-react";
import { UnifiedMedia } from "@/lib/tmdb-types";
import { MediaCard } from "./media-card";
import { MediaCardSkeleton } from "./media-card-skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface MediaGridProps {
  items?: UnifiedMedia[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionHref?: string;
  emptyActionLabel?: string;
  skeletonCount?: number;
  className?: string;
}

export function MediaGrid({
  items = [],
  isLoading = false,
  emptyTitle = "هیچ موردی یافت نشد",
  emptyDescription = "موردی با شرایط درخواستی شما در دسترس نیست. می‌توانید فیلترها را تغییر دهید.",
  emptyActionHref,
  emptyActionLabel,
  skeletonCount = 12,
  className,
}: MediaGridProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4",
          className
        )}
      >
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <MediaCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[340px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-8 text-center bg-card/30 backdrop-blur-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/60 text-muted-foreground mb-4">
          <Film className="h-8 w-8 text-amber-500/80" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-1">{emptyTitle}</h3>
        <p className="max-w-md text-sm text-muted-foreground mb-6">
          {emptyDescription}
        </p>
        {emptyActionHref && emptyActionLabel && (
          <Button asChild variant="cinema">
            <Link href={emptyActionHref}>{emptyActionLabel}</Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5",
        className
      )}
    >
      {items.map((item, index) => (
        <MediaCard
          key={`${item.id}-${item.media_type}-${index}`}
          media={item}
          priority={index < 6}
        />
      ))}
    </div>
  );
}
