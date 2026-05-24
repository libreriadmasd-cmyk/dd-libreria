import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Horizontal scroll carousel with prev/next arrows.
 * - children must be a flat list of cards (each given a min-w on parent)
 * - on small screens swiping works natively
 */
export const Carousel = ({ children, itemMinWidth = 280, className = "", testId }) => {
  const scrollerRef = useRef(null);

  const scrollBy = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    const w = el.clientWidth * 0.8;
    el.scrollBy({ left: dir * w, behavior: "smooth" });
  };

  return (
    <div className={`relative group ${className}`} data-testid={testId}>
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-white border border-border shadow-md text-brand-blue hover:bg-brand-blue hover:text-white transition items-center justify-center"
        aria-label="Anterior"
        data-testid={testId ? `${testId}-prev` : undefined}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={() => scrollBy(1)}
        className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-white border border-border shadow-md text-brand-blue hover:bg-brand-blue hover:text-white transition items-center justify-center"
        aria-label="Siguiente"
        data-testid={testId ? `${testId}-next` : undefined}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
      <div
        ref={scrollerRef}
        className="overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory"
      >
        <div
          className="flex gap-4 sm:gap-5 pb-2"
          style={{ minWidth: "min-content" }}
        >
          {Array.isArray(children)
            ? children.map((c, i) => (
                <div
                  key={i}
                  className="snap-start shrink-0"
                  style={{ minWidth: `${itemMinWidth}px`, width: `${itemMinWidth}px` }}
                >
                  {c}
                </div>
              ))
            : children}
        </div>
      </div>
    </div>
  );
};
