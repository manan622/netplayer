// TMDB API client (key was in the original public repo)
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

export interface TmdbDetails extends TmdbItem {
  genres?: { id: number; name: string }[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  episode_run_time?: number[];
  tagline?: string;
  status?: string;
}

export interface TmdbEpisode {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string | null;
  runtime: number | null;
  vote_average: number;
}

export interface TmdbSeason {
  id: number;
  season_number: number;
  name: string;
  episodes: TmdbEpisode[];
}

const j = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`TMDB ${r.status}`);
  return r.json();
};

export const tmdbImage = (
  path: string | null,
  size: "w300" | "w500" | "w780" | "original" = "w500",
) => (path ? `${TMDB_IMAGE_BASE_URL}/${size}${path}` : "");

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

export async function fetchDetails(mediaType: MediaType, id: number): Promise<TmdbDetails> {
  const data = await j(`${TMDB_BASE_URL}/${mediaType}/${id}?api_key=${TMDB_API_KEY}&language=en-US`);
  return { ...data, mediaType };
}

export async function fetchSeason(showId: number, seasonNumber: number): Promise<TmdbSeason> {
  return j(`${TMDB_BASE_URL}/tv/${showId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&language=en-US`);
}

export async function fetchRecommendations(mediaType: MediaType, id: number): Promise<TmdbItem[]> {
  const data = await j(
    `${TMDB_BASE_URL}/${mediaType}/${id}/recommendations?api_key=${TMDB_API_KEY}&language=en-US&page=1`,
  );
  return (data.results as TmdbItem[]).slice(0, 12).map((r) => ({ ...r, mediaType }));
}

export async function searchMulti(query: string): Promise<TmdbItem[]> {
  if (!query.trim()) return [];
  const data = await j(
    `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&language=en-US&page=1&query=${encodeURIComponent(query)}`,
  );
  return (data.results as (TmdbItem & { media_type?: MediaType })[])
    .filter((r) => r.media_type === "movie" || r.media_type === "tv")
    .map((r) => ({ ...r, mediaType: r.media_type! }));
}

// ===== Streaming source builders =====

export interface ApiSource {
  id: string;
  name: string;
  url: string;
}

export const API_SOURCES: ApiSource[] = [
  { id: "tmdb", name: "MoviesAPI (Default)", url: "https://moviesapi.club" },
  { id: "netflix", name: "AutoEmbed", url: "https://player.autoembed.cc/embed" },
  { id: "hulu", name: "VidSrc", url: "https://vidsrc.cc/v2/embed" },
  { id: "prime", name: "VidLink", url: "https://vidlink.pro" },
  { id: "Hotstar", name: "Embed.su", url: "https://embed.su/embed" },
  { id: "multiembed", name: "MultiEmbed", url: "https://multiembed.mov" },
  { id: "2embed", name: "2Embed", url: "https://2embed.cc/embed" },
  { id: "videasy", name: "Videasy", url: "https://player.videasy.net" },
  { id: "vidfast", name: "VidFast", url: "https://vidfast.pro" },
];

export interface PlayTarget {
  id: number;
  mediaType: MediaType;
  season?: number;
  episode?: number;
}

export function getVideoUrl(t: PlayTarget, sourceId: string): string {
  const api = API_SOURCES.find((s) => s.id === sourceId) ?? API_SOURCES[0];
  if (t.mediaType === "tv") {
    const s = t.season ?? 1;
    const e = t.episode ?? 1;
    if (sourceId === "hulu" || sourceId === "prime" || sourceId === "Hotstar") {
      return `${api.url}/tv/${t.id}/${s}/${e}?autoPlay=true`;
    }
    if (sourceId === "multiembed") {
      return `${api.url}/directstream.php?video_id=${t.id}&tmdb=1&s=${s}&e=${e}&autoPlay=true`;
    }
    if (sourceId === "2embed") {
      return `${api.url}tv/${t.id}&s=${s}&e=${e}&autoPlay=true`;
    }
    if (sourceId === "videasy") {
      return `${api.url}/tv/${t.id}/${s}/${e}?nextEpisode=true&autoplayNextEpisode=true&episodeSelector=true&color=E50914&autoPlay=true`;
    }
    if (sourceId === "vidfast") {
      return `${api.url}/tv/${t.id}/${s}/${e}?nextButton=true&autoNext=true&autoPlay=true`;
    }
    return `${api.url}/tv/${t.id}-${s}-${e}?autoPlay=true`;
  }
  if (sourceId === "multiembed") return `${api.url}/directstream.php?video_id=${t.id}&tmdb=1&autoPlay=true`;
  if (sourceId === "2embed") return `${api.url}/${t.id}?autoPlay=true`;
  if (sourceId === "videasy") return `${api.url}/movie/${t.id}?color=E50914&autoPlay=true`;
  if (sourceId === "vidfast") return `${api.url}/movie/${t.id}?autoPlay=true`;
  return `${api.url}/movie/${t.id}?autoPlay=true`;
}
