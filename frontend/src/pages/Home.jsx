import { useEffect, useMemo, useState, useCallback } from "react";
import { Navbar } from "../components/store/Navbar";
import { CategoryTabs } from "../components/store/CategoryTabs";
import { CategoryVitrina } from "../components/store/CategoryVitrina";
import { OffersStrip } from "../components/store/OffersStrip";
import { ProductCard } from "../components/store/ProductCard";
import { Loader2, ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Skeleton } from "../components/ui/skeleton";
import { fetchProducts, fetchCategories, fetchFeatured, fetchOffers } from "../lib/api";
import { FilterSidebar } from "../components/store/FilterSidebar";
import { ChevronRight } from "lucide-react";

const PAGE_SIZE = 48;
const SORT_OPTIONS = [
  { v: "relevance", label: "Relevancia" },
  { v: "price_asc", label: "Precio · menor a mayor" },
  { v: "price_desc", label: "Precio · mayor a menor" },
  { v: "name_asc", label: "Nombre · A → Z" },
  { v: "newest", label: "Recién actualizados" },
];

export default function Home() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("Todos");
  const [sort, setSort] = useState("relevance");
  const [counts, setCounts] = useState({ __total: 0 });
  const [skip, setSkip] = useState(0);
  const [featured, setFeatured] = useState({});
  const [offers, setOffers] = useState([]);
  const [filters, setFilters] = useState({
    subcategoria: null,
    color: null,
    priceMin: null,
    priceMax: null,
    brand: null,
  });

  // Debounce search
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const reloadCategories = useCallback(async () => {
    try {
      const data = await fetchCategories();
      const map = { __total: data.total };
      (data.categories || []).forEach((c) => {
        const categoryName = c.name === "General" ? "Librería" : c.name;
        map[categoryName] = (map[categoryName] || 0) + c.count;
      });
      setCounts(map);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    reloadCategories();
    fetchFeatured(3).then((d) => setFeatured(d.items || {})).catch(() => {});
    fetchOffers(12).then((d) => setOffers(d.items || [])).catch(() => {});
  }, [reloadCategories]);

  useEffect(() => {
    // Reset filters when changing category
    setFilters({ subcategoria: null, color: null, priceMin: null, priceMax: null, brand: null });
  }, [activeCat]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setSkip(0);
    fetchProducts({
      categoria: activeCat,
      subcategoria: filters.subcategoria,
      color: filters.color,
      brand: filters.brand,
      precio_min: filters.priceMin,
      precio_max: filters.priceMax,
      q: debouncedQuery,
      sort,
      skip: 0,
      limit: PAGE_SIZE,
    })
      .then((data) => {
        if (!active) return;
        setItems(data.items || []);
        setTotal(data.total || 0);
        setError(null);
      })
      .catch((e) => {
        if (!active) return;
        setError(e.message);
        setItems([]);
        setTotal(0);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [activeCat, debouncedQuery, sort, filters]);

  const handleLoadMore = async () => {
    const nextSkip = skip + PAGE_SIZE;
    setLoadingMore(true);
    try {
      const data = await fetchProducts({
        categoria: activeCat,
        subcategoria: filters.subcategoria,
        color: filters.color,
        brand: filters.brand,
        precio_min: filters.priceMin,
        precio_max: filters.priceMax,
        q: debouncedQuery,
        sort,
        skip: nextSkip,
        limit: PAGE_SIZE,
      });
      setItems((prev) => [...prev, ...(data.items || [])]);
      setSkip(nextSkip);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const hasMore = items.length < total;

  const subcategoryChips = useMemo(() => {
    return Array.from(
      new Set(items.map((p) => p.subcategoria).filter(Boolean))
    ).slice(0, 8);
  }, [items]);

  const brandChips = useMemo(() => {
    return Array.from(
      new Set(
        items
          .map((p) => p.marca || p.brand)
          .filter((value) => typeof value === "string" && value.trim())
      )
    ).slice(0, 8);
  }, [items]);

  // Scroll smoothly to catalog when a category vitrina "Ver todos" is clicked
  const jumpToCatalog = (cat) => {
    setActiveCat(cat);
    setTimeout(() => {
      const el = document.getElementById("catalog");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const VITRINA_ORDER = ["Marroquinería", "Librería", "Juguetería", "Regalería", "Tecno"];
  const showVitrinas = !debouncedQuery && activeCat === "Todos";

  return (
    <div className="min-h-screen relative">
      <Navbar searchQuery={query} onSearchChange={setQuery} />
      <CategoryTabs
        selected={activeCat}
        onSelect={setActiveCat}
        counts={counts}
      />

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 space-y-12">
        {/* Offers banner */}
        {showVitrinas && offers.length > 0 && (
          <OffersStrip items={offers} />
        )}

        {/* Category vitrinas — only on the default home view */}
        {showVitrinas && (
          <div className="space-y-12" data-testid="vitrinas-grid">
            {VITRINA_ORDER.map((cat) => (
              <CategoryVitrina
                key={cat}
                category={cat}
                items={featured[cat] || []}
                onJumpTo={jumpToCatalog}
              />
            ))}
          </div>
        )}

        {/* Full catalog */}
        <section id="catalog" className="space-y-6">
          {/* Breadcrumb */}
          {(activeCat !== "Todos" || filters.subcategoria) && (
            <nav
              className="flex items-center gap-1.5 text-xs text-gray-500"
              data-testid="breadcrumbs"
            >
              <button
                type="button"
                onClick={() => setActiveCat("Todos")}
                className="hover:text-brand-ink transition-colors"
              >
                Inicio
              </button>
              {activeCat !== "Todos" && (
                <>
                  <ChevronRight className="w-3 h-3" />
                  <button
                    type="button"
                    onClick={() => setFilters((f) => ({ ...f, subcategoria: null }))}
                    className="hover:text-brand-ink transition-colors"
                  >
                    {activeCat}
                  </button>
                </>
              )}
              {filters.subcategoria && (
                <>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-brand-ink font-medium">
                    {filters.subcategoria}
                  </span>
                </>
              )}
            </nav>
          )}

          <div className={`grid gap-6 lg:gap-8 ${activeCat !== "Todos" ? "md:grid-cols-4" : "md:grid-cols-1"}`}>
            {activeCat !== "Todos" && (
              <FilterSidebar
                categoria={activeCat}
                selectedSub={filters.subcategoria}
                selectedColor={filters.color}
                priceMin={filters.priceMin}
                priceMax={filters.priceMax}
                onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
                onClear={() =>
                  setFilters({ subcategoria: null, color: null, priceMin: null, priceMax: null })
                }
              />
            )}

            <div className={activeCat !== "Todos" ? "md:col-span-3" : "md:col-span-1"}>
          <div className="flex flex-col gap-4">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-brand-ink">
                  {activeCat === "Todos" ? "Todo el catálogo" : activeCat}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {loading
                    ? "Cargando…"
                    : `${total.toLocaleString("es-AR")} ${total === 1 ? "artículo" : "artículos"}`}
                  {debouncedQuery && !loading && (
                    <span>
                      {" "}
                      · búsqueda "
                      <span className="font-medium">{debouncedQuery}</span>"
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2" data-testid="sort-control">
                <ArrowUpDown className="w-4 h-4 text-gray-500" strokeWidth={1.75} />
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="h-10 min-w-[220px] rounded-full border-border bg-white text-sm">
                    <SelectValue placeholder="Ordenar…" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((o) => (
                      <SelectItem key={o.v} value={o.v}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(subcategoryChips.length > 0 || brandChips.length > 0) && (
              <div className="flex flex-wrap gap-2 items-center">
                {subcategoryChips.map((sub) => {
                  const active = filters.subcategoria === sub;
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setFilters((f) => ({ ...f, subcategoria: active ? null : sub }))}
                      className={`h-9 rounded-full px-4 text-sm transition-all ${
                        active
                          ? "bg-brand-ink text-brand-cream"
                          : "bg-white border border-border text-brand-ink hover:border-brand-ink"
                      }`}
                    >
                      {sub}
                    </button>
                  );
                })}

                {brandChips.map((brand) => {
                  const active = filters.brand === brand;
                  return (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => setFilters((f) => ({ ...f, brand: active ? null : brand }))}
                      className={`h-9 rounded-full px-4 text-sm transition-all ${
                        active
                          ? "bg-brand-ink text-brand-cream"
                          : "bg-white border border-border text-brand-ink hover:border-brand-ink"
                      }`}
                    >
                      {brand}
                    </button>
                  );
                })}

                {(filters.subcategoria || filters.brand) && (
                  <button
                    type="button"
                    onClick={() => setFilters({ subcategoria: null, color: null, priceMin: null, priceMax: null })}
                    className="h-9 rounded-full px-4 text-sm bg-white border border-border text-gray-600 hover:border-brand-ink hover:text-brand-ink"
                  >
                    Limpiar filtros rápidos
                  </button>
                )}
              </div>
            )}
          </div>

          {loading && items.length === 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 py-6">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-border bg-white p-3"
                >
                  <Skeleton className="aspect-square rounded-xl mb-3" />
                  <Skeleton className="h-4 w-5/6 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-3" />
                  <Skeleton className="h-10 w-full rounded-full" />
                </div>
              ))}
            </div>
          )}

          {error && !loading && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
              {error}
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="rounded-2xl border border-border bg-white p-12 text-center">
              <p className="font-display text-lg font-semibold text-brand-ink">
                Sin resultados
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Probá con otro término o elegí otra categoría.
              </p>
            </div>
          )}

          {!loading && items.length > 0 && (
            <>
              <div
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5"
                data-testid="product-grid"
              >
                {items.map((p) => (
                  <ProductCard key={p.sku} product={p} />
                ))}
              </div>

              {hasMore && (
                <div className="mt-10 flex justify-center">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="inline-flex items-center justify-center h-11 px-6 rounded-full bg-white border border-border text-sm font-medium text-brand-ink hover:border-brand-ink transition-colors disabled:opacity-50"
                    data-testid="load-more-button"
                  >
                    {loadingMore ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Ver más artículos (
                        {(total - items.length).toLocaleString("es-AR")}{" "}
                        restantes)
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
            </div>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-border bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={`${process.env.PUBLIC_URL || ""}/logo-dd.png`}
              alt="D+D"
              className="h-8 w-auto"
            />
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} D+D · Alcorta.
            </p>
          </div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400">
            Librería & Marroquinería
          </p>
        </div>
      </footer>
    </div>
  );
}
