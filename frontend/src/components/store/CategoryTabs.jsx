import { useNavigate } from "react-router-dom";
import { Briefcase, BookOpen, ToyBrick, Gift, Smartphone, Grid } from "lucide-react";

export const FIXED_CATEGORIES = [
  "Todos",
  "Marroquinería",
  "Librería",
  "Juguetería",
  "Regalería",
  "Tecno",
];

const CATEGORY_ICONS = {
  Todos: Grid,
  Marroquinería: Briefcase,
  Librería: BookOpen,
  Juguetería: ToyBrick,
  Regalería: Gift,
  Tecno: Smartphone,
};

const CATEGORY_COLORS = {
  Todos: "bg-brand-blue text-brand-cream",
  Marroquinería: "bg-brand-teal text-white",
  Librería: "bg-brand-blue text-white",
  Juguetería: "bg-brand-coral text-white",
  Regalería: "bg-brand-yellow text-brand-ink",
  Tecno: "bg-brand-blueDark text-white",
};

export const CategoryTabs = ({ selected, onSelect, counts = {} }) => {
  const navigate = useNavigate();

  const handle = (cat) => {
    const path = cat === "Todos" ? "/" : `/categoria/${encodeURIComponent(cat)}`;
    if (window.location.pathname !== path) navigate(path);
    onSelect(cat);
  };

  return (
    <nav
      className="sticky top-[4.5rem] z-40 bg-white/80 backdrop-blur-xl border-b border-brand-blue/10"
      data-testid="category-tabs"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 sm:gap-3 py-3 overflow-x-auto scrollbar-hide">
          {FIXED_CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat] || Grid;
            const active = selected === cat;
            const count = cat === "Todos" ? counts.__total || 0 : counts[cat] || 0;
            const colorClass = active
              ? "bg-brand-ink text-white border border-brand-ink shadow-sm"
              : "bg-white text-gray-600 border border-border hover:border-brand-blue hover:text-brand-blue";
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handle(cat)}
                className={`group relative shrink-0 inline-flex items-center gap-3 h-11 px-4 sm:px-5 rounded-full text-sm font-medium transition-all ${colorClass}`}
                data-testid={`category-tab-${cat}`}
              >
                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${CATEGORY_COLORS[cat] || "bg-slate-200 text-slate-800"}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <span className="tracking-tight">{cat}</span>
                <span className="text-[11px] tabular-nums text-gray-400">
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
