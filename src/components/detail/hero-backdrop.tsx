"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  Clock,
  Calendar,
  ExternalLink,
  Layers,
  Sparkles,
  Film,
  Tv,
} from "lucide-react";
import { MovieDetail, TVDetail, MediaType } from "@/lib/tmdb-types";
import { getBackdropUrl, getImageUrl } from "@/lib/tmdb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WatchlistButton } from "@/components/media/watchlist-button";
import { TrailerModal } from "./trailer-modal";

interface HeroBackdropProps {
  media: MovieDetail | TVDetail;
  type: MediaType;
}

const KNOWN_PERSIAN_MEDIA: Record<number, { title: string; overview: string }> = {
  618588: {
    title: "روبی گیلمن: کراکن نوجوان",
    overview: "روبی گیلمن، یک دختر نوجوان ۱۶ ساله خجالتی و مهربان، متوجه می‌شود که از نوادگان مستقیم خاندان سلطنتی کراکن‌های افسانه‌ای محافظ اقیانوس است و سرنوشت نجات جهان زیر آب بر دوش او قرار دارد.",
  },
  969681: {
    title: "مرد عنکبوتی: روزی کاملاً جدید",
    overview: "پیتر پارکر در ماجراجویی تازه خود با چالش‌ها و تهدیدات جدیدی در نیویورک روبه‌رو می‌شود و باید تعادل میان زندگی قهرمانی و شخصی خود را حفظ کند.",
  },
  823464: {
    title: "گودزیلا و کونگ: امپراتوری جدید",
    overview: "گودزیلا و کونگ در نبردی حماسی علیه تهدیدی ناشناخته و عظیم که در درون زمین پنهان شده با یکدیگر متحد می‌شوند.",
  },
  1022789: {
    title: "درون و بیرون ۲",
    overview: "رایلی وارد دوران نوجوانی می‌شود و احساسات جدیدی از جمله اضطراب، حسادت و شرمندگی به اتاق کنترل ذهن او راه پیدا می‌کنند.",
  },
  519182: {
    title: "من نفرت‌انگیز ۴",
    overview: "گرو و خانواده‌اش با ورود عضو جدید خانواده و روبرو شدن با دشمن سرسخت قدیمی‌شان، ماجراجویی هیجان‌انگیز دیگری را آغاز می‌کنند.",
  },
};

