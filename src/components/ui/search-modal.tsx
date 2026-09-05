"use client";

import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  X,
  Sparkles,
  Film,
  Tv,
  Calendar,
  Star,
  Globe,
  ChevronLeft,
  Loader2,
  Check,
  Flame,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { UnifiedMedia } from "@/lib/tmdb-types";
import { getImageUrl } from "@/lib/tmdb";
import { POPULAR_COUNTRIES } from "@/components/filters/filter-sidebar";
import { Slider } from "@/components/ui/slider";

export interface SearchFilterState {
  query: string;
  mediaType: "all" | "movie" | "tv" | "animation";
  genre: string;
  year: string;
  country: string;
  rating: number;
  sortBy: string;
  lang: "all" | "fa" | "en";
}

export interface SearchModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  defaultShowFilters?: boolean;
  initialFilters?: Partial<SearchFilterState>;
  onApplyFilters?: (filters: SearchFilterState) => void;
  hotkey?: string | null;
  closeOnEscape?: boolean;
  className?: string;
  modal?: boolean;
}

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

const POPULAR_YEARS = ["2026", "2025", "2024", "2023", "2022", "2021", "2020", "2018", "2015", "2010"];

const SORT_OPTIONS = [
  { value: "popularity.desc", label: "محبوب‌ترین" },
  { value: "vote_average.desc", label: "بالاترین امتیاز" },
  { value: "primary_release_date.desc", label: "جدیدترین تاریخ انتشار" },
  { value: "vote_count.desc", label: "بیشترین تعداد آرا" },
];

const QUICK_ACTIONS = [
  {
    label: "انیمیشن‌های برتر ۲۰۲۴ و ۲۰۲۵",
    icon: <Sparkles className="h-3.5 w-3.5 text-amber-400" />,
    filters: { mediaType: "animation" as const, year: "2024" },
  },
  {
    label: "فیلم‌های سینمایی جدید ۲۰۲۵",
    icon: <Film className="h-3.5 w-3.5 text-blue-400" />,
    filters: { mediaType: "movie" as const, year: "2025" },
  },
  {
    label: "سریال‌های درام و پرطرفدار",
    icon: <Tv className="h-3.5 w-3.5 text-emerald-400" />,
    filters: { mediaType: "tv" as const, genre: "18" },
  },
  {
    label: "سینمای برگزیده ایران",
    icon: <Flame className="h-3.5 w-3.5 text-rose-400" />,
    filters: { country: "IR", sortBy: "vote_average.desc" },
  },
];

