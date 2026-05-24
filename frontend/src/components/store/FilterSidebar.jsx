import { useEffect, useState } from "react";
import { Filter, X } from "lucide-react";
import { fetchCategoryFilters } from "../../lib/api";
import { formatARS } from "../../lib/format";

export const FilterSidebar = ({
  categoria,
  selectedSub,
  selectedColor,
  priceMin,
  priceMax,
  onChange,
  onClear,
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!categoria || categoria === "Todos") {
      setData(null);
      return;
    }
    setLoading(true);
    fetchCategoryFilters(categoria)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [categoria]);

  if (!categoria || categoria === "Todos") return null;

  const hasActive =
    selectedSub || selectedColor || priceMin !== null || priceMax !== null;

  return (
    <aside
      className="md:col-span-1 space-y-6 md:sticky md:top-32 md:h-fit md:max-h-[calc(100vh-9rem)] md:overflow-y-auto pb-4"
      data-testid="filter-sidebar"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-700" />
          <h3 className="font-display font-semibold text-brand-ink text-base">
            Filtros
          </h3>
        </div>
        {hasActive && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-gray-500 hover:text-red-600 transition inline-flex items-center gap-1"
            data-testid="filter-clear"
          >
            <X className="w-3 h-3" /> Limpiar
          </button>
        )}
      </div>

      {loading && (
        <p className="text-xs text-gray-400">Cargando filtros…</p>
      )}

      {/* Subcategorias */}
      {data?.subcategorias?.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-500 mb-2.5">
            Subcategoría
          </p>
          <ul className="space-y-1">
            {data.subcategorias.map((s) => {
              const active = selectedSub === s.name;
              return (
                <li key={s.name}>
                  <button
                    type="button"
                    onClick={() =>
                      onChange?.({ subcategoria: active ? null : s.name })
                    }
                    className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition flex items-center justify-between ${
                      active
                        ? "bg-brand-ink text-brand-cream font-semibold"
                        : "text-gray-700 hover:bg-pastel-sand"
                    }`}
                    data-testid={`filter-sub-${s.name}`}
                  >
                    <span>{s.name}</span>
                    <span
                      className={`text-[11px] tabular-nums ${active ? "text-white/70" : "text-gray-400"}`}
                    >
                      {s.count}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Colores */}
      {data?.colores?.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-500 mb-2.5">
            Color
          </p>
          <div className="flex flex-wrap gap-1.5">
            {data.colores.map((c) => {
              const active = selectedColor === c.name;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() =>
                    onChange?.({ color: active ? null : c.name })
                  }
                  className={`text-xs px-2.5 py-1 rounded-full border transition ${
                    active
                      ? "bg-brand-ink text-brand-cream border-brand-ink font-semibold"
                      : "bg-white text-gray-700 border-border hover:border-brand-ink"
                  }`}
                  data-testid={`filter-color-${c.name}`}
                >
                  {c.name}{" "}
                  <span
                    className={`tabular-nums ${active ? "text-white/60" : "text-gray-400"}`}
                  >
                    {c.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Price range */}
      {data && data.price_max > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-500 mb-2.5">
            Precio (ARS)
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={priceMin ?? ""}
              placeholder={`Mín ${Math.floor(data.price_min).toLocaleString("es-AR")}`}
              onChange={(e) =>
                onChange?.({
                  priceMin: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              className="w-full h-9 rounded-lg border border-border bg-white px-2 text-xs tabular-nums"
              data-testid="filter-price-min"
            />
            <input
              type="number"
              value={priceMax ?? ""}
              placeholder={`Máx ${Math.ceil(data.price_max).toLocaleString("es-AR")}`}
              onChange={(e) =>
                onChange?.({
                  priceMax: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              className="w-full h-9 rounded-lg border border-border bg-white px-2 text-xs tabular-nums"
              data-testid="filter-price-max"
            />
          </div>
          <p className="mt-1.5 text-[10px] text-gray-400">
            {formatARS(data.price_min)} — {formatARS(data.price_max)}
          </p>
        </div>
      )}
    </aside>
  );
};
