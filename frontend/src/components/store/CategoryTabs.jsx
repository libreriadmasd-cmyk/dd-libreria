import { useNavigate } from "react-router-dom";

// 4 tabs fijos + Todos + General (fallback automático)
export const FIXED_CATEGORIES = [
  "Todos",
  "Marroquinería",
  "Librería",
  "Juguetería",
  "Regalería",
  "Tecno",
];

export const CategoryTabs = ({ selected, onSelect, counts = {} }) => {
  const navigate = useNavigate();

  const handle = (cat) => {
    if (window.location.pathname !== "/") navigate("/");
    onSelect(cat);
  };

  // If data has "General" or other extra categories, expose General tab
  const hasGeneral = (counts.General || 0) > 0;
  const tabs = hasGeneral
    ? [...FIXED_CATEGORIES, "General"]
    : FIXED_CATEGORIES;

  return (
    <nav
      className="sticky top-16 z-40 bg-brand-cream/90 backdrop-blur-xl border-b border-border"
      data-testid="category-tabs"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 sm:gap-3 py-3 overflow-x-auto scrollbar-hide">
          {tabs.map((cat) => {
            const active = selected === cat;
            const count =
              cat === "Todos" ? counts.__total || 0 : counts[cat] || 0;
            const featured = cat === "Marroquinería";
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handle(cat)}
                className={[
                  "group relative shrink-0 inline-flex items-center gap-2 h-10 px-4 sm:px-5 rounded-full text-sm transition-all",
                  active
                    ? "bg-brand-ink text-brand-cream font-semibold shadow-sm"
                    : featured
                      ? "bg-pastel-mint text-brand-greenDark font-semibold border border-brand-green/30 hover:bg-brand-green hover:text-white"
                      : "bg-white text-gray-700 border border-border hover:border-brand-ink hover:text-brand-ink font-medium",
                ].join(" ")}
                data-testid={`category-tab-${cat}`}
              >
                {featured && !active && (
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-brand-green"
                    aria-hidden
                  />
                )}
                <span className="tracking-tight">{cat}</span>
                <span
                  className={[
                    "text-[11px] tabular-nums font-mono",
                    active ? "text-white/70" : "text-gray-400",
                  ].join(" ")}
                >
                  {count.toLocaleString("es-AR")}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
