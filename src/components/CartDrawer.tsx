import { useMemo, useState } from "react";
import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { useCart, TOMATO_PASTE_UNIT_PRICE, itemDrinksSubtotal } from "@/lib/cart";
import { useCategories, useMenuItems } from "@/hooks/use-menu";
import type { MenuItem } from "@/lib/database.types";
import { CheckoutForm } from "./CheckoutForm";

export function CartDrawer() {
  const {
    items,
    removeItem,
    updateQuantity,
    updateTomatoSachets,
    addDrinkToItem,
    updateDrinkQuantityOnItem,
    removeDrinkFromItem,
    clearCart,
    totalItems,
    totalTomatoSachets,
    tomatoTotal,
    drinksTotal,
    totalAmount,
    isOpen,
    setIsOpen,
  } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);

  const { data: categories } = useCategories();
  const { data: menuItems } = useMenuItems();

  const drinkOptions = useMemo<MenuItem[]>(() => {
    const drinksCat = categories?.find((c) => c.slug === "drinks");
    if (!drinksCat || !menuItems) return [];
    return menuItems
      .filter((m) => m.category_id === drinksCat.id && m.is_available)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [categories, menuItems]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
        onClick={() => {
          setIsOpen(false);
          setShowCheckout(false);
        }}
      />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card z-[70] shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-2xl font-display text-secondary flex items-center gap-2">
            <ShoppingBag size={24} />
            {showCheckout ? "Checkout" : `Your Cart (${totalItems})`}
          </h2>
          <button
            onClick={() => {
              setIsOpen(false);
              setShowCheckout(false);
            }}
            className="p-2 hover:bg-muted rounded-full transition-colors"
            aria-label="Close cart"
          >
            <X size={24} />
          </button>
        </div>

        {showCheckout ? (
          <CheckoutForm onBack={() => setShowCheckout(false)} />
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingBag size={48} className="mx-auto text-muted-foreground/40 mb-4" />
                  <p className="text-muted-foreground font-semibold">Your cart is empty</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Add items from the menu to get started
                  </p>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="mt-4 bg-primary text-primary-foreground px-6 py-2 rounded-full font-bold uppercase text-sm hover:bg-secondary transition-colors"
                  >
                    Browse Menu
                  </button>
                </div>
              ) : (
                items.map((item) => {
                  const drinkSub = itemDrinksSubtotal(item);
                  const lineTotal =
                    item.price * item.quantity +
                    (item.tomatoSachets || 0) * TOMATO_PASTE_UNIT_PRICE +
                    drinkSub;
                  const alreadyPickedIds = new Set(item.drinkAddOns.map((d) => d.id));
                  return (
                    <div
                      key={item.id}
                      className="flex gap-3 bg-background rounded-2xl p-3 border border-border"
                    >
                      {item.photo_url ? (
                        <img
                          src={item.photo_url}
                          alt={item.name}
                          className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center text-2xl flex-shrink-0">
                          🍽️
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-secondary text-sm truncate">
                          {item.name}
                        </h3>
                        <p className="text-primary font-bold text-sm">
                          KES {lineTotal}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-sm font-bold w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/60">
                          <span className="text-[11px] text-muted-foreground flex-1">
                            🍅 Tomato sachet
                            <span className="text-muted-foreground/70"> (+KES {TOMATO_PASTE_UNIT_PRICE})</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => updateTomatoSachets(item.id, (item.tomatoSachets || 0) - 1)}
                            disabled={(item.tomatoSachets || 0) <= 0}
                            className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label="Fewer tomato sachets"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-xs font-bold w-5 text-center">
                            {item.tomatoSachets || 0}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateTomatoSachets(item.id, (item.tomatoSachets || 0) + 1)}
                            className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                            aria-label="More tomato sachets"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        {item.drinkAddOns.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {item.drinkAddOns.map((d) => (
                              <li key={d.id} className="flex items-center gap-2">
                                <span className="text-[11px] text-muted-foreground flex-1 truncate">
                                  🥤 {d.name}
                                  <span className="text-muted-foreground/70"> (+KES {d.price})</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateDrinkQuantityOnItem(item.id, d.id, d.quantity - 1)}
                                  className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                                  aria-label={`Fewer ${d.name}`}
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="text-xs font-bold w-5 text-center">{d.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateDrinkQuantityOnItem(item.id, d.id, d.quantity + 1)}
                                  className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                                  aria-label={`More ${d.name}`}
                                >
                                  <Plus size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeDrinkFromItem(item.id, d.id)}
                                  className="p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                                  aria-label={`Remove ${d.name}`}
                                >
                                  <X size={12} />
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}

                        {drinkOptions.length > 0 && (
                          <div className="mt-2">
                            <select
                              value=""
                              onChange={(e) => {
                                const drink = drinkOptions.find((d) => d.id === e.target.value);
                                if (drink) addDrinkToItem(item.id, drink);
                                e.target.value = "";
                              }}
                              className="w-full text-[11px] px-2 py-1 rounded-lg bg-muted border border-border text-secondary focus:outline-none focus:ring-1 focus:ring-primary"
                              aria-label="Add a drink to this meal"
                            >
                              <option value="">🥤 Add a drink…</option>
                              {drinkOptions.map((d) => (
                                <option key={d.id} value={d.id} disabled={alreadyPickedIds.has(d.id)}>
                                  {d.name} — KES {d.price}
                                  {alreadyPickedIds.has(d.id) ? " (added)" : ""}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="self-start p-1 text-muted-foreground hover:text-destructive transition-colors"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-border p-4 space-y-3">
                {totalTomatoSachets > 0 && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>🍅 Tomato sachets x {totalTomatoSachets}</span>
                    <span>KES {tomatoTotal}</span>
                  </div>
                )}
                {drinksTotal > 0 && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>🥤 Drink add-ons</span>
                    <span>KES {drinksTotal}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-lg font-bold">
                  <span className="text-secondary">Total</span>
                  <span className="text-primary text-2xl font-display">
                    KES {totalAmount}
                  </span>
                </div>
                <button
                  onClick={() => setShowCheckout(true)}
                  className="w-full bg-primary text-primary-foreground py-4 rounded-full font-bold uppercase tracking-wide text-base hover:scale-[1.02] transition-transform shadow-card-warm flex items-center justify-center gap-2"
                >
                  Checkout
                </button>
                <button
                  onClick={clearCart}
                  className="w-full text-muted-foreground text-sm hover:text-destructive transition-colors py-1"
                >
                  Clear Cart
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
