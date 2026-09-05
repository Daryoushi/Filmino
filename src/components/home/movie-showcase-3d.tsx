"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { BooksShowcase, BookCfg } from "@/components/ui/books-showcase";
import { UnifiedMedia } from "@/lib/tmdb-types";
import { getImageUrl } from "@/lib/tmdb";
import { SectionHeader } from "@/components/shared/section-header";

interface MovieShowcaseProps {
  items: UnifiedMedia[];
}

export function MovieShowcase({ items }: MovieShowcaseProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isLight = mounted && resolvedTheme === "light";

  const showcaseItems: BookCfg[] = React.useMemo(() => {
    return items.slice(0, 10).map((media) => {
      const year = media.release_date ? media.release_date.split("-")[0] : "2025";
      const stars = Math.min(5, Math.max(1, Math.round(media.vote_average / 2)));
      const rating = media.vote_average > 0 ? media.vote_average.toFixed(1) : "8.2";
      const posterUrl = getImageUrl(media.poster_path, "w780");
      const backdropUrl = getImageUrl(media.backdrop_path, "w780") || posterUrl;

      return {
        id: String(media.id),
        title: media.title,
        originalTitle: media.original_title,
        author: media.media_type === "tv" ? "سریال تلویزیونی" : "فیلم سینمایی",
        mediaType: media.media_type,
        href: media.media_type === "tv" ? `/tv/${media.id}` : `/movies/${media.id}`,
        year,
        stars,
        rating,
        desc: media.overview || "برای مشاهده مشخصات کامل، عوامل، تریلر و اطلاعات اثر کلیک کنید.",
        images: {
          front: posterUrl,
        },
        edge: "#141722",
      };
    });
  }, [items]);

  if (showcaseItems.length === 0) return null;

  return (
    <section className="relative w-full overflow-hidden bg-background border-b border-border/40 pb-4 pt-5 transition-colors duration-300">
      <div className="container mx-auto px-4 md:px-8 mb-2">
        <SectionHeader
          title="آثار برگزیده و پیشنهادی"
          subtitle="منتخب برترین فیلم‌ها و سریال‌های روز جهان"
          href="/browse"
          actionLabel="مشاهده همه در آرشیو"
        />
      </div>

      <div className="h-[520px] md:h-[580px] w-full -mt-2">
        <BooksShowcase
          books={showcaseItems}
          heroTitle="FILMINO"
          navTitle="آثار برگزیده هفته"
          className="min-h-0"
          showNav={false}
          themeColors={{
            bgDark: "#08090c",
            bgLight: "#f8fafc",
            foregroundDark: "#f5f5f5",
            foregroundLight: "#0f172a",
            pink: "#e5a00d",
            lav: isLight ? "#64748b" : "#9296a3",
            cream: isLight ? "#ffffff" : "#101116",
            navy: isLight ? "#f8fafc" : "#08090c",
          }}
        />
      </div>
    </section>
  );
}
