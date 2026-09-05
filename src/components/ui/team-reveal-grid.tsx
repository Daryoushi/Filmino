"use client";

import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

export interface TeamRevealMember {
  /** Stable identifier used by the controlled active state. */
  id: string;
  name: string;
  role: string;
  expertise: string;
  /** Any browser-readable image URL. When omitted, an initial-based portrait is rendered. */
  image?: string;
  imageAlt?: string;
  /** CSS object-position value used when an image is supplied. */
  imagePosition?: string;
  /** Accent shown while the member is active. */
  accent?: string;
}

export interface TeamRevealGridProps
  extends Omit<React.ComponentPropsWithoutRef<"section">, "title"> {
  eyebrow?: string;
  title?: string;
  description?: string;
  members?: readonly TeamRevealMember[];
  /** Controlled active member id. */
  activeMemberId?: string | null;
  /** Initial active member id when uncontrolled. Defaults to the first member. */
  defaultActiveMemberId?: string | null;
  onActiveMemberChange?: (memberId: string | null) => void;
  /** Automatically moves the reveal between members when idle. */
  autoPlay?: boolean;
  rotationInterval?: number;
}

const DEFAULT_MEMBERS: readonly TeamRevealMember[] = [
  {
    id: "maya-chen",
    name: "Maya Chen",
    role: "Product Engineer",
    expertise: "Turns early product ideas into fast, resilient interfaces.",
    accent: "#fb4f43",
  },
  {
    id: "noah-williams",
    name: "Noah Williams",
    role: "Infrastructure",
    expertise: "Keeps deployments observable, secure, and quietly reliable.",
    accent: "#ff7a45",
  },
  {
    id: "amina-patel",
    name: "Amina Patel",
    role: "Backend Engineer",
    expertise: "Designs APIs and data systems that scale without drama.",
    accent: "#f04f78",
  },
  {
    id: "leo-martin",
    name: "Leo Martin",
    role: "AI Engineer",
    expertise: "Ships useful AI workflows from prototype to production.",
    accent: "#8b5cf6",
  },
  {
    id: "sana-ibrahim",
    name: "Sana Ibrahim",
    role: "Design Engineer",
    expertise: "Builds expressive systems where design and code meet.",
    accent: "#3b82f6",
  },
  {
    id: "eli-brooks",
    name: "Eli Brooks",
    role: "Developer Experience",
    expertise: "Makes complex tools feel obvious, documented, and fast.",
    accent: "#14b8a6",
  },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function Portrait({ member, active }: { member: TeamRevealMember; active: boolean }) {
  const style = {
    "--team-accent": member.accent ?? "#fb4f43",
  } as React.CSSProperties;

  return (
    <div
      style={style}
      className={cn(
        "relative h-full overflow-hidden rounded-[1.05rem] bg-neutral-100 transition-colors duration-500 dark:bg-neutral-900",
        active && "bg-[color-mix(in_srgb,var(--team-accent)_10%,white)] dark:bg-[color-mix(in_srgb,var(--team-accent)_13%,#0a0a0a)]",
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 opacity-55 transition-opacity duration-500",
          active && "opacity-100",
        )}
        style={{
          background:
            "radial-gradient(circle at 68% 20%, color-mix(in srgb, var(--team-accent) 36%, transparent), transparent 36%), radial-gradient(circle at 22% 82%, color-mix(in srgb, var(--team-accent) 16%, transparent), transparent 42%)",
        }}
      />

      {member.image ? (
        // A native image keeps the registry component portable across React frameworks.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.image}
          alt={member.imageAlt ?? member.name}
          loading="lazy"
          draggable={false}
          className={cn(
            "absolute inset-0 h-full w-full object-cover grayscale transition-[filter,transform,opacity] duration-500 ease-out motion-reduce:transition-none",
            active ? "scale-[1.02] grayscale-0" : "scale-100 grayscale",
          )}
          style={{ objectPosition: member.imagePosition ?? "center 20%" }}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-end overflow-hidden">
          <div
            aria-hidden="true"
            className={cn(
              "absolute top-[13%] aspect-square h-[36%] rounded-full bg-neutral-300 transition-[transform,background-color] duration-500 dark:bg-neutral-700",
              active && "-translate-y-0.5 scale-105 bg-[var(--team-accent)]",
            )}
          />
          <div
            aria-hidden="true"
            className={cn(
              "absolute -bottom-[12%] h-[66%] w-[82%] rounded-t-[48%] bg-neutral-300/90 transition-[transform,background-color] duration-500 dark:bg-neutral-700/90",
              active && "scale-105 bg-[var(--team-accent)]",
            )}
          />
          <span className="relative z-10 mb-[18%] text-2xl font-semibold tracking-[-0.08em] text-white mix-blend-difference">
            {initials(member.name)}
          </span>
        </div>
      )}

      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-500",
          active ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}

export function TeamRevealGrid({
  eyebrow,
  title = "Meet the team",
  description = "A small, multidisciplinary team building thoughtful tools for ambitious people.",
  members = DEFAULT_MEMBERS,
  activeMemberId,
  defaultActiveMemberId,
  onActiveMemberChange,
  autoPlay = true,
  rotationInterval = 2800,
  className,
  ...props
}: TeamRevealGridProps) {
  const firstMemberId = members[0]?.id ?? null;
  const [internalActiveId, setInternalActiveId] = useState<string | null>(
    defaultActiveMemberId === undefined ? firstMemberId : defaultActiveMemberId,
  );
  const [interacting, setInteracting] = useState(false);
  const isControlled = activeMemberId !== undefined;

  const memberIds = useMemo(() => new Set(members.map((member) => member.id)), [members]);
  const requestedActiveId = isControlled ? activeMemberId : internalActiveId;
  const resolvedActiveId =
    requestedActiveId && memberIds.has(requestedActiveId) ? requestedActiveId : firstMemberId;

  const selectMember = useCallback(
    (memberId: string | null) => {
      if (!isControlled) setInternalActiveId(memberId);
      onActiveMemberChange?.(memberId);
    },
    [isControlled, onActiveMemberChange],
  );

  useEffect(() => {
    if (!autoPlay || interacting || members.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      const currentIndex = members.findIndex((member) => member.id === resolvedActiveId);
      const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % members.length;
      selectMember(members[nextIndex]?.id ?? null);
    }, Math.max(rotationInterval, 1200));

    return () => window.clearInterval(timer);
  }, [autoPlay, interacting, members, resolvedActiveId, rotationInterval, selectMember]);

  return (
    <section
      className={cn(
        "@container relative h-full w-full overflow-hidden bg-white px-3 py-4 text-neutral-950 dark:bg-neutral-950 dark:text-white sm:px-6 sm:py-6",
        className,
      )}
      {...props}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.075]"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, currentColor 0.7px, transparent 0.8px)",
          backgroundSize: "12px 12px",
        }}
      />

      <div className="relative mx-auto w-full max-w-5xl">
        <header className="mx-auto mb-8 max-w-2xl text-center">
          {eyebrow ? (
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-500 dark:text-neutral-400">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-balance text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
            <span className="relative inline-block">
              <span className="relative z-10">{title}</span>
              <svg
                aria-hidden="true"
                className="absolute -bottom-3 left-0 h-3 w-full text-[#fb4f43] sm:-bottom-4 sm:h-4"
                viewBox="0 0 100 20"
                preserveAspectRatio="none"
                fill="none"
              >
                <path d="M2 12 Q35 2 95 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" pathLength="1">
                  <animate attributeName="stroke-dasharray" values="0 1;1 0" dur="700ms" fill="freeze" />
                </path>
                <path d="M5 15 Q40 18 98 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" pathLength="1">
                  <animate attributeName="stroke-dasharray" values="0 1;1 0" dur="800ms" begin="120ms" fill="freeze" />
                </path>
              </svg>
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-sm leading-6 text-neutral-600 dark:text-neutral-400">
            {description}
          </p>
        </header>

        <ul className="flex flex-wrap justify-center gap-3 sm:gap-3.5">
          {members.map((member) => {
            const active = member.id === resolvedActiveId;
            const detailsId = `team-member-${member.id}-details`;

            return (
              <li
                key={member.id}
                className="relative min-w-0 flex-none w-[calc((100%-0.75rem)/2)] sm:w-[calc((100%-1.75rem)/3)] md:w-[calc((100%-2.625rem)/4)] lg:w-[calc((100%-3.5rem)/5)]"
              >
                <button
                  type="button"
                  aria-expanded={active}
                  aria-controls={detailsId}
                  onClick={() => selectMember(member.id)}
                  onPointerEnter={(event) => {
                    if (event.pointerType === "mouse") {
                      setInteracting(true);
                      selectMember(member.id);
                    }
                  }}
                  onPointerLeave={(event) => {
                    if (event.pointerType === "mouse") setInteracting(false);
                  }}
                  onFocus={() => {
                    setInteracting(true);
                    selectMember(member.id);
                  }}
                  onBlur={() => setInteracting(false)}
                  className="group block w-full rounded-2xl text-left outline-none cursor-pointer"
                >
                  <div
                    style={{ "--team-accent": member.accent ?? "#fb4f43" } as React.CSSProperties}
                    className={cn(
                      "relative overflow-hidden rounded-2xl border bg-white p-1 shadow-[0_10px_35px_-24px_rgba(0,0,0,0.42)] transition-[border-color,box-shadow,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none dark:bg-neutral-900",
                      active
                        ? "-translate-y-1 border-[color-mix(in_srgb,var(--team-accent)_55%,transparent)] shadow-[0_22px_48px_-28px_color-mix(in_srgb,var(--team-accent)_55%,transparent)]"
                        : "border-black/10 dark:border-white/10",
                      "focus-visible:ring-2 focus-visible:ring-[var(--team-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-950",
                    )}
                  >
                    <div
                      className={cn(
                        "h-48 transition-[height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none sm:h-52 md:h-60",
                        active && "h-52 sm:h-56 md:h-64",
                      )}
                    >
                      <Portrait member={member} active={active} />
                    </div>

                    <div
                      id={detailsId}
                      className={cn(
                        "absolute inset-x-1.5 bottom-1.5 z-10 rounded-lg bg-black/80 px-2 py-1 backdrop-blur-md transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none border border-white/10",
                        active ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0 pointer-events-none",
                      )}
                    >
                      <p className="line-clamp-1 text-center text-[10px] font-medium leading-tight text-white/95 sm:text-[11px]">
                        {member.expertise}
                      </p>
                    </div>
                  </div>

                  <div className="px-1 pt-2 text-center">
                    <h3 className="truncate text-xs font-semibold tracking-tight sm:text-sm">
                      {member.name}
                    </h3>
                    <p
                      className={cn(
                        "mt-0.5 truncate text-[10px] text-neutral-500 transition-colors duration-300 dark:text-neutral-400 sm:text-xs",
                        active && "text-[var(--team-accent)] dark:text-[var(--team-accent)]",
                      )}
                      style={{ "--team-accent": member.accent ?? "#fb4f43" } as React.CSSProperties}
                    >
                      {member.role}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export default TeamRevealGrid;
