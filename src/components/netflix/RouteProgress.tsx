import { useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function RouteProgress() {
  const status = useRouterState({ select: (s) => s.status });
  const loading = status === "pending";
  return (
    <div
      className={cn(
        "fixed top-0 inset-x-0 z-[60] h-0.5 pointer-events-none transition-opacity duration-300",
        loading ? "opacity-100" : "opacity-0",
      )}
    >
      <div
        className={cn(
          "h-full bg-primary shadow-[0_0_10px_var(--color-primary)]",
          loading ? "animate-[route-progress_1.2s_ease-out_forwards]" : "w-0",
        )}
      />
    </div>
  );
}
