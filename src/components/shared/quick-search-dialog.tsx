"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Loader2, Star, Film, Tv, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/use-debounce";
import { UnifiedMedia } from "@/lib/tmdb-types";
import { getImageUrl } from "@/lib/tmdb";

interface QuickSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickSearchDialog({
  open,
  onOpenChange,
}: QuickSearchDialogProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [results, setResults] = React.useState<UnifiedMedia[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!debouncedSearch.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);

    fetch(`/api/tmdb/search/multi?query=${encodeURIComponent(debouncedSearch)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled && data.results) {
          const filtered = data.results
            .filter(
              (item: { media_type?: string }) =>
                item.media_type === "movie" || item.media_type === "tv"
            )
            .slice(0, 8)
            .map((item: Record<string, unknown>) => ({
              id: item.id,
              title: item.title || item.name,
              poster_path: item.poster_path,
              release_date: item.release_date || item.first_air_date,
              vote_average: item.vote_average,
              media_type: item.media_type,
            }));
          setResults(filtered);
        }
      })
      .catch((err) => {
        console.error("Search error:", err);
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [debouncedSearch]);

  const handleSelect = (item: UnifiedMedia) => {
    onOpenChange(false);
    setSearchTerm("");
    const href =
      item.media_type === "tv" ? `/tv/${item.id}` : `/movies/${item.id}`;
    router.push(href);
  };

  const handleFullSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onOpenChange(false);
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-card/95 backdrop-blur-xl border-border/80 shadow-2xl">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="sr-only">جستجوی سریع فیلم و سریال</DialogTitle>
          <form onSubmit={handleFullSearch} className="relative flex items-center">
            <Search className="absolute start-3 h-5 w-5 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجوی فیلم، سریال، انیمیشن..."
              className="h-12 pe-12 ps-10 text-base bg-muted/40 border-0 focus-visible:ring-1 focus-visible:ring-amber-500 rounded-xl"
              autoFocus
            />
            {isLoading && (
              <Loader2 className="absolute end-3 h-5 w-5 animate-spin text-amber-500" />
            )}
          </form>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto px-4 py-3 space-y-1">
          {results.length > 0 ? (
            <div className="space-y-1">
              {results.map((item) => {
                const year = item.release_date
                  ? item.release_date.split("-")[0]
                  : null;
                const rating =
                  item.vote_average > 0 ? item.vote_average.toFixed(1) : null;

                return (
                  <button
                    key={`${item.id}-${item.media_type}`}
                    onClick={() => handleSelect(item)}
                    className="flex w-full items-center gap-3 p-2 rounded-xl text-start hover:bg-muted/70 transition-colors group cursor-pointer"
                  >
                    <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                      <Image
                        src={getImageUrl(item.poster_path, "w300")}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="flex flex-1 flex-col min-w-0">
                      <span className="font-semibold text-sm truncate text-foreground group-hover:text-amber-400 transition-colors">
                        {item.title}
                      </span>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Badge
                          variant="secondary"
                          className="px-1.5 py-0 text-[10px] gap-1"
                        >
                          {item.media_type === "tv" ? (
                            <>
                              <Tv className="h-2.5 w-2.5 text-sky-400" />
                              <span>سریال</span>
                            </>
                          ) : (
                            <>
                              <Film className="h-2.5 w-2.5 text-amber-400" />
                              <span>فیلم</span>
                            </>
                          )}
                        </Badge>
                        {year && <span dir="ltr">{year}</span>}
                      </div>
                    </div>

                    {rating && (
                      <div className="flex items-center gap-1 text-amber-400 text-xs font-semibold px-2">
                        <Star className="h-3 w-3 fill-amber-400" />
                        <span dir="ltr">{rating}</span>
                      </div>
                    )}
                  </button>
                );
              })}

              {searchTerm.trim() && (
                <button
                  onClick={handleFullSearch}
                  className="flex w-full items-center justify-between p-3 mt-2 rounded-xl border border-border/40 text-xs text-amber-400 hover:bg-amber-500/10 font-medium transition-colors cursor-pointer"
                >
                  <span>مشاهده همه نتایج برای «{searchTerm}»</span>
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : debouncedSearch.trim() && !isLoading ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              نتیجه‌ای برای «{debouncedSearch}» یافت نشد.
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-muted-foreground">
              نام فیلم، سریال یا انیمیشن مورد نظر خود را تایپ کنید
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
