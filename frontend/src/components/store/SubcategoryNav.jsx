import { findCategoryMeta } from "./categoriesMeta";

export const SubcategoryNav = ({ categoria, value, onChange, counts = {} }) => {
  const meta = findCategoryMeta(categoria);
  if (!meta || !meta.subs?.length) return null;

  // Hide subs with 0 results to avoid empty options
  const visible = meta.subs.filter((s) => {
    const c = counts[s.name];
    // If counts not provided, show all; otherwise hide zero
    return c === undefined || c > 0;
  });

  if (visible.length === 0) return null;

  return (
    <nav
      className="flex flex-wrap gap-2 mb-5"
      data-testid="subcategory-nav"
      aria-label={`Subcategorías de ${categoria}`}
    >
      <button
        type="button"
        onClick={() => onChange?.("")}
        className={`text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-full border-2 transition ${
          !value
            ? "bg-brand-ink text-brand-cream border-brand-ink"
            : "bg-white border-border text-gray-700 hover:border-brand-ink"
        }`}
        data-testid="subnav-todos"
      >
        Todas
      </button>
      {visible.map((s) => {
        const active = value === s.name;
        const c = counts[s.name];
        return (
          <button
            key={s.name}
            type="button"
            onClick={() => onChange?.(s.name)}
            className={`text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-full border-2 transition inline-flex items-center gap-1.5 ${
              active
                ? "bg-brand-ink text-brand-cream border-brand-ink"
                : `${s.color} hover:scale-105`
            }`}
            data-testid={`subnav-${s.name}`}
          >
            <span aria-hidden>{s.emoji}</span>
            <span>{s.name}</span>
            {c !== undefined && (
              <span
                className={`text-[10px] tabular-nums ${
                  active ? "text-white/70" : "text-gray-500"
                }`}
              >
                ({c})
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
