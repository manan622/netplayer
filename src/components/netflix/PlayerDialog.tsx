import { useState } from "react";
import { ExternalLink } from "lucide-react";
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
  if (!target) return null;
  const url = getVideoUrl(target, sourceId);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 bg-black border-border overflow-hidden">
        <DialogTitle className="sr-only">Video player</DialogTitle>
        <DialogDescription className="sr-only">
          Streaming player. If the player asks to disable sandbox, use "Open in new tab".
        </DialogDescription>
        <div className="aspect-video w-full bg-black">
          <iframe
            key={url}
            src={url}
            title="Player"
            referrerPolicy="origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
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
            <div className="flex gap-2">
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
            If the player shows "please disable sandbox", click <strong>Open in new tab</strong> — the
            preview iframe sandboxes embedded videos. It works normally on the deployed site.
          </p>
          {sourcesOpen && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {API_SOURCES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSourceId(s.id)}
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