export function HeroBackdrop({ media, type }: HeroBackdropProps) {
  const isMovie = type === "movie";
  const movie = isMovie ? (media as MovieDetail) : null;
  const tv = !isMovie ? (media as TVDetail) : null;

  const mediaId = Number(media.id);
  const known = KNOWN_PERSIAN_MEDIA[mediaId];

  const rawTitle = isMovie ? movie!.title : tv!.name;
  const rawOriginalTitle = isMovie ? movie!.original_title : tv!.original_name;

  // Check if rawTitle has Persian characters
  const hasPersianTitle = /[\u0600-\u06FF]/.test(rawTitle || "");
  const displayFaTitle = known?.title || (hasPersianTitle ? rawTitle : (rawTitle || rawOriginalTitle));
  // English title is always placed beneath the Persian title
  const displayEnTitle = rawOriginalTitle || (displayFaTitle !== rawTitle ? rawTitle : null);

  const title = displayFaTitle;

  const hasPersianOverview = /[\u0600-\u06FF]/.test(media.overview || "");
  const initialOverview =
    known?.overview ||
    (hasPersianOverview ? media.overview : media.overview || "خلاصه‌ای برای این اثر ثبت نشده است.");

  const [translatedOverview, setTranslatedOverview] = React.useState<string>(initialOverview);

  React.useEffect(() => {
    if (known?.overview) {
      setTranslatedOverview(known.overview);
      return;
    }
    if (media.overview && !/[\u0600-\u06FF]/.test(media.overview)) {
      fetch(`/api/translate?text=${encodeURIComponent(media.overview)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.translated) {
            setTranslatedOverview(data.translated);
          }
        })
        .catch(() => {});
    } else {
      setTranslatedOverview(media.overview || "خلاصه‌ای برای این اثر ثبت نشده است.");
    }
  }, [media.overview, known?.overview]);

  const releaseDate = isMovie ? movie!.release_date : tv!.first_air_date;
  const year = releaseDate ? releaseDate.split("-")[0] : "";
  const rating = media.vote_average > 0 ? media.vote_average.toFixed(1) : null;

  // Find trailer from videos
  const trailer = media.videos?.results?.find(
    (v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
  );

  const imdbId = media.external_ids?.imdb_id;

  return (
    <div className="relative w-full overflow-hidden bg-cinema-dark border-b border-border/40">
      {/* Background Backdrop Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={getBackdropUrl(media.backdrop_path, "original")}
          alt={title}
          fill
          priority
          className="object-cover object-center opacity-35 filter blur-[1px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 container mx-auto px-4 md:px-8 pt-12 pb-16 md:pt-16 md:pb-20">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 lg:gap-12">
          {/* Poster Card */}
          <div className="relative w-48 sm:w-56 md:w-64 lg:w-72 shrink-0 aspect-[2/3] overflow-hidden rounded-2xl border-2 border-border/60 bg-card shadow-2xl shadow-black/80">
            <Image
              src={getImageUrl(media.poster_path, "w500")}
              alt={title}
              fill
              priority
              className="object-cover"
            />
          </div>

          {/* Details Column */}
          <div className="flex-1 space-y-5 text-center md:text-start">
            {/* Metadata Tags */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <Badge
                variant="genre"
                className="bg-black/60 border-white/20 text-white gap-1 py-1 px-3"
              >
                {isMovie ? (
                  <>
                    <Film className="h-3.5 w-3.5 text-amber-400" />
                    <span>فیلم سینمایی</span>
                  </>
                ) : (
                  <>
                    <Tv className="h-3.5 w-3.5 text-sky-400" />
                    <span>سریال تلویزیونی</span>
                  </>
                )}
              </Badge>

              {rating && (
                <Badge
                  variant="rating"
                  className="bg-amber-500/20 text-amber-400 border-amber-500/40 gap-1 py-1 px-3 text-xs"
                >
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span dir="ltr">{rating} / 10</span>
                  {media.vote_count > 0 && (
                    <span className="text-[11px] text-amber-400/80 ms-1 font-normal">
                      ({media.vote_count.toLocaleString("fa-IR")} رای)
                    </span>
                  )}
                </Badge>
              )}

              {year && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground px-2">
                  <Calendar className="h-3.5 w-3.5" />
                  <span dir="ltr">{year}</span>
                </span>
              )}

              {isMovie && movie?.runtime && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground px-2">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{movie.runtime} دقیقه</span>
                </span>
              )}

              {!isMovie && tv && tv.number_of_seasons > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground px-2">
                  <Layers className="h-3.5 w-3.5" />
                  <span>{tv.number_of_seasons} فصل</span>
                </span>
              )}
            </div>

            {/* Titles */}
            <div className="space-y-1.5">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tight">
                {displayFaTitle}
              </h1>
              {displayEnTitle && (
                <p className="text-sm md:text-base text-muted-foreground font-medium font-sans tracking-wide">
                  <span dir="ltr" className="inline-block">
                    {displayEnTitle}
                  </span>
                </p>
              )}
            </div>

            {/* Tagline */}
            {media.tagline && (
              <p className="text-xs md:text-sm font-medium italic text-amber-400/90">
                «{media.tagline}»
              </p>
            )}

            {/* Genres */}
            {media.genres && media.genres.length > 0 && (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5">
                {media.genres.map((g) => (
                  <Link
                    key={g.id}
                    href={`/browse?genre=${g.id}&type=${type}`}
                    className="hover:scale-105 transition-transform"
                  >
                    <Badge
                      variant="genre"
                      className="text-xs py-1 px-3 hover:bg-amber-500/20 hover:text-amber-300 transition-colors"
                    >
                      {g.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}

            {/* Overview */}
            <div className="space-y-1.5 max-w-3xl">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                خلاصه داستان
              </h3>
              <p className="text-sm md:text-base text-foreground/90 leading-relaxed">
                {translatedOverview}
              </p>
            </div>

            {/* Action Row */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-4">
              {trailer && (
                <TrailerModal videoKey={trailer.key} title={title} />
              )}

              <WatchlistButton
                media={{
                  id: media.id,
                  media_type: type,
                  title: title,
                  poster_path: media.poster_path,
                  vote_average: media.vote_average,
                  release_date: releaseDate,
                  added_at: Date.now(),
                }}
                variant="full"
                className="h-11 px-5 rounded-xl"
              />

              {imdbId && (
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-xl border-yellow-500/40 bg-[#f5c518]/10 text-yellow-500 hover:bg-[#f5c518] hover:text-black font-black text-xs gap-2 transition-all"
                >
                  <a
                    href={`https://www.imdb.com/title/${imdbId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="bg-[#f5c518] text-black px-1.5 py-0.5 rounded font-black text-[10px]">
                      IMDb
                    </span>
                    <span>مشاهده در IMDb</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
