import { useEffect, useState } from "react";
import { Loader2, Sparkles, GraduationCap, Gamepad2, PartyPopper } from "lucide-react";
import { fetchProducts } from "../../lib/api";
import { ProductCard } from "./ProductCard";

// Pre-defined kits — each fetches up to 3 products matching its keywords
const KITS = [
  {
    id: "universitario",
    name: "Kit Universitario",
    Icon: GraduationCap,
    color: "bg-brand-blue",
    accent: "text-brand-blue",
    pill: "bg-brand-blue/10 text-brand-blue",
    tagline: "Todo para arrancar las clases",
    query: "cuaderno",
    sort: "relevance",
  },
  {
    id: "gamer",
    name: "Kit Gamer",
    Icon: Gamepad2,
    color: "bg-brand-coral",
    accent: "text-brand-coral",
    pill: "bg-brand-coral/10 text-brand-coral",
    tagline: "Lo último en gaming y audio",
    query: "auricular",
    sort: "relevance",
  },
  {
    id: "regalo",
    name: "Set de Regalo",
    Icon: PartyPopper,
    color: "bg-brand-yellow",
    accent: "text-yellow-700",
    pill: "bg-brand-yellow/15 text-yellow-700",
    tagline: "Detalles que hacen la diferencia",
    query: "mate",
    sort: "relevance",
  },
];

const KitBlock = ({ kit }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts({ q: kit.query, sort: kit.sort, limit: 3 })
      .then((d) => setItems((d.items || []).slice(0, 3)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [kit.query, kit.sort]);

  if (loading) return null;
  if (items.length === 0) return null;

  const Icon = kit.Icon;

  return (
    <div
      className="rounded-3xl border border-border bg-white p-4 sm:p-5 shadow-sm"
      data-testid={`kit-${kit.id}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <span className={`h-11 w-11 rounded-full ${kit.color} grid place-items-center shadow-sm`}>
          <Icon className="w-5 h-5 text-white" strokeWidth={2} />
        </span>
        <div>
          <p className={`text-[10px] uppercase tracking-[0.2em] font-bold ${kit.accent}`}>
            Nexo Recomendado
          </p>
          <h4 className="font-display text-lg sm:text-xl font-bold text-brand-blue leading-tight">
            {kit.name}
          </h4>
          <p className="text-xs text-gray-500">{kit.tagline}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {items.map((p) => (
          <ProductCard key={p.sku} product={p} />
        ))}
      </div>
    </div>
  );
};

export const KitsRecommended = () => (
  <section className="my-10" data-testid="kits-recommended">
    <div className="flex items-center gap-3 mb-6">
      <span className="h-11 w-11 rounded-full bg-brand-teal grid place-items-center shadow-md">
        <Sparkles className="w-5 h-5 text-white" strokeWidth={2} />
      </span>
      <div>
        <p className="text-[11px] uppercase tracking-[0.25em] text-brand-teal font-bold">
          Selecciones de Nexo
        </p>
        <h3 className="font-display text-2xl sm:text-3xl font-bold text-brand-blue">
          Nexos Recomendados
        </h3>
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
      {KITS.map((k) => (
        <KitBlock key={k.id} kit={k} />
      ))}
    </div>
  </section>
);
