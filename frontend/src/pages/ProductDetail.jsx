import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ChevronRight, ChevronLeft, Plus, Loader2, Check, ImageOff } from "lucide-react";
import { Navbar } from "../components/store/Navbar";
import { formatARS } from "../lib/format";
import { useCart } from "../context/CartContext";
import { toast } from "sonner";
import { fetchProduct } from "../lib/api";

const CATEGORY_STYLES = {
  Marroquinería: "bg-pastel-mint text-brand-greenDark",
  Librería: "bg-pastel-sand text-gray-700",
  Juguetería: "bg-pastel-butter text-yellow-900",
  Regalería: "bg-pastel-lilac text-purple-800",
  Escritura: "bg-pastel-sky text-blue-900",
  General: "bg-gray-100 text-gray-600",
};

const isUrl = (s) => typeof s === "string" && /^https?:\/\//i.test(s);

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgOk, setImgOk] = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchProduct(id)
      .then((p) => active && setProduct(p))
      .catch(() => active && setProduct(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  const gallery =
    (Array.isArray(product?.imagenes) && product.imagenes.filter(Boolean)) ||
    (product?.imagen ? [product.imagen] : []);

  useEffect(() => {
    setImgOk(true);
    setActiveImg(0);
  }, [product?.sku]);

  const handleAdd = () => {
    addToCart(product);
    toast.success("Agregado a la bolsa", { description: product?.nombre });
  };

  const currentImg = gallery[activeImg] || "";
  const imgSrc = currentImg
    ? isUrl(currentImg)
      ? currentImg
      : `${process.env.PUBLIC_URL || ""}/images/${currentImg}`
    : "";

  const badgeClass = product?.categoria
    ? CATEGORY_STYLES[product.categoria] || CATEGORY_STYLES.General
    : "";

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav
          className="flex items-center gap-1.5 text-sm text-gray-500 mb-6"
          data-testid="breadcrumb"
        >
          <Link to="/" className="hover:text-brand-ink transition-colors">
            Inicio
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          {product?.categoria && (
            <>
              <span>{product.categoria}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </>
          )}
          <span className="text-brand-ink font-medium truncate max-w-[40ch]">
            {product?.nombre || "Producto"}
          </span>
        </nav>

        {loading && (
          <div className="flex items-center justify-center py-24 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        )}

        {!loading && !product && (
          <div className="rounded-2xl border border-border bg-white p-10 text-center">
            <h2 className="font-display text-2xl font-bold text-brand-ink">
              Producto no encontrado
            </h2>
            <button
              onClick={() => navigate("/")}
              className="mt-6 inline-flex items-center gap-2 h-10 px-5 rounded-full bg-brand-ink text-brand-cream text-sm font-semibold"
            >
              <ChevronLeft className="w-4 h-4" /> Volver al catálogo
            </button>
          </div>
        )}

        {!loading && product && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12">
            <div className="md:col-span-3">
              <div className="relative aspect-square rounded-3xl bg-pastel-sand border border-border overflow-hidden">
                {imgSrc && imgOk ? (
                  <img
                    src={imgSrc}
                    alt={product.nombre}
                    className="w-full h-full object-contain p-8"
                    data-testid="pdp-image"
                    onError={() => setImgOk(false)}
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="flex flex-col items-center text-gray-400">
                      <ImageOff className="w-8 h-8 mb-3" strokeWidth={1.25} />
                      <span className="text-xs uppercase tracking-[0.25em]">
                        Imagen no disponible
                      </span>
                    </div>
                  </div>
                )}
              </div>
              {gallery.length > 1 && (
                <div
                  className="mt-4 flex gap-2 overflow-x-auto pb-1"
                  data-testid="pdp-gallery"
                >
                  {gallery.map((src, idx) => {
                    const thumb = isUrl(src)
                      ? src
                      : `${process.env.PUBLIC_URL || ""}/images/${src}`;
                    const active = idx === activeImg;
                    return (
                      <button
                        key={`${src}-${idx}`}
                        type="button"
                        onClick={() => {
                          setActiveImg(idx);
                          setImgOk(true);
                        }}
                        className={`shrink-0 h-20 w-20 rounded-xl overflow-hidden border-2 transition ${
                          active
                            ? "border-brand-ink"
                            : "border-transparent hover:border-gray-300"
                        } bg-pastel-sand`}
                        data-testid={`pdp-thumb-${idx}`}
                        aria-label={`Imagen ${idx + 1}`}
                      >
                        <img
                          src={thumb}
                          alt=""
                          className="w-full h-full object-contain p-1"
                          onError={(e) => {
                            e.currentTarget.style.opacity = "0.25";
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="md:col-span-2 md:sticky md:top-24 md:h-fit space-y-6">
              {product.categoria && (
                <span
                  className={`inline-flex text-[10px] font-medium px-2.5 py-1 rounded-full ${badgeClass}`}
                >
                  {product.categoria}
                </span>
              )}
              <h1
                className="font-display text-3xl sm:text-4xl font-bold text-brand-ink tracking-tight leading-tight"
                data-testid="pdp-title"
              >
                {product.nombre}
              </h1>
              {product.sku && (
                <p className="text-xs text-gray-500">
                  <span className="font-semibold text-gray-700">SKU:</span>{" "}
                  {product.sku}
                </p>
              )}

              <div className="border-y border-border py-5">
                <p className="text-[11px] uppercase tracking-[0.15em] text-gray-500">
                  Precio
                </p>
                <p
                  className="font-display text-4xl font-bold text-brand-ink mt-1 tabular-nums"
                  data-testid="pdp-price"
                >
                  {formatARS(product.precio)}
                </p>
                <div className="mt-3 flex items-center gap-2 text-sm">
                  {product.stock > 0 ? (
                    <>
                      <span className="inline-flex items-center gap-1 text-brand-green font-semibold">
                        <Check className="w-4 h-4" /> En stock
                      </span>
                      <span className="text-gray-400">·</span>
                      <span className="text-gray-500">
                        {product.stock} disponibles
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-600">
                      Consultar disponibilidad
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAdd}
                style={{ color: "#FAFAF7" }}
                className="w-full inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-brand-ink hover:bg-black text-sm font-semibold transition-all active:scale-[0.98]"
                data-testid="pdp-add-to-cart"
              >
                <Plus className="w-5 h-5" strokeWidth={2.5} />
                Agregar al carrito
              </button>

              <button
                onClick={() => navigate("/")}
                className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand-ink transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Volver al catálogo
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
