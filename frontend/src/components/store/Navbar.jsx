import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Search, X, Trash2, Minus, Plus, ImageOff } from "lucide-react";
import { Input } from "../ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "../ui/sheet";
import { useCart } from "../../context/CartContext";
import { formatARS } from "../../lib/format";
import { buildWhatsAppUrl } from "../../lib/whatsapp";
import { searchSuggest } from "../../lib/api";
import { cldThumb } from "../../lib/cloudinary";

const isUrl = (s) => typeof s === "string" && /^https?:\/\//i.test(s);
const resolveImg = (img) => {
  if (!img) return "";
  const url = isUrl(img) ? img : `${process.env.PUBLIC_URL || ""}/images/${img}`;
  return cldThumb(url);
};
const firstImage = (p) =>
  (Array.isArray(p.imagenes) && p.imagenes[0]) || p.imagen || "";

// ============ Predictive Search ============
const SearchBox = ({ value, onChange }) => {
  const [hits, setHits] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // Debounced suggestions
  useEffect(() => {
    const q = (value || "").trim();
    if (q.length < 2) {
      setHits([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await searchSuggest(q, 6);
        setHits(res.items || []);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const goTo = (sku) => {
    setOpen(false);
    navigate(`/producto/${sku}`);
  };

  const onKeyDown = (e) => {
    if (!open || hits.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      goTo(hits[activeIdx].sku);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 max-w-xl mx-auto"
      data-testid="search-box"
    >
      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <Input
        type="text"
        value={value || ""}
        onChange={(e) => {
          onChange?.(e.target.value);
          setActiveIdx(-1);
          if (window.location.pathname !== "/") navigate("/");
        }}
        onKeyDown={onKeyDown}
        onFocus={() => hits.length > 0 && setOpen(true)}
        placeholder="Buscar por nombre o SKU…"
        className="pl-10 h-11 rounded-full border-border bg-white focus-visible:ring-brand-ink/20"
        data-testid="nav-search-input"
        autoComplete="off"
      />
      {open && (hits.length > 0 || loading) && (
        <div
          className="absolute top-full mt-2 left-0 right-0 rounded-2xl bg-white border border-border shadow-lg overflow-hidden z-50 animate-fade-up"
          data-testid="search-suggest-panel"
        >
          {loading && hits.length === 0 && (
            <div className="p-4 text-sm text-gray-500">Buscando…</div>
          )}
          <ul>
            {hits.map((h, idx) => {
              const img = resolveImg(firstImage(h));
              return (
                <li key={h.sku}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIdx(idx)}
                    onClick={() => goTo(h.sku)}
                    className={`w-full flex items-center gap-3 p-2.5 text-left transition ${
                      activeIdx === idx ? "bg-brand-cream" : "hover:bg-brand-cream/60"
                    }`}
                    data-testid={`suggest-item-${h.sku}`}
                  >
                    <div className="h-11 w-11 shrink-0 rounded-lg bg-pastel-sand overflow-hidden grid place-items-center">
                      {img ? (
                        <img
                          src={img}
                          alt=""
                          className="w-full h-full object-contain p-1"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <ImageOff className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-brand-ink truncate">
                        {h.nombre}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        <span className="font-mono">{h.sku}</span> ·{" "}
                        <span className="text-gray-400">{h.categoria}</span>
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-brand-ink tabular-nums">
                      {formatARS(h.precio)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

// ============ Navbar ============
export const Navbar = ({ searchQuery, onSearchChange }) => {
  const { items, count, total, pulseKey, removeItem, updateQty, clear } =
    useCart();
  const [open, setOpen] = useState(false);

  const handleWhatsApp = () => {
    window.open(buildWhatsAppUrl(items, total), "_blank", "noopener");
  };

  return (
    <>
      <header
        className="sticky top-0 z-50 w-full border-b border-brand-blue/10 bg-white/95 backdrop-blur-xl shadow-sm"
        data-testid="main-header"
      >
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="hidden md:flex flex-1">
            <SearchBox value={searchQuery} onChange={onSearchChange} />
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center text-center pointer-events-none md:pointer-events-auto">
            <Link
              to="/"
              className="flex flex-col items-center gap-1"
              data-testid="nav-brand"
            >
              <div className="flex items-center gap-2">
                <span className="text-brand-blue text-xl sm:text-2xl font-extrabold tracking-tight">
                  Nexo
                </span>
                <span className="text-brand-coral text-xl sm:text-2xl font-extrabold tracking-tight">
                  Store
                </span>
              </div>
              <span className="text-[10px] uppercase tracking-[0.35em] text-brand-teal font-semibold">
                Conectamos lo que necesitás
              </span>
            </Link>
          </div>

          <div className="flex justify-end flex-1">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="relative h-11 px-4 rounded-full bg-brand-blue text-white hover:bg-brand-blueDark active:scale-[0.98] transition-all inline-flex items-center gap-2 text-sm font-semibold"
              data-testid="nav-cart-button"
              aria-label="Carrito"
            >
              <ShoppingBag className="w-4 h-4" strokeWidth={1.75} />
              <span className="hidden sm:inline">Bolsa</span>
              {count > 0 && (
                <span
                  key={pulseKey}
                  className="min-w-[22px] h-5 px-1.5 rounded-full bg-brand-yellow text-brand-blue text-[11px] font-bold grid place-items-center animate-cart-pulse"
                  data-testid="nav-cart-counter"
                >
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
        <div className="md:hidden px-4 pb-3">
          <SearchBox value={searchQuery} onChange={onSearchChange} />
        </div>
      </header>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md p-0 flex flex-col bg-brand-cream"
          data-testid="cart-drawer"
        >
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border text-left">
            <SheetTitle className="font-display text-2xl font-bold text-brand-ink">
              Tu bolsa
            </SheetTitle>
            <SheetDescription className="text-sm text-gray-500">
              {count === 0
                ? "Aún no hay artículos."
                : `${count} ${count === 1 ? "artículo" : "artículos"} seleccionados.`}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="h-14 w-14 rounded-full bg-pastel-sand grid place-items-center mb-4">
                  <ShoppingBag
                    className="w-6 h-6 text-brand-ink"
                    strokeWidth={1.5}
                  />
                </div>
                <p className="font-display font-semibold text-brand-ink">
                  Bolsa vacía
                </p>
                <p className="text-sm text-gray-500 mt-1 max-w-[30ch]">
                  Explorá el catálogo y agregá lo que te guste.
                </p>
              </div>
            ) : (
              <ul className="space-y-3" data-testid="cart-items">
                {items.map((i) => (
                  <li
                    key={i.id}
                    className="flex gap-3 rounded-2xl border border-border p-3 bg-white"
                  >
                    <div className="h-16 w-16 shrink-0 rounded-xl bg-pastel-sand overflow-hidden grid place-items-center">
                      {i.imagen ? (
                        <img
                          src={resolveImg(i.imagen)}
                          alt={i.nombre}
                          className="w-full h-full object-contain p-1.5"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-brand-ink line-clamp-2 leading-snug">
                        {i.nombre}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatARS(i.precio)} c/u
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="inline-flex items-center rounded-full bg-brand-cream border border-border">
                          <button
                            type="button"
                            onClick={() => updateQty(i.id, -1)}
                            className="h-7 w-7 grid place-items-center rounded-full hover:bg-pastel-sand active:scale-90 transition"
                            aria-label="Restar"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="min-w-[24px] text-center text-sm font-semibold tabular-nums">
                            {i.cantidad}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQty(i.id, 1)}
                            className="h-7 w-7 grid place-items-center rounded-full hover:bg-pastel-sand active:scale-90 transition"
                            aria-label="Sumar"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-sm font-semibold text-brand-ink tabular-nums">
                          {formatARS(i.precio * i.cantidad)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(i.id)}
                      className="h-7 w-7 shrink-0 grid place-items-center rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {items.length > 0 && (
            <div className="border-t border-border p-6 space-y-4 bg-white">
              <div className="flex items-baseline justify-between">
                <span className="text-xs uppercase tracking-[0.15em] text-gray-500">
                  Total estimado
                </span>
                <span
                  className="font-display text-2xl font-bold text-brand-ink tabular-nums"
                  data-testid="cart-total"
                >
                  {formatARS(total)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleWhatsApp}
                className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-full bg-brand-green hover:bg-brand-greenDark text-white text-sm font-semibold transition-all active:scale-[0.98]"
                data-testid="cart-whatsapp-button"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 fill-current"
                  aria-hidden="true"
                >
                  <path d="M20.52 3.48A11.87 11.87 0 0 0 12.04 0C5.5 0 .18 5.3.18 11.84c0 2.09.55 4.13 1.6 5.93L0 24l6.38-1.67a11.82 11.82 0 0 0 5.66 1.44h.01c6.53 0 11.85-5.3 11.85-11.84 0-3.16-1.23-6.13-3.38-8.45ZM12.04 21.8h-.01a9.92 9.92 0 0 1-5.06-1.39l-.36-.21-3.79.99 1.01-3.69-.24-.38a9.83 9.83 0 0 1-1.51-5.28c0-5.44 4.44-9.87 9.91-9.87 2.65 0 5.13 1.03 7 2.9a9.79 9.79 0 0 1 2.9 6.98c0 5.44-4.44 9.95-9.85 9.95Zm5.68-7.41c-.31-.15-1.84-.91-2.13-1.01-.29-.1-.5-.15-.71.16-.21.31-.82 1.01-1 1.22-.18.21-.37.23-.68.08-.31-.15-1.31-.48-2.5-1.54a9.36 9.36 0 0 1-1.73-2.14c-.18-.31-.02-.48.14-.63.14-.14.31-.37.47-.55.16-.18.21-.31.31-.52.1-.21.05-.39-.03-.55-.08-.15-.71-1.71-.97-2.34-.25-.61-.51-.53-.71-.54l-.61-.01c-.21 0-.55.08-.84.39-.29.31-1.1 1.08-1.1 2.63 0 1.55 1.13 3.06 1.29 3.27.16.21 2.23 3.4 5.41 4.77.76.33 1.35.52 1.81.67.76.24 1.45.21 2 .13.61-.09 1.84-.75 2.1-1.48.26-.73.26-1.36.18-1.48-.08-.13-.29-.21-.6-.36Z" />
                </svg>
                Pedir por WhatsApp
              </button>
              <button
                type="button"
                onClick={clear}
                className="w-full text-xs text-gray-500 hover:text-red-600 transition inline-flex items-center justify-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Vaciar bolsa
              </button>
              <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                Finalizás tu pedido por WhatsApp con Nexo Store. Stock y precio final
                se confirman en el chat.
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};
