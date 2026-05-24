import { useCart } from "../../context/CartContext";
import { buildWhatsAppUrl } from "../../lib/whatsapp";

export const WhatsAppFloating = () => {
  const { items, total, count } = useCart();

  const handleClick = () => {
    window.open(buildWhatsAppUrl(items, total), "_blank", "noopener");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 h-14 pl-4 pr-5 rounded-full bg-[#25D366] hover:bg-[#1EBE5B] text-white font-semibold shadow-lg shadow-green-300/50 hover:shadow-green-400/60 active:scale-95 transition-all inline-flex items-center gap-2.5 group"
      data-testid="whatsapp-floating-button"
      aria-label="Pedir por WhatsApp"
    >
      <span className="relative grid place-items-center h-9 w-9 rounded-full bg-white/15">
        <svg
          viewBox="0 0 24 24"
          className="w-6 h-6 fill-current"
          aria-hidden="true"
        >
          <path d="M20.52 3.48A11.87 11.87 0 0 0 12.04 0C5.5 0 .18 5.3.18 11.84c0 2.09.55 4.13 1.6 5.93L0 24l6.38-1.67a11.82 11.82 0 0 0 5.66 1.44h.01c6.53 0 11.85-5.3 11.85-11.84 0-3.16-1.23-6.13-3.38-8.45ZM12.04 21.8h-.01a9.92 9.92 0 0 1-5.06-1.39l-.36-.21-3.79.99 1.01-3.69-.24-.38a9.83 9.83 0 0 1-1.51-5.28c0-5.44 4.44-9.87 9.91-9.87 2.65 0 5.13 1.03 7 2.9a9.79 9.79 0 0 1 2.9 6.98c0 5.44-4.44 9.95-9.85 9.95Zm5.68-7.41c-.31-.15-1.84-.91-2.13-1.01-.29-.1-.5-.15-.71.16-.21.31-.82 1.01-1 1.22-.18.21-.37.23-.68.08-.31-.15-1.31-.48-2.5-1.54a9.36 9.36 0 0 1-1.73-2.14c-.18-.31-.02-.48.14-.63.14-.14.31-.37.47-.55.16-.18.21-.31.31-.52.1-.21.05-.39-.03-.55-.08-.15-.71-1.71-.97-2.34-.25-.61-.51-.53-.71-.54l-.61-.01c-.21 0-.55.08-.84.39-.29.31-1.1 1.08-1.1 2.63 0 1.55 1.13 3.06 1.29 3.27.16.21 2.23 3.4 5.41 4.77.76.33 1.35.52 1.81.67.76.24 1.45.21 2 .13.61-.09 1.84-.75 2.1-1.48.26-.73.26-1.36.18-1.48-.08-.13-.29-.21-.6-.36Z" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-yellow text-gray-900 text-[10px] font-bold grid place-items-center ring-2 ring-[#25D366]">
            {count}
          </span>
        )}
      </span>
      <span className="hidden sm:inline text-sm">
        {count > 0 ? "Pedir por WhatsApp" : "Consultar por WhatsApp"}
      </span>
    </button>
  );
};
