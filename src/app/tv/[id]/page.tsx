import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTVDetails, getImageUrl, toUnifiedMedia } from "@/lib/tmdb";
import { HeroBackdrop } from "@/components/detail/hero-backdrop";
import { SeasonList } from "@/components/detail/season-list";
import { CastCarousel } from "@/components/detail/cast-carousel";
import { MediaGallery } from "@/components/detail/media-gallery";
import { MediaCarousel } from "@/components/media/media-carousel";
import { Sparkles } from "lucide-react";

interface TVPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: TVPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const tv = await getTVDetails(id);
    return {
      title: `${tv.name} (${tv.first_air_date?.slice(0, 4) || ""})`,
      description:
        tv.overview ||
        `مشاهده اطلاعات، فصل‌ها، قسمت‌ها، بازیگران و امتیاز سریال ${tv.name} در فیلمینو.`,
      openGraph: {
        title: tv.name,
        description: tv.overview,
        images: tv.poster_path ? [getImageUrl(tv.poster_path, "w780")] : [],
      },
    };
  } catch {
    return { title: "سریال یافت نشد" };
  }
}

export default async function TVDetailPage({ params }: TVPageProps) {
  const { id } = await params;

  let tv;
  try {
    tv = await getTVDetails(id);
  } catch (error) {
    console.error("Failed to load TV show:", error);
    notFound();
  }

  const similarItems = (tv.similar?.results || []).map((t) =>
    toUnifiedMedia(t, "tv")
  );

  const isAnimation =
    tv.genres?.some(
      (g) =>
        g.id === 16 ||
        g.name?.includes("انیمیشن") ||
        g.name?.toLowerCase().includes("animation")
    ) ?? false;

  return (
    <div className="flex flex-col min-h-screen pb-16 space-y-12">
      {/* Hero Backdrop & Details */}
      <HeroBackdrop media={tv} type="tv" />

      <div className="container mx-auto px-4 md:px-8 space-y-12">
        {/* Seasons & Episodes Explorer */}
        {tv.seasons && tv.seasons.length > 0 && (
          <SeasonList tvId={tv.id} seasons={tv.seasons} />
        )}

        {/* Cast Carousel */}
        {tv.credits?.cast && (
          <CastCarousel cast={tv.credits.cast} isAnimation={isAnimation} />
        )}

        {/* Gallery */}
        {tv.images && (
          <MediaGallery images={tv.images} title={tv.name} />
        )}

        {/* Similar TV Shows */}
        {similarItems.length > 0 && (
          <div className="pt-6 border-t border-border/40">
            <MediaCarousel
              title="سریال‌های مشابه و پیشنهادی"
              subtitle="اگر از این سریال لذت بردید، این عناوین نیز ممکن است برای شما جذاب باشند"
              items={similarItems}
              icon={<Sparkles className="h-5 w-5 text-sky-400" />}
            />
          </div>
        )}
      </div>
    </div>
  );
}
