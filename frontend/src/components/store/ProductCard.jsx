import { Link } from "react-router-dom";
import { Plus, ImageOff } from "lucide-react";
import { formatARS } from "../../lib/format";
import { useCart } from "../../context/CartContext";
import { toast } from "sonner";
import { useState } from "react";

const CATEGORY_STYLES = {
  Marroquinería: "bg-pastel-mint text-brand-greenDark",
  Librería: "bg-pastel-sand text-gray-700",
  Juguetería: "bg-pastel-butter text-yellow-900",
  Regalería: "bg-pastel-lilac text-purple-800",
  Escritura: "bg-pastel-sky text-blue-900",
  General: "bg-gray-100 text-gray-600",
};

const isFullUrl = (s) => typeof s === "string" && /^https?:\/\//i.test(s);
const resolveImg = (img) => {
  if (!img) return "";
  if (isFullUrl(img)) return img;
  if (img.startsWith("/api/")) return `${process.env.REACT_APP_BACKEND_URL}${img}`;
  return `${process.env.PUBLIC_URL || ""}/images/${img}`;
};
const firstImage = (p) =>
  (Array.isArray(p?.imagenes) && p.imagenes[0]) || p?.imagen || "";

// Fallback decoration: first 2 letters of the product name on a soft sand background
const ImageFallback = ({ name }) => {
  const initials = (name || "D+D")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div className="absolute inset-0 grid place-items-center bg-pastel-sand">
      <div className="flex flex-col items-center text-gray-400">
        <ImageOff className="w-6 h-6 mb-2" strokeWidth={1.5} />
        <span className="font-display text-2xl font-semibold text-gray-500">
          {initials || "D+D"}
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
  const onOffer =
    typeof product.precio_oferta === "number" && product.precio_oferta > 0;
  const displayPrice = onOffer ? product.precio_oferta : product.precio;
  const badgeClass =
    CATEGORY_STYLES[product.categoria] || CATEGORY_STYLES.General;

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
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
        {onOffer && (
          <span
            className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white px-2 py-1 rounded-full shadow-sm"
            data-testid="offer-badge"
          >
            Oferta
          </span>
        )}
        {product.stock !== undefined && product.stock <= 0 ? (
          <span className="absolute top-2 right-2 text-[10px] font-medium bg-white/95 text-gray-700 px-2 py-1 rounded-full border border-border">
            Consultar stock
          </span>
        ) : product.stock !== undefined && product.stock <= 3 ? (
          <span className="absolute top-2 right-2 text-[11px] font-semibold bg-red-50 text-red-700 px-2 py-1 rounded-full border border-red-100">
            ¡Últimos disponibles!
          </span>
        ) : null}
        {hasGallery && (
          <span
            className="absolute bottom-2 left-2 text-[10px] font-semibold bg-white/95 text-brand-ink px-2 py-0.5 rounded-full border border-border inline-flex items-center gap-1"
            data-testid="gallery-indicator"
          >
            +{product.imagenes.length - 1} fotos
          </span>
        )}
      </div>

      <span
        className={`inline-flex self-start text-[10px] font-medium px-2 py-0.5 rounded-full ${badgeClass}`}
        data-testid="product-category"
      >
        {product.categoria || "General"}
      </span>

      <h3
        className="mt-2 font-display font-medium text-brand-ink text-[14px] leading-snug line-clamp-2 min-h-[2.6em]"
        data-testid="product-name"
      >
        {product.nombre}
      </h3>

      <p className="mt-2 font-display tabular-nums" data-testid="product-price">
        {onOffer ? (
          <span className="flex items-baseline gap-3">
            <span className="text-red-600 text-xl sm:text-2xl font-extrabold">{formatARS(displayPrice)}</span>
            <span className="text-[11px] text-gray-300 line-through font-normal">{formatARS(product.precio)}</span>
          </span>
        ) : (
          <span className="text-lg font-semibold text-brand-ink">{formatARS(displayPrice)}</span>
        )}
      </p>

      <button
        type="button"
        onClick={handleAdd}
        style={{ color: "#FAFAF7" }}
        className="mt-3 w-full inline-flex items-center justify-center gap-1.5 h-10 rounded-full bg-brand-ink hover:bg-black active:scale-[0.98] transition-all text-[13px] font-semibold tracking-tight"
        data-testid="add-to-cart-button"
      >
        <Plus className="w-4 h-4" strokeWidth={2.5} />
        <span>Agregar al carrito</span>
      </button>
    </Link>
  );
};