export function SearchModal({
  open,
  onOpenChange,
  defaultOpen = false,
  defaultShowFilters = false,
  initialFilters,
  onApplyFilters,
  hotkey = "k",
  closeOnEscape = true,
  className,
  modal = true,
}: SearchModalProps) {
  const router = useRouter();

  // Filters state
  const [query, setQuery] = useState(initialFilters?.query || "");
  const [mediaType, setMediaType] = useState<"all" | "movie" | "tv" | "animation">(
    initialFilters?.mediaType || "all"
  );
  const [selectedGenre, setSelectedGenre] = useState(initialFilters?.genre || "");
  const [selectedYear, setSelectedYear] = useState(initialFilters?.year || "");
  const [yearInput, setYearInput] = useState(initialFilters?.year || "");
  const [selectedCountry, setSelectedCountry] = useState(initialFilters?.country || "");
  const [minRating, setMinRating] = useState(initialFilters?.rating || 0);
  const [sortBy, setSortBy] = useState(initialFilters?.sortBy || "popularity.desc");
  const [searchLang, setSearchLang] = useState<"all" | "fa" | "en">(initialFilters?.lang || "all");

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(defaultShowFilters);
  const [liveResults, setLiveResults] = useState<UnifiedMedia[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Controlled vs internal open state
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const actualOpen = isControlled ? open : internalOpen;

  // Keep state in sync with initialFilters whenever it changes or modal opens
  useEffect(() => {
    if (initialFilters) {
      if (initialFilters.query !== undefined) setQuery(initialFilters.query);
      if (initialFilters.mediaType !== undefined) setMediaType(initialFilters.mediaType);
      if (initialFilters.genre !== undefined) setSelectedGenre(initialFilters.genre);
      if (initialFilters.year !== undefined) {
        setSelectedYear(initialFilters.year);
        setYearInput(initialFilters.year);
      }
      if (initialFilters.country !== undefined) setSelectedCountry(initialFilters.country);
      if (initialFilters.rating !== undefined) setMinRating(initialFilters.rating);
      if (initialFilters.sortBy !== undefined) setSortBy(initialFilters.sortBy);
      if (initialFilters.lang !== undefined) setSearchLang(initialFilters.lang);
    }
  }, [initialFilters, actualOpen]);

  const setOpen = useCallback(
    (value: boolean) => {
      if (!isControlled) setInternalOpen(value);
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange]
  );

  const openRef = useRef(actualOpen);
  const setOpenRef = useRef(setOpen);
  useEffect(() => {
    openRef.current = actualOpen;
    setOpenRef.current = setOpen;
  });

  // ⌘K / Ctrl+K to toggle, Escape to close
  useEffect(() => {
    if (!modal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (hotkey && e.key.toLowerCase() === hotkey.toLowerCase() && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpenRef.current(!openRef.current);
      } else if (closeOnEscape && e.key === "Escape" && openRef.current) {
        setOpenRef.current(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modal, hotkey, closeOnEscape]);

  // Focus input when modal opens
  useEffect(() => {
    if (actualOpen) {
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [actualOpen]);

  // Live search debounced
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setLiveResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/tmdb/search/multi?query=${encodeURIComponent(trimmed)}&page=1`);
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        let items: UnifiedMedia[] = (data.results || []).filter(
          (i: UnifiedMedia) => i.media_type === "movie" || i.media_type === "tv"
        );

        if (mediaType === "movie") {
          items = items.filter((i) => i.media_type === "movie" && !i.genre_ids?.includes(16));
        } else if (mediaType === "tv") {
          items = items.filter((i) => i.media_type === "tv" && !i.genre_ids?.includes(16));
        } else if (mediaType === "animation") {
          items = items.filter((i) => i.genre_ids?.includes(16));
        }

        if (selectedGenre) {
          items = items.filter((i) => i.genre_ids?.includes(Number(selectedGenre)));
        }

        setLiveResults(items.slice(0, 6));
      } catch {
        setLiveResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query, mediaType, selectedGenre]);

  const handleApply = () => {
    const filters: SearchFilterState = {
      query,
      mediaType,
      genre: selectedGenre,
      year: selectedYear,
      country: selectedCountry,
      rating: minRating,
      sortBy,
      lang: searchLang,
    };
    onApplyFilters?.(filters);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleApply();
    }
  };

  // Compute active filter tags
  const activeTags = useMemo(() => {
    const list: { id: string; label: string; onRemove: () => void }[] = [];

    if (mediaType !== "all") {
      const typeLabel = mediaType === "movie" ? "فیلم سینمایی" : mediaType === "tv" ? "سریال" : "انیمیشن";
      list.push({ id: "mediaType", label: `نوع: ${typeLabel}`, onRemove: () => setMediaType("all") });
    }

    if (selectedGenre) {
      const g = SEARCH_GENRES.find((item) => String(item.id) === selectedGenre);
      if (g) {
        list.push({ id: "genre", label: `ژانر: ${g.name}`, onRemove: () => setSelectedGenre("") });
      }
    }

    if (selectedYear) {
      list.push({
        id: "year",
        label: `سال: ${selectedYear}`,
        onRemove: () => {
          setSelectedYear("");
          setYearInput("");
        },
      });
    }

    if (selectedCountry) {
      const c = POPULAR_COUNTRIES.find((item) => item.code === selectedCountry);
      if (c) {
        list.push({ id: "country", label: `کشور: ${c.name}`, onRemove: () => setSelectedCountry("") });
      }
    }

    if (minRating > 0) {
      list.push({ id: "rating", label: `امتیاز: ${minRating}+`, onRemove: () => setMinRating(0) });
    }

    if (searchLang !== "all") {
      list.push({
        id: "lang",
        label: searchLang === "fa" ? "فقط فارسی" : "English",
        onRemove: () => setSearchLang("all"),
      });
    }

    return list;
  }, [mediaType, selectedGenre, selectedYear, selectedCountry, minRating, searchLang]);

  const panel = (
    <div
      role={modal ? "dialog" : undefined}
      aria-modal={modal ? true : undefined}
      className={cn(
        "mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border backdrop-blur-2xl transition-all",
        "border-border/80 bg-card/95 text-card-foreground shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)]",
        className
      )}
    >
      {/* Search Bar Input */}
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3.5 bg-muted/20">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Search className="h-4 w-4" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="عنوان فارسی یا انگلیسی، نام کارگردان یا بازیگر..."
          aria-label="Search"
          className="min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 font-medium"
        />

        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear query"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {isLoading && (
          <div className="px-1 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
          </div>
        )}

        <div className="flex shrink-0 items-center gap-2">
          {/* Advanced Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setShowAdvancedFilters((prev) => !prev)}
            aria-label="Filters"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border",
              showAdvancedFilters
                ? "bg-amber-500 text-neutral-950 border-amber-500 shadow-sm"
                : "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border-border/70"
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">فیلترهای پیشرفته</span>
          </button>

          {/* Hotkey Indicator */}
          {modal && hotkey && (
            <kbd className="hidden sm:flex items-center gap-0.5 rounded-lg border border-border/80 bg-muted/40 px-2 py-1 font-mono text-[11px] font-medium text-muted-foreground">
              <span className="text-[12px] leading-none">⌘</span>
              {hotkey.toUpperCase()}
            </kbd>
          )}
        </div>
      </div>

      {/* Active Filter Tags */}
      {activeTags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap px-4 py-2.5 border-b border-border/40 bg-muted/10">
          <span className="text-[11px] text-muted-foreground font-medium me-1">فیلترهای فعال:</span>
          {activeTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"
            >
              <span>{tag.label}</span>
              <button
                type="button"
                onClick={tag.onRemove}
                aria-label={`حذف ${tag.label}`}
                className="hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => {
              setMediaType("all");
              setSelectedGenre("");
              setSelectedYear("");
              setYearInput("");
              setSelectedCountry("");
              setMinRating(0);
              setSearchLang("all");
            }}
            className="text-[10px] text-muted-foreground hover:text-foreground hover:underline me-auto cursor-pointer"
          >
            پاک کردن همه
          </button>
        </div>
      )}

      {/* Collapsible Advanced Filters Drawer */}
      <AnimatePresence initial={false}>
        {showAdvancedFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="border-b border-border/60 bg-card/60 p-4 sm:p-5 space-y-4 overflow-hidden"
          >
            {/* Row 1: Media Type & Language */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Media Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">نوع اثر</label>
                <div className="grid grid-cols-4 gap-1 p-1 bg-muted/40 rounded-xl border border-border/60">
                  <button
                    type="button"
                    onClick={() => setMediaType("all")}
                    className={cn(
                      "py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center",
                      mediaType === "all" ? "bg-amber-500 text-black shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    همه
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaType("movie")}
                    className={cn(
                      "py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center",
                      mediaType === "movie" ? "bg-amber-500 text-black shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    فیلم
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaType("tv")}
                    className={cn(
                      "py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center",
                      mediaType === "tv" ? "bg-amber-500 text-black shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    سریال
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaType("animation")}
                    className={cn(
                      "py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center",
                      mediaType === "animation" ? "bg-amber-500 text-black shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    انیمیشن
                  </button>
                </div>
              </div>

              {/* Language */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">زبان عنوان</label>
                <div className="grid grid-cols-3 gap-1 p-1 bg-muted/40 rounded-xl border border-border/60">
                  <button
                    type="button"
                    onClick={() => setSearchLang("all")}
                    className={cn(
                      "py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center",
                      searchLang === "all" ? "bg-amber-500 text-black shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    همه
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchLang("fa")}
                    className={cn(
                      "py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center",
                      searchLang === "fa" ? "bg-amber-500 text-black shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    فارسی
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchLang("en")}
                    className={cn(
                      "py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center font-mono",
                      searchLang === "en" ? "bg-amber-500 text-black shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    English
                  </button>
                </div>
              </div>
            </div>

            {/* Row 2: Year & IMDb Rating & Country & Sort */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Year */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground">سال ساخت</label>
                  {selectedYear && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedYear("");
                        setYearInput("");
                      }}
                      className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                    >
                      پاک کردن
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="مثلاً 2025"
                  value={yearInput}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setYearInput(v);
                    if (v.length === 4) {
                      setSelectedYear(v);
                    } else if (v.length === 0) {
                      setSelectedYear("");
                    }
                  }}
                  className="w-full h-8 px-3 text-xs rounded-xl bg-muted/40 border border-border/70 text-right font-mono outline-none focus:border-amber-400"
                />
                <div className="flex flex-wrap gap-1 pt-1">
                  {POPULAR_YEARS.slice(0, 4).map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => {
                        const next = selectedYear === y ? "" : y;
                        setSelectedYear(next);
                        setYearInput(next);
                      }}
                      className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-mono transition-colors cursor-pointer",
                        selectedYear === y ? "bg-amber-500 text-black font-bold" : "bg-muted/60 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>

              {/* IMDb Rating */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-muted-foreground">حداقل امتیاز</label>
                  <span className="font-bold text-amber-400 text-[11px] bg-amber-500/10 px-1.5 py-0.5 rounded">
                    {minRating > 0 ? `${minRating}+` : "همه"}
                  </span>
                </div>
                <div className="pt-2">
                  <Slider
                    value={[minRating]}
                    min={0}
                    max={9}
                    step={0.5}
                    onValueChange={(vals) => setMinRating(vals[0])}
                    className="py-1 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground px-0.5 pt-1">
                    <span>۰</span>
                    <span>۵</span>
                    <span>۹+</span>
                  </div>
                </div>
              </div>

              {/* Country */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">کشور سازنده</label>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full h-8 px-2 text-xs rounded-xl bg-muted/40 border border-border/70 text-foreground outline-none focus:border-amber-400"
                >
                  <option value="">همه کشورها</option>
                  {POPULAR_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">مرتب‌سازی نتایج</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full h-8 px-2 text-xs rounded-xl bg-muted/40 border border-border/70 text-foreground outline-none focus:border-amber-400"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Genres */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground">دسته‌بندی و ژانر</label>
                {selectedGenre && (
                  <button
                    type="button"
                    onClick={() => setSelectedGenre("")}
                    className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                  >
                    پاک کردن ژانر
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SEARCH_GENRES.map((g) => {
                  const isSelected = selectedGenre === String(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setSelectedGenre(isSelected ? "" : String(g.id))}
                      className={cn(
                        "rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer",
                        isSelected
                          ? "bg-amber-500 text-black font-bold shadow-sm"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {g.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Results Preview */}
      {liveResults.length > 0 && (
        <div className="border-b border-border/60 max-h-72 overflow-y-auto">
          <p className="px-4 pt-3 pb-1.5 text-xs text-muted-foreground font-semibold flex items-center justify-between">
            <span>نتایج زنده پیشنهادی</span>
            <span className="text-[11px] font-mono text-amber-400">{liveResults.length} اثر</span>
          </p>
          <ul className="p-2 space-y-1">
            {liveResults.map((item) => {
              const href = item.media_type === "tv" ? `/tv/${item.id}` : `/movies/${item.id}`;
              const year = (item.release_date || "").split("-")[0];
              const isAnim = item.genre_ids?.includes(16);

              return (
                <li key={`${item.media_type}-${item.id}`}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    className="group flex items-center justify-between gap-3 p-2 rounded-2xl hover:bg-muted/60 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative h-12 w-9 rounded-lg overflow-hidden shrink-0 bg-muted border border-border/40 shadow-xs">
                        <Image
                          src={getImageUrl(item.poster_path, "w300")}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-foreground truncate group-hover:text-amber-400 transition-colors">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                          {item.original_title && item.original_title !== item.title && (
                            <span className="truncate max-w-[150px] font-mono">{item.original_title}</span>
                          )}
                          {year && <span>• {year}</span>}
                          <span
                            className={cn(
                              "px-1.5 py-0.2 rounded font-semibold",
                              isAnim
                                ? "bg-pink-500/10 text-pink-400"
                                : item.media_type === "tv"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-blue-500/10 text-blue-400"
                            )}
                          >
                            {isAnim ? "انیمیشن" : item.media_type === "tv" ? "سریال" : "فیلم"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.vote_average > 0 && (
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg">
                          <Star className="h-3 w-3 fill-amber-400" />
                          <span>{item.vote_average.toFixed(1)}</span>
                        </div>
                      )}
                      <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:-translate-x-1 group-hover:text-foreground transition-transform" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Quick Action Suggestions */}
      <div className="p-3 sm:p-4 bg-muted/10">
        <p className="px-2 pb-2 text-xs font-semibold text-muted-foreground">پیشنهادات و فیلترهای سریع</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {QUICK_ACTIONS.map((action, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (action.filters.mediaType) setMediaType(action.filters.mediaType);
                if (action.filters.year) {
                  setSelectedYear(action.filters.year);
                  setYearInput(action.filters.year);
                }
                if (action.filters.genre) setSelectedGenre(action.filters.genre);
                if (action.filters.country) setSelectedCountry(action.filters.country);
                if (action.filters.sortBy) setSortBy(action.filters.sortBy);
                setShowAdvancedFilters(true);
              }}
              className="flex items-center gap-2.5 p-2 rounded-xl text-right hover:bg-muted/60 transition-colors border border-border/40 text-xs font-medium cursor-pointer group"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted/60 group-hover:bg-amber-500/10 transition-colors">
                {action.icon}
              </span>
              <span className="truncate text-muted-foreground group-hover:text-foreground transition-colors">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Footer Action: Search Button */}
      <div className="flex items-center justify-between gap-3 p-3 sm:p-4 border-t border-border/60 bg-muted/30">
        <p className="text-[11px] text-muted-foreground hidden sm:block">
          برای جستجو کلید <kbd className="px-1.5 py-0.5 rounded bg-muted border font-mono">Enter</kbd> را بزنید
        </p>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {modal && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
            >
              انصراف
            </button>
          )}
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-xs font-bold bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <Search className="h-4 w-4" />
            <span>مشاهده نتایج جستجو</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (!modal) return panel;

  return (
    <AnimatePresence>
      {actualOpen && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[10vh] overflow-y-auto"
        >
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-2xl"
          >
            {panel}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default SearchModal;
