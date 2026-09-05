"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Loader2,
  X,
  Film,
  Tv,
  Sparkles,
  SlidersHorizontal,
  RotateCcw,
  Star,
  Compass,
  Globe,
  Calendar,
  Languages,
  ArrowDown,
  CheckCircle2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MediaGrid } from "@/components/media/media-grid";
import { UnifiedMedia } from "@/lib/tmdb-types";
import { POPULAR_COUNTRIES } from "@/components/filters/filter-sidebar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { SearchModal, SearchFilterState } from "@/components/ui/search-modal";

const POPULAR_YEARS = [
  "2026",
  "2025",
  "2024",
  "2023",
  "2022",
  "2021",
  "2020",
  "2018",
  "2015",
  "2010",
  "2000",
];

const SORT_OPTIONS = [
  { value: "popularity.desc", label: "محبوب‌ترین" },
  { value: "vote_average.desc", label: "بالاترین امتیاز" },
  { value: "primary_release_date.desc", label: "جدیدترین تاریخ انتشار" },
  { value: "vote_count.desc", label: "بیشترین تعداد آرا" },
];

const SEARCH_GENRES = [
  { id: 28, name: "اکشن" },
  { id: 10759, name: "اکشن و ماجراجویی (سریال)" },
  { id: 12, name: "ماجراجویی" },
  { id: 35, name: "کمدی" },
  { id: 18, name: "درام" },
  { id: 27, name: "ترسناک" },
  { id: 878, name: "علمی-تخیلی" },
  { id: 10765, name: "علمی‌تخیلی و فانتزی (سریال)" },
  { id: 80, name: "جنایی" },
  { id: 9648, name: "معمایی" },
  { id: 10749, name: "عاشقانه" },
  { id: 14, name: "فانتزی" },
];

const QUICK_SEARCH_CHIPS = [
  { label: "انیمیشن‌های ۲۰۲۴ و ۲۰۲۵", type: "animation" as const, year: "2024" },
  { label: "سینمای برتر ایران", country: "IR", sort: "vote_average.desc" },
  { label: "فیلم‌های جدید ۲۰۲۵", type: "movie" as const, year: "2025" },
  { label: "سریال‌های درام محبوب", type: "tv" as const, genre: "18" },
  { label: "انیمه و کارتون ژاپنی", type: "animation" as const, country: "JP" },
];

