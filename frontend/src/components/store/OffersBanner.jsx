import { useEffect, useState } from "react";
import { Loader2, Flame } from "lucide-react";
import { fetchProducts } from "../../lib/api";
import { ProductCard } from "./ProductCard";

export const OffersBanner = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts({ on_sale: true, sort: "offers", limit: 8 })
      .then((d) => setItems(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <section
      className="relative rounded-3xl border border-red-200 bg-gradient-to-br from-red-50 via-white to-pastel-butter/40 p-5 sm:p-7 my-6 shadow-sm"
      data-testid="offers-banner"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="h-12 w-12 rounded-2xl bg-red-600 grid place-items-center shadow-lg">
          <Flame className="w-6 h-6 text-white" strokeWidth={2} />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-red-700 font-bold">
            Ofertas de la semana
          </p>
          <h3 className="font-display text-2xl sm:text-3xl font-bold text-brand-ink leading-tight">
            🔥 Todo lo mejor en precio especial
          </h3>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {items.slice(0, 8).map((p) => (
          <ProductCard key={p.sku} product={p} />
        ))}
      </div>
    </section>
  );
};
