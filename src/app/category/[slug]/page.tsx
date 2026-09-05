import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BROWSE_GENRES, discoverMedia } from "@/lib/tmdb";
import { PaginatedResponse, UnifiedMedia } from "@/lib/tmdb-types";
import { CategoryClient } from "./category-client";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const genre = BROWSE_GENRES.find((g) => g.slug === slug);
  if (!genre) return { title: "دسته‌بندی یافت نشد" };

  return {
    title: `${genre.name} | برترین آثار دسته‌بندی ${genre.name}`,
    description: `مشاهده و بررسی محبوب‌ترین و برترین فیلم‌ها و سریال‌های ژانر ${genre.name} در فیلمینو.`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page || 1);
  const sort = (resolvedSearchParams.sort as string) || "popularity.desc";
  const country = (resolvedSearchParams.country as string) || "";
  const year = (resolvedSearchParams.year as string) || "";
  const rating = Number(resolvedSearchParams.rating || 0);
  const type = (resolvedSearchParams.type as "movie" | "tv") || "movie";

  const genre = BROWSE_GENRES.find((g) => g.slug === slug);
  if (!genre) {
    notFound();
  }

  let data: PaginatedResponse<UnifiedMedia> = { page: 1, results: [], total_pages: 1, total_results: 0 };
  try {
    data = await discoverMedia({
      type,
      genre: genre.id,
      sortBy: sort,
      country: country || undefined,
      year: year || undefined,
      voteAverageGte: rating > 0 ? rating : undefined,
      page,
    });
  } catch (e) {
    console.error(`Category ${slug} fetch error:`, e);
  }

  return (
    <CategoryClient
      slug={slug}
      genreName={genre.name}
      genreId={genre.id}
      initialItems={data.results}
      initialTotalPages={Math.min(data.total_pages || 1, 500)}
      initialTotalResults={data.total_results || 0}
    />
  );
}
