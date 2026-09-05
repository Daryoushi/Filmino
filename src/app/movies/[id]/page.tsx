import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMovieDetails, getImageUrl, toUnifiedMedia } from "@/lib/tmdb";
import { HeroBackdrop } from "@/components/detail/hero-backdrop";
import { CastCarousel } from "@/components/detail/cast-carousel";
import { MediaGallery } from "@/components/detail/media-gallery";
import { MediaCarousel } from "@/components/media/media-carousel";
import { Sparkles } from "lucide-react";

interface MoviePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: MoviePageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const movie = await getMovieDetails(id);
    return {
      title: `${movie.title} (${movie.release_date?.slice(0, 4) || ""})`,
      description:
        movie.overview ||
        `مشاهده اطلاعات، بازیگران، تریلر و امتیاز فیلم ${movie.title} در فیلمینو.`,
      openGraph: {
        title: movie.title,
        description: movie.overview,
        images: movie.poster_path ? [getImageUrl(movie.poster_path, "w780")] : [],
      },
    };
  } catch {
    return { title: "فیلم یافت نشد" };
  }
}

export default async function MovieDetailPage({ params }: MoviePageProps) {
  const { id } = await params;

  let movie;
  try {
    movie = await getMovieDetails(id);
  } catch (error) {
    console.error("Failed to load movie:", error);
    notFound();
  }

  const similarItems = (movie.similar?.results || []).map((m) =>
    toUnifiedMedia(m, "movie")
  );

  const isAnimation =
    movie.genres?.some(
      (g) =>
        g.id === 16 ||
        g.name?.includes("انیمیشن") ||
        g.name?.toLowerCase().includes("animation")
    ) ?? false;

  return (
    <div className="flex flex-col min-h-screen pb-16 space-y-12">
      {/* Hero Backdrop & Details */}
      <HeroBackdrop media={movie} type="movie" />

      <div className="container mx-auto px-4 md:px-8 space-y-12">
        {/* Cast & Crew Carousel */}
        {movie.credits?.cast && (
          <CastCarousel cast={movie.credits.cast} isAnimation={isAnimation} />
        )}

        {/* Gallery */}
        {movie.images && (
          <MediaGallery images={movie.images} title={movie.title} />
        )}

        {/* Similar Movies */}
        {similarItems.length > 0 && (
          <div className="pt-6 border-t border-border/40">
            <MediaCarousel
              title="فیلم‌های مشابه و پیشنهادی"
              subtitle="اگر از این فیلم لذت بردید، شاید این آثار را نیز بپسندید"
              items={similarItems}
              icon={<Sparkles className="h-5 w-5 text-amber-400" />}
            />
          </div>
        )}
      </div>
    </div>
  );
}
