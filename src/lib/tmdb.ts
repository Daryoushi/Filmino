import {
  Movie,
  TVShow,
  UnifiedMedia,
  MovieDetail,
  TVDetail,
  PaginatedResponse,
  Genre,
  MediaType,
} from "./tmdb-types";
import { translateToPersian } from "./translate";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN;
const TMDB_API_KEY = process.env.TMDB_API_KEY;

export const TMDB_IMAGE_BASE =
  process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE || "https://image.tmdb.org/t/p";

// Persian genre dictionary
export const GENRE_MAP_FA: Record<number, string> = {
  28: "اکشن",
  12: "ماجراجویی",
  16: "انیمیشن",
  35: "کمدی",
  80: "جنایی",
  99: "مستند",
  18: "درام",
  10751: "خانوادگی",
  14: "فانتزی",
  36: "تاریخی",
  27: "ترسناک",
  10402: "موسیقی",
  9648: "معمایی",
  10749: "عاشقانه",
  878: "علمی-تخیلی",
  10770: "فیلم تلویزیونی",
  53: "هیجان‌انگیز",
  10752: "جنگی",
  37: "وسترن",
  10759: "اکشن و ماجراجویی",
  10762: "کودک و نوجوان",
  10763: "خبری",
  10764: "واقعیت‌نما (Reality)",
  10765: "علمی‌تخیلی و فانتزی",
  10766: "سوپ‌اپرا",
  10767: "گفتگومحور",
  10768: "جنگ و سیاست",
};

// Available categories for Browse/Navigation
export const BROWSE_GENRES = [
  { id: 16, slug: "animation", name: "انیمیشن", icon: "Sparkles" },
  { id: 28, slug: "action", name: "اکشن", icon: "Flame" },
  { id: 18, slug: "drama", name: "درام", icon: "Film" },
  { id: 35, slug: "comedy", name: "کمدی", icon: "Laugh" },
  { id: 27, slug: "horror", name: "ترسناک", icon: "Ghost" },
  { id: 878, slug: "sci-fi", name: "علمی-تخیلی", icon: "Rocket" },
  { id: 80, slug: "crime", name: "جنایی", icon: "ShieldAlert" },
  { id: 9648, slug: "mystery", name: "معمایی", icon: "Eye" },
  { id: 10749, slug: "romance", name: "عاشقانه", icon: "Heart" },
  { id: 14, slug: "fantasy", name: "فانتزی", icon: "Wand2" },
];

export function getImageUrl(
  path: string | null | undefined,
  size: "w300" | "w500" | "w780" | "original" = "w500"
): string {
  if (!path) {
    return "/images/placeholder-poster.svg";
  }
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function getBackdropUrl(
  path: string | null | undefined,
  size: "w780" | "w1280" | "original" = "original"
): string {
  if (!path) {
    return "/images/placeholder-backdrop.svg";
  }
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function toUnifiedMedia(
  item: Record<string, unknown> | Movie | TVShow,
  forcedType?: MediaType
): UnifiedMedia {
  const isMovie =
    forcedType === "movie" ||
    ("title" in item && typeof item.title === "string") ||
    item.media_type === "movie";

  const rawItem = item as Record<string, unknown>;

  const id = Number(rawItem.id);
  const title = (rawItem.title || rawItem.name || "بدون عنوان") as string;
  const original_title = (rawItem.original_title ||
    rawItem.original_name ||
    title) as string;
  const overview = (rawItem.overview || "") as string;
  let poster_path = (rawItem.poster_path as string | null) || null;
  let backdrop_path = (rawItem.backdrop_path as string | null) || null;

  // Specific high-quality overrides for entries with cropped/bad localized TMDB fan images
  if (id === 969681) {
    // Spider-Man: Brand New Day
    poster_path = "/bjiS5ipwxb9JFy3XRRN4OAilSeX.jpg";
    backdrop_path = "/vjMvFSmGUxEtqVdaZgvFee9XkZl.jpg";
  }
  const release_date = (rawItem.release_date ||
    rawItem.first_air_date ||
    "") as string;
  const vote_average = Number(rawItem.vote_average || 0);
  const vote_count = Number(rawItem.vote_count || 0);
  const popularity = Number(rawItem.popularity || 0);
  const genre_ids = Array.isArray(rawItem.genre_ids)
    ? (rawItem.genre_ids as number[])
    : Array.isArray(rawItem.genres)
    ? ((rawItem.genres as { id: number }[]).map((g) => g.id))
    : [];

  return {
    id,
    title,
    original_title,
    overview,
    poster_path,
    backdrop_path,
    release_date,
    vote_average,
    vote_count,
    popularity,
    genre_ids,
    media_type: isMovie ? "movie" : "tv",
  };
}

async function tmdbFetch<T>(
  endpoint: string,
  params: Record<string, string | number | boolean | undefined> = {},
  options?: RequestInit
): Promise<T> {
  const cleanParams: Record<string, string> = {};
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      cleanParams[key] = String(val);
    }
  });

  const queryString = new URLSearchParams(cleanParams).toString();
  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint.slice(1)
    : endpoint;

  // If server-side, call direct to TMDB; if client, use internal proxy
  const isServer = typeof window === "undefined";

  if (isServer) {
    const url = `${TMDB_BASE_URL}/${normalizedEndpoint}${
      queryString ? `?${queryString}` : ""
    }`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (TMDB_ACCESS_TOKEN) {
      headers["Authorization"] = `Bearer ${TMDB_ACCESS_TOKEN}`;
    } else if (TMDB_API_KEY) {
      const u = new URL(url);
      u.searchParams.set("api_key", TMDB_API_KEY);
    }

    const res = await fetch(url, {
      ...options,
      headers: { ...headers, ...options?.headers },
      next: { revalidate: 3600, ...options?.next },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(
        `TMDB Server fetch error (${res.status}) on ${endpoint}: ${errText}`
      );
    }

    return res.json() as Promise<T>;
  } else {
    const url = `/api/tmdb/${normalizedEndpoint}${
      queryString ? `?${queryString}` : ""
    }`;
    const res = await fetch(url, options);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(
        `TMDB Client fetch error (${res.status}) on ${endpoint}: ${errText}`
      );
    }

    return res.json() as Promise<T>;
  }
}

