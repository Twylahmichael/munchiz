import { useState } from "react";
import { X, Trash2, ShoppingBag } from "lucide-react";
import { useCart, itemLineTotal } from "@/lib/cart";
import { CheckoutForm } from "./CheckoutForm";
import { QuantityStepper } from "./QuantityStepper";

export function CartDrawer() {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    addonsTotal,
    totalAmount,
    isOpen,
    setIsOpen,
  } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);

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
                  const lineTotal = itemLineTotal(item);
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
                          KES {lineTotal.toLocaleString()}
                        </p>
                        <div className="mt-1">
                          <QuantityStepper
                            value={item.quantity}
                            onChange={(q) => updateQuantity(item.id, q)}
                            min={0}
                            max={99}
                            ariaLabel={`${item.name} quantity`}
                          />
                        </div>
                        {item.addons.length > 0 && (
                          <ul className="mt-2 pt-2 border-t border-border/60 space-y-1">
                            {item.addons.map((a) => (
                              <li
                                key={a.id}
                                className="flex items-center justify-between text-[11px] text-muted-foreground"
                              >
                                <span className="truncate">
                                  + {a.quantity}× {a.name}
                                </span>
                                <span className="whitespace-nowrap ml-2">
                                  KES {(a.price * a.quantity).toLocaleString()}
                                </span>
                              </li>
                            ))}
                          </ul>
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
                {addonsTotal > 0 && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Add-ons</span>
                    <span>KES {addonsTotal.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-lg font-bold">
                  <span className="text-secondary">Total</span>
                  <span className="text-primary text-2xl font-display">
                    KES {totalAmount.toLocaleString()}
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
