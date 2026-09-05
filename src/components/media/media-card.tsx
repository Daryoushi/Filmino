"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Film, Tv } from "lucide-react";
import { UnifiedMedia } from "@/lib/tmdb-types";
import { getImageUrl, GENRE_MAP_FA } from "@/lib/tmdb";
import { WatchlistButton } from "./watchlist-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MediaCardProps {
  media: UnifiedMedia;
  priority?: boolean;
  className?: string;
}

export function MediaCard({ media, priority = false, className }: MediaCardProps) {
  const [imgSrc, setImgSrc] = React.useState<string>(
    getImageUrl(media.poster_path, "w500")
  );

  const href =
    media.media_type === "tv" ? `/tv/${media.id}` : `/movies/${media.id}`;

  const year = media.release_date ? media.release_date.split("-")[0] : null;
  const rating =
    media.vote_average > 0 ? media.vote_average.toFixed(1) : null;
  const primaryGenre =
    media.genre_ids && media.genre_ids.length > 0
      ? GENRE_MAP_FA[media.genre_ids[0]]
      : null;

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl overflow-hidden transition-all duration-300",
        className
      )}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-card/80 border border-border/40 shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:shadow-amber-500/10 group-hover:border-amber-500/40 group-hover:-translate-y-1">
        <Link href={href} className="absolute inset-0 z-10 block" aria-label={media.title}>
          <Image
            src={imgSrc}
            alt={media.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none"
            onError={() => setImgSrc("/images/placeholder-poster.svg")}
          />
        </Link>

        {/* Gradient Overlay on Hover */}
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/20 to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Floating Top Bar (Rating & Watchlist) */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-2 z-20 pointer-events-none">
          {rating ? (
            <Badge
              variant="rating"
              className="flex items-center gap-1 shadow-md bg-black/70 backdrop-blur-md border-amber-500/30 text-amber-400 font-bold px-2 py-0.5"
            >
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span dir="ltr">{rating}</span>
            </Badge>
          ) : (
            <div />
          )}

          <div className="pointer-events-auto">
            <WatchlistButton media={media} variant="icon" />
          </div>
        </div>

        {/* Bottom Tag Bar (Movie/TV Badge) */}
        <div className="absolute bottom-2 start-2 z-10">
          <Badge
            variant="genre"
            className="bg-black/60 backdrop-blur-md text-[11px] border-white/15 text-white/90 gap-1 px-2 py-0.5"
          >
            {media.media_type === "tv" ? (
              <>
                <Tv className="h-3 w-3 text-sky-400" />
                <span>سریال</span>
              </>
            ) : (
              <>
                <Film className="h-3 w-3 text-amber-400" />
                <span>فیلم</span>
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* Card Info Below Poster */}
      <div className="flex flex-col gap-1 p-2">
        <Link
          href={href}
          className="line-clamp-1 text-sm font-semibold text-foreground/90 transition-colors group-hover:text-amber-400"
          title={media.title}
        >
          {media.title}
        </Link>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span dir="ltr">{year || "—"}</span>
          {primaryGenre && (
            <span className="line-clamp-1 max-w-[90px] text-muted-foreground/80">
              {primaryGenre}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