// ----------------- TMDB API Methods ----------------- //

export async function getTrending(
  mediaType: "all" | "movie" | "tv" = "all",
  timeWindow: "day" | "week" = "week"
): Promise<UnifiedMedia[]> {
  try {
    const res = await tmdbFetch<PaginatedResponse<Record<string, unknown>>>(
      `/trending/${mediaType}/${timeWindow}`,
      { language: "fa-IR" }
    );
    return res.results.map((item) => toUnifiedMedia(item));
  } catch {
    // Fallback without language in case of TMDB localized trending quirks
    const res = await tmdbFetch<PaginatedResponse<Record<string, unknown>>>(
      `/trending/${mediaType}/${timeWindow}`
    );
    return res.results.map((item) => toUnifiedMedia(item));
  }
}

export async function getNowPlayingMovies(page = 1): Promise<PaginatedResponse<UnifiedMedia>> {
  const res = await tmdbFetch<PaginatedResponse<Movie>>(`/movie/now_playing`, {
    page,
    language: "fa-IR",
  });
  return {
    ...res,
    results: res.results.map((m) => toUnifiedMedia(m, "movie")),
  };
}

export async function getPopularMovies(page = 1): Promise<PaginatedResponse<UnifiedMedia>> {
  const res = await tmdbFetch<PaginatedResponse<Movie>>(`/movie/popular`, {
    page,
    language: "fa-IR",
  });
  return {
    ...res,
    results: res.results.map((m) => toUnifiedMedia(m, "movie")),
  };
}

export async function getTopRatedMovies(page = 1): Promise<PaginatedResponse<UnifiedMedia>> {
  const res = await tmdbFetch<PaginatedResponse<Movie>>(`/movie/top_rated`, {
    page,
    language: "fa-IR",
  });
  return {
    ...res,
    results: res.results.map((m) => toUnifiedMedia(m, "movie")),
  };
}

export async function getUpcomingMovies(page = 1): Promise<PaginatedResponse<UnifiedMedia>> {
  const res = await tmdbFetch<PaginatedResponse<Movie>>(`/movie/upcoming`, {
    page,
    language: "fa-IR",
  });
  return {
    ...res,
    results: res.results.map((m) => toUnifiedMedia(m, "movie")),
  };
}

export async function getPopularTV(page = 1): Promise<PaginatedResponse<UnifiedMedia>> {
  const res = await tmdbFetch<PaginatedResponse<TVShow>>(`/tv/popular`, {
    page,
    language: "fa-IR",
  });
  return {
    ...res,
    results: res.results.map((t) => toUnifiedMedia(t, "tv")),
  };
}

export async function getTopRatedTV(page = 1): Promise<PaginatedResponse<UnifiedMedia>> {
  const res = await tmdbFetch<PaginatedResponse<TVShow>>(`/tv/top_rated`, {
    page,
    language: "fa-IR",
  });
  return {
    ...res,
    results: res.results.map((t) => toUnifiedMedia(t, "tv")),
  };
}

