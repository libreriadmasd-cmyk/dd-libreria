import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "../components/store/Navbar";
import { CategoryTabs } from "../components/store/CategoryTabs";
import { ProductCard } from "../components/store/ProductCard";
import { Loader2, ArrowUpDown } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import { fetchProducts, fetchCategories, fetchFacets } from "../lib/api";
import { FeaturedSections } from "../components/store/FeaturedSections";
import { FilterSidebar } from "../components/store/FilterSidebar";
import { OffersBanner } from "../components/store/OffersBanner";
import { Footer } from "../components/store/Footer";
import { TrustBanner } from "../components/store/TrustBanner";
import { KitsCarousel } from "../components/store/KitsCarousel";
import { ChevronRight, Home as HomeIcon } from "lucide-react";

const PAGE_SIZE = 48;

const SORT_OPTIONS = [
  { v: "relevance", label: "Relevancia" },
  { v: "offers", label: "Mejores ofertas" },
  { v: "price_asc", label: "Precio · menor a mayor" },
  { v: "price_desc", label: "Precio · mayor a menor" },
  { v: "name_asc", label: "Nombre · A → Z" },
  { v: "newest", label: "Recién actualizados" },
];

const EMPTY_FILTERS = {
  marca: "", color: "", min_price: "", max_price: "", on_sale: false, subcategoria: "",
};

const CATEGORY_KEYWORDS = {
  "Marroquinería": [
    "mochila",
    "cartuchera",
    "bolso",
    "billetera",
    "cartera",
    "portafolio",
  ],
  "Juguetería": [
    "juego",
    "juguete",
    "muñeca",
    "auto",
    "pelota",
    "punteria",
    "dados",
    "cartas",
  ],
  "Regalería": [
    "regalo",
    "set",
    "pack",
    "souvenir",
    "tarjeta",
    "adorno",
    "velas",
    "box",
  ],
  "Tecno": [
    "cable",
    "usb",
    "mouse",
    "teclado",
    "auricular",
    "pila",
    "calculadora",
  ],
};

const normalizeTitle = (name) => (name || "").toLowerCase();

const classifyProductCategory = (product) => {
  const title = normalizeTitle(product?.nombre || product?.name || "");
  const category = (product?.categoria || "").trim().toLowerCase();

  if (["marroquinería", "marroquineria"].includes(category)) return "Marroquinería";
  if (["juguetería", "jugueteria"].includes(category)) return "Juguetería";
  if (["regalería", "regaleria"].includes(category)) return "Regalería";
  if (category === "tecno") return "Tecno";

  if (CATEGORY_KEYWORDS["Marroquinería"].some((keyword) => title.includes(keyword))) {
    return "Marroquinería";
  }
  if (CATEGORY_KEYWORDS["Juguetería"].some((keyword) => title.includes(keyword))) {
    return "Juguetería";
  }
  if (CATEGORY_KEYWORDS["Regalería"].some((keyword) => title.includes(keyword))) {
    return "Regalería";
  }
  if (CATEGORY_KEYWORDS["Tecno"].some((keyword) => title.includes(keyword))) {
    return "Tecno";
  }

  return "Librería";
};

const matchesActiveCategory = (product, category) => category === "Todos" || classifyProductCategory(product) === category;

