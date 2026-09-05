"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  Film,
  Tv,
  Info,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
} from "lucide-react";
import { UnifiedMedia } from "@/lib/tmdb-types";
import { getBackdropUrl, getImageUrl } from "@/lib/tmdb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WatchlistButton } from "@/components/media/watchlist-button";
import { FlipText } from "@/components/ui/flip-text";
import { cn } from "@/lib/utils";

interface HeroSliderProps {
  items: UnifiedMedia[];
}

export function HeroSlider({ items }: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const featured = items.slice(0, 6);

  // Auto-slide every 7 seconds, pauses when hovered
  React.useEffect(() => {
    if (featured.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featured.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [featured.length, isPaused]);

  if (featured.length === 0) return null;

  const current = featured[currentIndex];
  const year = current.release_date ? current.release_date.split("-")[0] : "";
  const rating =
    current.vote_average > 0 ? current.vote_average.toFixed(1) : null;
  const href =
    current.media_type === "tv" ? `/tv/${current.id}` : `/movies/${current.id}`;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % featured.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + featured.length) % featured.length);
  };

  return (
    <div
      className="group relative w-full h-[580px] sm:h-[640px] md:h-[700px] lg:h-[760px] overflow-hidden bg-cinema-dark select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Backdrops with crossfade */}
      {featured.map((item, index) => {
        const isActive = index === currentIndex;
        return (
          <div
            key={item.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? "opacity-100 z-10 scale-100" : "opacity-0 z-0 scale-105 pointer-events-none"
            }`}
            style={{ transitionProperty: "opacity, transform" }}
          >
            <Image
              src={getBackdropUrl(item.backdrop_path, "original")}
              alt={item.title}
              fill
              priority={index === 0}
              className="object-cover object-center"
            />
            {/* Dark & Gold Cinema Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/50 to-transparent" />
            <div className="absolute inset-0 bg-black/35" />
          </div>
        );
      })}

      {/* Hero Content Container */}
      <div className="relative z-20 container mx-auto h-full flex flex-col justify-end pb-28 md:pb-32 px-4 md:px-8">
        <div className="max-w-2xl space-y-4 text-start">
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="genre"
              className="bg-black/70 border-white/20 text-white gap-1.5 py-1 px-3"
            >
              {current.media_type === "tv" ? (
                <>
                  <Tv className="h-3.5 w-3.5 text-sky-400" />
                  <span>سریال تلویزیونی</span>
                </>
              ) : (
                <>
                  <Film className="h-3.5 w-3.5 text-amber-400" />
                  <span>فیلم سینمایی</span>
                </>
              )}
            </Badge>

            {rating && (
              <Badge
                variant="rating"
                className="bg-amber-500/20 text-amber-400 border-amber-500/40 gap-1 py-1 px-3 font-bold"
              >
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span dir="ltr">{rating} / 10</span>
              </Badge>
            )}

            {year && (
              <span className="text-xs text-slate-300 font-medium px-2" dir="ltr">
                {year}
              </span>
            )}

            <button
              onClick={() => setIsPaused(!isPaused)}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-amber-400 px-2 py-0.5 rounded bg-black/40 border border-white/10"
              title={isPaused ? "ادامه پخش اسلایدر" : "توقف موقت اسلایدر"}
            >
              {isPaused ? (
                <>
                  <Play className="h-3 w-3 fill-current" />
                  <span>پخش خودکار</span>
                </>
              ) : (
                <>
                  <Pause className="h-3 w-3 fill-current" />
                  <span>توقف</span>
                </>
              )}
            </button>
          </div>

          {/* Persian Title with FlipText + English Subtitle Directly Below */}
          <div className="flex flex-col gap-1.5 items-start text-start">
            <FlipText
              key={`${current.id}-${current.title}`}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-md text-start"
              duration={1.8}
            >
              {current.title}
            </FlipText>

            {/* English Title placed DIRECTLY under Persian Title on the right */}
            {current.original_title && current.original_title !== current.title && (
              <p
                className="text-sm md:text-base text-amber-400 font-semibold tracking-wider text-start font-sans"
                dir="ltr"
              >
                {current.original_title}
              </p>
            )}
          </div>

          {/* Overview */}
          {current.overview && (
            <p className="text-xs sm:text-sm md:text-base text-slate-300/90 line-clamp-3 leading-relaxed max-w-xl">
              {current.overview}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button asChild size="lg" variant="cinema" className="gap-2 rounded-xl">
              <Link href={href}>
                <Info className="h-5 w-5" />
                <span>مشاهده جزئیات</span>
              </Link>
            </Button>

            <WatchlistButton
              media={current}
              variant="full"
              className="h-12 px-6 rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Prominent Large Side Arrows for User Navigation */}
      <button
        onClick={prevSlide}
        aria-label="فیلم قبلی"
        className="absolute end-4 md:end-8 top-1/2 -translate-y-1/2 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white border border-white/20 backdrop-blur-md transition-all duration-200 hover:bg-amber-500 hover:text-black hover:border-amber-400 hover:scale-110 shadow-xl cursor-pointer"
      >
        <ChevronRight className="h-6 w-6 stroke-[2.5]" />
      </button>

      <button
        onClick={nextSlide}
        aria-label="فیلم بعدی"
        className="absolute start-4 md:start-8 top-1/2 -translate-y-1/2 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white border border-white/20 backdrop-blur-md transition-all duration-200 hover:bg-amber-500 hover:text-black hover:border-amber-400 hover:scale-110 shadow-xl cursor-pointer"
      >
        <ChevronLeft className="h-6 w-6 stroke-[2.5]" />
      </button>

      {/* Interactive Bottom Movie Thumbnail Switcher Strip */}
      <div className="absolute inset-x-0 bottom-4 z-30 container mx-auto px-4 md:px-8 flex items-center justify-between">
        {/* Thumbnails of featured movies */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
          {featured.map((item, index) => {
            const isSelected = index === currentIndex;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "group/thumb relative flex items-center gap-2.5 p-1.5 rounded-xl transition-all duration-300 backdrop-blur-md border cursor-pointer text-start",
                  isSelected
                    ? "bg-black/80 border-amber-500 ring-2 ring-amber-500/40 scale-105 shadow-lg shadow-amber-500/20"
                    : "bg-black/50 border-white/10 opacity-70 hover:opacity-100 hover:border-white/30"
                )}
              >
                <div className="relative h-10 w-7 shrink-0 overflow-hidden rounded-md bg-muted">
                  <Image
                    src={getImageUrl(item.poster_path, "w300")}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="hidden sm:flex flex-col max-w-[120px] pe-2">
                  <span
                    className={cn(
                      "text-xs font-bold truncate",
                      isSelected ? "text-amber-400" : "text-white/90"
                    )}
                  >
                    {item.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate" dir="ltr">
                    {item.release_date ? item.release_date.split("-")[0] : ""}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Slide indicator dots */}
        <div className="hidden lg:flex items-center gap-1.5 ms-4 shrink-0">
          {featured.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={cn(
                "h-2 rounded-full transition-all duration-300 cursor-pointer",
                i === currentIndex
                  ? "w-8 bg-amber-400"
                  : "w-2 bg-white/40 hover:bg-white/70"
              )}
              aria-label={`اسلاید ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
