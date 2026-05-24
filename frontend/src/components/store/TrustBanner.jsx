import { MapPin, Award, ShieldCheck } from "lucide-react";

export const TrustBanner = () => (
  <section
    className="bg-white border-y border-border"
    data-testid="trust-banner"
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
      <div className="flex items-center gap-3 justify-center sm:justify-start">
        <span className="h-10 w-10 rounded-full bg-brand-blue/10 grid place-items-center shrink-0">
          <MapPin className="w-5 h-5 text-brand-blue" strokeWidth={2} />
        </span>
        <div className="text-sm">
          <p className="font-semibold text-brand-blue">📍 Alcorta para todo el país</p>
          <p className="text-xs text-gray-500">Retiro local · Envíos a toda Argentina</p>
        </div>
      </div>

      <div className="flex items-center gap-3 justify-center sm:justify-center">
        <span className="h-10 w-10 rounded-full bg-brand-yellow/15 grid place-items-center shrink-0">
          <Award className="w-5 h-5 text-brand-yellow" strokeWidth={2} />
        </span>
        <div className="text-sm">
          <p className="font-semibold text-brand-blue">⭐ Tu tienda de confianza desde siempre</p>
          <p className="text-xs text-gray-500">18 años acompañando a Alcorta</p>
        </div>
      </div>

      <div className="flex items-center gap-3 justify-center sm:justify-end">
        <span className="h-10 w-10 rounded-full bg-brand-teal/15 grid place-items-center shrink-0">
          <ShieldCheck className="w-5 h-5 text-brand-teal" strokeWidth={2} />
        </span>
        <div className="text-sm">
          <p className="font-semibold text-brand-blue">✅ Compra 100% segura</p>
          <p className="text-xs text-gray-500">Confirmás todo por WhatsApp</p>
        </div>
      </div>
    </div>
  </section>
);
