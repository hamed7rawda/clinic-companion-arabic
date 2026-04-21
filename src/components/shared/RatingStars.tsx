import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({ rating, size = 14 }: { rating: number | null; size?: number }) {
  if (!rating) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={cn(
            i <= rating ? "fill-warning text-warning" : "fill-muted text-muted-foreground/40"
          )}
        />
      ))}
    </div>
  );
}
