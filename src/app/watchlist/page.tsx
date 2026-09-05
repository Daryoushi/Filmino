"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bookmark,
  Trash2,
  Film,
  Tv,
  Compass,
} from "lucide-react";
import { useWatchlist } from "@/hooks/use-watchlist";
import { MediaCard } from "@/components/media/media-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MediaCardSkeleton } from "@/components/media/media-card-skeleton";
import { UnifiedMedia } from "@/lib/tmdb-types";

export default function WatchlistPage() {
  const { watchlist, isLoaded, clearWatchlist } = useWatchlist();
  const [activeTab, setActiveTab] = React.useState<"all" | "movie" | "tv">("all");

  const items: UnifiedMedia[] = React.useMemo(() => {
    return watchlist.map((w) => ({
      id: w.id,
      title: w.title,
      original_title: w.title,
      overview: "",
      poster_path: w.poster_path,
      backdrop_path: null,
      release_date: w.release_date,
      vote_average: w.vote_average,
      vote_count: 0,
      popularity: 0,
      genre_ids: [],
      media_type: w.media_type,
    }));
  }, [watchlist]);

  const filteredItems = React.useMemo(() => {
    if (activeTab === "all") return items;
    return items.filter((i) => i.media_type === activeTab);
  }, [items, activeTab]);

  const movieCount = items.filter((i) => i.media_type === "movie").length;
  const tvCount = items.filter((i) => i.media_type === "tv").length;

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/50">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-foreground">
            لیست علاقه‌مندی‌ها
          </h1>
        </div>

        {isLoaded && watchlist.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (window.confirm("آیا از پاک کردن تمام لیست علاقه‌مندی‌ها مطمئن هستید؟")) {
                clearWatchlist();
              }
            }}
            className="text-destructive hover:bg-destructive/10 border-destructive/30 gap-1.5 rounded-xl text-xs self-start sm:self-auto"
          >
            <Trash2 className="h-4 w-4" />
            <span>پاک‌سازی کل لیست</span>
          </Button>
        )}
      </div>

      {/* Tabs */}
      {isLoaded && items.length > 0 && (
        <div className="flex justify-start">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as "all" | "movie" | "tv")}
          >
            <TabsList className="h-10 rounded-xl bg-card border border-border/70 p-1">
              <TabsTrigger value="all" className="gap-2 text-xs">
                <span>همه</span>
                <span className="text-[10px] opacity-70">({items.length})</span>
              </TabsTrigger>
              <TabsTrigger value="movie" className="gap-2 text-xs">
                <Film className="h-3 w-3 text-amber-400" />
                <span>فیلم‌ها</span>
                <span className="text-[10px] opacity-70">({movieCount})</span>
              </TabsTrigger>
              <TabsTrigger value="tv" className="gap-2 text-xs">
                <Tv className="h-3 w-3 text-sky-400" />
                <span>سریال‌ها</span>
                <span className="text-[10px] opacity-70">({tvCount})</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Grid or Empty state */}
      {!isLoaded ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <MediaCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
          {filteredItems.map((media) => (
            <MediaCard key={`${media.id}-${media.media_type}`} media={media} />
          ))}
        </div>
      ) : (
        <div className="flex min-h-[380px] flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 p-8 text-center bg-card/40 backdrop-blur-sm">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-400 mb-4">
            <Bookmark className="h-10 w-10 stroke-[1.8]" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            هنوز اثری به علاقه‌مندی‌های خود اضافه نکرده‌اید
          </h3>
          <p className="max-w-md text-xs md:text-sm text-muted-foreground mb-6 leading-relaxed">
            هنگام مرور فیلم‌ها و سریال‌ها، با کلیک روی آیکون بوکمارک می‌توانید آنها
            را در این صفحه ذخیره کنید تا همیشه در دسترستان باشند.
          </p>
          <Button asChild variant="cinema" size="lg" className="rounded-xl gap-2">
            <Link href="/browse">
              <Compass className="h-4 w-4" />
              <span>کاوش و انتخاب فیلم و سریال</span>
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
