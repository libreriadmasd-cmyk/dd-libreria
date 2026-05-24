import { Link } from "react-router-dom";
import { Plus, ImageOff } from "lucide-react";
import { formatARS } from "../../lib/format";
import { useCart } from "../../context/CartContext";
import { toast } from "sonner";
import { useState } from "react";
import { cldThumb } from "../../lib/cloudinary";

const CATEGORY_KEYWORDS = {
  Marroquinería: ["cartera", "bolso", "morral", "bandolera", "riñonera", "mochila", "cuero"],
  Librería: ["libro", "cuaderno", "tapa dura", "librería", "block", "resma", "pluma", "lapicera", "marcador"],
  Juguetería: ["juguete", "muñeca", "lego", "rompecabezas", "peluche", "auto", "figura"],
  Regalería: ["regalo", "set", "pack", "velas", "tarjeta", "souvenir", "adornos"],
  Tecno: ["celular", "cargador", "auricular", "parlante", "power bank", "tablet", "camara", "notebook"],
};

const CATEGORY_STYLES = {
  Marroquinería: "bg-brand-teal text-white",
  Librería: "bg-brand-blue text-white",
  Juguetería: "bg-brand-coral text-white",
  Regalería: "bg-brand-yellow text-brand-ink",
  Tecno: "bg-brand-ink text-white",
  General: "bg-slate-100 text-slate-700",
};

const isUrl = (s) => typeof s === "string" && /^https?:\/\//i.test(s);
const resolveImg = (img) => {
  if (!img) return "";
  const url = isUrl(img) ? img : `${process.env.PUBLIC_URL || ""}/images/${img}`;
  return cldThumb(url);
};
const firstImage = (p) =>
  (Array.isArray(p?.imagenes) && p.imagenes[0]) || p?.imagen || "";

const normalizeText = (value) =>
  String(value || "").toLowerCase().replace(/[^a-z0-9áéíóúüñ]+/gi, " ");

const classifyProductCategory = (product) => {
  const title = normalizeText(product.nombre || "");
  const category = product.categoria || "General";
  const keywords = CATEGORY_KEYWORDS[category] || [];
  if (keywords.some((keyword) => title.includes(keyword))) return category;

  for (const [cat, terms] of Object.entries(CATEGORY_KEYWORDS)) {
    if (terms.some((keyword) => title.includes(keyword))) return cat;
  }
  return category === "General" ? "Librería" : category;
};

const ImageFallback = ({ name }) => {
  const initials = (name || "Nexo Store")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div className="absolute inset-0 grid place-items-center bg-brand-cream">
      <div className="flex flex-col items-center text-brand-ink">
        <ImageOff className="w-6 h-6 mb-2" strokeWidth={1.5} />
        <span className="font-display text-2xl font-semibold">
          {initials || "NX"}
        </span>
      </div>
    </div>
  );
};

export const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [imgOk, setImgOk] = useState(Boolean(firstImage(product)));
  const imgSrc = resolveImg(firstImage(product));
  const hasGallery = Array.isArray(product.imagenes) && product.imagenes.length > 1;
  const displayCategory = classifyProductCategory(product);
  const badgeClass = CATEGORY_STYLES[displayCategory] || CATEGORY_STYLES.General;

  const oferta = Number(product.precio_oferta) || 0;
  const precio = Number(product.precio) || 0;
  const onSale = oferta > 0 && oferta < precio;
  const offPercent = onSale ? Math.round(((precio - oferta) / precio) * 100) : 0;

  const handleAdd = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const selectedProduct = onSale ? { ...product, precio: oferta } : product;
    addToCart(selectedProduct);
    toast.success("Agregado a la bolsa", { description: product.nombre });
  };

  return (
    <Link
      to={`/producto/${product.sku}`}
      className="group relative rounded-3xl border border-border bg-white p-3 flex flex-col transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:border-brand-ink/20"
      data-testid="product-card"
    >
      <div className="relative aspect-square rounded-3xl bg-brand-cream/80 overflow-hidden mb-3">
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
          <div className="absolute top-3 left-3 rounded-full bg-red-600 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white shadow-lg">
            OFERTA
          </div>
        )}
        {product.destacado && !onSale && (
          <div className="absolute top-3 left-3 rounded-full bg-brand-blue text-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] shadow-md">
            Premium
          </div>
        )}
        {hasGallery && (
          <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-brand-ink shadow-sm border border-border">
            +{product.imagenes.length - 1} fotos
          </div>
        )}
        {product.stock !== undefined && product.stock <= 0 && (
          <div className="absolute top-3 right-3 rounded-full bg-white/95 px-2 py-1 text-[10px] font-medium text-slate-700 border border-border">
            Sin stock
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className={`inline-flex text-[10px] font-semibold px-2.5 py-1 rounded-full ${badgeClass}`} data-testid="product-category">
          {displayCategory}
        </span>
        {product.marca && (
          <span className="inline-flex text-[10px] font-semibold px-2.5 py-1 rounded-full bg-brand-ink/5 text-brand-ink">
            {product.marca}
          </span>
        )}
      </div>

      <h3 className="mt-3 font-display font-semibold text-brand-ink text-[14px] leading-tight line-clamp-2 min-h-[2.7em]" data-testid="product-name">
        {product.nombre}
      </h3>

      <div className="mt-3 min-h-[54px]" data-testid="product-price-block">
        {onSale ? (
          <>
            <p className="text-xs text-slate-400 line-through tabular-nums" data-testid="price-original">
              {formatARS(precio)}
            </p>
            <p className="font-display text-xl font-bold text-red-600 tabular-nums" data-testid="price-sale">
              {formatARS(oferta)}
            </p>
          </>
        ) : (
          <p className="font-display text-xl font-semibold text-brand-ink tabular-nums" data-testid="product-price">
            {formatARS(precio)}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 h-11 rounded-full bg-brand-blue text-white hover:bg-brand-blueDark active:scale-[0.98] transition-all duration-200 text-sm font-semibold shadow-sm"
        data-testid="add-to-cart-button"
      >
        <Plus className="w-4 h-4" strokeWidth={2.25} />
        Lo quiero
      </button>
    </Link>
  );
};
