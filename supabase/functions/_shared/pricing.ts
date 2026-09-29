// Server-side pricing for SMS orders. Mirrors the arithmetic CheckoutForm.tsx
// does client-side (quantity × price, + delivery fee, - promo discount), but
// every price/fee here comes from a fresh database read — never from
// anything the customer typed in an SMS. This is what keeps SMS orders and
// web orders charging the same amount for the same basket.

export interface MenuItemForPricing {
  id: string;
  name: string;
  price: number;
  is_available: boolean;
}

export interface PricedLine {
  menu_item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

/**
 * Prices one order line strictly from the database menu item — any quantity
 * or "price" text the customer sent is only ever used to pick *which* item
 * and *how many*, never what it costs.
 */
export function priceLine(item: MenuItemForPricing, quantity: number): PricedLine {
  const qty = Math.max(1, Math.floor(quantity));
  return {
    menu_item_id: item.id,
    item_name: item.name,
    quantity: qty,
    unit_price: item.price,
    subtotal: Math.round(item.price * qty * 100) / 100,
  };
}

export interface OrderTotals {
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
}

export function calculateTotals(lines: PricedLine[], deliveryFee: number): OrderTotals {
  const subtotal = Math.round(lines.reduce((sum, l) => sum + l.subtotal, 0) * 100) / 100;
  const delivery_fee = Math.max(0, Math.round(deliveryFee * 100) / 100);
  return { subtotal, delivery_fee, total_amount: subtotal + delivery_fee };
}

export function formatKes(amount: number): string {
  return Math.round(amount).toLocaleString("en-KE");
}
