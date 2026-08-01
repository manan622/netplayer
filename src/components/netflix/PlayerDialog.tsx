import { useEffect, useRef, useState } from "react";
import {
  ExternalLink,
  Maximize2,
  SkipBack,
  SkipForward,
  Settings2,
  Check,
  X,
  Play,
  Star,
  RefreshCw,
  ThumbsDown,
  Loader2,
  Smartphone,
  Copy,
  TriangleAlert,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { API_SOURCES, getVideoUrl, fetchAbsoluteEpisode, type PlayTarget } from "@/services/tmdb";
import { updateContinueProgress } from "@/lib/library";
import { useSourceHealth, sortSourcesByHealth } from "@/lib/source-health";
import {
  detectPlatform,
  playersForPlatform,
  openInExternalPlayer,
  isDirectStream,
  openWithChooser,
  type ExternalPlayerPlatform,
} from "@/lib/external-player";
import { cn } from "@/lib/utils";

const FAV_SOURCE_KEY = "netflix.favsource.v1";
const ABS_NUM_KEY = "netflix.absnum.v1";
const DEFAULT_SOURCE = "videasy";


const readFavSource = (): string | null => {
  try {
    const v = localStorage.getItem(FAV_SOURCE_KEY);
    return v && API_SOURCES.some((s) => s.id === v) ? v : null;
  } catch {
    return null;
  }
};

const readAbsMap = (): Record<string, boolean> => {
  try {
    return JSON.parse(localStorage.getItem(ABS_NUM_KEY) || "{}") as Record<string, boolean>;
  } catch {
    return {};
  }
};

const fmtTime = (s: number) => {
  if (!s || s < 0) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = Math.floor(s % 60).toString().padStart(2, "0");
  return h ? `${h}:${m.toString().padStart(2, "0")}:${ss}` : `${m}:${ss}`;
};


export function PlayerDialog({
  open,
  onOpenChange,
  target,
  title,
  resumeProgress,
  onPrev,
  onNext,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  target: PlayTarget | null;
  title?: string;
  resumeProgress?: number;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const [sourceId, setSourceId] = useState(DEFAULT_SOURCE);
  const [favSource, setFavSource] = useState<string | null>(null);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [externalOpen, setExternalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [manualUrl, setManualUrl] = useState("");

  const [platform, setPlatform] = useState<ExternalPlayerPlatform>("desktop");
  useEffect(() => setPlatform(detectPlatform()), []);
  const [loading, setLoading] = useState(true);
  const [manualPick, setManualPick] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { health, checking, recheck, markDown } = useSourceHealth(target, open);

  // Auto-fall back to a reachable source when the current one is down
  useEffect(() => {
    if (!open || manualPick) return;
    if (health[sourceId]?.status !== "down") return;
    const working = sortSourcesByHealth(API_SOURCES, health, favSource).find(
      (s) => health[s.id]?.status === "up",
    );
    if (working && working.id !== sourceId) setSourceId(working.id);
  }, [open, health, sourceId, manualPick, favSource]);

  // reset manual override when the target changes
  useEffect(() => {
    setManualPick(false);
  }, [target?.id, target?.season, target?.episode]);


  // load favourite source on mount
  useEffect(() => {
    const f = readFavSource();
    if (f) {
      setFavSource(f);
      setSourceId(f);
    }
  }, []);

  const toggleFav = (id: string) => {
    const next = favSource === id ? null : id;
    setFavSource(next);
    try {
      if (next) localStorage.setItem(FAV_SOURCE_KEY, next);
      else localStorage.removeItem(FAV_SOURCE_KEY);
    } catch {
      /* ignore */
    }
  };

  // ==== Absolute episode numbering (anime) ====
  const [absNum, setAbsNum] = useState(false);
  useEffect(() => {
    if (!target || target.mediaType !== "tv") return;
    setAbsNum(!!readAbsMap()[String(target.id)]);
  }, [target?.id, target?.mediaType]);

  const toggleAbsNum = () => {
    if (!target) return;
    const next = !absNum;
    setAbsNum(next);
    try {
      const map = readAbsMap();
      if (next) map[String(target.id)] = true;
      else delete map[String(target.id)];
      localStorage.setItem(ABS_NUM_KEY, JSON.stringify(map));
    } catch {
      /* ignore */
    }
  };

  const absQ = useQuery({
    queryKey: ["absEpisode", target?.id, target?.season, target?.episode],
    queryFn: () => fetchAbsoluteEpisode(target!.id, target!.season ?? 1, target!.episode ?? 1),
    enabled:
      !!target &&
      target.mediaType === "tv" &&
      absNum &&
      !target.absoluteEpisode &&
      (target.season ?? 1) > 1,
  });



  useEffect(() => {
    if (open) setLoading(true);
  }, [open, sourceId, target?.id, target?.season, target?.episode]);

  // Sandbox auto-open
  useEffect(() => {
    if (!open || !target) return;
    let sandboxed = false;
    try {
      sandboxed = window.self !== window.top;
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      window.top?.location.href;
    } catch {
      sandboxed = true;
    }
    if (sandboxed) {
      const u = getVideoUrl(target, sourceId, resumeProgress);
      window.open(u, "_blank", "noopener,noreferrer");
      onOpenChange(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, target?.id, target?.season, target?.episode]);

  // Listen for postMessage progress events from supported players
  useEffect(() => {
    if (!open || !target) return;
    const onMsg = (e: MessageEvent) => {
      const d = e.data as unknown;
      if (!d || typeof d !== "object") return;
      let currentTime: number | undefined;
      let duration: number | undefined;
      const obj = d as Record<string, unknown>;
      if (obj.type === "PLAYER_EVENT" && obj.data && typeof obj.data === "object") {
        const dd = obj.data as Record<string, unknown>;
        if (typeof dd.currentTime === "number") currentTime = dd.currentTime;
        if (typeof dd.duration === "number") duration = dd.duration;
      }
      if (obj.type === "MEDIA_DATA" && obj.data && typeof obj.data === "object") {
        const entry = (obj.data as Record<string, unknown>)[String(target.id)] as
          | { progress?: { watched?: number; duration?: number } }
          | undefined;
        if (entry?.progress) {
          currentTime = entry.progress.watched;
          duration = entry.progress.duration;
        }
      }
      if (typeof currentTime === "number" && currentTime > 5) {
        updateContinueProgress(
          {
            id: target.id,
            mediaType: target.mediaType,
            season: target.season,
            episode: target.episode,
          },
          currentTime,
          duration,
        );
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [open, target?.id, target?.season, target?.episode, target?.mediaType]);

  if (!target) return null;
  const absEpisode = absNum
    ? (target.absoluteEpisode ??
      ((target.season ?? 1) > 1 ? absQ.data : (target.episode ?? 1)))
    : undefined;
  const playTarget: PlayTarget =
    target.mediaType === "tv" && absNum && absEpisode
      ? { ...target, season: 1, episode: absEpisode }
      : target;
  const url = getVideoUrl(playTarget, sourceId, resumeProgress);

  const goFullscreen = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  const isTv = target.mediaType === "tv";
  const supportsResume = sourceId === "videasy" || sourceId === "vidfast";
  const activeSource = API_SOURCES.find((s) => s.id === sourceId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-6xl p-0 bg-black border-0 overflow-hidden rounded-xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] [&>button.absolute]:hidden"
      >
        <DialogTitle className="sr-only">{title ?? "Video player"}</DialogTitle>
        <DialogDescription className="sr-only">
          Streaming player. If a source is blocked, switch source or open in a new tab.
        </DialogDescription>

        {/* Stage */}
        <div ref={wrapRef} className="relative aspect-video w-full bg-black group/stage">
          {/* Cinematic loader */}
          {loading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-b from-black via-black/95 to-black pointer-events-none">
              <div className="relative flex items-center justify-center">
                <div className="absolute size-20 rounded-full border border-white/10 animate-ping" />
                <div className="absolute size-14 rounded-full border border-primary/40 animate-pulse" />
                <div className="size-12 rounded-full bg-primary/90 flex items-center justify-center shadow-[0_0_40px_rgba(229,9,20,0.55)]">
                  <Play className="size-5 text-white fill-white ml-0.5" />
                </div>
              </div>
              <div className="mt-6 text-[11px] uppercase tracking-[0.3em] text-white/60">
                Preparing stream
              </div>
              {title && (
                <div className="mt-2 text-sm text-white/80 max-w-md text-center px-6 truncate">
                  {title}
                  {isTv && target.season && target.episode && (
                    <span className="text-white/50"> · S{target.season}·E{target.episode}</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Top gradient + title overlay */}
          <div
            className={cn(
              "absolute top-0 inset-x-0 z-10 px-4 sm:px-6 py-3 sm:py-4 flex items-start justify-between gap-3",
              "bg-gradient-to-b from-black/80 via-black/40 to-transparent",
              "opacity-0 group-hover/stage:opacity-100 focus-within:opacity-100 transition-opacity duration-300",
              loading && "opacity-100",
            )}
          >
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.25em] text-white/60">
                Now playing
              </div>
              {title && (
                <div className="text-sm sm:text-base font-semibold text-white truncate max-w-[60vw] sm:max-w-md">
                  {title}
                  {isTv && target.season && target.episode && (
                    <span className="text-white/60 font-normal">
                      {" "}· S{target.season} · E{target.episode}
                    </span>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-full bg-black/50 backdrop-blur-md p-2 text-white/80 hover:text-white hover:bg-black/70 transition-colors ring-1 ring-white/10"
              aria-label="Close player"
            >
              <X className="size-4" />
            </button>
          </div>

          <iframe
            key={url}
            src={url}
            title={title ?? "Player"}
            referrerPolicy="origin"
            onLoad={() => setLoading(false)}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="size-full border-0"
          />
        </div>

        {/* Control bar */}
        <div className="relative bg-gradient-to-b from-zinc-950 to-black border-t border-white/5">
          <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3">
            {/* Left: source + status */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white/5 ring-1 ring-white/10">
                <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                <span className="text-[11px] uppercase tracking-wider text-white/60">Live</span>
                <span className="text-xs text-white font-medium">{activeSource?.name}</span>
              </div>
              {resumeProgress && resumeProgress > 5 && (
                <span className="text-xs text-primary/90 hidden sm:inline">
                  Resume {fmtTime(resumeProgress)}
                  {!supportsResume && " · seek manually"}
                </span>
              )}
            </div>

            {/* Right: actions */}
            <div className="flex flex-wrap items-center gap-1.5">
              {isTv && onPrev && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onPrev}
                  className="text-white/80 hover:text-white hover:bg-white/10"
                >
                  <SkipBack className="size-4" /> Prev
                </Button>
              )}
              {isTv && onNext && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onNext}
                  className="text-white/80 hover:text-white hover:bg-white/10"
                >
                  <SkipForward className="size-4" /> Next
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  markDown(sourceId);
                  setManualPick(false);
                }}
                className="text-white/80 hover:text-white hover:bg-white/10"
                title="Mark this source as not working and switch"
              >
                <ThumbsDown className="size-4" />
                <span className="hidden sm:inline">Not working</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSourcesOpen((v) => !v)}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <Settings2 className="size-4" /> Sources
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setExternalOpen((v) => !v)}
                className="text-white/80 hover:text-white hover:bg-white/10"
                title="Play in an external app like MX Player or VLC"
              >
                <Smartphone className="size-4" />
                <span className="hidden sm:inline">External app</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={goFullscreen}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <Maximize2 className="size-4" />
                <span className="hidden sm:inline">Fullscreen</span>
              </Button>
              <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-white">
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" />
                  <span className="hidden sm:inline">New tab</span>
                </a>
              </Button>
            </div>
          </div>

          {/* External player panel */}
          {externalOpen && (
            <div className="px-4 sm:px-6 pb-4 animate-fade-in">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                  Open in external player
                </div>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(url);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    } catch {
                      /* ignore */
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-[11px] text-white/60 hover:text-white transition-colors"
                >
                  {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                  {copied ? "Copied" : "Copy stream link"}
                </button>
              </div>
              {!directOk && (
                <div className="mb-3 flex gap-2.5 rounded-lg bg-amber-500/10 ring-1 ring-amber-400/25 px-3 py-2.5">
                  <TriangleAlert className="size-4 shrink-0 text-amber-400 mt-0.5" />
                  <div className="text-[11px] leading-relaxed text-amber-100/80">
                    This source is a web player page, not a video file, so MX Player / VLC will
                    reject it. Paste a direct <code className="text-amber-300">.m3u8</code> or{" "}
                    <code className="text-amber-300">.mp4</code> link below to send it to an app, or
                    keep watching in the built-in player.
                  </div>
                </div>
              )}

              <div className="mb-3 flex gap-2">
                <input
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  placeholder="Direct stream link (.m3u8 / .mp4)"
                  className="min-w-0 flex-1 rounded-lg bg-white/[0.04] ring-1 ring-white/10 px-3 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:ring-white/25"
                />
                {platform === "android" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openWithChooser(playUrl, title)}
                    className="shrink-0 text-white/80 hover:text-white hover:bg-white/10"
                  >
                    Open with…
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {playersForPlatform(platform).map((p) => {
                  const native = p.platforms.includes(platform);
                  const playable = isDirectStream(playUrl);
                  return (
                    <button
                      key={p.id}
                      onClick={() => openInExternalPlayer(p, playUrl, title)}
                      title={
                        playable
                          ? `Play in ${p.name}`
                          : "No direct stream link yet — this may not open"
                      }
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left ring-1 transition-colors",
                        native && playable
                          ? "bg-white/[0.06] ring-white/15 hover:bg-white/10"
                          : "bg-white/[0.02] ring-white/5 hover:bg-white/[0.06] opacity-50",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block text-xs font-medium text-white truncate">
                          {p.name}
                        </span>
                        <span className="block text-[10px] text-white/40">{p.hint}</span>
                      </span>
                      <ExternalLink className="size-3.5 shrink-0 text-white/40" />
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-white/40">
                Every embed source resolves its video inside the page with tokens, so the link above
                is HTML — external apps can't decode it. Grab the real stream link (long-press the
                video → copy link, or your browser's network tab), paste it here, then pick an app.
              </p>

            </div>
          )}



          {/* Sources panel */}
          {sourcesOpen && (
            <div className="px-4 sm:px-6 pb-4 animate-fade-in">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                  Working sources first · tap ★ to pin your favourite
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={recheck}
                  disabled={checking}
                  className="h-7 text-[11px] text-white/70 hover:text-white hover:bg-white/10"
                >
                  {checking ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="size-3.5" />
                  )}
                  {checking ? "Testing…" : "Re-test"}
                </Button>
              </div>

              {isTv && (
                <div className="mb-3 flex items-start justify-between gap-3 rounded-lg bg-white/[0.03] ring-1 ring-white/10 px-3 py-2.5">
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-white/90">
                      Absolute episode numbering
                    </div>
                    <div className="text-[10px] text-white/45 mt-0.5 leading-relaxed">
                      For anime indexed as one long season (e.g. E1000 instead of S5·E12).
                      {absNum && (
                        <span className="text-amber-400/90">
                          {" "}
                          Requesting E
                          {absQ.isLoading && (target.season ?? 1) > 1 ? "…" : (absEpisode ?? target.episode ?? 1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={toggleAbsNum}
                    role="switch"
                    aria-checked={absNum}
                    aria-label="Toggle absolute episode numbering"
                    className={cn(
                      "shrink-0 mt-0.5 h-6 w-11 rounded-full transition-colors ring-1",
                      absNum ? "bg-primary ring-primary/60" : "bg-white/10 ring-white/15",
                    )}
                  >
                    <span
                      className={cn(
                        "block size-5 rounded-full bg-white shadow transition-transform",
                        absNum ? "translate-x-[22px]" : "translate-x-0.5",
                      )}
                    />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {sortSourcesByHealth(API_SOURCES, health, favSource).map((src) => {
                  const s = src as (typeof API_SOURCES)[number];
                  const active = s.id === sourceId;
                  const fav = s.id === favSource;
                  const st = health[s.id]?.status ?? "unknown";
                  const ms = health[s.id]?.ms;
                  return (
                    <div
                      key={s.id}
                      className={cn(
                        "group/source relative rounded-lg text-sm transition-all ring-1",
                        active
                          ? "bg-primary/15 ring-primary/50 text-white"
                          : "bg-white/[0.03] ring-white/10 text-white/80 hover:bg-white/[0.07] hover:ring-white/20",
                        st === "down" && !active && "opacity-55",
                      )}
                    >
                      <button
                        onClick={() => {
                          setSourceId(s.id);
                          setManualPick(true);
                          setSourcesOpen(false);
                        }}
                        className="w-full text-left px-3 py-2.5 pr-9"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "size-1.5 rounded-full shrink-0",
                              st === "up" && "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]",
                              st === "down" && "bg-red-500",
                              (st === "checking" || st === "unknown") &&
                                "bg-white/40 animate-pulse",
                            )}
                          />
                          <span className="font-medium truncate">{s.name}</span>
                          {active && <Check className="size-4 text-primary shrink-0" />}
                        </div>
                        <div className="text-[10px] mt-0.5">
                          {st === "checking" && <span className="text-white/40">Testing…</span>}
                          {st === "up" && (
                            <span className="text-emerald-400/80">
                              Working{ms ? ` · ${ms}ms` : ""}
                            </span>
                          )}
                          {st === "down" && <span className="text-red-400/80">Not responding</span>}
                          {st === "unknown" && <span className="text-white/30">Untested</span>}
                        </div>
                        {(s.id === "videasy" || s.id === "vidfast") && (
                          <div className="text-[10px] text-emerald-400/60">Resume supported</div>
                        )}
                        {fav && (
                          <div className="text-[10px] text-amber-400/90">Favourite</div>
                        )}
                      </button>
                      <button
                        onClick={() => toggleFav(s.id)}
                        aria-label={fav ? `Unfavourite ${s.name}` : `Favourite ${s.name}`}
                        aria-pressed={fav}
                        className="absolute top-2 right-2 p-1 rounded-md hover:bg-white/10 transition-colors"
                      >
                        <Star
                          className={cn(
                            "size-4",
                            fav ? "text-amber-400 fill-amber-400" : "text-white/35",
                          )}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-white/40 mt-3 leading-relaxed">
                Availability is tested live per title — sources that refuse to connect drop to the
                bottom. If a working source still shows a blank screen, hit “Not working” and we'll
                switch you to the next one.
              </p>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
