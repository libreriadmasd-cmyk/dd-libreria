import { useEffect, useState } from "react";
import { MapPin, Phone, Mail, Instagram, Facebook } from "lucide-react";
import { fetchStoreConfig } from "../../lib/api";

const DEFAULTS = {
  about_text: "Nexo Store · Conectamos lo que necesitás. Más de 8.000 artículos curados.",
  phone: "+54 9 3465 53-8232",
  email: "contacto@nexostore.com.ar",
  address: "Alcorta, Santa Fe",
  maps_url: "https://www.google.com/maps?q=Alcorta+Santa+Fe&output=embed",
  instagram_url: "https://instagram.com/nexostore",
  facebook_url: "https://facebook.com/NexoStore",
};

export const Footer = () => {
  const [cfg, setCfg] = useState(DEFAULTS);

  useEffect(() => {
    fetchStoreConfig()
      .then((d) => setCfg({ ...DEFAULTS, ...d }))
      .catch(() => {});
  }, []);

  const phoneHref = cfg.phone
    ? `https://wa.me/${cfg.phone.replace(/\D/g, "")}`
    : null;

  return (
    <footer
      className="border-t border-border bg-white relative z-10"
      data-testid="site-footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Nosotros */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <img
              src={`${process.env.PUBLIC_URL || ""}/nexo-logo.png`}
              alt="Nexo Store"
              className="h-10 w-auto"
            />
            <span className="font-display text-xl font-bold text-brand-blue">
              Nexo Store
            </span>
          </div>
          <p
            className="text-sm text-gray-600 leading-relaxed"
            data-testid="footer-about"
          >
            {cfg.about_text}
          </p>
          <div className="flex items-center gap-3 mt-4">
            {cfg.instagram_url && (
              <a
                href={cfg.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 grid place-items-center rounded-full border border-border text-gray-600 hover:text-brand-ink hover:border-brand-ink transition"
                aria-label="Instagram"
                data-testid="footer-instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
            )}
            {cfg.facebook_url && (
              <a
                href={cfg.facebook_url}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 grid place-items-center rounded-full border border-border text-gray-600 hover:text-brand-ink hover:border-brand-ink transition"
                aria-label="Facebook"
                data-testid="footer-facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Contacto */}
        <div>
          <h4 className="font-display text-sm font-bold text-brand-ink uppercase tracking-wider mb-4">
            Contacto
          </h4>
          <ul className="space-y-3 text-sm text-gray-700">
            {cfg.phone && (
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-brand-green mt-0.5 shrink-0" />
                {phoneHref ? (
                  <a
                    href={phoneHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-brand-ink"
                    data-testid="footer-phone"
                  >
                    {cfg.phone}
                  </a>
                ) : (
                  <span data-testid="footer-phone">{cfg.phone}</span>
                )}
              </li>
            )}
            {cfg.email && (
              <li className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-brand-green mt-0.5 shrink-0" />
                <a
                  href={`mailto:${cfg.email}`}
                  className="hover:text-brand-ink"
                  data-testid="footer-email"
                >
                  {cfg.email}
                </a>
              </li>
            )}
            {cfg.address && (
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-brand-green mt-0.5 shrink-0" />
                <span data-testid="footer-address">{cfg.address}</span>
              </li>
            )}
          </ul>
        </div>

        {/* Mapa */}
        <div>
          <h4 className="font-display text-sm font-bold text-brand-ink uppercase tracking-wider mb-4">
            Cómo llegar
          </h4>
          {cfg.maps_url ? (
            <div className="rounded-2xl overflow-hidden border border-border bg-pastel-sand aspect-[4/3]">
              <iframe
                title="Ubicación Nexo Store"
                src={cfg.maps_url}
                className="w-full h-full"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                data-testid="footer-map"
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-brand-cream aspect-[4/3] grid place-items-center text-sm text-gray-500">
              Cargá la URL del mapa desde el panel de Admin
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-500">
          <p>© {new Date().getFullYear()} <span className="font-semibold text-brand-blue">Nexo Store</span> · Conectamos lo que necesitás.</p>
          <p className="uppercase tracking-[0.2em]">
            Librería · Marroquinería · Juguetería · Regalería · Tecno
          </p>
        </div>
      </div>
    </footer>
  );
};
