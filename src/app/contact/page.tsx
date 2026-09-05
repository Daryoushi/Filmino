import { Metadata } from "next";
import { StaggeredGrid, BentoItem } from "@/components/ui/staggered-grid";
import { FaTelegram, FaLinkedin, FaGithub, FaEnvelope, FaHeadset } from "react-icons/fa";

export const metadata: Metadata = {
  title: "ارتباط با ما | فیلمینو (Filmino)",
  description:
    "راه‌های ارتباطی، پشتیبانی، شبکه‌های اجتماعی و ارسال پیشنهادات برای پروژه فیلمینو",
};

export default function ContactPage() {
  const bentoItems: BentoItem[] = [
    {
      id: "telegram-channel",
      title: "کانال تلگرام",
      description: "@daryoushi_dev - اخبار، اطلاعیه‌ها و بروزرسانی‌ها",
      icon: <FaTelegram className="w-5 h-5" />,
      image: "/images/telegram-channel.jpg",
      href: "https://t.me/daryoushi_dev",
    },
    {
      id: "telegram-support",
      title: "پشتیبانی تلگرام",
      description: "@A_Daryoushi - ارسال مستقیم پیام و پشتیبانی",
      icon: <FaHeadset className="w-5 h-5" />,
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80",
      href: "https://t.me/A_Daryoushi",
    },
    {
      id: "github",
      title: "گیت‌هاب پروژه",
      description: "Daryoushi/Filmino - سورس کد متن‌باز فیلمینو",
      icon: <FaGithub className="w-5 h-5" />,
      image:
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
      href: "https://github.com/Daryoushi/Filmino",
    },
    {
      id: "linkedin",
      title: "پروفایل لینکدین",
      description: "Abalfazl Daryoushi - ارتباط حرفه‌ای و شبکه‌سازی",
      icon: <FaLinkedin className="w-5 h-5" />,
      image:
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80",
      href: "https://www.linkedin.com/in/abalfazl-daryoushi",
    },
    {
      id: "email",
      title: "ایمیل و مکاتبات",
      description: "abalfazl.daryoushi37073@gmail.com - ارسال مستقیم پیام و ایمیل",
      icon: <FaEnvelope className="w-5 h-5" />,
      image:
        "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=800&auto=format&fit=crop&q=80",
      href: "mailto:abalfazl.daryoushi37073@gmail.com",
    },
  ];

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] py-6 space-y-3 overflow-hidden">
      {/* Top Welcome Title */}
      <div className="container mx-auto px-4 text-center space-y-3 max-w-2xl">
        <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight">
          ارتباط با ما و شبکه همکاران
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
          برای تعامل مستقیم، دریافت پشتیبانی یا همکاری در توسعه محتوا یا طراحی و برنامه نویسی، میتوانید از بخش کارتهای تعاملی زیر استفاده نمایید.
        </p>
      </div>

      {/* GSAP Staggered Grid with ScrollTrigger */}
      <div className="w-full">
        <StaggeredGrid
          centerText="FILMINO"
          bentoItems={bentoItems}
          credits={{
            moreDemos: { text: "کاوش در آرشیو فیلم‌ها ←", href: "/browse" },
          }}
        />
      </div>
    </div>
  );
}
