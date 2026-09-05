import { Suspense } from "react";
import type { Metadata } from "next";
import { discoverMedia } from "@/lib/tmdb";
import { PaginatedResponse, UnifiedMedia } from "@/lib/tmdb-types";
import { BrowseClient } from "./browse-client";
import { MediaRowSkeleton } from "@/components/media/media-card-skeleton";

export const metadata: Metadata = {
  title: "کاوش فیلم و سریال | فیلتر پیشرفته",
  description: "جستجو، مرتب‌سازی و فیلتر پیشرفته هزاران فیلم و سریال برتر جهان بر اساس ژانر، سال و امتیاز.",
};

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const type = (resolvedParams.type as "movie" | "tv") || "movie";
  const genre = (resolvedParams.genre as string) || "";
  const year = (resolvedParams.year as string) || "";
  const rating = Number(resolvedParams.rating || 0);
  const sort = (resolvedParams.sort as string) || "popularity.desc";
  const page = Number(resolvedParams.page || 1);

  let initialData: PaginatedResponse<UnifiedMedia> = { page: 1, results: [], total_pages: 1, total_results: 0 };
  try {
    initialData = await discoverMedia({
      type,
      genre,
      year,
      voteAverageGte: rating > 0 ? rating : undefined,
      sortBy: sort,
      page,
    });
  } catch (e) {
    console.error("Browse initial fetch error:", e);
  }

  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-12">
          <MediaRowSkeleton count={12} />
        </div>
      }
    >
      <BrowseClient
        initialItems={initialData.results}
        initialTotalPages={initialData.total_pages}
        initialTotalResults={initialData.total_results}
      />
    </Suspense>
  );
}
