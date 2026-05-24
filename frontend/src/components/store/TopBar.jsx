export const TopBar = () => (
  <div
    className="w-full bg-brand-blue text-brand-cream text-[11px] sm:text-xs relative z-20"
    data-testid="top-bar"
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-center overflow-hidden">
      <span className="inline-flex items-center gap-2 tracking-wide font-semibold">
        <span>📍</span>
        Alcorta
        <span className="text-brand-cream/70">|</span>
        <span>🚚 Envíos a toda la zona</span>
      </span>
    </div>
  </div>
);
