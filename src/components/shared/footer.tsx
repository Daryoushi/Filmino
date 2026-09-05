import Link from "next/link";
import Image from "next/image";
import { Heart, Compass, Sparkles } from "lucide-react";
import { BROWSE_GENRES } from "@/lib/tmdb";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-card/40 backdrop-blur-md pt-12 pb-8 mt-16 text-muted-foreground text-sm">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand & Info */}
          <div className="md:col-span-2 space-y-4">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-black text-xl text-foreground"
            >
              <div className="relative h-8 w-6 shrink-0">
                <Image
                  src="/images/filmino-icon.png"
                  alt="لوگوی فیلمینو"
                  width={32}
                  height={42}
                  className="h-full w-auto object-contain"
                />
              </div>
              <span className="text-foreground">
                فیلمینو (Filmino)
              </span>
            </Link>
            <p className="text-sm leading-relaxed max-w-md text-muted-foreground/90">
              ویترین جامع، مدرن و شکیل برای مرور هزاران فیلم، سریال و انیمیشن برتر جهان با دسترسی به تمام فیلم ها و سریال های به روز و جذاب.
            </p>
          </div>

          {/* Quick Categories */}
          <div className="space-y-3">
            <h4 className="font-bold text-foreground text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>ژانرهای محبوب</span>
            </h4>
            <ul className="space-y-2 text-xs">
              {BROWSE_GENRES.slice(0, 5).map((genre) => (
                <li key={genre.slug}>
                  <Link
                    href={`/category/${genre.slug}`}
                    className="hover:text-amber-400 transition-colors"
                  >
                    {genre.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-foreground text-base flex items-center gap-2">
              <Compass className="h-4 w-4 text-amber-500" />
              <span>دسترسی سریع</span>
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/browse?type=movie"
                  className="hover:text-amber-400 transition-colors"
                >
                  فیلم‌های سینمایی
                </Link>
              </li>
              <li>
                <Link
                  href="/browse?type=tv"
                  className="hover:text-amber-400 transition-colors"
                >
                  سریال‌های تلویزیونی
                </Link>
              </li>
              <li>
                <Link
                  href="/category/animation"
                  className="hover:text-amber-400 transition-colors"
                >
                  دنیای انیمیشن
                </Link>
              </li>
              <li>
                <Link
                  href="/watchlist"
                  className="hover:text-amber-400 transition-colors"
                >
                  لیست علاقه‌مندی‌ها
                </Link>
              </li>
              <li>
                <Link
                  href="/search"
                  className="hover:text-amber-400 transition-colors"
                >
                  جستجوی پیشرفته
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: centered credit */}
        <div className="border-t border-border/40 pt-6 flex items-center justify-center text-xs text-muted-foreground/80">
          <p dir="ltr" className="text-center font-medium tracking-wide">
            desing and develop with ❤️ by Daryoushi.
          </p>
        </div>
      </div>
    </footer>
  );
}
