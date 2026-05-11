// TMDB API client (key was already exposed in original public repo)
export const TMDB_API_KEY = "da914409e3ab4f883504dc0dbf9d9917";
export const TMDB_BASE_URL = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

export type MediaType = "movie" | "tv";

export interface TmdbItem {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  mediaType?: MediaType;
  genre_ids?: number[];
  runtime?: number;
}

const j = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`TMDB ${r.status}`);
  return r.json();
};

export const tmdbImage = (path: string | null, size: "w300" | "w500" | "w780" | "original" = "w500") =>
  path ? `${TMDB_IMAGE_BASE_URL}/${size}${path}` : "";

export const getTitle = (item: TmdbItem) => item.title || item.name || "Untitled";

export async function fetchTrending(): Promise<TmdbItem[]> {
  const data = await j(`${TMDB_BASE_URL}/trending/all/week?api_key=${TMDB_API_KEY}&language=en-US`);
  return (data.results as TmdbItem[]).map((r) => ({
    ...r,
    mediaType: (r as { media_type?: MediaType }).media_type ?? "movie",
  }));
}

export interface Category {
  title: string;
  endpoint: string;
  mediaType: MediaType;
}

export const MOVIE_CATEGORIES: Category[] = [
  { title: "Popular Movies", endpoint: "/movie/popular", mediaType: "movie" },
  { title: "Top Rated", endpoint: "/movie/top_rated", mediaType: "movie" },
  { title: "Now Playing", endpoint: "/movie/now_playing", mediaType: "movie" },
  { title: "Upcoming", endpoint: "/movie/upcoming", mediaType: "movie" },
];

export const TV_CATEGORIES: Category[] = [
  { title: "Popular TV Shows", endpoint: "/tv/popular", mediaType: "tv" },
  { title: "Top Rated TV", endpoint: "/tv/top_rated", mediaType: "tv" },
  { title: "On The Air", endpoint: "/tv/on_the_air", mediaType: "tv" },
  { title: "Airing Today", endpoint: "/tv/airing_today", mediaType: "tv" },
];

export async function fetchCategory(cat: Category): Promise<TmdbItem[]> {
  const data = await j(`${TMDB_BASE_URL}${cat.endpoint}?api_key=${TMDB_API_KEY}&language=en-US&page=1`);
  return (data.results as TmdbItem[]).map((r) => ({ ...r, mediaType: cat.mediaType }));
}
