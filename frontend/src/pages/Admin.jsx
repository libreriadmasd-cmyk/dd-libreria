import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Lock,
  LogOut,
  UploadCloud,
  Plus,
  Search,
  Loader2,
  Trash2,
  Save,
  ArrowLeft,
  PackageCheck,
  Package,
  ImageOff,
  Images,
} from "lucide-react";
import { Input } from "../components/ui/input";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../components/ui/tabs";
import {
  adminLogin,
  adminVerify,
  adminStats,
  adminUploadCSV,
  adminUpdateProduct,
  adminCreateProduct,
  adminDeleteProduct,
  clearAdminToken,
  getAdminToken,
  fetchProducts,
} from "../lib/api";
import { formatARS } from "../lib/format";
import { AdminTools } from "../components/store/AdminTools";
import { GalleryModal } from "../components/store/GalleryModal";

// Subcategorías por categoría (deben coincidir con SUBCATEGORY_TREE del backend)
const SUBCATS_BY_CAT = {
  Marroquinería: ["Mochilas","Carteras y Bolsos","Riñoneras y Neceser","Valijas y Viaje","Accesorios"],
  Librería: ["Estudio","Oficina","Creatividad","Organización","Kits"],
  Juguetería: ["Juegos de Mesa","Muñecos y Figuras","Didácticos","Aire Libre y Rodados","Primera Infancia"],
  Tecno: ["Audio","Computación","Gaming","Energía","Accesorios Celular"],
  Regalería: ["Hogar y Bazar","Decoración","Mates y Termos","Regalos"],
  General: [],
};

