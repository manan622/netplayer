import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { NotificationsButton } from "./NotificationsButton";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-colors duration-300",
        scrolled ? "bg-background/95 backdrop-blur" : "bg-gradient-to-b from-black/80 to-transparent",
      )}
    >
      <div className="flex items-center gap-8 px-4 md:px-12 py-4">
        <Link to="/" className="text-2xl md:text-3xl font-black tracking-tight text-primary">
          NETFLIX
        </Link>
        <nav className="hidden md:flex gap-6 text-sm text-foreground/90">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <a href="#" className="hover:text-foreground transition-colors">TV Shows</a>
          <a href="#" className="hover:text-foreground transition-colors">Movies</a>
          <a href="#" className="hover:text-foreground transition-colors">New & Popular</a>
          <Link to="/my-list" className="hover:text-foreground transition-colors">My List</Link>
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <Link to="/search" className="text-foreground/90 hover:text-foreground" aria-label="Search">
            <Search className="size-5" />
          </Link>
          <NotificationsButton />
          <div className="size-8 rounded bg-primary/80" aria-label="Profile" />
        </div>
      </div>
    </header>
  );
}
