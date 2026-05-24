import { useState } from "react";
import { toast } from "sonner";
import {
  Wand2,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  ExternalLink,
  Check,
  X,
  Package,
  PackageCheck,
} from "lucide-react";
import { Input } from "../ui/input";
import { adminImageTemplate, adminReclassify, adminCleanTitles, adminSubclassify, adminUpdatePricesBulk } from "../../lib/api";

// ============ Image URL template =============
const ImageTemplateTool = ({ onDone }) => {
  const [prefix, setPrefix] = useState(
    "https://res.cloudinary.com/darxvchbt/image/upload/"
  );
  const [suffix, setSuffix] = useState(".webp");
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [statuses, setStatuses] = useState({});

  const runPreview = async () => {
    setLoading(true);
    setStatuses({});
    try {
      const res = await adminImageTemplate({ prefix, suffix, apply: false, sampleSize: 6 });
      setPreview(res.preview || []);
      // Probe each URL from the browser (avoids CORS for Cloudinary)
      (res.preview || []).forEach((p) => {
        const img = new Image();
        img.onload = () =>
          setStatuses((s) => ({ ...s, [p.sku]: "ok" }));
        img.onerror = () =>
          setStatuses((s) => ({ ...s, [p.sku]: "fail" }));
        img.src = p.url;
      });
    } catch (e) {
      toast.error("Error", { description: e.message });
    } finally {
      setLoading(false);
    }
  };

  const applyAll = async () => {
    if (!window.confirm(
      "Esto reemplazará la URL de imagen de TODOS los productos. ¿Continuar?"
    )) return;
    setApplying(true);
    try {
      const res = await adminImageTemplate({ prefix, suffix, apply: true });
      toast.success("URLs actualizadas", {
        description: `${res.updated} productos.`,
      });
      onDone?.();
    } catch (e) {
      toast.error("Error", { description: e.message });
    } finally {
      setApplying(false);
    }
  };

  const okCount = Object.values(statuses).filter((v) => v === "ok").length;
  const failCount = Object.values(statuses).filter((v) => v === "fail").length;

  return (
    <div className="rounded-2xl border border-border bg-white p-6 space-y-5" data-testid="image-template-tool">
      <div>
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-brand-greenDark" />
          <h3 className="font-display text-lg font-bold text-brand-ink">
            Cruzar imágenes por SKU
          </h3>
        </div>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
          Construí la URL final como{" "}
          <code className="bg-brand-cream px-1 py-0.5 rounded text-xs">prefijo + SKU + sufijo</code>.
          Probá primero con la muestra; si todo da verde, aplicá a los 8.142 productos.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-3">
        <div>
          <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-600 mb-1">
            Prefijo
          </label>
          <Input
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder="https://res.cloudinary.com/.../image/upload/v123/folder/"
            className="h-10 rounded-xl bg-brand-cream border-border font-mono text-xs"
            data-testid="img-prefix"
          />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-600 mb-1">
            Sufijo
          </label>
          <Input
            value={suffix}
            onChange={(e) => setSuffix(e.target.value)}
            placeholder=".jpg"
            className="h-10 rounded-xl bg-brand-cream border-border font-mono text-xs"
            data-testid="img-suffix"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={runPreview}
          disabled={loading || !prefix}
          className="h-10 px-4 rounded-full bg-white border border-border text-sm font-medium hover:border-brand-ink inline-flex items-center gap-2 disabled:opacity-50"
          data-testid="img-preview-btn"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Probar con muestra
        </button>
        <button
          type="button"
          onClick={applyAll}
          disabled={applying || !prefix || okCount === 0}
          style={{ color: "#FAFAF7" }}
          className="h-10 px-4 rounded-full bg-brand-ink hover:bg-black text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-40"
          data-testid="img-apply-btn"
        >
          {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          Aplicar a todos los productos
        </button>
      </div>

      {preview.length > 0 && (
        <div>
          <div className="flex items-center gap-3 text-xs mb-3">
            <span className="inline-flex items-center gap-1 text-brand-greenDark font-semibold">
              <Check className="w-3.5 h-3.5" /> {okCount} OK
            </span>
            <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
              <X className="w-3.5 h-3.5" /> {failCount} falla
            </span>
            {failCount > 0 && okCount === 0 && (
              <span className="text-gray-500">
                · Ajustá el prefijo/sufijo hasta que la muestra dé verde.
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {preview.map((p) => {
              const st = statuses[p.sku];
              return (
                <a
                  key={p.sku}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square rounded-xl border border-border bg-pastel-sand overflow-hidden"
                  title={`${p.nombre}\n${p.url}`}
                >
                  {st === "ok" ? (
                    <img src={p.url} alt="" className="w-full h-full object-contain p-2" />
                  ) : st === "fail" ? (
                    <div className="absolute inset-0 grid place-items-center bg-red-50 text-red-700">
                      <X className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 grid place-items-center">
                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    </div>
                  )}
                  <span className="absolute bottom-1 right-1 text-[9px] text-gray-500 bg-white/90 px-1 rounded inline-flex items-center gap-0.5">
                    {p.sku.slice(-5)} <ExternalLink className="w-2.5 h-2.5" />
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ============ Reclassify tool ==============
const ReclassifyTool = ({ onDone }) => {
  const [scope, setScope] = useState("general_only");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);

  const runPreview = async () => {
    setLoading(true);
    try {
      const res = await adminReclassify({ scope, apply: false });
      setPreview(res);
    } catch (e) {
      toast.error("Error", { description: e.message });
    } finally {
      setLoading(false);
    }
  };

  const applyAll = async () => {
    if (!window.confirm(
      scope === "all"
        ? "Esto re-clasificará TODOS los productos (pisa categorías actuales). ¿Continuar?"
        : "Se re-clasificarán solo los productos en categorías fallback (General, vacías, ruido)."
    )) return;
    setApplying(true);
    try {
      const res = await adminReclassify({ scope, apply: true });
      toast.success("Re-clasificación aplicada", {
        description: `${res.scanned} productos procesados`,
      });
      setPreview(res);
      onDone?.();
    } catch (e) {
      toast.error("Error", { description: e.message });
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-white p-6 space-y-5" data-testid="reclassify-tool">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-greenDark" />
          <h3 className="font-display text-lg font-bold text-brand-ink">
            Re-clasificar por keywords
          </h3>
        </div>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
          Asigna categoría (Marroquinería / Librería / Juguetería / Regalería) analizando el{" "}
          <b>nombre del producto</b>. Ideal para catálogos cargados sin categoría.
        </p>
      </div>

      <div className="flex gap-2">
        {[
          { v: "general_only", label: "Solo 'General' / vacíos", desc: "Preserva las ya clasificadas" },
          { v: "all", label: "Todos los productos", desc: "Pisa categorías actuales" },
        ].map((m) => (
          <button
            key={m.v}
            type="button"
            onClick={() => setScope(m.v)}
            className={`flex-1 text-left p-3 rounded-xl border text-xs transition ${
              scope === m.v
                ? "border-brand-ink bg-brand-ink/5"
                : "border-border bg-white hover:border-brand-ink/40"
            }`}
          >
            <p className="font-semibold text-brand-ink">{m.label}</p>
            <p className="text-gray-500 mt-0.5">{m.desc}</p>
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={runPreview}
          disabled={loading}
          className="h-10 px-4 rounded-full bg-white border border-border text-sm font-medium hover:border-brand-ink inline-flex items-center gap-2 disabled:opacity-50"
          data-testid="reclass-preview-btn"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Vista previa
        </button>
        <button
          type="button"
          onClick={applyAll}
          disabled={applying}
          style={{ color: "#FAFAF7" }}
          className="h-10 px-4 rounded-full bg-brand-ink hover:bg-black text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-40"
          data-testid="reclass-apply-btn"
        >
          {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          Aplicar
        </button>
      </div>

      {preview && (
        <div className="rounded-xl bg-pastel-mint/40 border border-brand-green/20 p-4 text-sm">
          <p className="font-semibold text-brand-greenDark mb-2">
            {preview.applied ? "✓ Aplicado" : "Vista previa"} · {preview.scanned.toLocaleString("es-AR")} productos
          </p>
          <ul className="grid grid-cols-2 gap-1 text-xs text-gray-700 tabular-nums">
            {Object.entries(preview.counts).map(([k, v]) => (
              <li key={k}>
                <b>{v.toLocaleString("es-AR")}</b> · {k}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export const AdminTools = ({ onDone }) => {
  const [cleaning, setCleaning] = useState(false);
  const [cleanResult, setCleanResult] = useState(null);
  const [subclassifying, setSubclassifying] = useState(false);
  const [subResult, setSubResult] = useState(null);

  const subclassifyNow = async () => {
    if (!window.confirm("Esto re-asigna subcategorías por palabra clave en todos los productos. ¿Continuar?")) return;
    setSubclassifying(true);
    setSubResult(null);
    try {
      const res = await adminSubclassify(true);
      setSubResult(res);
      toast.success("Subcategorías aplicadas", { description: `${res.scanned} productos analizados` });
      onDone?.();
    } catch (e) {
      toast.error("Error", { description: e.message });
    } finally {
      setSubclassifying(false);
    }
  };

  const cleanTitles = async () => {
    if (!window.confirm(
      "Esto normaliza todos los nombres: quita códigos al final, dobles comillas y aplica Title Case. ¿Continuar?"
    )) return;
    setCleaning(true);
    setCleanResult(null);
    try {
      const res = await adminCleanTitles();
      setCleanResult(res);
      toast.success("Limpieza completada", {
        description: `${res.updated} nombres actualizados.`,
      });
      onDone?.();
    } catch (e) {
      toast.error("Error", { description: e.message });
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="space-y-4">
      <BulkPriceTool onDone={onDone} />
      <ImageTemplateTool onDone={onDone} />
      <ReclassifyTool onDone={onDone} />

      <div className="rounded-2xl border border-border bg-white p-6 space-y-4" data-testid="subclassify-tool">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-greenDark" />
            <h3 className="font-display text-lg font-bold text-brand-ink">
              Asignar subcategorías + colores
            </h3>
          </div>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">
            Analiza cada producto y le asigna una <b>subcategoría</b> (ej:
            Mochilas, Estudio, Audio) y extrae <b>colores</b> del nombre (Rojo,
            Azul, etc.). Lo que no matchee queda sin subcategoría.
          </p>
        </div>
        <button
          type="button"
          onClick={subclassifyNow}
          disabled={subclassifying}
          style={{ color: "#FAFAF7" }}
          className="h-10 px-4 rounded-full bg-brand-ink hover:bg-black text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-40"
          data-testid="subclassify-btn"
        >
          {subclassifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          Aplicar subclasificación
        </button>
        {subResult && (
          <div className="rounded-xl bg-pastel-mint/40 border border-brand-green/20 p-4 text-sm">
            <p className="font-semibold text-brand-greenDark mb-2">
              ✓ {subResult.scanned.toLocaleString("es-AR")} productos analizados
              · {subResult.products_with_color} con color detectado
            </p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-white p-6 space-y-4" data-testid="clean-titles-tool">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-greenDark" />
            <h3 className="font-display text-lg font-bold text-brand-ink">
              Limpiar títulos de productos
            </h3>
          </div>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">
            Pasa por todos los productos y normaliza el nombre: elimina{" "}
            <code className="bg-brand-cream px-1 rounded text-xs">""</code>{" "}
            duplicadas, acentos sueltos, códigos internos al final y aplica{" "}
            <b>Title Case</b>.
          </p>
        </div>
        <button
          type="button"
          onClick={cleanTitles}
          disabled={cleaning}
          style={{ color: "#FAFAF7" }}
          className="h-10 px-4 rounded-full bg-brand-ink hover:bg-black text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-40"
          data-testid="clean-titles-btn"
        >
          {cleaning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          Aplicar limpieza
        </button>

        {cleanResult && (
          <div className="rounded-xl bg-pastel-mint/40 border border-brand-green/20 p-4 text-sm">
            <p className="font-semibold text-brand-greenDark mb-2">
              ✓ {cleanResult.updated} nombres actualizados
            </p>
            {cleanResult.sample_before && cleanResult.sample_before.length > 0 && (
              <ul className="text-xs text-gray-700 space-y-1.5">
                {cleanResult.sample_before.slice(0, 5).map((b, i) => (
                  <li key={i}>
                    <span className="text-gray-500 line-through">{b}</span>
                    {" → "}
                    <b className="text-brand-ink">{cleanResult.sample_after[i]}</b>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ============ Bulk price update tool ==============
const BulkPriceTool = ({ onDone }) => {
  const [categoria, setCategoria] = useState("Marroquinería");
  const [subcategoria, setSubcategoria] = useState("");
  const [porcentaje, setPorcentaje] = useState(0);
  const [loading, setLoading] = useState(false);

  const CATS = ["Marroquinería","Librería","Juguetería","Regalería","Tecno","General"];

  const run = async () => {
    if (!window.confirm(`Actualizar precios en ${categoria}${subcategoria ? ' / '+subcategoria : ''} en ${porcentaje}% ?`)) return;
    setLoading(true);
    try {
      const res = await adminUpdatePricesBulk({ categoria, subcategoria: subcategoria || null, porcentaje: Number(porcentaje) });
      toast.success("Precios actualizados", { description: `${res.modified || 0} productos modificados` });
      onDone?.();
    } catch (e) {
      toast.error("Error", { description: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-white p-6 space-y-4" data-testid="bulk-price-tool">
      <div className="flex items-center gap-2">
        <Package className="w-4 h-4 text-brand-greenDark" />
        <h3 className="font-display text-lg font-bold text-brand-ink">Actualización masiva de precios</h3>
      </div>
      <p className="text-sm text-gray-500">Seleccioná categoría (opcional subcategoría) y aplicá un porcentaje. Ej: 10 = +10%, -5 = -5%.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-600 mb-1">Categoría</label>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full h-10 rounded-xl bg-brand-cream border-border px-3 text-sm">
            {CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-600 mb-1">Subcategoría (opcional)</label>
          <Input value={subcategoria} onChange={(e) => setSubcategoria(e.target.value)} placeholder="Mochilas, Estudio..." className="h-10 rounded-xl bg-brand-cream border-border" />
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-600 mb-1">Porcentaje</label>
          <Input type="number" value={porcentaje} onChange={(e) => setPorcentaje(e.target.value)} className="h-10 rounded-xl bg-brand-cream border-border" />
        </div>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={run} disabled={loading} style={{ color: "#FAFAF7" }} className="h-10 px-4 rounded-full bg-brand-ink hover:bg-black text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageCheck className="w-4 h-4" />} Aplicar
        </button>
      </div>
    </div>
  );
};
