import { useState } from "react";
import { cn } from "@/lib/utils";

type Props = React.ImgHTMLAttributes<HTMLImageElement>;

export function SmoothImage({ className, onLoad, ...props }: Props) {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      {...props}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
      className={cn(
        "transition-opacity duration-500 ease-out",
        loaded ? "opacity-100" : "opacity-0",
        className,
      )}
    />
  );
}
