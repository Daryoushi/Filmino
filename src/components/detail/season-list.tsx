"use client";

import * as React from "react";
import Image from "next/image";
import { Season, Episode } from "@/lib/tmdb-types";
import { getImageUrl } from "@/lib/tmdb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, Calendar, Layers, Clock, ChevronDown, ChevronUp, Tv } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface SeasonListProps {
  tvId: number;
  seasons: Season[];
}

export function SeasonList({ tvId, seasons }: SeasonListProps) {
  const filteredSeasons = seasons.filter((s) => s.season_number > 0);
  const [selectedSeasonNumber, setSelectedSeasonNumber] = React.useState<number>(
    filteredSeasons[0]?.season_number || 1
  );
  const [episodes, setEpisodes] = React.useState<Episode[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  const currentSeason = filteredSeasons.find(
    (s) => s.season_number === selectedSeasonNumber
  );

  React.useEffect(() => {
    if (!tvId) return;

    let cancelled = false;
    setIsLoading(true);

    fetch(`/api/tmdb/tv/${tvId}/season/${selectedSeasonNumber}?language=fa-IR`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.episodes) {
          setEpisodes(data.episodes);
        }
      })
      .catch((err) => console.error("Error fetching season episodes:", err))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tvId, selectedSeasonNumber]);

  if (filteredSeasons.length === 0) return null;

  const totalEpisodes = episodes.length || currentSeason?.episode_count || 0;

  return (
    <div className="space-y-4">
      {/* Header & Season Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <Layers className="h-5 w-5 text-amber-400" />
          <h3 className="text-xl font-bold text-foreground">
            فصل‌ها و قسمت‌ها
          </h3>
          <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5 border-border/70">
            {filteredSeasons.length} فصل
          </Badge>
        </div>

        <div className="w-full sm:w-52">
          <Select
            value={String(selectedSeasonNumber)}
            onValueChange={(val) => {
              setSelectedSeasonNumber(Number(val));
            }}
          >
            <SelectTrigger className="h-10 text-xs rounded-xl bg-card border-border/70">
              <SelectValue placeholder="انتخاب فصل" />
            </SelectTrigger>
            <SelectContent>
              {filteredSeasons.map((s) => (
                <SelectItem
                  key={s.id}
                  value={String(s.season_number)}
                  className="text-xs"
                >
                  فصل {s.season_number} ({s.episode_count} قسمت)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Expandable Season Bar with "دیدن همه قسمت ها" Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-card/60 border border-border/70 backdrop-blur-sm shadow-sm hover:border-border transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner">
            <Tv className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-base text-foreground">
                فصل {selectedSeasonNumber}
              </h4>
              <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5">
                {totalEpisodes} قسمت
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isOpen
                ? "در حال حاضر تمامی قسمت‌های این فصل در نمای کشویی زیر باز هستند."
                : "برای نمایش تمامی قسمت‌ها همراه با زمان و خلاصه، روی دکمه کلیک کنید."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 shrink-0 cursor-pointer self-start sm:self-auto pb-0.5"
        >
          <span>{isOpen ? "بستن لیست قسمت‌ها" : "دیدن همه قسمت‌ها"}</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              isOpen ? "rotate-180 text-foreground" : "group-hover:translate-y-0.5"
            )}
          />
        </button>
      </div>

      {/* Collapsible Episodes Drawer */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="episodes-drawer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pt-2">
              {isLoading ? (
                <div className="py-12 text-center text-xs text-muted-foreground animate-pulse rounded-2xl bg-card/40 border border-border/50">
                  در حال بارگذاری قسمت‌های فصل {selectedSeasonNumber}...
                </div>
              ) : episodes.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {episodes.map((ep) => (
                      <div
                        key={ep.id}
                        className="flex flex-col md:flex-row items-start gap-4 p-4 rounded-2xl bg-card/50 border border-border/50 hover:border-amber-500/25 transition-all duration-200 hover:shadow-md"
                      >
                        {/* Still Thumbnail */}
                        <div className="relative aspect-video w-full md:w-56 shrink-0 overflow-hidden rounded-xl bg-muted">
                          <Image
                            src={getImageUrl(ep.still_path, "w500")}
                            alt={ep.name}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute top-2 start-2">
                            <Badge variant="cinema" className="text-[10px] px-1.5 py-0.5 font-bold shadow-md">
                              قسمت {ep.episode_number}
                            </Badge>
                          </div>
                        </div>

                        {/* Episode Info */}
                        <div className="flex-1 space-y-2 w-full">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="font-bold text-sm md:text-base text-foreground">
                              {ep.name || `قسمت ${ep.episode_number}`}
                            </h4>

                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              {ep.vote_average > 0 && (
                                <span className="flex items-center gap-1 text-amber-400 font-semibold">
                                  <Star className="h-3 w-3 fill-amber-400" />
                                  <span dir="ltr">{ep.vote_average.toFixed(1)}</span>
                                </span>
                              )}
                              {ep.runtime && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{ep.runtime} دقیقه</span>
                                </span>
                              )}
                              {ep.air_date && (
                                <span className="flex items-center gap-1" dir="ltr">
                                  <Calendar className="h-3 w-3" />
                                  <span>{ep.air_date}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                            {ep.overview || "خلاصه‌ای برای این قسمت ثبت نشده است."}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bottom Close Button */}
                  <div className="pt-3 pb-2 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-card hover:bg-muted border border-border text-xs font-bold text-muted-foreground hover:text-foreground transition-all duration-200 shadow-sm cursor-pointer"
                    >
                      <ChevronUp className="h-4 w-4" />
                      <span>بستن منوی قسمت‌ها</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-xs text-muted-foreground rounded-2xl bg-card/40 border border-border/50">
                  اطلاعات قسمت‌های این فصل در دسترس نیست.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
