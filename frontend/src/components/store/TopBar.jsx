import { MapPin, Truck } from "lucide-react";

export const TopBar = () => (
  <div
    className="w-full bg-brand-ink text-brand-cream text-[11px] sm:text-xs"
    data-testid="top-bar"
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-center gap-6 overflow-hidden">
      <span className="inline-flex items-center gap-1.5 tracking-wide">
        <MapPin className="w-3.5 h-3.5 text-brand-yellow" strokeWidth={2} />
        Retiros en nuestro local de <b className="font-semibold">Alcorta</b>
      </span>
      <span className="hidden sm:inline text-brand-cream/30">|</span>
      <span className="inline-flex items-center gap-1.5 tracking-wide">
        <span aria-hidden className="text-lg">🚚</span>
        Envíos a <b className="font-semibold">Rosario y alrededores</b>
      </span>
    </div>
  </div>
);
