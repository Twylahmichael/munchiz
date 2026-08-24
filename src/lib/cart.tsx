import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { MenuItem } from "./database.types";

// A generic add-on line attached to a specific cart line.
// Add-ons are configured per menu item by the admin — the frontend
// only needs id/name/price/quantity to bill and display them.
export interface CartAddon {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string | null;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  photo_url: string | null;
  addons: CartAddon[];
}

interface CartContextValue {
  items: CartItem[];
  /** Add a fresh cart line, optionally with a set of pre-picked add-ons and a starting quantity. */
  addItem: (item: MenuItem, addons?: CartAddon[], quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  setItemAddons: (itemId: string, addons: CartAddon[]) => void;
  clearCart: () => void;
  totalItems: number;
  addonsTotal: number;
  totalAmount: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CART_KEY = "munchiz-cart";

function addonsSubtotal(addons: CartAddon[] | undefined): number {
  return (addons || []).reduce((s, a) => s + a.price * a.quantity, 0);
}

// Older cart shapes stored per-item `tomatoSachets` / `drinkAddOns`.
// Migrate them into the new `addons` array on load so we never lose
// what the user already had in-cart.
function migrateLegacyItem(raw: any): CartItem {
  const legacyAddons: CartAddon[] = [];
  if (Number(raw?.tomatoSachets) > 0) {
    legacyAddons.push({
      id: "legacy-tomato-sachet",
      name: "Tomato paste sachet",
      price: 5,
      quantity: Math.floor(Number(raw.tomatoSachets)),
      category: "Sauces & Sachets",
    });
  }
  if (Array.isArray(raw?.drinkAddOns)) {
    for (const d of raw.drinkAddOns) {
      legacyAddons.push({
        id: String(d.id),
        name: String(d.name),
        price: Number(d.price) || 0,
        quantity: Math.max(1, Math.floor(Number(d.quantity) || 1)),
        category: "Drinks",
      });
    }
  }
  return {
    id: String(raw.id),
    name: String(raw.name),
    price: Number(raw.price) || 0,
    quantity: Math.max(1, Math.floor(Number(raw.quantity) || 1)),
    photo_url: raw.photo_url ?? null,
    addons: Array.isArray(raw?.addons)
      ? raw.addons.map((a: any) => ({
          id: String(a.id),
          name: String(a.name),
          price: Number(a.price) || 0,
          quantity: Math.max(1, Math.floor(Number(a.quantity) || 1)),
          category: a.category ?? null,
        }))
      : legacyAddons,
  };
}

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? (JSON.parse(raw) as any[]) : [];
    return parsed.map(migrateLegacyItem);
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

function mergeAddons(existing: CartAddon[], incoming: CartAddon[]): CartAddon[] {
  const out: CartAddon[] = existing.map((a) => ({ ...a }));
  for (const inc of incoming) {
    const match = out.find((e) => e.id === inc.id);
    if (match) match.quantity += inc.quantity;
    else out.push({ ...inc });
  }
  return out;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);
  // NOTE: `addItem` no longer opens the drawer. Checkout is intentional —
  // the user opens the cart from the navbar cart icon.
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const addItem = useCallback(
    (menuItem: MenuItem, addons: CartAddon[] = [], quantity: number = 1) => {
      const qty = Math.max(1, Math.floor(quantity));
      setItems((prev) => {
        const existing = prev.find((i) => i.id === menuItem.id);
        // If the item is already in the cart, bump quantity and merge new
        // add-ons into the existing line so it stays consolidated.
        if (existing) {
          const mergedAddons = mergeAddons(existing.addons, addons);
          return prev.map((i) =>
            i.id === menuItem.id ? { ...i, quantity: i.quantity + qty, addons: mergedAddons } : i,
          );
        }
        return [
          ...prev,
          {
            id: menuItem.id,
            name: menuItem.name,
            price: menuItem.price,
            quantity: qty,
            photo_url: menuItem.photo_url,
            addons,
          },
        ];
      });
    },
    [],
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
  }, []);

  const setItemAddons = useCallback((itemId: string, addons: CartAddon[]) => {
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, addons } : i)));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const addonsTotal = items.reduce((sum, i) => sum + addonsSubtotal(i.addons), 0);
  const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0) + addonsTotal;

  return (
    <CartContext
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        setItemAddons,
        clearCart,
        totalItems,
        addonsTotal,
        totalAmount,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </CartContext>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function itemAddonsSubtotal(item: Pick<CartItem, "addons">): number {
  return addonsSubtotal(item.addons);
}

export function itemLineTotal(item: CartItem): number {
  return item.price * item.quantity + addonsSubtotal(item.addons);
}
