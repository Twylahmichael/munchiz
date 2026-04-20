export const WHATSAPP_NUMBER = "254728466665";

export function buildWhatsAppUrl(item?: string): string {
  const message = item
    ? `Hi Munchiz! 🍔 I'd like to order: ${item}. Please confirm and share delivery details. Thank you!`
    : `Hi Munchiz! 🍔 I'd like to place an order. Please share the menu and delivery details. Thank you!`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
