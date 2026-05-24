import { Link } from "react-router-dom";
import { Plus, ImageOff } from "lucide-react";
import { formatARS } from "../../lib/format";
import { useCart } from "../../context/CartContext";
import { toast } from "sonner";
import { useState } from "react";
import { cldThumb } from "../../lib/cloudinary";

const CATEGORY_STYLES = {
  Marroquinería: "bg-pastel-mint text-brand-greenDark",
  Librería: "bg-pastel-sand text-gray-700",
  Juguetería: "bg-pastel-butter text-yellow-900",
  Regalería: "bg-pastel-lilac text-purple-800",
  Tecno: "bg-pastel-sky text-blue-900",
  General: "bg-gray-100 text-gray-600",
};

const isUrl = (s) => typeof s === "string" && /^https?:\/\//i.test(s);
const resolveImg = (img) => {
  if (!img) return "";
  const url = isUrl(img) ? img : `${process.env.PUBLIC_URL || ""}/images/${img}`;
  return cldThumb(url);
};
const firstImage = (p) =>
  (Array.isArray(p?.imagenes) && p.imagenes[0]) || p?.imagen || "";

const ImageFallback = ({ name }) => {
  const initials = (name || "Nexo Store")
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map((w) => w[0]).join("").toUpperCase();
  return (
    <div className="absolute inset-0 grid place-items-center bg-pastel-sand">
      <div className="flex flex-col items-center text-gray-400">
        <ImageOff className="w-6 h-6 mb-2" strokeWidth={1.5} />
        <span className="font-display text-2xl font-semibold text-gray-500">
          {initials || "Nexo Store"}
        </span>
      </div>
    </div>
  );
};

export const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [imgOk, setImgOk] = useState(Boolean(firstImage(product)));
  const imgSrc = resolveImg(firstImage(product));
  const hasGallery =
    Array.isArray(product.imagenes) && product.imagenes.length > 1;
  const badgeClass =
    CATEGORY_STYLES[product.categoria] || CATEGORY_STYLES.General;

  const oferta = Number(product.precio_oferta) || 0;
  const precio = Number(product.precio) || 0;
  const onSale = oferta > 0 && oferta < precio;
  const offPercent = onSale
    ? Math.round(((precio - oferta) / precio) * 100)
    : 0;

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const p = onSale ? { ...product, precio: oferta } : product;
    addToCart(p);
    toast.success("Agregado a la bolsa", { description: product.nombre });
  };

  return (
    <Link
      to={`/producto/${product.sku}`}
      className="group relative rounded-2xl border border-border bg-white p-3 flex flex-col transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-brand-ink/30 animate-fade-up"
      data-testid="product-card"
    >
      <div className="relative aspect-square rounded-xl bg-pastel-sand overflow-hidden mb-3">
        {imgSrc && imgOk ? (
          <img
            src={imgSrc}
            alt={product.nombre}
            loading="lazy"
            className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
            data-testid="product-image"
            onError={() => setImgOk(false)}
          />
        ) : (
          <ImageFallback name={product.nombre} />
        )}
        {onSale && (
          <span
            className="absolute top-2 left-2 text-[11px] font-extrabold tracking-wide bg-red-600 text-white px-2.5 py-1 rounded-full shadow-md"
            data-testid="off-badge"
          >
            -{offPercent}% OFF
          </span>
        )}
        {product.destacado && !onSale && (
          <span className="absolute top-2 left-2 text-[10px] font-bold tracking-wide bg-brand-yellow text-brand-ink px-2 py-0.5 rounded-full">
            ★ Destacado
          </span>
        )}
        {product.stock !== undefined && product.stock <= 0 && (
          <span className="absolute top-2 right-2 text-[10px] font-medium bg-white/95 text-gray-700 px-2 py-1 rounded-full border border-border">
            Consultar stock
          </span>
        )}
        {hasGallery && (
          <span
            className="absolute bottom-2 left-2 text-[10px] font-semibold bg-white/95 text-brand-ink px-2 py-0.5 rounded-full border border-border"
            data-testid="gallery-indicator"
          >
            +{product.imagenes.length - 1} fotos
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1 items-center">
        <span
          className={`inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full ${badgeClass}`}
          data-testid="product-category"
        >
          {product.categoria || "General"}
        </span>
        {product.marca && (
          <span className="inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-ink/5 text-brand-ink">
            {product.marca}
          </span>
        )}
      </div>

      <h3
        className="mt-2 font-display font-medium text-brand-ink text-[14px] leading-snug line-clamp-2 min-h-[2.6em]"
        data-testid="product-name"
      >
        {product.nombre}
      </h3>

      <div className="mt-2 min-h-[44px]" data-testid="product-price-block">
        {onSale ? (
          <>
            <p className="text-xs text-gray-400 line-through tabular-nums" data-testid="price-original">
              {formatARS(precio)}
            </p>
            <p className="font-display text-lg font-bold text-red-600 tabular-nums" data-testid="price-sale">
              {formatARS(oferta)}
            </p>
          </>
        ) : (
          <p className="font-display text-lg font-semibold text-brand-ink tabular-nums" data-testid="product-price">
            {formatARS(precio)}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className="mt-3 w-full inline-flex items-center justify-center gap-1.5 h-10 rounded-full bg-brand-teal hover:bg-brand-tealDark text-white active:scale-[0.98] transition-all duration-200 text-[13px] font-semibold tracking-tight shadow-sm hover:shadow-md"
        data-testid="add-to-cart-button"
      >
        <Plus className="w-4 h-4" strokeWidth={2.5} />
        <span>Lo quiero</span>
      </button>
    </Link>
  );
};
