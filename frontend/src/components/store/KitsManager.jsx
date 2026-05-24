import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Save, X, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  fetchKits, adminCreateKit, adminUpdateKit, adminDeleteKit,
  fetchProducts,
} from "../../lib/api";
import { Input } from "../ui/input";
import { formatARS } from "../../lib/format";

const emptyKit = () => ({
  nombre: "", descripcion: "", precio: 0, skus: [], imagen: "", activo: true, orden: 0,
});

const ProductPicker = ({ skus, onChange }) => {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!q || q.length < 2) { setResults([]); return; }
    let active = true;
    setBusy(true);
    const t = setTimeout(() => {
      fetchProducts({ q, limit: 8 })
        .then((d) => active && setResults(d.items || []))
        .catch(() => {})
        .finally(() => active && setBusy(false));
    }, 300);
    return () => { active = false; clearTimeout(t); };
  }, [q]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar producto por nombre o SKU…"
          className="pl-9 h-10 rounded-xl bg-brand-cream"
          data-testid="kit-product-search"
        />
      </div>
      {busy && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
      {results.length > 0 && (
        <div className="max-h-64 overflow-y-auto space-y-1 border border-border rounded-xl bg-white p-2">
          {results.map((p) => (
            <button
              key={p.sku}
              type="button"
              disabled={skus.includes(p.sku)}
              onClick={() => { onChange([...skus, p.sku]); setQ(""); setResults([]); }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-brand-cream disabled:opacity-40 inline-flex items-center justify-between gap-2"
            >
              <span className="text-sm text-brand-blue truncate">
                {p.nombre} <span className="text-[10px] font-mono text-gray-500">· {p.sku}</span>
              </span>
              <span className="text-xs text-gray-500 tabular-nums shrink-0">{formatARS(p.precio)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const KitForm = ({ kit, onSave, onCancel, onDelete }) => {
  const [form, setForm] = useState(kit || emptyKit());
  const [saving, setSaving] = useState(false);
  const isNew = !kit?.id;
  const productos = kit?.productos || [];

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.precio || form.skus.length === 0) {
      toast.error("Faltan datos", { description: "Nombre, precio y al menos 1 producto." });
      return;
    }
    setSaving(true);
    try {
      const updated = isNew
        ? await adminCreateKit(form)
        : await adminUpdateKit(kit.id, form);
      onSave?.(updated);
      toast.success(isNew ? "Kit creado" : "Kit actualizado");
    } catch (err) {
      toast.error("Error", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`¿Eliminar el kit "${form.nombre}"?`)) return;
    try {
      await adminDeleteKit(kit.id);
      onDelete?.(kit.id);
      toast.success("Kit eliminado");
    } catch (err) { toast.error("Error", { description: err.message }); }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-white p-5 space-y-4" data-testid="kit-form">
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-display text-lg font-bold text-brand-blue">
          {isNew ? "Nuevo Kit" : `Editando: ${form.nombre}`}
        </h4>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-gray-400 hover:text-brand-blue">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-700 mb-1">
            Nombre del Kit
          </label>
          <Input
            value={form.nombre}
            onChange={(e) => setForm((s) => ({ ...s, nombre: e.target.value }))}
            placeholder="Kit Universitario · Kit Gamer · Set de Regalo"
            className="h-10 rounded-xl bg-brand-cream"
            data-testid="kit-nombre"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-700 mb-1">
            Descripción (opcional)
          </label>
          <textarea
            value={form.descripcion || ""}
            onChange={(e) => setForm((s) => ({ ...s, descripcion: e.target.value }))}
            rows={2}
            className="w-full rounded-xl bg-brand-cream border border-border p-3 text-sm"
            placeholder="Lo esencial para arrancar las clases"
          />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-700 mb-1">
            Precio total del kit
          </label>
          <Input
            type="number" step="0.01"
            value={form.precio}
            onChange={(e) => setForm((s) => ({ ...s, precio: Number(e.target.value) || 0 }))}
            className="h-10 rounded-xl bg-brand-cream tabular-nums"
            data-testid="kit-precio"
          />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-700 mb-1">
            Imagen del Kit (URL Cloudinary)
          </label>
          <Input
            value={form.imagen || ""}
            onChange={(e) => setForm((s) => ({ ...s, imagen: e.target.value }))}
            placeholder="https://res.cloudinary.com/darxvchbt/…"
            className="h-10 rounded-xl bg-brand-cream"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!form.activo}
              onChange={(e) => setForm((s) => ({ ...s, activo: e.target.checked }))}
              className="h-4 w-4 accent-brand-teal"
            />
            <span className="text-sm text-brand-blue font-semibold">Mostrar en la web</span>
          </label>
          <div className="ml-auto">
            <label className="block text-[10px] uppercase font-semibold text-gray-500">Orden</label>
            <input
              type="number"
              value={form.orden || 0}
              onChange={(e) => setForm((s) => ({ ...s, orden: Number(e.target.value) || 0 }))}
              className="h-9 w-16 rounded-lg border border-border bg-brand-cream px-2 text-sm tabular-nums"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-700 mb-2">
          Productos del Kit ({form.skus.length})
        </label>

        {form.skus.length > 0 && (
          <div className="space-y-1 mb-3">
            {form.skus.map((sku) => {
              const p = productos.find((x) => x.sku === sku);
              return (
                <div key={sku} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-brand-cream border border-border">
                  <span className="text-sm text-brand-blue truncate">
                    {p?.nombre || sku} <span className="text-[10px] font-mono text-gray-500">· {sku}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setForm((s) => ({ ...s, skus: s.skus.filter((x) => x !== sku) }))}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <ProductPicker
          skus={form.skus}
          onChange={(arr) => setForm((s) => ({ ...s, skus: arr }))}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="h-10 px-5 rounded-full bg-brand-teal hover:bg-brand-tealDark text-white font-semibold text-sm inline-flex items-center gap-2 disabled:opacity-50"
          data-testid="kit-save"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isNew ? "Crear Kit" : "Guardar"}
        </button>
        {!isNew && (
          <button
            type="button"
            onClick={remove}
            className="h-10 px-4 rounded-full border border-red-200 text-red-600 hover:bg-red-50 font-semibold text-sm"
          >
            Eliminar
          </button>
        )}
      </div>
    </form>
  );
};

export const KitsManager = () => {
  const [kits, setKits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | "new" | kitObj

  const reload = () => {
    setLoading(true);
    fetchKits()
      .then((d) => setKits(d.items || []))
      .catch(() => setKits([]))
      .finally(() => setLoading(false));
  };

  useEffect(reload, []);

  if (loading) {
    return <div className="py-10 text-center text-gray-400"><Loader2 className="w-5 h-5 inline animate-spin" /></div>;
  }

  return (
    <div className="space-y-5" data-testid="kits-manager">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="h-10 w-10 rounded-full bg-brand-teal grid place-items-center">
            <Sparkles className="w-5 h-5 text-white" />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold text-brand-blue">
              Kits Imperdibles
            </h3>
            <p className="text-xs text-gray-500">
              Combiná productos y poneles un precio único.
            </p>
          </div>
        </div>
        {editing === null && (
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="h-10 px-4 rounded-full bg-brand-blue text-white font-semibold text-sm inline-flex items-center gap-2"
            data-testid="kit-new-btn"
          >
            <Plus className="w-4 h-4" /> Nuevo Kit
          </button>
        )}
      </div>

      {editing === "new" && (
        <KitForm
          onSave={(k) => { setKits((arr) => [k, ...arr]); setEditing(null); }}
          onCancel={() => setEditing(null)}
        />
      )}

      {editing && editing !== "new" && (
        <KitForm
          kit={editing}
          onSave={(k) => { setKits((arr) => arr.map((x) => x.id === k.id ? k : x)); setEditing(null); }}
          onCancel={() => setEditing(null)}
          onDelete={(id) => { setKits((arr) => arr.filter((x) => x.id !== id)); setEditing(null); }}
        />
      )}

      {kits.length === 0 && editing === null && (
        <div className="rounded-2xl border border-dashed border-border bg-white p-10 text-center text-sm text-gray-500">
          Todavía no creaste kits. Tocá "Nuevo Kit" arriba para empezar.
        </div>
      )}

      {kits.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kits.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setEditing(k)}
              className="rounded-2xl border border-border bg-white p-4 text-left hover:border-brand-teal transition"
              data-testid={`kit-edit-${k.id}`}
            >
              <div className="flex items-start gap-3">
                <span className={`h-10 w-10 rounded-xl ${k.activo ? "bg-brand-teal" : "bg-gray-300"} grid place-items-center shrink-0`}>
                  <Sparkles className="w-5 h-5 text-white" />
                </span>
                <div className="min-w-0">
                  <h4 className="font-display font-bold text-brand-blue text-sm truncate">{k.nombre}</h4>
                  <p className="text-xs text-gray-500">{k.skus?.length || 0} productos</p>
                  <p className="text-base font-bold text-brand-blue tabular-nums mt-1">
                    {formatARS(k.precio)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
