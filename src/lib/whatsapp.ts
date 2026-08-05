export const WHATSAPP_NUMBER = "254728466665";

export function buildWhatsAppUrl(): string {
  const message = `Hi Munchiz! 🍔 I have a question. Thank you!`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
