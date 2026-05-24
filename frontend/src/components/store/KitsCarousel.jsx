import { useEffect, useState } from "react";
import { Sparkles, Loader2, ImageOff } from "lucide-react";
import { fetchKits } from "../../lib/api";
import { formatARS } from "../../lib/format";
import { cldTile } from "../../lib/cloudinary";
import { Carousel } from "./Carousel";
import { buildWhatsAppUrl } from "../../lib/whatsapp";
import { useCart } from "../../context/CartContext";
import { toast } from "sonner";

const isUrl = (s) => typeof s === "string" && /^https?:\/\//i.test(s);
const firstImage = (p) =>
  (Array.isArray(p?.imagenes) && p.imagenes[0]) || p?.imagen || "";

const KitMiniThumb = ({ p }) => {
  const [ok, setOk] = useState(true);
  const url = firstImage(p);
  const src = isUrl(url) ? cldTile(url) : "";
  return (
    <div className="h-12 w-12 rounded-xl border border-border bg-white overflow-hidden grid place-items-center shrink-0">
      {src && ok ? (
        <img src={src} alt={p?.nombre} className="w-full h-full object-cover" onError={() => setOk(false)} />
      ) : (
        <ImageOff className="w-4 h-4 text-gray-300" />
      )}
    </div>
  );
};

const KitCard = ({ kit }) => {
  const { addToCart } = useCart();
  const productos = kit.productos || [];
  const original = Number(kit.precio_original) || 0;
  const precio = Number(kit.precio) || 0;
  const off = original > precio && original > 0
    ? Math.round(((original - precio) / original) * 100)
    : 0;
  const heroImg = isUrl(kit.imagen)
    ? cldTile(kit.imagen)
    : firstImage(productos[0])
      ? cldTile(firstImage(productos[0]))
      : "";

  const handleAdd = () => {
    addToCart({
      sku: `KIT-${kit.id}`,
      nombre: kit.nombre,
      precio: precio,
      imagen: heroImg,
    });
    toast.success("Kit agregado a la bolsa");
  };

  const handleWhatsApp = () => {
    const items = [{ sku: `KIT-${kit.id}`, nombre: kit.nombre, precio, cantidad: 1, id: kit.id }];
    window.open(buildWhatsAppUrl(items, precio), "_blank", "noopener");
  };

  return (
    <article
      className="rounded-3xl border border-brand-teal/30 bg-white overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col h-full"
      data-testid={`kit-card-${kit.id}`}
    >
      <div className="relative aspect-[4/3] bg-pastel-mint">
        {heroImg ? (
          <img src={heroImg} alt={kit.nombre} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center">
            <Sparkles className="w-10 h-10 text-brand-teal/40" />
          </div>
        )}
        {off > 0 && (
          <span className="absolute top-3 left-3 text-[11px] font-extrabold tracking-wide bg-brand-coral text-white px-2.5 py-1 rounded-full shadow-md">
            -{off}% OFF
          </span>
        )}
        <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider bg-brand-blue text-white px-2 py-0.5 rounded-full inline-flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Kit
        </span>
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <h4 className="font-display text-lg font-bold text-brand-blue leading-tight line-clamp-2">
            {kit.nombre}
          </h4>
          {kit.descripcion && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{kit.descripcion}</p>
          )}
        </div>

        {/* Mini-thumbs of products in kit */}
        {productos.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1">
            {productos.slice(0, 5).map((p) => <KitMiniThumb key={p.sku} p={p} />)}
            {productos.length > 5 && (
              <span className="text-[10px] text-gray-500 px-2">+{productos.length - 5}</span>
            )}
          </div>
        )}

        <div className="mt-auto">
          {original > precio && original > 0 && (
            <p className="text-xs text-gray-400 line-through tabular-nums">
              {formatARS(original)}
            </p>
          )}
          <p className="font-display text-2xl font-extrabold text-brand-blue tabular-nums">
            {formatARS(precio)}
          </p>
          <p className="text-[10px] text-gray-500">{productos.length} productos incluidos</p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleAdd}
            className="flex-1 h-10 rounded-full bg-brand-teal hover:bg-brand-tealDark text-white text-sm font-semibold transition active:scale-[0.98]"
            data-testid={`kit-buy-${kit.id}`}
          >
            Lo quiero
          </button>
          <button
            type="button"
            onClick={handleWhatsApp}
            className="h-10 px-4 rounded-full border-2 border-brand-teal text-brand-teal hover:bg-brand-teal/10 text-sm font-semibold transition"
            data-testid={`kit-whatsapp-${kit.id}`}
          >
            Consultar
          </button>
        </div>
      </div>
    </article>
  );
};

export const KitsCarousel = () => {
  const [kits, setKits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKits()
      .then((d) => setKits(d.items || []))
      .catch(() => setKits([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (kits.length === 0) return null;

  return (
    <section className="my-8" data-testid="kits-imperdibles">
      <div className="flex items-center gap-3 mb-5">
        <span className="h-12 w-12 rounded-full bg-gradient-to-br from-brand-coral to-brand-yellow grid place-items-center shadow-md">
          <Sparkles className="w-6 h-6 text-white" strokeWidth={2} />
        </span>
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-brand-coral font-bold">
            Selección Nexo
          </p>
          <h3 className="font-display text-2xl sm:text-3xl font-bold text-brand-blue">
            Kits Imperdibles
          </h3>
        </div>
      </div>

      <Carousel itemMinWidth={300} testId="kits-carousel">
        {kits.map((k) => <KitCard key={k.id} kit={k} />)}
      </Carousel>
    </section>
  );
};
