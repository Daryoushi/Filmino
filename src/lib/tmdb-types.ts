export type MediaType = "movie" | "tv";

export interface Genre {
  id: number;
  name: string;
}

export interface Movie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  adult?: boolean;
  video?: boolean;
  media_type?: "movie";
}

export interface TVShow {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  origin_country?: string[];
  media_type?: "tv";
}

export interface UnifiedMedia {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  media_type: MediaType;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface CreditsResponse {
  cast: CastMember[];
  crew: CrewMember[];
}

export interface VideoItem {
  id: string;
  key: string;
  name: string;
  site: string;
  size: number;
  type: string;
  official: boolean;
  published_at: string;
}

export interface VideosResponse {
  results: VideoItem[];
}

export interface ImageItem {
  aspect_ratio: number;
  file_path: string;
  height: number;
  width: number;
}

export interface ImagesResponse {
  backdrops: ImageItem[];
  posters: ImageItem[];
  logos?: ImageItem[];
}

export interface ExternalIds {
  imdb_id: string | null;
  facebook_id?: string | null;
  instagram_id?: string | null;
  twitter_id?: string | null;
  wikidata_id?: string | null;
}

export interface MovieDetail extends Movie {
  budget: number;
  revenue: number;
  runtime: number | null;
  status: string;
  tagline: string | null;
  genres: Genre[];
  credits?: CreditsResponse;
  videos?: VideosResponse;
  images?: ImagesResponse;
  external_ids?: ExternalIds;
  similar?: PaginatedResponse<Movie>;
  recommendations?: PaginatedResponse<Movie>;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string;
  episode_number: number;
  season_number: number;
  vote_average: number;
  vote_count: number;
  runtime?: number | null;
}

export interface Season {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  episode_count: number;
  air_date: string;
  episodes?: Episode[];
}

export interface TVDetail extends TVShow {
  number_of_seasons: number;
  number_of_episodes: number;
  seasons: Season[];
  status: string;
  tagline: string | null;
  genres: Genre[];
  episode_run_time: number[];
  credits?: CreditsResponse;
  videos?: VideosResponse;
  images?: ImagesResponse;
  external_ids?: ExternalIds;
  similar?: PaginatedResponse<TVShow>;
  recommendations?: PaginatedResponse<TVShow>;
}

export interface PaginatedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface WatchlistItem {
  id: number;
  media_type: MediaType;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
  added_at: number;
}