export async function getOnTheAirTV(page = 1): Promise<PaginatedResponse<UnifiedMedia>> {
  const res = await tmdbFetch<PaginatedResponse<TVShow>>(`/tv/on_the_air`, {
    page,
    language: "fa-IR",
  });
  return {
    ...res,
    results: res.results.map((t) => toUnifiedMedia(t, "tv")),
  };
}

export async function getAnimationHighlights(page = 1): Promise<PaginatedResponse<UnifiedMedia>> {
  const res = await tmdbFetch<PaginatedResponse<Movie>>(`/discover/movie`, {
    page,
    with_genres: "16", // Animation
    sort_by: "popularity.desc",
    "vote_count.gte": 100,
    language: "fa-IR",
  });
  return {
    ...res,
    results: res.results.map((m) => toUnifiedMedia(m, "movie")),
  };
}

export interface DiscoverFilterParams {
  type?: MediaType;
  genre?: string | number;
  year?: string | number;
  country?: string;
  voteAverageGte?: number;
  sortBy?: string;
  language?: string;
  page?: number;
}

export async function discoverMedia(
  filters: DiscoverFilterParams
): Promise<PaginatedResponse<UnifiedMedia>> {
  const type = filters.type || "movie";
  const endpoint = type === "tv" ? "/discover/tv" : "/discover/movie";

  const params: Record<string, string | number | undefined> = {
    page: filters.page || 1,
    sort_by: filters.sortBy || "popularity.desc",
    language: filters.language || "fa-IR",
  };

  if (filters.genre) {
    params.with_genres = filters.genre;
  }
  if (filters.country) {
    params.with_origin_country = filters.country;
  }
  if (filters.voteAverageGte) {
    params["vote_average.gte"] = filters.voteAverageGte;
    params["vote_count.gte"] = 50; // Filter out low-sample titles
  }
  if (filters.year) {
    if (type === "movie") {
      params.primary_release_year = filters.year;
    } else {
      params.first_air_date_year = filters.year;
    }
  }

  const res = await tmdbFetch<PaginatedResponse<Record<string, unknown>>>(
    endpoint,
    params
  );

  return {
    ...res,
    results: res.results.map((item) => toUnifiedMedia(item, type)),
  };
}

export async function getMovieDetails(id: number | string): Promise<MovieDetail> {
  const res = await tmdbFetch<MovieDetail>(`/movie/${id}`, {
    append_to_response: "credits,videos,images,similar,recommendations,external_ids",
    language: "fa-IR",
  });

  // Fallback if overview is empty in fa-IR
  if (!res.overview) {
    try {
      const enRes = await tmdbFetch<MovieDetail>(`/movie/${id}`, {
        language: "en-US",
      });
      if (enRes.overview) {
        res.overview = enRes.overview;
      }
    } catch {
      // ignore
    }
  }

  // Ensure overview is translated to Persian if in English
  if (res.overview && !/[\u0600-\u06FF]/.test(res.overview)) {
    try {
      res.overview = await translateToPersian(res.overview);
    } catch {
      // ignore
    }
  }

  return res;
}

export async function getTVDetails(id: number | string): Promise<TVDetail> {
  const res = await tmdbFetch<TVDetail>(`/tv/${id}`, {
    append_to_response: "credits,videos,images,similar,recommendations,external_ids",
    language: "fa-IR",
  });

  // Fallback if overview is empty in fa-IR
  if (!res.overview) {
    try {
      const enRes = await tmdbFetch<TVDetail>(`/tv/${id}`, {
        language: "en-US",
      });
      if (enRes.overview) {
        res.overview = enRes.overview;
      }
    } catch {
      // ignore
    }
  }

  // Ensure overview is translated to Persian if in English
  if (res.overview && !/[\u0600-\u06FF]/.test(res.overview)) {
    try {
      res.overview = await translateToPersian(res.overview);
    } catch {
      // ignore
    }
  }

  return res;
}

export async function searchMulti(
  query: string,
  page = 1
): Promise<PaginatedResponse<UnifiedMedia>> {
  if (!query.trim()) {
    return { page: 1, results: [], total_pages: 0, total_results: 0 };
  }

  const res = await tmdbFetch<PaginatedResponse<Record<string, unknown>>>(
    `/search/multi`,
    {
      query,
      page,
      language: "fa-IR",
      include_adult: false,
    }
  );

  const filtered = res.results.filter(
    (item) => item.media_type === "movie" || item.media_type === "tv"
  );

  return {
    ...res,
    results: filtered.map((item) => toUnifiedMedia(item)),
  };
}
