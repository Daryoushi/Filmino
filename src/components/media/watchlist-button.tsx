"use client";

import * as React from "react";
import { Bookmark, Check } from "lucide-react";
import { useWatchlist } from "@/hooks/use-watchlist";
import { UnifiedMedia, WatchlistItem } from "@/lib/tmdb-types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface WatchlistButtonProps {
  media: UnifiedMedia | WatchlistItem;
  variant?: "icon" | "full";
  className?: string;
}

export function WatchlistButton({
  media,
  variant = "icon",
  className,
}: WatchlistButtonProps) {
  const { isInWatchlist, toggleWatchlist, isLoaded } = useWatchlist();
  const inList = isLoaded ? isInWatchlist(media.id, media.media_type) : false;

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const added = toggleWatchlist(media);
    if (added) {
      toast.success(`"${media.title}" به علاقه‌مندی‌ها اضافه شد`, {
        description: "می‌توانید در منوی بالای صفحه آن را مشاهده کنید.",
      });
    } else {
      toast.info(`"${media.title}" از علاقه‌مندی‌ها حذف شد`);
    }
  };

  if (variant === "full") {
    return (
      <Button
        onClick={handleToggle}
        variant={inList ? "cinema" : "glass"}
        className={cn("gap-2 font-medium transition-all duration-300", className)}
      >
        {inList ? (
          <>
            <Check className="h-4 w-4 stroke-[2.5]" />
            <span>در لیست تماشا</span>
          </>
        ) : (
          <>
            <Bookmark className="h-4 w-4" />
            <span>افزودن به علاقه‌مندی‌ها</span>
          </>
        )}
      </Button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      aria-label={inList ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
      title={inList ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 backdrop-blur-md cursor-pointer",
        inList
          ? "bg-amber-500 text-black shadow-lg shadow-amber-500/30 scale-105"
          : "bg-black/50 text-white hover:bg-black/80 hover:text-amber-400 border border-white/10",
        className
      )}
    >
      <Bookmark
        className={cn("h-4 w-4", inList ? "fill-black stroke-black" : "")}
      />
    </button>
  );
}
