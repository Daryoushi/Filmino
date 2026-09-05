"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FilterSidebar } from "@/components/filters/filter-sidebar";
import { SortSelect } from "@/components/filters/sort-select";
import { MediaGrid } from "@/components/media/media-grid";
import { Button } from "@/components/ui/button";
import { UnifiedMedia, MediaType } from "@/lib/tmdb-types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface CategoryClientProps {
  slug: string;
  genreName: string;
  genreId: number;
  initialItems: UnifiedMedia[];
  initialTotalPages: number;
  initialTotalResults: number;
}

export function CategoryClient({
  slug,
  genreName,
  genreId,
  initialItems,
  initialTotalPages,
  initialTotalResults,
}: CategoryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const isAnimation = slug === "animation";

  // URL state
  const type = (searchParams.get("type") as MediaType) || "movie";
  const year = searchParams.get("year") || "";
  const country = searchParams.get("country") || "";
  const rating = Number(searchParams.get("rating") || 0);
  const sort = searchParams.get("sort") || "popularity.desc";
  const page = Number(searchParams.get("page") || 1);

  const [items, setItems] = React.useState<UnifiedMedia[]>(initialItems);
  const [totalPages, setTotalPages] = React.useState(initialTotalPages);
  const [totalResults, setTotalResults] = React.useState(initialTotalResults);
  const [isLoading, setIsLoading] = React.useState(false);

  const updateUrl = React.useCallback(
    (params: Record<string, string | number | undefined>) => {
      const current = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([key, val]) => {
        if (val === undefined || val === "" || val === 0 || (key === "page" && val === 1)) {
          current.delete(key);
        } else {
          current.set(key, String(val));
        }
      });
      router.push(`/category/${slug}?${current.toString()}`);
    },
    [router, searchParams, slug]
  );

  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    const query = new URLSearchParams({
      page: String(page),
      sort_by: sort,
      language: "fa-IR",
      with_genres: String(genreId),
    });

    if (country) query.set("with_origin_country", country);
    if (rating > 0) {
      query.set("vote_average.gte", String(rating));
      query.set("vote_count.gte", "30");
    }
    if (year) {
      if (type === "movie") query.set("primary_release_year", year);
      else query.set("first_air_date_year", year);
    }

    const endpoint = type === "tv" ? "discover/tv" : "discover/movie";

    fetch(`/api/tmdb/${endpoint}?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.results) {
          const mapped: UnifiedMedia[] = data.results.map((item: Record<string, unknown>) => ({
            id: item.id as number,
            title: (item.title || item.name || "بدون عنوان") as string,
            original_title: (item.original_title || item.original_name || "") as string,
            overview: (item.overview || "") as string,
            poster_path: (item.poster_path as string | null) || null,
            backdrop_path: (item.backdrop_path as string | null) || null,
            release_date: (item.release_date || item.first_air_date || "") as string,
            vote_average: Number(item.vote_average || 0),
            vote_count: Number(item.vote_count || 0),
            popularity: Number(item.popularity || 0),
            genre_ids: (item.genre_ids as number[]) || [genreId],
            media_type: type,
          }));
          setItems(mapped);
          setTotalPages(Math.min(data.total_pages || 1, 500));
          setTotalResults(data.total_results || 0);
        }
      })
      .catch((err) => console.error("Category fetch error:", err))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [type, genreId, year, country, rating, sort, page]);

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 space-y-8">
      {/* Category Hero Banner */}
      <div className="relative overflow-hidden py-4 md:py-6">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground tracking-tight">
              {genreName}
            </h1>
          </div>

          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            {isAnimation
              ? "مجموعه‌ای جذاب از دیدنی‌ترین کارتون‌ها، انیمه‌ها و پویانمایی‌های سینمایی و سریالی برتر جهان از کمپانی‌های پیکسار، دیزنی، دریم‌ورکس و استودیو جیبلی."
              : `آرشیو گلچین شده از پرطرفدارترین و دیدنی‌ترین عناوین ژانر ${genreName} با برترین رتبه‌ها.`}
          </p>
        </div>
      </div>

      {/* Main Layout: Filter Sidebar + Grid */}
      <div className="flex flex-col lg:flex-row gap-8">
        <FilterSidebar
          filters={{ type, genre: String(genreId), year, country, rating }}
          onFilterChange={(newFilters) => updateUrl({ ...newFilters, page: 1 })}
          onReset={() =>
            router.push(`/category/${slug}`)
          }
          className="top-24"
        />

        <div className="flex-1 space-y-8">
          <div className="flex items-center justify-between pb-4 border-b border-border/50">
            <span className="text-xs text-muted-foreground font-medium">
              نمایش عناوین دسته‌بندی <b className="text-foreground">{genreName}</b>
            </span>
            <SortSelect
              value={sort}
              onChange={(newSort) => updateUrl({ sort: newSort, page: 1 })}
            />
          </div>

          <MediaGrid
            items={items}
            isLoading={isLoading}
            emptyTitle={`هیچ اثری در دسته‌بندی ${genreName} با این فیلترها یافت نشد`}
            emptyDescription="فیلترهای انتخابی یا سال و کشور را تغییر دهید تا عناوین بیشتری نمایش داده شود."
            emptyActionLabel="بازنشانی فیلترها"
            emptyActionHref={`/category/${slug}`}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-6 border-t border-border/40">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => updateUrl({ page: page - 1 })}
                className="gap-1.5 rounded-xl text-xs cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
                <span>صفحه قبل</span>
              </Button>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-semibold">
                <span>صفحه</span>
                <span className="text-amber-400 font-bold" dir="ltr">
                  {page}
                </span>
                <span>از</span>
                <span dir="ltr">{totalPages}</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => updateUrl({ page: page + 1 })}
                className="gap-1.5 rounded-xl text-xs cursor-pointer"
              >
                <span>صفحه بعد</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
