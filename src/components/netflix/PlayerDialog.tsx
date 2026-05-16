import { useEffect, useRef, useState } from "react";
import { ExternalLink, Maximize2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { API_SOURCES, getVideoUrl, type PlayTarget } from "@/services/tmdb";

export function PlayerDialog({
  open,
  onOpenChange,
  target,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  target: PlayTarget | null;
}) {
  const [sourceId, setSourceId] = useState("videasy");
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const wrapRef = useRef<HTMLDivElement>(null);

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
            <p className="text-sm text-muted-foreground">
              Source:{" "}
              <span className="text-foreground font-medium">
                {API_SOURCES.find((s) => s.id === sourceId)?.name}
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
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
            If the player asks to disable sandbox or shows nothing, try another source or use{" "}
            <strong>Open in new tab</strong>. The preview iframe is sandboxed; deployed sites work normally.
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
