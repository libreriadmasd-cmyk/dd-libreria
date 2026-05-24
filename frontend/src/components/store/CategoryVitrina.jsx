import { Link } from "react-router-dom";
import { ShoppingBag, BookOpen, Gamepad2, Gift, Cpu, ArrowRight } from "lucide-react";
import { ProductCard } from "./ProductCard";

// Icon + color per category
export const CATEGORY_META = {
  Marroquinería: { Icon: ShoppingBag, color: "text-brand-greenDark", bg: "bg-pastel-mint" },
  Librería: { Icon: BookOpen, color: "text-gray-700", bg: "bg-pastel-sand" },
  Juguetería: { Icon: Gamepad2, color: "text-yellow-900", bg: "bg-pastel-butter" },
  Regalería: { Icon: Gift, color: "text-purple-800", bg: "bg-pastel-lilac" },
  Tecno: { Icon: Cpu, color: "text-blue-900", bg: "bg-pastel-sky" },
};

export const CategoryVitrina = ({ category, items = [], onJumpTo }) => {
  const meta = CATEGORY_META[category] || CATEGORY_META.Librería;
  const { Icon, color, bg } = meta;
  const isEmpty = items.length === 0;

  return (
    <section
      className="space-y-5 animate-fade-up"
      data-testid={`vitrina-${category}`}
    >
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`h-12 w-12 rounded-2xl ${bg} grid place-items-center shrink-0`}>
            <Icon className={`w-6 h-6 ${color}`} strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-brand-ink tracking-tight">
              {category}
            </h3>
            <p className="text-xs text-gray-500">
              {isEmpty ? "Pronto sumamos artículos" : "Selección de la semana"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onJumpTo?.(category)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-ink hover:gap-2 transition-all"
          data-testid={`vitrina-${category}-see-all`}
        >
          Ver todos
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {isEmpty ? (
        <div className="rounded-2xl border border-dashed border-border bg-white/70 p-8 text-center text-sm text-gray-500">
          Esta categoría todavía no tiene artículos. Pronto sumamos novedades.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          {items.slice(0, 3).map((p) => (
            <ProductCard key={p.sku} product={p} />
          ))}
        </div>
      )}
    </section>
  );
};
