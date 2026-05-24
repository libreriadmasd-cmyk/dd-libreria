import { formatARS } from "./format";

// Número de WhatsApp del local D+D (formato internacional sin "+")
export const WHATSAPP_NUMBER = "5493465538232";

export const buildWhatsAppMessage = (items, total) => {
  const lines = ["Hola D+D, quiero comprar:", ""];
  if (!items || items.length === 0) {
    lines.push("(Aún sin productos)");
  } else {
    items.forEach((i, idx) => {
      const subtotal = i.precio * i.cantidad;
      lines.push(
        `${idx + 1}. ${i.nombre} — x${i.cantidad} — ${formatARS(i.precio)} c/u = ${formatARS(subtotal)}`
      );
    });
    lines.push("");
    lines.push(`Total: ${formatARS(total)}`);
  }
  return lines.join("\n");
};

export const buildWhatsAppUrl = (items, total) => {
  const text = encodeURIComponent(buildWhatsAppMessage(items, total));
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
};