export function SearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q") || "";
  const initialType = (searchParams.get("type") as "all" | "movie" | "tv" | "animation") || "all";
  const initialGenre = searchParams.get("genre") || "";
  const initialYear = searchParams.get("year") || "";
  const initialCountry = searchParams.get("country") || "";
  const initialRating = Number(searchParams.get("rating") || 0);
  const initialSort = searchParams.get("sort") || "popularity.desc";
  const initialLang = (searchParams.get("lang") as "all" | "fa" | "en") || "all";

  // Form input states (draft before clicking search button)
  const [query, setQuery] = React.useState(initialQuery);
  const [mediaType, setMediaType] = React.useState<"all" | "movie" | "tv" | "animation">(initialType);
  const [selectedGenre, setSelectedGenre] = React.useState<string>(initialGenre);
  const [selectedYear, setSelectedYear] = React.useState<string>(initialYear);
  const [selectedCountry, setSelectedCountry] = React.useState<string>(initialCountry);
  const [minRating, setMinRating] = React.useState<number>(initialRating);
  const [sortBy, setSortBy] = React.useState<string>(initialSort);
  const [searchLang, setSearchLang] = React.useState<"all" | "fa" | "en">(initialLang);

  // Year manual input state
  const [yearInput, setYearInput] = React.useState<string>(initialYear);
  const [yearError, setYearError] = React.useState<string>("");

  // Search execution trigger state: only true if query exists initially or user clicks search
  const [hasSearched, setHasSearched] = React.useState<boolean>(
    Boolean(initialQuery || initialGenre || initialYear || initialCountry || initialRating > 0)
  );

  const [results, setResults] = React.useState<UnifiedMedia[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // Trigger search execution
  const executeSearch = React.useCallback(
    (customOverrides?: {
      query?: string;
      mediaType?: "all" | "movie" | "tv" | "animation";
      selectedGenre?: string;
      selectedYear?: string;
      selectedCountry?: string;
      minRating?: number;
      sortBy?: string;
      searchLang?: "all" | "fa" | "en";
    }) => {
      const q = customOverrides?.query ?? query;
      const type = customOverrides?.mediaType ?? mediaType;
      const genre = customOverrides?.selectedGenre ?? selectedGenre;
      const yr = customOverrides?.selectedYear ?? selectedYear;
      const ctry = customOverrides?.selectedCountry ?? selectedCountry;
      const rat = customOverrides?.minRating ?? minRating;
      const srt = customOverrides?.sortBy ?? sortBy;
      const lng = customOverrides?.searchLang ?? searchLang;

      // Update URL
      const current = new URLSearchParams();
      if (q.trim()) current.set("q", q.trim());
      if (type !== "all") current.set("type", type);
      if (genre) current.set("genre", genre);
      if (yr) current.set("year", yr);
      if (ctry) current.set("country", ctry);
      if (rat > 0) current.set("rating", String(rat));
      if (srt !== "popularity.desc") current.set("sort", srt);
      if (lng !== "all") current.set("lang", lng);

      const queryString = current.toString();
      router.replace(queryString ? `/search?${queryString}` : "/search");

      setHasSearched(true);
      setIsLoading(true);

      const hasText = q.trim().length > 0;
      let fetchUrl = "";

      if (hasText) {
        fetchUrl = `/api/tmdb/search/multi?query=${encodeURIComponent(q.trim())}`;
      } else {
        const targetType = type === "tv" ? "tv" : "movie";
        const discoverParams = new URLSearchParams({
          sort_by: srt,
          language: "fa-IR",
        });

        if (type === "animation") {
          discoverParams.set("with_genres", "16");
        } else if (genre) {
          discoverParams.set("with_genres", genre);
        }

        if (ctry) {
          discoverParams.set("with_origin_country", ctry);
        }

        if (rat > 0) {
          discoverParams.set("vote_average.gte", String(rat));
          discoverParams.set("vote_count.gte", "30");
        }

        if (yr) {
          if (targetType === "movie") discoverParams.set("primary_release_year", yr);
          else discoverParams.set("first_air_date_year", yr);
        }

        fetchUrl = `/api/tmdb/discover/${targetType}?${discoverParams.toString()}`;
      }

      fetch(fetchUrl)
        .then((res) => res.json())
        .then((data) => {
          if (!data.results) {
            setResults([]);
            return;
          }

          let mapped: UnifiedMedia[] = data.results
            .filter((item: { media_type?: string }) => {
              if (hasText) {
                return item.media_type === "movie" || item.media_type === "tv";
              }
              return true;
            })
            .map((item: Record<string, unknown>) => ({
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
              media_type: (item.media_type as "movie" | "tv") || (type === "tv" ? "tv" : "movie"),
            }));

          // Client-side filtering when text query is used
          if (hasText) {
            if (type === "animation") {
              mapped = mapped.filter((i) => i.genre_ids.includes(16));
            } else if (type !== "all") {
              mapped = mapped.filter((i) => i.media_type === type);
            }

            if (genre) {
              mapped = mapped.filter((i) => i.genre_ids.includes(Number(genre)));
            }

            if (yr) {
              mapped = mapped.filter((i) => i.release_date?.startsWith(yr));
            }

            if (rat > 0) {
              mapped = mapped.filter((i) => i.vote_average >= rat);
            }

            // Sort
            if (srt === "vote_average.desc") {
              mapped.sort((a, b) => b.vote_average - a.vote_average);
            } else if (srt === "primary_release_date.desc") {
              mapped.sort((a, b) => (b.release_date || "").localeCompare(a.release_date || ""));
            } else if (srt === "vote_count.desc") {
              mapped.sort((a, b) => b.vote_count - a.vote_count);
            }
          }

          // Language filter
          const persianRegex = /[\u0600-\u06FF]/;
          if (lng === "fa") {
            mapped = mapped.filter(
              (i) => persianRegex.test(i.title) || persianRegex.test(i.overview)
            );
          } else if (lng === "en") {
            mapped = mapped.filter((i) => !persianRegex.test(i.original_title));
          }

          setResults(mapped);
        })
        .catch((err) => {
          console.error("Search fetch error:", err);
          setResults([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    },
    [query, mediaType, selectedGenre, selectedYear, selectedCountry, minRating, sortBy, searchLang, router]
  );

  // Initial load if query parameters were present in URL
  React.useEffect(() => {
    if (initialQuery || initialGenre || initialYear || initialCountry || initialRating > 0) {
      executeSearch();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      executeSearch();
    }
  };

  const resetFilters = () => {
    setSelectedGenre("");
    setSelectedYear("");
    setSelectedCountry("");
    setYearInput("");
    setYearError("");
    setMinRating(0);
    setSortBy("popularity.desc");
    setMediaType("all");
    setSearchLang("all");
    setQuery("");
    setResults([]);
    setHasSearched(false);
    router.replace("/search");
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[۰-۹]/g, (d) =>
      String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    );
    const cleanVal = rawVal.replace(/\D/g, "").slice(0, 4);
    setYearInput(cleanVal);

    if (!cleanVal) {
      setYearError("");
      setSelectedYear("");
      return;
    }

    if (cleanVal.length === 4) {
      const numYear = parseInt(cleanVal, 10);
      if (numYear >= 1950 && numYear <= 2030) {
        setYearError("");
        setSelectedYear(cleanVal);
      } else {
        setYearError("بین ۱۹۵۰ تا ۲۰۳۰ وارد کنید");
      }
    } else {
      setYearError("");
    }
  };

  const movieCount = results.filter((i) => i.media_type === "movie").length;
  const tvCount = results.filter((i) => i.media_type === "tv").length;
  const animCount = results.filter((i) => i.genre_ids.includes(16)).length;

  return (
    <div className="container mx-auto px-4 md:px-8 py-10 space-y-10 max-w-6xl">
      {/* Top Title & Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight">
          جستجوی پیشرفته فیلم، سریال و انیمیشن
        </h1>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
          عنوان دلخواه خود را بنویسید یا با ترکیب فیلترهای هوشمند، اثر مورد نظر خود را دقیقاً پیدا کنید.
        </p>
      </div>

      {/* VengeanceUI Advanced Search Console (Embedded seamlessly without duplicate borders) */}
      <div className="w-full max-w-4xl mx-auto">
        <SearchModal
          modal={false}
          defaultShowFilters={false}
          initialFilters={{
            query,
            mediaType,
            genre: selectedGenre,
            year: selectedYear,
            country: selectedCountry,
            rating: minRating,
            sortBy,
            lang: searchLang,
          }}
          onApplyFilters={(newFilters: SearchFilterState) => {
            setQuery(newFilters.query);
            setMediaType(newFilters.mediaType);
            setSelectedGenre(newFilters.genre);
            setSelectedYear(newFilters.year);
            setYearInput(newFilters.year);
            setSelectedCountry(newFilters.country);
            setMinRating(newFilters.rating);
            setSortBy(newFilters.sortBy);
            setSearchLang(newFilters.lang);

            executeSearch({
              query: newFilters.query,
              mediaType: newFilters.mediaType,
              selectedGenre: newFilters.genre,
              selectedYear: newFilters.year,
              selectedCountry: newFilters.country,
              minRating: newFilters.rating,
              sortBy: newFilters.sortBy,
              searchLang: newFilters.lang,
            });
          }}
        />
      </div>

      {/* Results Section (ONLY shown after search has been performed) */}
      {hasSearched ? (
        <div className="space-y-6">
          {/* Result Count Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/60 border border-border/70 rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">دسته‌بندی نتایج:</span>
              <span className="text-xs font-bold text-foreground bg-muted/60 px-2.5 py-1 rounded-lg">
                همه: {results.length}
              </span>
              {animCount > 0 && (
                <span className="text-xs font-bold text-pink-400 bg-pink-500/10 px-2.5 py-1 rounded-lg">
                  انیمیشن: {animCount}
                </span>
              )}
              {movieCount > 0 && (
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                  فیلم: {movieCount}
                </span>
              )}
              {tvCount > 0 && (
                <span className="text-xs font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-lg">
                  سریال: {tvCount}
                </span>
              )}
            </div>

            <div className="text-xs text-muted-foreground">
              {results.length > 0 ? (
                <span>
                  نمایش <b className="text-foreground">{results.length}</b> عنوان منطبق
                </span>
              ) : (
                <span>هیچ عنوانی یافت نشد</span>
              )}
            </div>
          </div>

          {/* Media Grid */}
          <MediaGrid
            items={results}
            isLoading={isLoading}
            emptyTitle="اثری با این مشخصات یافت نشد"
            emptyDescription="می‌توانید فیلتر کشور، سال یا حداقل امتیاز را کمتر کنید یا کلمات جستجو را تغییر دهید."
          />
        </div>
      ) : (
        /* Clean Welcome State when nothing searched yet */
        <div className="text-center py-16 px-4 border border-dashed border-border/80 rounded-3xl bg-card/20 space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 mx-auto">
            <Compass className="h-8 w-8 stroke-[2]" />
          </div>
          <h3 className="text-lg font-bold text-foreground">
            فیلترها و کلمات مورد نظر خود را وارد کنید
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            پس از مشخص کردن عنوان یا انتخاب فیلترهای بالا، روی دکمه «جستجو و اعمال فیلترها» بزنید تا بین تمامی فیلم‌ها، سریال‌ها و انیمیشن‌ها جستجو شود.
          </p>
        </div>
      )}
    </div>
  );
}
