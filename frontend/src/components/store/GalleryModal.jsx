import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Plus, Trash2, ImageOff, Loader2, Star, UploadCloud, Camera } from "lucide-react";
import { adminAddImage, adminRemoveImage, adminUploadFile, resolveBackendUrl } from "../../lib/api";

export const GalleryModal = ({ product, open, onOpenChange, onChange }) => {
  const [images, setImages] = useState(product?.imagenes || []);
  const [newUrl, setNewUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef(null);

  const sync = (updated) => {
    setImages(updated.imagenes || []);
    onChange?.(updated);
  };

  const add = async () => {
    const url = newUrl.trim();
    if (!url) return;
    setBusy(true);
    try {
      const updated = await adminAddImage(product.sku, url);
      sync(updated);
      setNewUrl("");
      toast.success("Imagen agregada");
    } catch (e) {
      toast.error("Error", { description: e.message });
    } finally {
      setBusy(false);
    }
  };

  const onFilePicked = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const uploaded = await adminUploadFile(file);
      const updated = await adminAddImage(product.sku, uploaded.url);
      sync(updated);
      toast.success("Foto subida", { description: file.name });
    } catch (e) {
      toast.error("Error al subir", { description: e.message });
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const remove = async (idx) => {
    setBusy(true);
    try {
      const updated = await adminRemoveImage(product.sku, idx);
      sync(updated);
    } catch (e) {
      toast.error("Error", { description: e.message });
    } finally {
      setBusy(false);
    }
  };

  const makeMain = async (idx) => {
    if (idx === 0) return;
    setBusy(true);
    try {
      // Move the chosen image to position 0: remove then insert
      const chosen = images[idx];
      // remove + re-add at front: simulate via remove then add (which appends)
      // Since backend append is the only op, we do:
      //  1) grab a copy of imagenes
      //  2) reorder locally, then PUT to /admin/products/{sku} with imagenes=reordered
      const reordered = [chosen, ...images.filter((_, i) => i !== idx)];
      const r = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/products/${encodeURIComponent(product.sku)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Admin-Token": localStorage.getItem("dd_admin_token") || "",
          },
          body: JSON.stringify({ imagenes: reordered }),
        }
      );
      if (!r.ok) throw new Error("No se pudo reordenar");
      const updated = await r.json();
      sync(updated);
      toast.success("Imagen principal actualizada");
    } catch (e) {
      toast.error("Error", { description: e.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl bg-brand-cream"
        data-testid="gallery-modal"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold text-brand-ink">
            Galería de imágenes
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 truncate">
            {product?.nombre}{" "}
            <span className="font-mono text-xs text-gray-500">· {product?.sku}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File upload — primary action */}
          <div className="rounded-xl border-2 border-dashed border-brand-ink/30 bg-white p-5 text-center hover:border-brand-ink/60 hover:bg-brand-cream/40 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => onFilePicked(e.target.files?.[0])}
              className="hidden"
              data-testid="gallery-file-input"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              style={{ color: "#FAFAF7" }}
              className="inline-flex items-center justify-center gap-2 h-14 px-7 rounded-full bg-brand-ink hover:bg-black active:scale-[0.98] disabled:opacity-50 transition-all text-base font-semibold"
              data-testid="gallery-upload-file-btn"
            >
              {busy ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  Subir foto desde mi dispositivo
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              JPG, PNG o WEBP · hasta 8MB. Funciona desde celu o computadora.
            </p>
          </div>

          {/* Add URL — secondary */}
          <div className="rounded-xl border border-border bg-white p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">
              También podés pegar una URL de imagen directa
            </p>
            <div className="flex gap-2">
              <Input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://res.cloudinary.com/…/imagen.webp"
                className="h-10 rounded-xl bg-brand-cream border-border font-mono text-xs"
                data-testid="gallery-new-url"
                onKeyDown={(e) => e.key === "Enter" && add()}
              />
              <button
                type="button"
                onClick={add}
                disabled={busy || !newUrl.trim()}
                style={{ color: "#FAFAF7" }}
                className="h-10 px-4 rounded-full bg-gray-800 hover:bg-black font-semibold text-sm disabled:opacity-50 inline-flex items-center gap-1.5"
                data-testid="gallery-add-btn"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Copia la URL de Cloudinary, Imgur o cualquier imagen pública.
            </p>
          </div>

          {/* Grid */}
          {images.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-white p-8 text-center text-sm text-gray-500">
              Aún no hay imágenes. Agregá la primera arriba.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" data-testid="gallery-grid">
              {images.map((url, idx) => (
                <div
                  key={`${url}-${idx}`}
                  className="relative group rounded-xl border border-border bg-white overflow-hidden"
                >
                  <div className="aspect-square bg-pastel-sand">
                    <img
                      src={resolveBackendUrl(url)}
                      alt=""
                      className="w-full h-full object-contain p-2"
                      onError={(e) => {
                        e.currentTarget.outerHTML = `<div class="w-full h-full grid place-items-center"><svg class="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3l18 18M21 15V6a2 2 0 00-2-2H9m-3 1.333V18a2 2 0 002 2h12"/></svg></div>`;
                      }}
                    />
                  </div>
                  {idx === 0 && (
                    <span className="absolute top-1.5 left-1.5 text-[9px] font-bold uppercase tracking-wider bg-brand-ink text-brand-cream px-1.5 py-0.5 rounded-full">
                      Principal
                    </span>
                  )}
                  <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {idx !== 0 && (
                      <button
                        type="button"
                        onClick={() => makeMain(idx)}
                        disabled={busy}
                        className="h-7 w-7 grid place-items-center rounded-full bg-white/90 text-gray-700 hover:text-brand-ink border border-border"
                        title="Hacer principal"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      disabled={busy}
                      className="h-7 w-7 grid place-items-center rounded-full bg-white/90 text-red-600 hover:bg-red-50 border border-border"
                      title="Eliminar"
                      data-testid={`gallery-remove-${idx}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
