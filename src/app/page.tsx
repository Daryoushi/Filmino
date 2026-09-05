import {
  getTrending,
  getNowPlayingMovies,
  getPopularMovies,
  getTopRatedTV,
  getAnimationHighlights,
  getUpcomingMovies,
} from "@/lib/tmdb";
import { MovieShowcase } from "@/components/home/movie-showcase-3d";
import { MediaCarousel } from "@/components/media/media-carousel";
import { MediaRowSkeleton } from "@/components/media/media-card-skeleton";

export const revalidate = 3600; // Revalidate every hour

export default async function HomePage() {
  // Parallel fetch of all initial homepage showcases
  const [
    trending,
    nowPlaying,
    animations,
    topRatedTV,
    popularMovies,
    upcoming,
  ] = await Promise.all([
    getTrending("all", "week").catch(() => []),
    getNowPlayingMovies(1).then((r) => r.results).catch(() => []),
    getAnimationHighlights(1).then((r) => r.results).catch(() => []),
    getTopRatedTV(1).then((r) => r.results).catch(() => []),
    getPopularMovies(1).then((r) => r.results).catch(() => []),
    getUpcomingMovies(1).then((r) => r.results).catch(() => []),
  ]);

  return (
    <div className="flex flex-col min-h-screen pb-12">
      {/* Featured Showcase at the top (Replaced Hero Slider) */}
      <MovieShowcase items={trending} />

      {/* Row 1: Trending Weekly */}
      <MediaCarousel
        title="داغ‌ترین‌های این هفته"
        subtitle="محبوب‌ترین عناوین سینما و تلویزیون بر اساس آمار مخاطبان"
        items={trending}
        viewAllHref="/browse?sort=popularity.desc"
      />

      {/* Row 2: Animation Spotlight */}
      <div className="relative py-2 bg-secondary/20 border-y border-border/40 my-4">
        <MediaCarousel
          title="دنیای شگفت‌انگیز انیمیشن و کارتون"
          subtitle="برترین انیمیشن‌های محبوب و پرفروش برای تمام سنین"
          items={animations}
          viewAllHref="/category/animation"
        />
      </div>

      {/* Row 3: Now Playing in Theaters */}
      <MediaCarousel
        title="در حال اکران در سینماها"
        subtitle="جدیدترین فیلم‌های اکران شده روی پرده نقره‌ای"
        items={nowPlaying}
        viewAllHref="/browse?type=movie"
      />

      {/* Row 4: Top Rated TV Series */}
      <MediaCarousel
        title="برترین سریال‌های تلویزیونی"
        subtitle="شاهکارهای امتیازبندی شده توسط بینندگان در سراسر دنیا"
        items={topRatedTV}
        viewAllHref="/browse?type=tv&sort=vote_average.desc"
      />

      {/* Row 5: Popular Movies */}
      <MediaCarousel
        title="محبوب‌ترین فیلم‌های جهان"
        subtitle="پربازدیدترین آثار سینمایی تاریخ و دوران اخیر"
        items={popularMovies}
        viewAllHref="/browse?type=movie&sort=popularity.desc"
      />

      {/* Row 6: Upcoming Movies */}
      <MediaCarousel
        title="به زودی در سینماها"
        subtitle="مورد انتظارترین آثاری که به زودی منتشر می‌شوند"
        items={upcoming}
        viewAllHref="/browse?type=movie"
      />
    </div>
  );
}
