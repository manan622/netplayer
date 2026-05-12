import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  const [sourceId, setSourceId] = useState("tmdb");
  const [sourcesOpen, setSourcesOpen] = useState(false);
  if (!target) return null;
  const url = getVideoUrl(target, sourceId);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 bg-black border-border overflow-hidden">
        <div className="aspect-video w-full bg-black">
          <iframe
            key={url}
            src={url}
            title="Player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="size-full border-0"
          />
        </div>
        <div className="p-4 flex flex-col gap-3 bg-card">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Source: <span className="text-foreground font-medium">{API_SOURCES.find((s) => s.id === sourceId)?.name}</span>
            </p>
            <Button size="sm" variant="secondary" onClick={() => setSourcesOpen((v) => !v)}>
              {sourcesOpen ? "Hide sources" : "Change source"}
            </Button>
          </div>
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
