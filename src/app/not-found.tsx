import Link from "next/link";
import { Film, Home, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="relative mb-6">
        <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-xl shadow-amber-500/5">
          <Film className="h-14 w-14 stroke-[1.5]" />
        </div>
        <span className="absolute -bottom-2 -end-2 flex h-8 px-2.5 items-center justify-center rounded-full bg-amber-500 text-xs font-black text-black">
          ۴۰۴
        </span>
      </div>

      <h1 className="text-3xl md:text-4xl font-black text-foreground mb-3">
        صفحه مورد نظر پیدا نشد!
      </h1>
      <p className="max-w-md text-sm md:text-base text-muted-foreground mb-8 leading-relaxed">
        به نظر می‌رسد این صحنه از فیلم کات خورده است! آدرس وارد شده اشتباه است یا
        محتوای مورد نظر جابه‌جا شده است.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild variant="cinema" size="lg" className="rounded-xl gap-2">
          <Link href="/">
            <Home className="h-4 w-4" />
            <span>بازگشت به صفحه اصلی</span>
          </Link>
        </Button>

        <Button asChild variant="outline" size="lg" className="rounded-xl gap-2">
          <Link href="/browse">
            <Compass className="h-4 w-4" />
            <span>کاوش فیلم و سریال</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
