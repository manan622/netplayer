import { useEffect, useRef, useState } from "react";
import { ExternalLink, Maximize2, Loader2, SkipBack, SkipForward } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { API_SOURCES, getVideoUrl, type PlayTarget } from "@/services/tmdb";
import { updateContinueProgress } from "@/lib/library";

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
  resumeProgress,
  onPrev,
  onNext,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  target: PlayTarget | null;
  resumeProgress?: number;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const [sourceId, setSourceId] = useState("videasy");
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const wrapRef = useRef<HTMLDivElement>(null);

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
      // Videasy
      if (obj.type === "PLAYER_EVENT" && obj.data && typeof obj.data === "object") {
        const dd = obj.data as Record<string, unknown>;
        if (typeof dd.currentTime === "number") currentTime = dd.currentTime;
        if (typeof dd.duration === "number") duration = dd.duration;
      }
      // VidLink
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
  const url = getVideoUrl(target, sourceId, resumeProgress);

  const goFullscreen = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  const isTv = target.mediaType === "tv";
  const supportsResume = sourceId === "videasy" || sourceId === "vidfast";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 bg-black border-border overflow-hidden">
        <DialogTitle className="sr-only">Video player</DialogTitle>
        <DialogDescription className="sr-only">
          Streaming player. If a source is blocked, switch source or open in a new tab.
        </DialogDescription>
        <div ref={wrapRef} className="relative aspect-video w-full bg-black">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 pointer-events-none">
              <Loader2 className="size-10 animate-spin text-white/80" />
            </div>
          )}
          <iframe
            key={url}
            src={url}
            title="Player"
            referrerPolicy="origin"
            onLoad={() => setLoading(false)}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="size-full border-0"
          />
        </div>
        <div className="p-4 flex flex-col gap-3 bg-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                Source:{" "}
                <span className="text-foreground font-medium">
                  {API_SOURCES.find((s) => s.id === sourceId)?.name}
                </span>
              </span>
              {isTv && target.season && target.episode && (
                <span className="text-foreground/80">
                  · S{target.season} · E{target.episode}
                </span>
              )}
              {resumeProgress && resumeProgress > 5 && (
                <span className="text-primary">
                  · Resume {fmtTime(resumeProgress)}
                  {!supportsResume && " (manual seek)"}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {isTv && onPrev && (
                <Button size="sm" variant="secondary" onClick={onPrev}>
                  <SkipBack className="size-4" /> Prev ep
                </Button>
              )}
              {isTv && onNext && (
                <Button size="sm" variant="secondary" onClick={onNext}>
                  <SkipForward className="size-4" /> Next ep
                </Button>
              )}
              <Button size="sm" variant="secondary" onClick={goFullscreen}>
                <Maximize2 className="size-4" /> Fullscreen
              </Button>
              <Button asChild size="sm" variant="default">
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" /> Open in new tab
                </a>
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setSourcesOpen((v) => !v)}>
                {sourcesOpen ? "Hide sources" : "Change source"}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Resume position works best on <strong>Videasy</strong> and <strong>VidFast</strong>.
            If a player asks to disable sandbox or shows nothing, switch source or use{" "}
            <strong>Open in new tab</strong>.
          </p>
          {sourcesOpen && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {API_SOURCES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSourceId(s.id);
                    setSourcesOpen(false);
                  }}
                  className={`text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    s.id === sourceId
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary hover:bg-secondary/70 text-foreground"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
