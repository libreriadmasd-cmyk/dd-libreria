import { useEffect, useState } from "react";
import { Tag, Palette, DollarSign, X, BadgePercent } from "lucide-react";
import { fetchFacets } from "../../lib/api";

export const FilterSidebar = ({ categoria, filters, onChange }) => {
  const [facets, setFacets] = useState({ brands: [], colors: [], price: { min: 0, max: 0 } });

  useEffect(() => {
    let active = true;
    fetchFacets({ categoria: categoria === "Todos" ? null : categoria })
      .then((d) => active && setFacets(d))
      .catch(() => {});
    return () => { active = false; };
  }, [categoria]);

  const set = (patch) => onChange?.({ ...filters, ...patch });

  const reset = () =>
    onChange?.({ marca: "", color: "", min_price: "", max_price: "", on_sale: false, subcategoria: "" });

  const hasActive =
    filters.marca || filters.color || filters.min_price || filters.max_price || filters.on_sale || filters.subcategoria;

  return (
    <aside
      className="rounded-2xl border border-border bg-white p-5 sticky top-44 h-fit"
      data-testid="filter-sidebar"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-brand-ink text-base">Filtros</h3>
        {hasActive && (
          <button
            type="button"
            onClick={reset}
            className="text-[11px] text-gray-500 hover:text-red-600 inline-flex items-center gap-1"
            data-testid="filter-reset"
          >
            <X className="w-3 h-3" /> Limpiar
          </button>
        )}
      </div>

      {/* Ofertas */}
      <label className="flex items-center gap-2 cursor-pointer mb-5 group">
        <input
          type="checkbox"
          checked={!!filters.on_sale}
          onChange={(e) => set({ on_sale: e.target.checked })}
          className="h-4 w-4 rounded accent-red-600"
          data-testid="filter-onsale"
        />
        <span className="inline-flex items-center gap-1.5 text-sm text-brand-ink font-medium">
          <BadgePercent className="w-4 h-4 text-red-600" /> Solo ofertas
        </span>
      </label>

      {/* Subcategorías */}
      {(facets.subcategorias || []).length > 0 && (
        <div className="mb-5">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-600 mb-2">
            Subcategoría
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => set({ subcategoria: "" })}
              className={`text-[11px] px-2.5 py-1 rounded-full border ${
                !filters.subcategoria
                  ? "bg-brand-ink text-brand-cream border-brand-ink"
                  : "bg-white border-border text-gray-700"
              }`}
              data-testid="filter-sub-todas"
            >
              Todas
            </button>
            {(facets.subcategorias || []).map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={() => set({ subcategoria: s.name })}
                className={`text-[11px] px-2.5 py-1 rounded-full border ${
                  filters.subcategoria === s.name
                    ? "bg-brand-ink text-brand-cream border-brand-ink"
                    : "bg-white border-border text-gray-700 hover:border-brand-ink"
                }`}
                data-testid={`filter-sub-${s.name}`}
              >
                {s.name} <span className="text-gray-400">({s.count})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Marca */}
      <div className="mb-5">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-600 mb-2 inline-flex items-center gap-1.5">
          <Tag className="w-3 h-3" /> Marca
        </p>
        <select
          value={filters.marca || ""}
          onChange={(e) => set({ marca: e.target.value })}
          className="w-full h-9 rounded-lg border border-border bg-brand-cream px-2 text-sm"
          data-testid="filter-marca"
        >
          <option value="">Todas las marcas</option>
          {(facets.brands || []).map((b) => (
            <option key={b.name} value={b.name}>
              {b.name} ({b.count})
            </option>
          ))}
        </select>
      </div>

      {/* Color */}
      <div className="mb-5">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-600 mb-2 inline-flex items-center gap-1.5">
          <Palette className="w-3 h-3" /> Color
        </p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => set({ color: "" })}
            className={`text-[11px] px-2.5 py-1 rounded-full border ${
              !filters.color
                ? "bg-brand-ink text-brand-cream border-brand-ink"
                : "bg-white border-border text-gray-700"
            }`}
          >
            Todos
          </button>
          {(facets.colors || []).slice(0, 14).map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => set({ color: c.name })}
              className={`text-[11px] px-2.5 py-1 rounded-full border ${
                filters.color === c.name
                  ? "bg-brand-ink text-brand-cream border-brand-ink"
                  : "bg-white border-border text-gray-700 hover:border-brand-ink"
              }`}
              data-testid={`filter-color-${c.name}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Precio */}
      <div>
        <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-600 mb-2 inline-flex items-center gap-1.5">
          <DollarSign className="w-3 h-3" /> Precio (ARS)
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder={String(Math.floor(facets.price?.min || 0))}
            value={filters.min_price ?? ""}
            onChange={(e) => set({ min_price: e.target.value })}
            className="w-full h-9 rounded-lg border border-border bg-brand-cream px-2 text-xs"
            data-testid="filter-min-price"
          />
          <span className="text-gray-400">–</span>
          <input
            type="number"
            placeholder={String(Math.ceil(facets.price?.max || 0))}
            value={filters.max_price ?? ""}
            onChange={(e) => set({ max_price: e.target.value })}
            className="w-full h-9 rounded-lg border border-border bg-brand-cream px-2 text-xs"
            data-testid="filter-max-price"
          />
        </div>
      </div>
    </aside>
  );
};
