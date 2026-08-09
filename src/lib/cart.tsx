import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { MenuItem } from "./database.types";

export interface DrinkAddOn {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface ExtraAddOn {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  photo_url: string | null;
  tomatoSachets: number;
  drinkAddOns: DrinkAddOn[];
  extraAddOns: ExtraAddOn[];
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: MenuItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateTomatoSachets: (id: string, sachets: number) => void;
  addDrinkToItem: (itemId: string, drink: MenuItem) => void;
  updateDrinkQuantityOnItem: (itemId: string, drinkId: string, quantity: number) => void;
  removeDrinkFromItem: (itemId: string, drinkId: string) => void;
  addExtraToItem: (itemId: string, extra: MenuItem) => void;
  updateExtraQuantityOnItem: (itemId: string, extraId: string, quantity: number) => void;
  removeExtraFromItem: (itemId: string, extraId: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalTomatoSachets: number;
  tomatoTotal: number;
  drinksTotal: number;
  extrasTotal: number;
  totalAmount: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const TOMATO_PASTE_UNIT_PRICE = 5;
const CART_KEY = "munchiz-cart";

function drinksSubtotal(addOns: DrinkAddOn[] | undefined): number {
  return (addOns || []).reduce((s, d) => s + d.price * d.quantity, 0);
}

function extrasSubtotal(addOns: ExtraAddOn[] | undefined): number {
  return (addOns || []).reduce((s, e) => s + e.price * e.quantity, 0);
}

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];
    return parsed.map((i) => ({
      ...i,
      tomatoSachets: i.tomatoSachets ?? 0,
      drinkAddOns: Array.isArray(i.drinkAddOns) ? i.drinkAddOns : [],
      extraAddOns: Array.isArray(i.extraAddOns) ? i.extraAddOns : [],
    }));
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const addItem = useCallback((menuItem: MenuItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === menuItem.id);
      if (existing) {
        return prev.map((i) =>
          i.id === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1,
          photo_url: menuItem.photo_url,
          tomatoSachets: 0,
          drinkAddOns: [],
          extraAddOns: [],
        },
      ];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i))
    );
  }, []);

  const updateTomatoSachets = useCallback((id: string, sachets: number) => {
    const safe = Math.max(0, Math.min(99, Math.floor(sachets)));
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, tomatoSachets: safe } : i))
    );
  }, []);

  const addDrinkToItem = useCallback((itemId: string, drink: MenuItem) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== itemId) return i;
        const existing = i.drinkAddOns.find((d) => d.id === drink.id);
        if (existing) {
          return {
            ...i,
            drinkAddOns: i.drinkAddOns.map((d) =>
              d.id === drink.id ? { ...d, quantity: d.quantity + 1 } : d
            ),
          };
        }
        return {
          ...i,
          drinkAddOns: [
            ...i.drinkAddOns,
            { id: drink.id, name: drink.name, price: drink.price, quantity: 1 },
          ],
        };
      })
    );
  }, []);

  const updateDrinkQuantityOnItem = useCallback((itemId: string, drinkId: string, quantity: number) => {
    const safe = Math.max(0, Math.min(99, Math.floor(quantity)));
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== itemId) return i;
        if (safe === 0) {
          return { ...i, drinkAddOns: i.drinkAddOns.filter((d) => d.id !== drinkId) };
        }
        return {
          ...i,
          drinkAddOns: i.drinkAddOns.map((d) =>
            d.id === drinkId ? { ...d, quantity: safe } : d
          ),
        };
      })
    );
  }, []);

  const removeDrinkFromItem = useCallback((itemId: string, drinkId: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { ...i, drinkAddOns: i.drinkAddOns.filter((d) => d.id !== drinkId) }
          : i
      )
    );
  }, []);

  const addExtraToItem = useCallback((itemId: string, extra: MenuItem) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== itemId) return i;
        const existing = i.extraAddOns.find((e) => e.id === extra.id);
        if (existing) {
          return {
            ...i,
            extraAddOns: i.extraAddOns.map((e) =>
              e.id === extra.id ? { ...e, quantity: e.quantity + 1 } : e
            ),
          };
        }
        return {
          ...i,
          extraAddOns: [
            ...i.extraAddOns,
            { id: extra.id, name: extra.name, price: extra.price, quantity: 1 },
          ],
        };
      })
    );
  }, []);

  const updateExtraQuantityOnItem = useCallback((itemId: string, extraId: string, quantity: number) => {
    const safe = Math.max(0, Math.min(99, Math.floor(quantity)));
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== itemId) return i;
        if (safe === 0) {
          return { ...i, extraAddOns: i.extraAddOns.filter((e) => e.id !== extraId) };
        }
        return {
          ...i,
          extraAddOns: i.extraAddOns.map((e) =>
            e.id === extraId ? { ...e, quantity: safe } : e
          ),
        };
      })
    );
  }, []);

  const removeExtraFromItem = useCallback((itemId: string, extraId: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { ...i, extraAddOns: i.extraAddOns.filter((e) => e.id !== extraId) }
          : i
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalTomatoSachets = items.reduce((sum, i) => sum + (i.tomatoSachets || 0), 0);
  const tomatoTotal = totalTomatoSachets * TOMATO_PASTE_UNIT_PRICE;
  const drinksTotal = items.reduce((sum, i) => sum + drinksSubtotal(i.drinkAddOns), 0);
  const extrasTotal = items.reduce((sum, i) => sum + extrasSubtotal(i.extraAddOns), 0);
  const totalAmount =
    items.reduce((sum, i) => sum + i.price * i.quantity, 0) + tomatoTotal + drinksTotal + extrasTotal;

  return (
    <CartContext value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      updateTomatoSachets,
      addDrinkToItem,
      updateDrinkQuantityOnItem,
      removeDrinkFromItem,
      addExtraToItem,
      updateExtraQuantityOnItem,
      removeExtraFromItem,
      clearCart,
      totalItems,
      totalTomatoSachets,
      tomatoTotal,
      drinksTotal,
      extrasTotal,
      totalAmount,
      isOpen,
      setIsOpen,
    }}>
      {children}
    </CartContext>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function itemDrinksSubtotal(item: Pick<CartItem, "drinkAddOns">): number {
  return drinksSubtotal(item.drinkAddOns);
}

export function itemExtrasSubtotal(item: Pick<CartItem, "extraAddOns">): number {
  return extrasSubtotal(item.extraAddOns);
}