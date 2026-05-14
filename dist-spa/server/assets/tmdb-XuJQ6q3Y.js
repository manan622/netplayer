import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { Search, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
function Header() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return /* @__PURE__ */ jsx(
    "header",
    {
      className: cn(
        "fixed top-0 inset-x-0 z-50 transition-colors duration-300",
        scrolled ? "bg-background/95 backdrop-blur" : "bg-gradient-to-b from-black/80 to-transparent"
      ),
      children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-8 px-4 md:px-12 py-4", children: [
        /* @__PURE__ */ jsx(Link, { to: "/", className: "text-2xl md:text-3xl font-black tracking-tight text-primary", children: "NETFLIX" }),
        /* @__PURE__ */ jsxs("nav", { className: "hidden md:flex gap-6 text-sm text-foreground/90", children: [
          /* @__PURE__ */ jsx(Link, { to: "/", className: "hover:text-foreground transition-colors", children: "Home" }),
          /* @__PURE__ */ jsx("a", { href: "#", className: "hover:text-foreground transition-colors", children: "TV Shows" }),
          /* @__PURE__ */ jsx("a", { href: "#", className: "hover:text-foreground transition-colors", children: "Movies" }),
          /* @__PURE__ */ jsx("a", { href: "#", className: "hover:text-foreground transition-colors", children: "New & Popular" }),
          /* @__PURE__ */ jsx("a", { href: "#", className: "hover:text-foreground transition-colors", children: "My List" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "ml-auto flex items-center gap-4", children: [
          /* @__PURE__ */ jsx(Link, { to: "/search", className: "text-foreground/90 hover:text-foreground", "aria-label": "Search", children: /* @__PURE__ */ jsx(Search, { className: "size-5" }) }),
          /* @__PURE__ */ jsx("button", { className: "text-foreground/90 hover:text-foreground", "aria-label": "Notifications", children: /* @__PURE__ */ jsx(Bell, { className: "size-5" }) }),
          /* @__PURE__ */ jsx("div", { className: "size-8 rounded bg-primary/80", "aria-label": "Profile" })
        ] })
      ] })
    }
  );
}
function Skeleton({ className, ...props }) {
  return /* @__PURE__ */ jsx("div", { className: cn("animate-pulse rounded-md bg-primary/10", className), ...props });
}
const TMDB_API_KEY = "da914409e3ab4f883504dc0dbf9d9917";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";
const j = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`TMDB ${r.status}`);
  return r.json();
};
const tmdbImage = (path, size = "w500") => path ? `${TMDB_IMAGE_BASE_URL}/${size}${path}` : "";
const getTitle = (item) => item.title || item.name || "Untitled";
async function fetchTrending() {
  const data = await j(`${TMDB_BASE_URL}/trending/all/week?api_key=${TMDB_API_KEY}&language=en-US`);
  return data.results.map((r) => ({
    ...r,
    mediaType: r.media_type ?? "movie"
  }));
}
const MOVIE_CATEGORIES = [
  { title: "Popular Movies", endpoint: "/movie/popular", mediaType: "movie" },
  { title: "Top Rated", endpoint: "/movie/top_rated", mediaType: "movie" },
  { title: "Now Playing", endpoint: "/movie/now_playing", mediaType: "movie" },
  { title: "Upcoming", endpoint: "/movie/upcoming", mediaType: "movie" }
];
const TV_CATEGORIES = [
  { title: "Popular TV Shows", endpoint: "/tv/popular", mediaType: "tv" },
  { title: "Top Rated TV", endpoint: "/tv/top_rated", mediaType: "tv" },
  { title: "On The Air", endpoint: "/tv/on_the_air", mediaType: "tv" },
  { title: "Airing Today", endpoint: "/tv/airing_today", mediaType: "tv" }
];
async function fetchCategory(cat) {
  const data = await j(`${TMDB_BASE_URL}${cat.endpoint}?api_key=${TMDB_API_KEY}&language=en-US&page=1`);
  return data.results.map((r) => ({ ...r, mediaType: cat.mediaType }));
}
async function fetchDetails(mediaType, id) {
  const data = await j(`${TMDB_BASE_URL}/${mediaType}/${id}?api_key=${TMDB_API_KEY}&language=en-US`);
  return { ...data, mediaType };
}
async function fetchSeason(showId, seasonNumber) {
  return j(`${TMDB_BASE_URL}/tv/${showId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&language=en-US`);
}
async function fetchRecommendations(mediaType, id) {
  const data = await j(
    `${TMDB_BASE_URL}/${mediaType}/${id}/recommendations?api_key=${TMDB_API_KEY}&language=en-US&page=1`
  );
  return data.results.slice(0, 12).map((r) => ({ ...r, mediaType }));
}
async function searchMulti(query) {
  if (!query.trim()) return [];
  const data = await j(
    `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&language=en-US&page=1&query=${encodeURIComponent(query)}`
  );
  return data.results.filter((r) => r.media_type === "movie" || r.media_type === "tv").map((r) => ({ ...r, mediaType: r.media_type }));
}
const API_SOURCES = [
  { id: "tmdb", name: "MoviesAPI (Default)", url: "https://moviesapi.club" },
  { id: "netflix", name: "AutoEmbed", url: "https://player.autoembed.cc/embed" },
  { id: "hulu", name: "VidSrc", url: "https://vidsrc.cc/v2/embed" },
  { id: "prime", name: "VidLink", url: "https://vidlink.pro" },
  { id: "Hotstar", name: "Embed.su", url: "https://embed.su/embed" },
  { id: "multiembed", name: "MultiEmbed", url: "https://multiembed.mov" },
  { id: "2embed", name: "2Embed", url: "https://2embed.cc/embed" },
  { id: "videasy", name: "Videasy", url: "https://player.videasy.net" },
  { id: "vidfast", name: "VidFast", url: "https://vidfast.pro" }
];
function getVideoUrl(t, sourceId) {
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
export {
  API_SOURCES as A,
  Header as H,
  MOVIE_CATEGORIES as M,
  Skeleton as S,
  TV_CATEGORIES as T,
  fetchCategory as a,
  fetchSeason as b,
  cn as c,
  getVideoUrl as d,
  fetchDetails as e,
  fetchTrending as f,
  getTitle as g,
  fetchRecommendations as h,
  searchMulti as s,
  tmdbImage as t
};
