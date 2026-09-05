"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FilterSidebar } from "@/components/filters/filter-sidebar";
import { SortSelect } from "@/components/filters/sort-select";
import { MediaGrid } from "@/components/media/media-grid";
import { Button } from "@/components/ui/button";
import { UnifiedMedia, MediaType } from "@/lib/tmdb-types";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BrowseClientProps {
  initialItems: UnifiedMedia[];
  initialTotalPages: number;
  initialTotalResults: number;
}

export function BrowseClient({
  initialItems,
  initialTotalPages,
  initialTotalResults,
}: BrowseClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read URL query state
  const type = (searchParams.get("type") as MediaType) || "movie";
  const genre = searchParams.get("genre") || "";
  const year = searchParams.get("year") || "";
  const country = searchParams.get("country") || "";
  const rating = Number(searchParams.get("rating") || 0);
  const sort = searchParams.get("sort") || "popularity.desc";
  const page = Number(searchParams.get("page") || 1);

  const [items, setItems] = React.useState<UnifiedMedia[]>(initialItems);
  const [totalPages, setTotalPages] = React.useState(initialTotalPages);
  const [totalResults, setTotalResults] = React.useState(initialTotalResults);
  const [isLoading, setIsLoading] = React.useState(false);

  // Update URL helper
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
      router.push(`/browse?${current.toString()}`);
    },
    [router, searchParams]
  );

  // Fetch when filters or page change
  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    const query = new URLSearchParams({
      page: String(page),
      sort_by: sort,
      language: "fa-IR",
    });

    if (genre) query.set("with_genres", genre);
    if (country) query.set("with_origin_country", country);
    if (rating > 0) {
      query.set("vote_average.gte", String(rating));
      query.set("vote_count.gte", "50");
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
            genre_ids: (item.genre_ids as number[]) || [],
            media_type: type,
          }));
          setItems(mapped);
          setTotalPages(Math.min(data.total_pages || 1, 500)); // TMDB max 500 pages
          setTotalResults(data.total_results || 0);
        }
      })
      .catch((err) => {
        console.error("Browse fetch error:", err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [type, genre, year, country, rating, sort, page]);

  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-border/50">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
            کاوش فیلم و سریال
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            فیلتر و مشاهده هزاران عنوان برتر سینما و تلویزیون
          </p>
        </div>

        <SortSelect
          value={sort}
          onChange={(newSort) => updateUrl({ sort: newSort, page: 1 })}
        />
      </div>

      {/* Main Layout: Sidebar + Grid */}
      <div className="flex flex-col lg:flex-row gap-8">
        <FilterSidebar
          filters={{ type, genre, year, country, rating }}
          onFilterChange={(newFilters) => updateUrl({ ...newFilters, page: 1 })}
          onReset={() =>
            router.push("/browse?type=movie&sort=popularity.desc")
          }
        />

        <div className="flex-1 space-y-8">
          <MediaGrid
            items={items}
            isLoading={isLoading}
            emptyTitle="هیچ فیلم یا سریالی با این فیلترها پیدا نشد"
            emptyDescription="فیلترهای انتخابی یا حداقل امتیاز را تغییر دهید تا نتایج بیشتری نمایش داده شود."
            emptyActionLabel="بازنشانی فیلترها"
            emptyActionHref="/browse"
          />

          {/* Pagination Controls */}
          {totalPages > 1 && !isLoading && (
            <div className="flex items-center justify-center gap-3 pt-6 border-t border-border/40">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => updateUrl({ page: page - 1 })}
                className="gap-1.5 rounded-xl text-xs"
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
                className="gap-1.5 rounded-xl text-xs"
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