export default function Home() {
  const { cat } = useParams();
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
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [hasMore, setHasMore] = useState(false);
  const [subCounts, setSubCounts] = useState({});

  // Sync selected category with route param
  useEffect(() => {
    if (!cat) {
      setActiveCat("Todos");
      return;
    }
    const decoded = decodeURIComponent(cat);
    setActiveCat(["Todos", "Marroquinería", "Librería", "Juguetería", "Regalería", "Tecno"].includes(decoded) ? decoded : "Todos");
  }, [cat]);

  // Fetch facets counts for subcategory nav (hide empty options)
  useEffect(() => {
    if (activeCat === "Todos") { setSubCounts({}); return; }
    let active = true;
    fetchFacets({ categoria: activeCat })
      .then((f) => {
        if (!active) return;
        const m = {};
        (f.subcategorias || []).forEach((s) => { m[s.name] = s.count; });
        setSubCounts(m);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [activeCat]);

  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const reloadCategories = useCallback(async () => {
    try {
      const data = await fetchCategories();
      const map = { __total: data.total };
      (data.categories || []).forEach((c) => { map[c.name] = c.count; });
      setCounts(map);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { reloadCategories(); }, [reloadCategories]);

  // Reset filters when category changes
  useEffect(() => { setFilters(EMPTY_FILTERS); }, [activeCat]);

  const navigate = useNavigate();
  const handleSelectCategory = (category) => {
    const nextPath = category === "Todos" ? "/" : `/categoria/${encodeURIComponent(category)}`;
    if (window.location.pathname !== nextPath) navigate(nextPath);
    setActiveCat(category);
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setSkip(0);
    const rawLimit = activeCat === "Todos" ? PAGE_SIZE : PAGE_SIZE * 4;
    const params = {
      q: debouncedQuery,
      sort,
      skip: 0,
      limit: rawLimit,
      ...filters,
    };
    if (!params.marca) delete params.marca;
    if (!params.color) delete params.color;
    if (!params.min_price) delete params.min_price;
    if (!params.max_price) delete params.max_price;
    if (!params.subcategoria) delete params.subcategoria;
    if (!params.on_sale) delete params.on_sale;

    fetchProducts(params)
      .then((data) => {
        if (!active) return;
        const rawItems = data.items || [];
        const filteredItems = rawItems.filter((product) => matchesActiveCategory(product, activeCat));
        setItems(filteredItems);
        setTotal(activeCat === "Todos" ? Number(data.total || filteredItems.length) : filteredItems.length);
        setHasMore(rawItems.length === rawLimit);
        setError(null);
      })
      .catch((e) => {
        if (!active) return;
        setError(e.message);
        setItems([]); setTotal(0);
        setHasMore(false);
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [activeCat, debouncedQuery, sort, filters]);

  const handleLoadMore = async () => {
    const rawLimit = activeCat === "Todos" ? PAGE_SIZE : PAGE_SIZE * 4;
    const nextSkip = skip + rawLimit;
    setLoadingMore(true);
    try {
      const data = await fetchProducts({
        q: debouncedQuery,
        sort,
        skip: nextSkip,
        limit: rawLimit,
        ...filters,
      });
      const rawItems = data.items || [];
      const filteredItems = rawItems.filter((product) => matchesActiveCategory(product, activeCat));
      setItems((prev) => [...prev, ...filteredItems]);
      setSkip(nextSkip);
      setHasMore(rawItems.length === rawLimit);
    } catch (e) {
      setError(e.message);
    } finally { setLoadingMore(false); }
  };

  const showHomeSections =
    activeCat === "Todos" && !debouncedQuery && !filters.marca && !filters.color &&
    !filters.min_price && !filters.max_price && !filters.on_sale && !filters.subcategoria;

  return (
    <div className="min-h-screen relative">
      <Navbar searchQuery={query} onSearchChange={setQuery} />
      <CategoryTabs selected={activeCat} onSelect={handleSelectCategory} counts={counts} />

      {showHomeSections && (
        <section className="relative overflow-hidden border-b border-border">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
            <p className="text-[11px] uppercase tracking-[0.3em] text-brand-teal font-semibold mb-3" data-testid="hero-tagline">
              Nexo Store · Conectamos lo que necesitás
            </p>
          </div>
        </section>
      )}

      {showHomeSections && <TrustBanner />}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {showHomeSections && (
          <>
            <KitsCarousel />
            <OffersBanner />
            <div className="pt-6 pb-12">
              <FeaturedSections onSelectCategory={handleSelectCategory} />
            </div>
          </>
        )}

        {/* Breadcrumbs when not on home view */}
        {!showHomeSections && (
          <nav
            className="flex items-center gap-1.5 text-sm text-gray-500 pt-4"
            data-testid="catalog-breadcrumb"
          >
            <button
              onClick={() => handleSelectCategory("Todos")}
              className="hover:text-brand-blue transition-colors inline-flex items-center gap-1"
            >
              <HomeIcon className="w-3.5 h-3.5" /> Inicio
            </button>
            {activeCat !== "Todos" && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-brand-blue font-medium">{activeCat}</span>
              </>
            )}
            {filters.subcategoria && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-brand-blue font-medium">{filters.subcategoria}</span>
              </>
            )}
          </nav>
        )}

        <div className="pt-8 pb-20">
          <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-brand-ink">
                {activeCat === "Todos" ? "Todo el catálogo" : activeCat}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {loading ? "Cargando…" : `${total.toLocaleString("es-AR")} ${total === 1 ? "artículo" : "artículos"}`}
                {debouncedQuery && !loading && (
                  <span> · búsqueda "<span className="font-medium">{debouncedQuery}</span>"</span>
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
                    <SelectItem key={o.v} value={o.v}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
            <FilterSidebar categoria={activeCat} filters={filters} onChange={setFilters} />

            <div>
              {loading && (
                <div className="flex items-center justify-center py-24 text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              )}

              {error && !loading && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
                  {error}
                </div>
              )}

              {!loading && !error && items.length === 0 && (
                <div className="rounded-2xl border border-border bg-white p-12 text-center">
                  <p className="font-display text-lg font-semibold text-brand-ink">Sin resultados</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Probá con otro término o quitá filtros.
                  </p>
                </div>
              )}

              {!loading && items.length > 0 && (
                <>
                  <div
                    className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5"
                    data-testid="product-grid"
                  >
                    {items.map((p) => <ProductCard key={p.sku} product={p} />)}
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
                          <>Ver más artículos ({(total - items.length).toLocaleString("es-AR")} restantes)</>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10">
        <Footer />
      </footer>
    </div>
  );
}
