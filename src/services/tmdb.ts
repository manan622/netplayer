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

export interface TmdbPage {
  results: TmdbItem[];
  page: number;
  total_pages: number;
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

export async function fetchTrending(page = 1): Promise<TmdbPage> {
  const data = await j(
    `${TMDB_BASE_URL}/trending/all/week?api_key=${TMDB_API_KEY}&language=en-US&page=${page}`,
  );
  return {
    page: data.page,
    total_pages: data.total_pages,
    results: (data.results as TmdbItem[]).map((r) => ({
      ...r,
      mediaType: (r as { media_type?: MediaType }).media_type ?? "movie",
    })),
  };
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

export async function fetchCategory(cat: Category, page = 1): Promise<TmdbPage> {
  const data = await j(
    `${TMDB_BASE_URL}${cat.endpoint}?api_key=${TMDB_API_KEY}&language=en-US&page=${page}`,
  );
  return {
    page: data.page,
    total_pages: data.total_pages,
    results: (data.results as TmdbItem[]).map((r) => ({ ...r, mediaType: cat.mediaType })),
  };
}

export async function fetchDetails(mediaType: MediaType, id: number): Promise<TmdbDetails> {
  const data = await j(`${TMDB_BASE_URL}/${mediaType}/${id}?api_key=${TMDB_API_KEY}&language=en-US`);
  return { ...data, mediaType };
}

export async function fetchSeason(showId: number, seasonNumber: number): Promise<TmdbSeason> {
  return j(`${TMDB_BASE_URL}/tv/${showId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&language=en-US`);
}

/**
 * Convert a season/episode pair to an absolute episode number
 * (S2E1 of a 12-episode S1 becomes episode 13) — used by anime sources
 * that index everything under season 1.
 */
export async function fetchAbsoluteEpisode(
  showId: number,
  season: number,
  episode: number,
): Promise<number> {
  if (season <= 1) return episode;
  const d = await j(`${TMDB_BASE_URL}/tv/${showId}?api_key=${TMDB_API_KEY}&language=en-US`);
  const seasons = (d.seasons ?? []) as { season_number: number; episode_count: number }[];
  const prior = seasons
    .filter((s) => s.season_number > 0 && s.season_number < season)
    .reduce((a, s) => a + (s.episode_count || 0), 0);
  return prior + episode;
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
  /** URL templates using {id} {s} {e} — when present they take priority */
  movie?: string;
  tv?: string;
}

export const API_SOURCES: ApiSource[] = [
  { id: "videasy", name: "Videasy", url: "https://player.videasy.net" },
  { id: "vidfast", name: "VidFast", url: "https://vidfast.pro" },
  { id: "prime", name: "VidLink", url: "https://vidlink.pro" },
  { id: "tmdb", name: "MoviesAPI", url: "https://moviesapi.club" },
  { id: "netflix", name: "AutoEmbed", url: "https://player.autoembed.cc/embed" },
  { id: "hulu", name: "VidSrc.cc", url: "https://vidsrc.cc/v2/embed" },
  { id: "Hotstar", name: "Embed.su", url: "https://embed.su/embed" },
  { id: "multiembed", name: "MultiEmbed", url: "https://multiembed.mov" },
  { id: "2embed", name: "2Embed", url: "https://2embed.cc/embed" },
  // ==== newer / widely-used providers ====
  {
    id: "vidsrcxyz",
    name: "VidSrc.xyz",
    url: "https://vidsrc.xyz",
    movie: "https://vidsrc.xyz/embed/movie?tmdb={id}",
    tv: "https://vidsrc.xyz/embed/tv?tmdb={id}&season={s}&episode={e}",
  },
  {
    id: "vidsrcto",
    name: "VidSrc.to",
    url: "https://vidsrc.to",
    movie: "https://vidsrc.to/embed/movie/{id}",
    tv: "https://vidsrc.to/embed/tv/{id}/{s}/{e}",
  },
  {
    id: "vidsrcsu",
    name: "VidSrc.su",
    url: "https://vidsrc.su",
    movie: "https://vidsrc.su/embed/movie/{id}",
    tv: "https://vidsrc.su/embed/tv/{id}/{s}/{e}",
  },
  {
    id: "vidcore",
    name: "VidCore",
    url: "https://www.vidcore.org",
    movie: "https://www.vidcore.org/embed/movie/{id}",
    tv: "https://www.vidcore.org/embed/tv/{id}/{s}/{e}",
  },
  {
    id: "ezvid",
    name: "EzVidAPI",
    url: "https://ezvidapi.com",
    movie: "https://ezvidapi.com/embed/movie/{id}",
    tv: "https://ezvidapi.com/embed/tv/{id}/{s}/{e}",
  },
  {
    id: "vidjoy",
    name: "VidJoy",
    url: "https://vidjoy.pro",
    movie: "https://vidjoy.pro/embed/movie/{id}",
    tv: "https://vidjoy.pro/embed/tv/{id}/{s}/{e}",
  },
  {
    id: "2embedskin",
    name: "2Embed.skin",
    url: "https://www.2embed.skin",
    movie: "https://www.2embed.skin/embed/{id}",
    tv: "https://www.2embed.skin/embedtv/{id}&s={s}&e={e}",
  },
  {
    id: "111movies",
    name: "111Movies",
    url: "https://111movies.com",
    movie: "https://111movies.com/movie/{id}",
    tv: "https://111movies.com/tv/{id}/{s}/{e}",
  },
  {
    id: "spencerdevs",
    name: "SpencerDevs",
    url: "https://spencerdevs.xyz",
    movie: "https://spencerdevs.xyz/movie/{id}",
    tv: "https://spencerdevs.xyz/tv/{id}/{s}/{e}",
  },
  {
    id: "rivestream",
    name: "RiveStream",
    url: "https://rivestream.org",
    movie: "https://rivestream.org/embed?type=movie&id={id}",
    tv: "https://rivestream.org/embed?type=tv&id={id}&season={s}&episode={e}",
  },
];


export interface PlayTarget {
  id: number;
  mediaType: MediaType;
  season?: number;
  episode?: number;
}

export function getVideoUrl(t: PlayTarget, sourceId: string, progress?: number): string {
  const api = API_SOURCES.find((s) => s.id === sourceId) ?? API_SOURCES[0];
  const tpl = t.mediaType === "tv" ? api.tv : api.movie;
  if (tpl) {
    return tpl
      .replace("{id}", String(t.id))
      .replace("{s}", String(t.season ?? 1))
      .replace("{e}", String(t.episode ?? 1));
  }
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
      const p = progress && progress > 5 ? `&progress=${Math.floor(progress)}` : "";
      return `${api.url}/tv/${t.id}/${s}/${e}?nextEpisode=true&autoplayNextEpisode=true&episodeSelector=true&color=E50914&autoPlay=true${p}`;
    }
    if (sourceId === "vidfast") {
      const p = progress && progress > 5 ? `&startAt=${Math.floor(progress)}` : "";
      return `${api.url}/tv/${t.id}/${s}/${e}?nextButton=true&autoNext=true&autoPlay=true${p}`;
    }
    return `${api.url}/tv/${t.id}-${s}-${e}?autoPlay=true`;
  }
  if (sourceId === "multiembed") return `${api.url}/directstream.php?video_id=${t.id}&tmdb=1&autoPlay=true`;
  if (sourceId === "2embed") return `${api.url}/${t.id}?autoPlay=true`;
  if (sourceId === "videasy") {
    const p = progress && progress > 5 ? `&progress=${Math.floor(progress)}` : "";
    return `${api.url}/movie/${t.id}?color=E50914&autoPlay=true${p}`;
  }
  if (sourceId === "vidfast") {
    const p = progress && progress > 5 ? `&startAt=${Math.floor(progress)}` : "";
    return `${api.url}/movie/${t.id}?autoPlay=true${p}`;
  }
  return `${api.url}/movie/${t.id}?autoPlay=true`;
}
