// Full-screen fixed watermark. Sits behind everything (z-0).
// On mobile we lower the opacity to keep readability under high screen brightness.
export const Watermark = () => (
  <div
    aria-hidden
    className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden"
    data-testid="watermark"
  >
    <img
      src={`${process.env.PUBLIC_URL || ""}/logo-dd.png`}
      alt=""
      draggable="false"
      className="w-[80vmin] h-[80vmin] object-contain opacity-[0.02] sm:opacity-[0.04] select-none"
    />
  </div>
);
