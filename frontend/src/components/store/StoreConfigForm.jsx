import { useEffect, useState } from "react";
import { Loader2, Save, Settings } from "lucide-react";
import { toast } from "sonner";
import { Input } from "../ui/input";
import { fetchStoreConfig, adminUpdateStoreConfig } from "../../lib/api";

const FIELDS = [
  { key: "about_text", label: "Nosotros (texto sobre la tienda)", placeholder: "Nexo Store Librería y Regalería · más de 8.000 artículos curados.", multiline: true },
  { key: "phone", label: "Teléfono / WhatsApp", placeholder: "+54 9 3465 53-8232" },
  { key: "email", label: "Email de contacto", placeholder: "contacto@nexostore.com.ar" },
  { key: "address", label: "Dirección", placeholder: "Alcorta, Santa Fe" },
  { key: "maps_url", label: "URL del mapa (Google Maps embed)", placeholder: "https://www.google.com/maps?q=Alcorta+Santa+Fe&output=embed", help: "En Google Maps → Compartir → Insertar mapa → copiar el src del iframe" },
  { key: "instagram_url", label: "URL de Instagram (opcional)", placeholder: "https://instagram.com/tutienda" },
  { key: "facebook_url", label: "URL de Facebook (opcional)", placeholder: "https://facebook.com/tutienda" },
];

export const StoreConfigForm = () => {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStoreConfig()
      .then((d) => setForm(d || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await adminUpdateStoreConfig(form);
      setForm(updated);
      toast.success("Configuración guardada", {
        description: "Los cambios ya están en la web.",
      });
    } catch (err) {
      toast.error("Error", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-border bg-white p-6 space-y-5"
      data-testid="store-config-form"
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-pastel-sky grid place-items-center">
          <Settings className="w-5 h-5 text-blue-900" strokeWidth={1.75} />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-brand-ink">
            ⚙️ Configuración de la Tienda
          </h3>
          <p className="text-sm text-gray-500">
            Lo que cargues acá aparece en el pie de página de toda la web.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FIELDS.map((f) => (
          <div key={f.key} className={f.multiline ? "sm:col-span-2" : ""}>
            <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-700 mb-1.5">
              {f.label}
            </label>
            {f.multiline ? (
              <textarea
                value={form[f.key] || ""}
                onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                rows={3}
                className="w-full rounded-xl bg-brand-cream border border-border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-ink/20"
                data-testid={`config-${f.key}`}
              />
            ) : (
              <Input
                value={form[f.key] || ""}
                onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="h-10 rounded-xl bg-brand-cream border-border"
                data-testid={`config-${f.key}`}
              />
            )}
            {f.help && (
              <p className="mt-1 text-[11px] text-gray-500">{f.help}</p>
            )}
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={saving}
        style={{ color: "#FAFAF7" }}
        className="h-11 px-6 rounded-full bg-brand-ink hover:bg-black font-semibold text-sm disabled:opacity-50 inline-flex items-center gap-2"
        data-testid="config-save-btn"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Guardar Cambios
      </button>
    </form>
  );
};
