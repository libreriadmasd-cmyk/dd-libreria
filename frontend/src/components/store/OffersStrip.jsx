import { Link } from "react-router-dom";
import { Sparkles, ImageOff } from "lucide-react";
import { formatARS } from "../../lib/format";

const isUrl = (s) => typeof s === "string" && /^https?:\/\//i.test(s);
const firstImage = (p) =>
  (Array.isArray(p?.imagenes) && p.imagenes[0]) || p?.imagen || "";

const OfferCard = ({ product }) => {
  const img = firstImage(product);
  const discount =
    product.precio_oferta && product.precio
      ? Math.round((1 - product.precio_oferta / product.precio) * 100)
      : 0;

  return (
    <Link
      to={`/producto/${product.sku}`}
      className="group relative shrink-0 w-[180px] sm:w-[200px] rounded-2xl border border-border bg-white overflow-hidden hover:-translate-y-0.5 hover:shadow-lg transition-all"
      data-testid={`offer-card-${product.sku}`}
    >
      <div className="relative aspect-square bg-pastel-sand">
        {img ? (
          <img
            src={img}
            alt={product.nombre}
            loading="lazy"
            className="w-full h-full object-contain p-3"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-gray-300">
            <ImageOff className="w-5 h-5" />
          </div>
        )}
        {discount > 0 && (
          <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white px-2 py-1 rounded-full shadow-sm">
            -{discount}%
          </span>
        )}
        <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider bg-brand-yellow text-brand-ink px-2 py-0.5 rounded-full">
          Oferta
        </span>
      </div>
      <div className="p-3">
        <p className="font-medium text-brand-ink text-[13px] leading-snug line-clamp-2 min-h-[2.6em]">
          {product.nombre}
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-display text-base font-bold text-red-600 tabular-nums">
            {formatARS(product.precio_oferta)}
          </span>
          <span className="text-xs text-gray-400 line-through tabular-nums">
            {formatARS(product.precio)}
          </span>
        </div>
      </div>
    </Link>
  );
};

export const OffersStrip = ({ items = [] }) => {
  if (!items || items.length === 0) return null;
  return (
    <section
      className="relative animate-fade-up"
      data-testid="offers-strip"
    >
      <div className="rounded-3xl bg-gradient-to-br from-red-50 via-white to-brand-yellow/10 border border-red-100 p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-xl bg-red-600 grid place-items-center">
            <Sparkles className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-brand-ink tracking-tight">
              Ofertas de la semana
            </h2>
            <p className="text-xs text-gray-500">
              {items.length} {items.length === 1 ? "producto" : "productos"} con
              descuento especial
            </p>
          </div>
        </div>
        <div className="-mx-2 px-2 pb-1">
          {/* Small screens: horizontal scroll. Medium+ use a responsive grid up to 5 cols */}
          <div className="flex gap-3 overflow-x-auto md:overflow-visible md:flex-none md:px-0 md:-mx-0">
            <div className="md:hidden flex gap-3">
              {items.map((p) => (
                <OfferCard key={p.sku} product={p} />
              ))}
            </div>
          </div>

          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {items.map((p) => (
              <OfferCard key={p.sku} product={p} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
