import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Play, X, Loader2, Maximize2, ExternalLink, ArrowLeft, Check, Plus } from "lucide-react";
import { B as Button, u as useWatchlist, M as MovieRow, t as toggleWatchlist, b as toLibraryItem, p as pushContinueWatching } from "./library-q1Q-GbTj.js";
import { b as fetchSeason, S as Skeleton, t as tmdbImage, c as cn, d as getVideoUrl, A as API_SOURCES, e as fetchDetails, h as fetchRecommendations, H as Header, g as getTitle } from "./tmdb-XuJQ6q3Y.js";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { a as Route } from "./router-GQ8IeEp4.js";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@tanstack/zod-adapter";
import "zod";
function EpisodeList({
  showId,
  totalSeasons,
  onPlay
}) {
  const [season, setSeason] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["season", showId, season],
    queryFn: () => fetchSeason(showId, season)
  });
  const seasons = Array.from({ length: Math.max(1, totalSeasons) }, (_, i) => i + 1);
  return /* @__PURE__ */ jsxs("section", { className: "px-4 md:px-12 py-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold", children: "Episodes" }),
      /* @__PURE__ */ jsx(
        "select",
        {
          value: season,
          onChange: (e) => setSeason(Number(e.target.value)),
          className: "bg-secondary text-foreground rounded-md px-3 py-2 text-sm border border-border",
          children: seasons.map((n) => /* @__PURE__ */ jsxs("option", { value: n, children: [
            "Season ",
            n
          ] }, n))
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3", children: [
      isLoading && Array.from({ length: 4 }).map((_, i) => /* @__PURE__ */ jsx(Skeleton, { className: "h-24 w-full" }, i)),
      data?.episodes.map((ep) => /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => onPlay(season, ep.episode_number),
          className: "group flex gap-4 text-left p-2 rounded-md hover:bg-secondary/50 transition-colors",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "relative shrink-0 w-40 md:w-56 aspect-video rounded overflow-hidden bg-card", children: [
              ep.still_path ? /* @__PURE__ */ jsx(
                "img",
                {
                  src: tmdbImage(ep.still_path, "w300"),
                  alt: ep.name,
                  className: "size-full object-cover",
                  loading: "lazy"
                }
              ) : null,
              /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center", children: /* @__PURE__ */ jsx(Play, { className: "size-10 fill-white" }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxs("p", { className: "font-semibold", children: [
                ep.episode_number,
                ". ",
                ep.name
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground line-clamp-2 mt-1", children: ep.overview }),
              ep.air_date && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: ep.air_date })
            ] })
          ]
        },
        ep.id
      ))
    ] })
  ] });
}
const Dialog = DialogPrimitive.Root;
const DialogPortal = DialogPrimitive.Portal;
const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DialogPrimitive.Overlay,
  {
    ref,
    className: cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props
  }
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;
const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(DialogPortal, { children: [
  /* @__PURE__ */ jsx(DialogOverlay, {}),
  /* @__PURE__ */ jsxs(
    DialogPrimitive.Content,
    {
      ref,
      className: cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsxs(DialogPrimitive.Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground", children: [
          /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Close" })
        ] })
      ]
    }
  )
] }));
DialogContent.displayName = DialogPrimitive.Content.displayName;
const DialogTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DialogPrimitive.Title,
  {
    ref,
    className: cn("text-lg font-semibold leading-none tracking-tight", className),
    ...props
  }
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;
const DialogDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DialogPrimitive.Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;
function PlayerDialog({
  open,
  onOpenChange,
  target
}) {
  const [sourceId, setSourceId] = useState("videasy");
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const wrapRef = useRef(null);
  useEffect(() => {
    if (open) setLoading(true);
  }, [open, sourceId, target?.id, target?.season, target?.episode]);
  if (!target) return null;
  const url = getVideoUrl(target, sourceId);
  const goFullscreen = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-5xl p-0 bg-black border-border overflow-hidden", children: [
    /* @__PURE__ */ jsx(DialogTitle, { className: "sr-only", children: "Video player" }),
    /* @__PURE__ */ jsx(DialogDescription, { className: "sr-only", children: "Streaming player. If a source is blocked, switch source or open in a new tab." }),
    /* @__PURE__ */ jsxs("div", { ref: wrapRef, className: "relative aspect-video w-full bg-black", children: [
      loading && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-black/60 z-10 pointer-events-none", children: /* @__PURE__ */ jsx(Loader2, { className: "size-10 animate-spin text-white/80" }) }),
      /* @__PURE__ */ jsx(
        "iframe",
        {
          src: url,
          title: "Player",
          referrerPolicy: "origin",
          onLoad: () => setLoading(false),
          allow: "accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share",
          sandbox: "allow-same-origin allow-scripts allow-forms allow-popups allow-presentation allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation",
          allowFullScreen: true,
          className: "size-full border-0"
        },
        url
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-4 flex flex-col gap-3 bg-card", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
          "Source:",
          " ",
          /* @__PURE__ */ jsx("span", { className: "text-foreground font-medium", children: API_SOURCES.find((s) => s.id === sourceId)?.name })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "secondary", onClick: goFullscreen, children: [
            /* @__PURE__ */ jsx(Maximize2, { className: "size-4" }),
            " Fullscreen"
          ] }),
          /* @__PURE__ */ jsx(Button, { asChild: true, size: "sm", variant: "default", children: /* @__PURE__ */ jsxs("a", { href: url, target: "_blank", rel: "noopener noreferrer", children: [
            /* @__PURE__ */ jsx(ExternalLink, { className: "size-4" }),
            " Open in new tab"
          ] }) }),
          /* @__PURE__ */ jsx(Button, { size: "sm", variant: "secondary", onClick: () => setSourcesOpen((v) => !v), children: sourcesOpen ? "Hide sources" : "Change source" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
        "If the player asks to disable sandbox or shows nothing, try another source or use",
        " ",
        /* @__PURE__ */ jsx("strong", { children: "Open in new tab" }),
        ". The preview iframe is sandboxed; deployed sites work normally."
      ] }),
      sourcesOpen && /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-2", children: API_SOURCES.map((s) => /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => {
            setSourceId(s.id);
            setSourcesOpen(false);
          },
          className: `text-left px-3 py-2 rounded-md text-sm transition-colors ${s.id === sourceId ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/70 text-foreground"}`,
          children: s.name
        },
        s.id
      )) })
    ] })
  ] }) });
}
function DetailPage() {
  const {
    mediaType,
    id
  } = Route.useParams();
  const m = mediaType;
  const showId = Number(id);
  const details = useQuery({
    queryKey: ["details", m, showId],
    queryFn: () => fetchDetails(m, showId)
  });
  const recs = useQuery({
    queryKey: ["recs", m, showId],
    queryFn: () => fetchRecommendations(m, showId)
  });
  const [playOpen, setPlayOpen] = useState(false);
  const [target, setTarget] = useState(null);
  const data = details.data;
  const watchlist = useWatchlist();
  const inList = !!data && watchlist.some((x) => x.id === showId && x.mediaType === m);
  const recordContinue = (extra = {}) => {
    if (!data) return;
    pushContinueWatching(toLibraryItem({
      ...data,
      mediaType: m
    }, extra));
  };
  const playMovie = () => {
    setTarget({
      id: showId,
      mediaType: m
    });
    setPlayOpen(true);
    recordContinue();
  };
  const playEpisode = (season, episode) => {
    setTarget({
      id: showId,
      mediaType: "tv",
      season,
      episode
    });
    setPlayOpen(true);
    recordContinue({
      season,
      episode
    });
  };
  const onToggleList = () => {
    if (!data) return;
    toggleWatchlist(toLibraryItem({
      ...data,
      mediaType: m
    }));
  };
  const bg = data?.backdrop_path ? tmdbImage(data.backdrop_path, "original") : "";
  const year = (data?.release_date || data?.first_air_date || "").slice(0, 4);
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background text-foreground", children: [
    /* @__PURE__ */ jsx(Header, {}),
    /* @__PURE__ */ jsxs("section", { className: "relative w-full h-[70vh] min-h-[420px] overflow-hidden", children: [
      bg && /* @__PURE__ */ jsx("img", { src: bg, alt: "", className: "absolute inset-0 size-full object-cover" }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" }),
      /* @__PURE__ */ jsxs(Link, { to: "/", className: "absolute top-20 left-4 md:left-12 z-20 inline-flex items-center gap-2 text-foreground/90 hover:text-foreground", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "size-5" }),
        " Back"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "relative z-10 h-full flex flex-col justify-end pb-12 md:justify-center md:pb-0 px-4 md:px-12 max-w-3xl", children: details.isLoading ? /* @__PURE__ */ jsx(Skeleton, { className: "h-12 w-80" }) : data ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-4xl md:text-6xl font-black tracking-tight drop-shadow-lg", children: getTitle(data) }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-center gap-3 text-sm text-foreground/80", children: [
          year && /* @__PURE__ */ jsx("span", { children: year }),
          /* @__PURE__ */ jsxs("span", { children: [
            "★ ",
            data.vote_average?.toFixed(1)
          ] }),
          data.number_of_seasons && /* @__PURE__ */ jsxs("span", { children: [
            data.number_of_seasons,
            " Season",
            data.number_of_seasons > 1 ? "s" : ""
          ] }),
          data.runtime ? /* @__PURE__ */ jsxs("span", { children: [
            data.runtime,
            " min"
          ] }) : null
        ] }),
        data.genres && /* @__PURE__ */ jsx("div", { className: "mt-3 flex flex-wrap gap-2", children: data.genres.map((g) => /* @__PURE__ */ jsx("span", { className: "text-xs px-2 py-1 rounded-full bg-secondary text-foreground/90", children: g.name }, g.id)) }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm md:text-base text-foreground/90 max-w-xl line-clamp-4", children: data.overview }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap gap-3", children: [
          m === "movie" && /* @__PURE__ */ jsxs(Button, { size: "lg", onClick: playMovie, className: "bg-white text-black hover:bg-white/90 font-semibold", children: [
            /* @__PURE__ */ jsx(Play, { className: "size-5 fill-current" }),
            " Play"
          ] }),
          m === "tv" && /* @__PURE__ */ jsxs(Button, { size: "lg", onClick: () => playEpisode(1, 1), className: "bg-white text-black hover:bg-white/90 font-semibold", children: [
            /* @__PURE__ */ jsx(Play, { className: "size-5 fill-current" }),
            " Play S1 · E1"
          ] }),
          /* @__PURE__ */ jsxs(Button, { size: "lg", variant: "secondary", onClick: onToggleList, children: [
            inList ? /* @__PURE__ */ jsx(Check, { className: "size-5" }) : /* @__PURE__ */ jsx(Plus, { className: "size-5" }),
            inList ? "In My List" : "My List"
          ] })
        ] })
      ] }) : null })
    ] }),
    m === "tv" && data && /* @__PURE__ */ jsx(EpisodeList, { showId, totalSeasons: data.number_of_seasons ?? 1, onPlay: playEpisode }),
    /* @__PURE__ */ jsx("div", { className: "pb-20", children: recs.data && recs.data.length > 0 && /* @__PURE__ */ jsx(MovieRow, { title: "More Like This", items: recs.data }) }),
    /* @__PURE__ */ jsx(PlayerDialog, { open: playOpen, onOpenChange: setPlayOpen, target })
  ] });
}
export {
  DetailPage as component
};