// =============== Login =================
const LoginView = ({ onLogged }) => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await adminLogin(password);
      onLogged();
    } catch (err) {
      setError(err.message || "Contraseña incorrecta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-brand-cream px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-3xl bg-white border border-border p-8 shadow-sm"
        data-testid="admin-login-form"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-pastel-mint grid place-items-center">
            <Lock className="w-5 h-5 text-brand-greenDark" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">
              D+D · Back-office
            </p>
            <h1 className="font-display text-xl font-bold text-brand-ink">
              Acceso administrador
            </h1>
          </div>
        </div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Contraseña
        </label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Ingresá la contraseña"
          className="h-11 rounded-xl bg-brand-cream border-border"
          data-testid="admin-password-input"
          autoFocus
        />
        {error && (
          <p className="mt-3 text-sm text-red-600" data-testid="admin-login-error">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading || !password}
          style={{ color: "#FAFAF7" }}
          className="mt-5 w-full h-11 rounded-full bg-brand-ink hover:bg-black font-semibold text-sm disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2"
          data-testid="admin-login-submit"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entrar"}
        </button>
        <p className="mt-6 text-[11px] text-gray-400 text-center">
          Acceso privado. Sólo personal autorizado de D+D.
        </p>
      </form>
    </div>
  );
};

// =============== CSV Upload ===============
const CsvUpload = ({ onDone }) => {
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState("upsert");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await adminUploadCSV(file, mode);
      setResult(res);
      toast.success("CSV procesado", {
        description: `${res.received} filas · ${res.inserted} nuevos · ${res.updated} actualizados`,
      });
      onDone?.();
    } catch (err) {
      toast.error("Error", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-border bg-white p-6 space-y-5"
      data-testid="csv-upload-form"
    >
      <div>
        <h3 className="font-display text-lg font-bold text-brand-ink">
          Actualización masiva
        </h3>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
          Subí un CSV con columnas <code className="font-mono text-xs bg-brand-cream px-1.5 py-0.5 rounded">Nombre, Categoria, SKU, Precio, Stock, Imagen URL</code>.
          Los productos existentes se actualizan por SKU; los nuevos se crean.
        </p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
          Modo
        </label>
        <div className="flex gap-2">
          {[
            { v: "upsert", label: "Fusionar (upsert)", desc: "Actualiza existentes y agrega nuevos" },
            { v: "replace", label: "Reemplazar todo", desc: "Borra el catálogo antes de cargar" },
          ].map((m) => (
            <button
              key={m.v}
              type="button"
              onClick={() => setMode(m.v)}
              className={`flex-1 text-left p-3 rounded-xl border text-xs transition ${
                mode === m.v
                  ? "border-brand-ink bg-brand-ink/5"
                  : "border-border bg-white hover:border-brand-ink/40"
              }`}
              data-testid={`csv-mode-${m.v}`}
            >
              <p className="font-semibold text-brand-ink">{m.label}</p>
              <p className="text-gray-500 mt-0.5">{m.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
          Archivo CSV
        </label>
        <label className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-brand-cream p-5 cursor-pointer hover:border-brand-ink/40 transition">
          <UploadCloud className="w-5 h-5 text-gray-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-brand-ink truncate">
              {file ? file.name : "Elegí un archivo .csv"}
            </p>
            <p className="text-[11px] text-gray-500">
              Máx recomendado: 20.000 filas
            </p>
          </div>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
            data-testid="csv-file-input"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={!file || loading}
        style={{ color: "#FAFAF7" }}
        className="w-full h-11 rounded-full bg-brand-ink hover:bg-black font-semibold text-sm disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2"
        data-testid="csv-upload-submit"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <UploadCloud className="w-4 h-4" /> Procesar CSV
          </>
        )}
      </button>

      {result && (
        <div className="rounded-xl bg-pastel-mint/50 border border-brand-green/20 p-4 text-sm">
          <p className="font-semibold text-brand-greenDark">
            ✓ CSV procesado correctamente
          </p>
          <ul className="mt-2 text-xs text-gray-700 space-y-0.5 tabular-nums">
            <li>Filas leídas: <b>{result.received}</b></li>
            <li>Productos nuevos: <b>{result.inserted}</b></li>
            <li>Productos actualizados: <b>{result.updated}</b></li>
            <li>Total en catálogo: <b>{result.total_in_db}</b></li>
          </ul>
        </div>
      )}
    </form>
  );
};

// =============== Product row ==============
const ProductRow = ({ p, onSave, onDelete }) => {
  const [stock, setStock] = useState(p.stock);
  const [precio, setPrecio] = useState(p.precio);
  const [precioOferta, setPrecioOferta] = useState(p.precio_oferta ?? "");
  const [categoria, setCategoria] = useState(p.categoria || "General");
  const [subcategoria, setSubcategoria] = useState(p.subcategoria || "");
  const [destacado, setDestacado] = useState(Boolean(p.destacado_inicio));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imgOk, setImgOk] = useState(Boolean(p.imagen));
  const [galleryOpen, setGalleryOpen] = useState(false);
  const imgCount = (Array.isArray(p.imagenes) ? p.imagenes.length : 0) || (p.imagen ? 1 : 0);

  const dirty =
    String(stock) !== String(p.stock) ||
    String(precio) !== String(p.precio) ||
    String(precioOferta) !== String(p.precio_oferta ?? "") ||
    Boolean(destacado) !== Boolean(p.destacado_inicio) ||
    subcategoria !== (p.subcategoria || "") ||
    categoria !== (p.categoria || "General");

  const save = async () => {
    setSaving(true);
    try {
      const patch = {
        stock: Number(stock) || 0,
        precio: Number(precio) || 0,
        categoria,
        subcategoria: subcategoria || null,
        destacado_inicio: Boolean(destacado),
      };
      const ofValue = String(precioOferta).trim();
      patch.precio_oferta = ofValue === "" ? null : Number(ofValue) || null;
      const updated = await adminUpdateProduct(p.sku, patch);
      toast.success("Guardado", { description: p.nombre });
      onSave?.(updated);
    } catch (e) {
      toast.error("Error", { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`¿Eliminar "${p.nombre}"?`)) return;
    setDeleting(true);
    try {
      await adminDeleteProduct(p.sku);
      toast.success("Eliminado");
      onDelete?.(p.sku);
    } catch (e) {
      toast.error("Error", { description: e.message });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
    <tr
      className="border-b border-border hover:bg-brand-cream/50"
      data-testid={`product-row-${p.sku}`}
    >
      <td className="p-3">
        <div className="h-12 w-12 rounded-lg bg-pastel-sand overflow-hidden grid place-items-center">
          {p.imagen && imgOk ? (
            <img
              src={p.imagen}
              alt=""
              className="w-full h-full object-contain p-1"
              onError={() => setImgOk(false)}
            />
          ) : (
            <ImageOff className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </td>
      <td className="p-3 max-w-[240px]">
        <p className="font-medium text-brand-ink text-sm truncate">{p.nombre}</p>
        <p className="text-[11px] text-gray-500 font-mono">{p.sku}</p>
      </td>
      <td className="p-3">
        <div className="flex flex-col gap-1">
          <select
            value={categoria}
            onChange={(e) => {
              setCategoria(e.target.value);
              setSubcategoria("");
            }}
            className="h-7 text-xs rounded-md border border-border bg-white px-2"
            data-testid={`edit-category-${p.sku}`}
          >
            {["Marroquinería","Librería","Juguetería","Regalería","Tecno","General"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={subcategoria}
            onChange={(e) => setSubcategoria(e.target.value)}
            className="h-7 text-[11px] rounded-md border border-border bg-pastel-sand/30 px-2 text-gray-700"
            data-testid={`edit-subcategory-${p.sku}`}
          >
            <option value="">— Sin subcat —</option>
            {(SUBCATS_BY_CAT[categoria] || []).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </td>
      <td className="p-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] uppercase tracking-wider text-gray-500 w-10">Normal</span>
            <input
              type="number"
              value={precio}
              step="0.01"
              onChange={(e) => setPrecio(e.target.value)}
              className="w-24 h-7 rounded-md border border-border bg-white px-2 text-xs tabular-nums"
              data-testid={`edit-price-${p.sku}`}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] uppercase tracking-wider text-red-600 w-10 font-semibold">Oferta</span>
            <input
              type="number"
              value={precioOferta}
              step="0.01"
              placeholder="—"
              onChange={(e) => setPrecioOferta(e.target.value)}
              className="w-24 h-7 rounded-md border border-red-200 bg-red-50/50 px-2 text-xs tabular-nums focus:bg-white"
              data-testid={`edit-offer-${p.sku}`}
            />
          </div>
        </div>
      </td>
      <td className="p-3">
        <input
          type="number"
          value={stock}
          min="0"
          onChange={(e) => setStock(e.target.value)}
          className="w-20 h-8 rounded-md border border-border bg-white px-2 text-xs tabular-nums"
          data-testid={`edit-stock-${p.sku}`}
        />
      </td>
      <td className="p-3 text-center">
        <label className="inline-flex items-center cursor-pointer" title="Mostrar en la portada de la web">
          <input
            type="checkbox"
            checked={destacado}
            onChange={(e) => setDestacado(e.target.checked)}
            className="peer sr-only"
            data-testid={`edit-featured-${p.sku}`}
          />
          <span className="relative h-5 w-9 rounded-full bg-gray-300 peer-checked:bg-brand-green transition-colors">
            <span className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
          </span>
        </label>
      </td>
      <td className="p-3 text-right">
        <div className="inline-flex gap-1">
          <button
            type="button"
            onClick={() => setGalleryOpen(true)}
            className="h-8 px-3 rounded-full bg-white border border-border text-xs font-medium text-gray-700 hover:border-brand-ink inline-flex items-center gap-1"
            data-testid={`gallery-${p.sku}`}
            title="Gestionar imágenes"
          >
            <Images className="w-3.5 h-3.5" />
            <span>{imgCount}</span>
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving}
            className="h-8 px-3 rounded-full bg-brand-ink text-brand-cream text-xs font-semibold disabled:opacity-40 inline-flex items-center gap-1"
            data-testid={`save-${p.sku}`}
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Guardar
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={deleting}
            className="h-8 w-8 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-600 inline-flex items-center justify-center"
            data-testid={`delete-${p.sku}`}
          >
            {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </td>
    </tr>
    {galleryOpen && (
      <GalleryModal
        product={p}
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        onChange={onSave}
      />
    )}
    </>
  );
};

// =============== Manage products =========
const ManageProducts = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(false);
  const LIMIT = 25;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchProducts({ q: debouncedQ, skip, limit: LIMIT });
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      toast.error("Error", { description: e.message });
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, skip]);

  useEffect(() => {
    setSkip(0);
  }, [debouncedQ]);

  useEffect(() => {
    load();
  }, [load]);

  const onSaved = (updated) =>
    setItems((prev) => prev.map((x) => (x.sku === updated.sku ? { ...x, ...updated } : x)));
  const onDeleted = (sku) => {
    setItems((prev) => prev.filter((x) => x.sku !== sku));
    setTotal((t) => Math.max(0, t - 1));
  };

  return (
    <div className="rounded-2xl border border-border bg-white p-0 overflow-hidden">
      <div className="p-5 flex flex-col sm:flex-row gap-3 sm:items-center justify-between border-b border-border">
        <div>
          <h3 className="font-display text-lg font-bold text-brand-ink">
            Gestión de productos
          </h3>
          <p className="text-sm text-gray-500">
            Editá stock, precio y categoría. Los cambios se guardan por SKU.
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar nombre o SKU…"
            className="pl-9 h-10 rounded-full bg-brand-cream border-border"
            data-testid="manage-search"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left" data-testid="manage-table">
          <thead className="bg-brand-cream text-[11px] uppercase tracking-wider text-gray-600">
            <tr>
              <th className="p-3 w-16"></th>
              <th className="p-3">Producto</th>
              <th className="p-3">Categoría</th>
              <th className="p-3">Precios (ARS)</th>
              <th className="p-3">Stock</th>
              <th className="p-3 text-center">Destacar</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && items.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-10 text-center text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin inline" />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-10 text-center text-gray-500 text-sm">
                  Sin resultados
                </td>
              </tr>
            ) : (
              items.map((p) => (
                <ProductRow key={p.sku} p={p} onSave={onSaved} onDelete={onDeleted} />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between p-4 border-t border-border bg-brand-cream">
        <p className="text-xs text-gray-600 tabular-nums">
          {total.toLocaleString("es-AR")} resultados · página {Math.floor(skip / LIMIT) + 1}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={skip === 0}
            onClick={() => setSkip((s) => Math.max(0, s - LIMIT))}
            className="h-8 px-3 rounded-full bg-white border border-border text-xs font-medium disabled:opacity-40"
          >
            ← Anterior
          </button>
          <button
            type="button"
            disabled={skip + LIMIT >= total}
            onClick={() => setSkip((s) => s + LIMIT)}
            className="h-8 px-3 rounded-full bg-white border border-border text-xs font-medium disabled:opacity-40"
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  );
};

// =============== Add new product =========
const AddProduct = ({ onCreated }) => {
  const empty = {
    sku: "",
    nombre: "",
    categoria: "Marroquinería",
    precio: "",
    stock: "",
    imagen: "",
  };
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminCreateProduct({
        sku: form.sku.trim(),
        nombre: form.nombre.trim(),
        categoria: form.categoria,
        precio: Number(form.precio) || 0,
        stock: Number(form.stock) || 0,
        imagen: form.imagen.trim(),
      });
      toast.success("Producto creado", { description: form.nombre });
      setForm(empty);
      onCreated?.();
    } catch (err) {
      toast.error("Error", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const field = (key, label, type = "text", placeholder = "") => (
    <div>
      <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-600 mb-1">
        {label}
      </label>
      <Input
        type={type}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="h-10 rounded-xl bg-brand-cream border-border"
        data-testid={`new-${key}`}
        required={["sku", "nombre"].includes(key)}
      />
    </div>
  );

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-border bg-white p-6 space-y-4"
      data-testid="add-product-form"
    >
      <div>
        <h3 className="font-display text-lg font-bold text-brand-ink">
          Alta manual de producto
        </h3>
        <p className="text-sm text-gray-500">
          Ideal para incorporar un artículo que no vino en el CSV.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {field("sku", "SKU / Código *", "text", "7798...")}
        {field("nombre", "Nombre *", "text", "Mochila urbana…")}
        <div>
          <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-600 mb-1">
            Categoría
          </label>
          <select
            value={form.categoria}
            onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
            className="w-full h-10 rounded-xl bg-brand-cream border border-border px-3 text-sm"
            data-testid="new-categoria"
          >
            {["Marroquinería","Librería","Juguetería","Regalería","Tecno","General"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        {field("precio", "Precio ARS", "number", "0.00")}
        {field("stock", "Stock", "number", "0")}
        <div className="sm:col-span-2">
          {field("imagen", "URL de imagen (Cloudinary)", "url", "https://res.cloudinary.com/…")}
        </div>
      </div>
      <button
        type="submit"
        disabled={loading || !form.sku || !form.nombre}
        style={{ color: "#FAFAF7" }}
        className="h-11 px-6 rounded-full bg-brand-ink hover:bg-black font-semibold text-sm disabled:opacity-50 inline-flex items-center gap-2"
        data-testid="add-product-submit"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        Crear producto
      </button>
    </form>
  );
};

// =============== Admin main ===============
export default function Admin() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(Boolean(getAdminToken()));
  const [stats, setStats] = useState(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState("manage");

  const loadStats = useCallback(async () => {
    try {
      const s = await adminStats();
      setStats(s);
    } catch {
      // token invalid
      setAuthed(false);
      clearAdminToken();
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!getAdminToken()) {
        setChecking(false);
        return;
      }
      const ok = await adminVerify();
      if (!active) return;
      if (!ok) {
        clearAdminToken();
        setAuthed(false);
      } else {
        setAuthed(true);
        await loadStats();
      }
      setChecking(false);
    })();
    return () => {
      active = false;
    };
  }, [loadStats]);

  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!authed) {
    return (
      <LoginView
        onLogged={async () => {
          setAuthed(true);
          await loadStats();
        }}
      />
    );
  }

  const logout = () => {
    clearAdminToken();
    setAuthed(false);
  };

  return (
    <div className="min-h-screen bg-brand-cream">
      <header className="sticky top-0 z-40 bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="h-9 w-9 rounded-full hover:bg-brand-cream grid place-items-center"
            aria-label="Volver"
            data-testid="admin-back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <img
            src={`${process.env.PUBLIC_URL || ""}/logo-dd.png`}
            alt="D+D"
            className="h-9 w-auto"
          />
          <div className="leading-tight hidden sm:block">
            <p className="font-display font-bold text-brand-ink text-sm">
              Back-office
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
              D+D · Alcorta
            </p>
          </div>
          <div className="flex-1" />
          <button
            onClick={logout}
            className="h-9 px-3 rounded-full bg-white border border-border text-xs text-gray-700 hover:bg-brand-cream inline-flex items-center gap-1.5"
            data-testid="admin-logout"
          >
            <LogOut className="w-3.5 h-3.5" /> Salir
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink tracking-tight">
            Panel de administración
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Gestioná el inventario sin tocar el diseño de la web.
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white border border-border p-4">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Package className="w-3.5 h-3.5" /> Total productos
              </div>
              <p className="font-display text-3xl font-bold text-brand-ink mt-1 tabular-nums">
                {stats.total.toLocaleString("es-AR")}
              </p>
            </div>
            <div className="rounded-2xl bg-white border border-border p-4">
              <div className="flex items-center gap-2 text-xs text-brand-greenDark">
                <PackageCheck className="w-3.5 h-3.5" /> Con stock
              </div>
              <p className="font-display text-3xl font-bold text-brand-ink mt-1 tabular-nums">
                {stats.in_stock.toLocaleString("es-AR")}
              </p>
            </div>
            <div className="rounded-2xl bg-white border border-border p-4 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <ImageOff className="w-3.5 h-3.5" /> Sin imagen
              </div>
              <p className="font-display text-3xl font-bold text-brand-ink mt-1 tabular-nums">
                {stats.missing_image.toLocaleString("es-AR")}
              </p>
            </div>
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-white border border-border rounded-full p-1 h-11">
            <TabsTrigger value="manage" data-testid="tab-manage" className="rounded-full px-4 data-[state=active]:bg-brand-ink data-[state=active]:text-brand-cream">
              Gestionar
            </TabsTrigger>
            <TabsTrigger value="csv" data-testid="tab-csv" className="rounded-full px-4 data-[state=active]:bg-brand-ink data-[state=active]:text-brand-cream">
              Subir CSV
            </TabsTrigger>
            <TabsTrigger value="new" data-testid="tab-new" className="rounded-full px-4 data-[state=active]:bg-brand-ink data-[state=active]:text-brand-cream">
              Nuevo producto
            </TabsTrigger>
            <TabsTrigger value="tools" data-testid="tab-tools" className="rounded-full px-4 data-[state=active]:bg-brand-ink data-[state=active]:text-brand-cream">
              Herramientas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manage" className="mt-4">
            <ManageProducts />
          </TabsContent>
          <TabsContent value="csv" className="mt-4">
            <CsvUpload onDone={loadStats} />
          </TabsContent>
          <TabsContent value="new" className="mt-4">
            <AddProduct onCreated={loadStats} />
          </TabsContent>
          <TabsContent value="tools" className="mt-4">
            <AdminTools onDone={loadStats} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
