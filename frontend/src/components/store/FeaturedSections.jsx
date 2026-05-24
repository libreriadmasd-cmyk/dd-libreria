import { useEffect, useState } from "react";
import { Loader2, ImageOff } from "lucide-react";
import { fetchFeatured } from "../../lib/api";
import { CATEGORIES_META } from "./categoriesMeta";
import { cldTile } from "../../lib/cloudinary";

const isUrl = (s) => typeof s === "string" && /^https?:\/\//i.test(s);
const firstImage = (p) =>
  (Array.isArray(p?.imagenes) && p.imagenes[0]) || p?.imagen || "";

const PhotoTile = ({ product, className }) => {
  const [ok, setOk] = useState(true);
  const img = firstImage(product);
  const src = isUrl(img) ? cldTile(img) : "";
  return (
    <div
      className={`bg-white/90 rounded-xl overflow-hidden grid place-items-center ${className}`}
      title={product?.nombre}
    >
      {src && ok ? (
        <img
          src={src}
          alt={product?.nombre || ""}
          className="w-full h-full object-cover"
          onError={() => setOk(false)}
          loading="lazy"
        />
      ) : (
        <div className="text-gray-400 flex flex-col items-center gap-1 p-2">
          <ImageOff className="w-5 h-5" />
          <span className="text-[9px] font-mono uppercase tracking-wider text-center line-clamp-2">
            {product?.nombre?.slice(0, 22) || "—"}
          </span>
        </div>
      )}
    </div>
  );
};

const CategoryCard = ({ meta, items, onSelect, large = false }) => {
  const { name, Icon, bg, tagline } = meta;
  const safeItems = (items || []).slice(0, 3);
  while (safeItems.length < 3) safeItems.push(null);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(name)}
      className={`group relative overflow-hidden rounded-3xl ${bg} text-white shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 text-left flex ${
        large ? "min-h-[420px]" : "min-h-[320px]"
      }`}
      data-testid={`cat-card-${name}`}
    >
      {/* Left: title + tagline + circular icon */}
      <div className="w-[42%] sm:w-[40%] p-5 sm:p-7 flex flex-col justify-between relative z-10">
        <div className={`h-14 w-14 sm:h-16 sm:w-16 grid place-items-center rounded-full bg-white/15 backdrop-blur ring-2 ${meta.iconRing || "ring-white/30"}`}>
          <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" strokeWidth={1.75} />
        </div>
        <div>
          <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight uppercase leading-none">
            {name}
          </h3>
          <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-white/85 leading-snug max-w-[18ch]">
            {tagline}
          </p>
          <span className="inline-flex items-center gap-1 mt-3 text-[11px] uppercase tracking-[0.2em] text-white/70 group-hover:text-white">
            Explorar →
          </span>
        </div>
      </div>

      {/* Right: photo collage 2x2 */}
      <div className="w-[58%] sm:w-[60%] p-2 sm:p-3 grid grid-cols-2 grid-rows-2 gap-2 sm:gap-3">
        <div className="row-span-2">
          {safeItems[0] ? (
            <PhotoTile product={safeItems[0]} className="h-full" />
          ) : (
            <div className="h-full bg-white/15 rounded-xl" />
          )}
        </div>
        {safeItems[1] ? (
          <PhotoTile product={safeItems[1]} className="aspect-square" />
        ) : (
          <div className="aspect-square bg-white/15 rounded-xl" />
        )}
        {safeItems[2] ? (
          <PhotoTile product={safeItems[2]} className="aspect-square" />
        ) : (
          <div className="aspect-square bg-white/15 rounded-xl" />
        )}
      </div>
    </button>
  );
};

export const FeaturedSections = ({ onSelectCategory }) => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeatured()
      .then((d) => setData(d.sections || {}))
      .catch(() => setData({}))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const get = (n) => CATEGORIES_META.find((c) => c.name === n);

  return (
    <section className="my-8" data-testid="featured-sections">
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500">
          Categorías destacadas
        </p>
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink mt-1">
          Encontrá lo que buscás
        </h2>
      </div>

      {/* All 5 categories same size: 2 cols on md, 3 cols on lg with the
          5th centered in last row to keep equal dimensions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        <CategoryCard meta={get("Tecno")} items={data["Tecno"]} onSelect={onSelectCategory} />
        <CategoryCard meta={get("Marroquinería")} items={data["Marroquinería"]} onSelect={onSelectCategory} />
        <CategoryCard meta={get("Juguetería")} items={data["Juguetería"]} onSelect={onSelectCategory} />
        <CategoryCard meta={get("Librería")} items={data["Librería"]} onSelect={onSelectCategory} />
        <CategoryCard meta={get("Regalería")} items={data["Regalería"]} onSelect={onSelectCategory} />
      </div>
    </section>
  );
};
