import { useState, useRef } from "react";
import { toast } from "sonner";
import { Camera, Loader2, X, Star, Trash2, ImageOff } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "../ui/dialog";
import { adminAddImage, adminRemoveImage, adminUpdateProduct } from "../../lib/api";
import { uploadToCloudinary, isCloudinaryConfigured } from "../../lib/cloudinary";

export const GalleryModal = ({ product, open, onOpenChange, onChange }) => {
  const [images, setImages] = useState(product?.imagenes || []);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const fileRef = useRef(null);

  const sync = (updated) => {
    setImages(updated.imagenes || []);
    onChange?.(updated);
  };

  const handleFiles = async (files) => {
    const list = Array.from(files || []);
    if (list.length === 0) return;
    if (!isCloudinaryConfigured()) {
      toast.error("Cloudinary no configurado");
      return;
    }
    setBusy(true);
    let last = null;
    try {
      for (let i = 0; i < list.length; i++) {
        setProgress(`Subiendo ${i + 1}/${list.length}…`);
        const url = await uploadToCloudinary(list[i]);
        last = await adminAddImage(product.sku, url);
      }
      if (last) sync(last);
      toast.success(`${list.length} foto${list.length > 1 ? "s" : ""} agregada${list.length > 1 ? "s" : ""}`);
    } catch (e) {
      toast.error("Error al subir", { description: e.message });
    } finally {
      setBusy(false);
      setProgress("");
      if (fileRef.current) fileRef.current.value = "";
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
      const reordered = [images[idx], ...images.filter((_, i) => i !== idx)];
      const updated = await adminUpdateProduct(product.sku, { imagenes: reordered });
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
      <DialogContent className="max-w-2xl bg-brand-cream" data-testid="gallery-modal">
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
          {/* GIANT upload button */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
            data-testid="gallery-file-input"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="w-full h-20 rounded-2xl border-2 border-dashed border-brand-green/40 bg-pastel-mint/40 hover:bg-pastel-mint hover:border-brand-green text-brand-greenDark font-bold text-base transition-all inline-flex items-center justify-center gap-3 disabled:opacity-50"
            data-testid="gallery-upload-cloudinary"
          >
            {busy ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                {progress || "Subiendo…"}
              </>
            ) : (
              <>
                <Camera className="w-7 h-7" strokeWidth={2} />
                📷 Cambiar / Agregar Foto
                <span className="text-xs font-medium text-gray-500">(podés elegir varias)</span>
              </>
            )}
          </button>

          {!isCloudinaryConfigured() && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
              Cloudinary no configurado. Revisá REACT_APP_CLOUDINARY_CLOUD_NAME y REACT_APP_CLOUDINARY_UPLOAD_PRESET.
            </p>
          )}

          {images.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-white p-8 text-center text-sm text-gray-500">
              Aún no hay imágenes. Tocá el botón para agregar la primera.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" data-testid="gallery-grid">
              {images.map((url, idx) => (
                <div key={`${url}-${idx}`} className="relative group rounded-xl border border-border bg-white overflow-hidden">
                  <div className="aspect-square bg-pastel-sand">
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-contain p-2"
                      onError={(e) => {
                        e.currentTarget.style.opacity = "0.2";
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
                        type="button" onClick={() => makeMain(idx)} disabled={busy}
                        className="h-7 w-7 grid place-items-center rounded-full bg-white/90 text-gray-700 hover:text-brand-ink border border-border"
                        title="Hacer principal"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button" onClick={() => remove(idx)} disabled={busy}
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
