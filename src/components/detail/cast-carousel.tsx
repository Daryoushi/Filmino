"use client";

import * as React from "react";
import { CastMember } from "@/lib/tmdb-types";
import { getImageUrl } from "@/lib/tmdb";
import { TeamRevealGrid, TeamRevealMember } from "@/components/ui/team-reveal-grid";

interface CastCarouselProps {
  cast: CastMember[];
  isAnimation?: boolean;
}

const ACCENTS = ["#fb4f43", "#ff7a45", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4"];

export function CastCarousel({ cast, isAnimation = false }: CastCarouselProps) {
  if (!cast || cast.length === 0) return null;

  // Filter cast with profile photos first, take top 6 to 12 actors
  const castWithImages = cast.filter((c) => !!c.profile_path);
  const displayCast = (castWithImages.length >= 6 ? castWithImages : cast).slice(0, 9);

  const [birthYears, setBirthYears] = React.useState<Record<number, string>>({});

  React.useEffect(() => {
    let isMounted = true;
    displayCast.forEach((member) => {
      if (!member.id || birthYears[member.id]) return;
      fetch(`/api/tmdb/person/${member.id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Fetch failed");
          return res.json();
        })
        .then((data) => {
          if (!isMounted) return;
          if (data?.birthday) {
            const year = data.birthday.split("-")[0];
            setBirthYears((prev) => ({ ...prev, [member.id]: year }));
          } else {
            setBirthYears((prev) => ({ ...prev, [member.id]: "نامشخص" }));
          }
        })
        .catch(() => {
          if (isMounted) {
            setBirthYears((prev) => ({ ...prev, [member.id]: "نامشخص" }));
          }
        });
    });

    return () => {
      isMounted = false;
    };
  }, [displayCast, birthYears]);

  const members: TeamRevealMember[] = displayCast.map((member, index) => {
    const year = birthYears[member.id];
    const birthText = year
      ? year !== "نامشخص"
        ? `سال تولد: ${year}`
        : "سال تولد: نامشخص"
      : "در حال بارگذاری سال تولد...";

    const roleText = isAnimation
      ? member.character
        ? `صداپیشه ${member.character}`
        : "صداپیشه"
      : member.character
      ? `در نقش ${member.character}`
      : "بازیگر";

    return {
      id: `cast-${member.id || index}`,
      name: member.name,
      role: roleText,
      expertise: birthText,
      image: member.profile_path ? getImageUrl(member.profile_path, "w500") : undefined,
      accent: ACCENTS[index % ACCENTS.length],
    };
  });

  const sectionTitle = isAnimation
    ? "صداپیشگان و گویندگان اثر"
    : "ستارگان و بازیگران اثر";

  const sectionDescription = isAnimation
    ? "هنرمندان و صداپیشگانی که با صدای ماندگار خود به شخصیت‌های این انیمیشن جان بخشیده‌اند."
    : "بازیگران شاخص و هنرمندانی که در خلق این فیلم یا سریال هنرنمایی کرده‌اند.";

  return (
    <div className="w-full">
      <TeamRevealGrid
        members={members}
        title={sectionTitle}
        description={sectionDescription}
        defaultActiveMemberId={members[0]?.id}
        autoPlay={true}
        rotationInterval={3200}
        className="py-6"
      />
    </div>
  );
}
