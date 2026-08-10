import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { MenuItem } from "@/lib/database.types";
import { useCart, type CartAddon } from "@/lib/cart";
import { useMenuItemAddonsGrouped } from "@/hooks/use-addons";

interface AddToCartModalProps {
  item: MenuItem;
  onClose: () => void;
  /** Called when the user clicks "Proceed to Checkout". */
  onCheckout: () => void;
}

/** Small controlled quantity input used per add-on row. */
function QtyInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      min={1}
      max={99}
      value={value}
      onChange={(e) => {
        const n = Math.max(1, Math.min(99, Math.floor(Number(e.target.value) || 1)));
        onChange(n);
      }}
      className="w-16 px-2 py-1 rounded-md border border-border bg-background text-secondary text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary"
    />
  );
}

export function AddToCartModal({ item, onClose, onCheckout }: AddToCartModalProps) {
  const { addItem } = useCart();
  const { data: groups, isLoading } = useMenuItemAddonsGrouped(item.id);

  // Track per-addon-id { checked, quantity }.
  const [state, setState] = useState<Record<string, { checked: boolean; quantity: number }>>({});
  // Open the first group by default so the modal isn't a wall of collapsed accordions.
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);

  useEffect(() => {
    if (groups.length > 0 && openCategoryId === null) {
      setOpenCategoryId(groups[0].category.id);
    }
  }, [groups, openCategoryId]);

  const pickedAddons = useMemo<CartAddon[]>(() => {
    const out: CartAddon[] = [];
    for (const g of groups) {
      for (const a of g.addons) {
        const s = state[a.id];
        if (s?.checked && s.quantity > 0) {
          out.push({
            id: a.id,
            name: a.name,
            price: a.price,
            quantity: s.quantity,
            category: g.category.name,
          });
        }
      }
    }
    return out;
  }, [state, groups]);

  const addonsSubtotal = pickedAddons.reduce((sum, a) => sum + a.price * a.quantity, 0);
  const lineTotal = item.price + addonsSubtotal;

  function commit(nextAction: "continue" | "checkout") {
    addItem(item, pickedAddons);
    if (nextAction === "checkout") onCheckout();
    else onClose();
  }

  const hasAddons = groups.length > 0;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Add ${item.name} to cart`}
        className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="pointer-events-auto w-full max-w-lg bg-card rounded-3xl shadow-2xl border border-border flex flex-col max-h-[90vh]">
          <header className="flex items-center justify-between p-5 border-b border-border">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                Add to cart
              </p>
              <h2 className="text-2xl font-display text-secondary truncate">{item.name}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-full transition-colors -mr-2"
              aria-label="Close"
            >
              <X size={22} />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {item.description && (
              <p className="text-sm text-muted-foreground">{item.description}</p>
            )}

            {isLoading ? (
              <div className="py-6 text-center text-muted-foreground text-sm">
                Loading options…
              </div>
            ) : hasAddons ? (
              groups.map((g) => {
                const isOpen = openCategoryId === g.category.id;
                return (
                  <section
                    key={g.category.id}
                    className="border border-border rounded-2xl overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenCategoryId(isOpen ? null : g.category.id)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-background hover:bg-muted transition-colors text-left"
                      aria-expanded={isOpen}
                    >
                      <span className="font-semibold text-secondary">{g.category.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {isOpen ? "Hide" : `${g.addons.length} option${g.addons.length === 1 ? "" : "s"}`}
                      </span>
                    </button>
                    {isOpen && (
                      <ul className="divide-y divide-border">
                        {g.addons.map((a) => {
                          const s = state[a.id] ?? { checked: false, quantity: 1 };
                          return (
                            <li
                              key={a.id}
                              className="flex items-center gap-3 px-4 py-3 bg-card"
                            >
                              <input
                                type="checkbox"
                                checked={s.checked}
                                onChange={(e) =>
                                  setState((prev) => ({
                                    ...prev,
                                    [a.id]: {
                                      checked: e.target.checked,
                                      quantity: prev[a.id]?.quantity ?? 1,
                                    },
                                  }))
                                }
                                className="w-5 h-5 accent-primary flex-shrink-0"
                                aria-label={`Add ${a.name}`}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-secondary truncate">
                                  {a.name}
                                </p>
                                {a.description && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {a.description}
                                  </p>
                                )}
                              </div>
                              <span className="text-sm text-muted-foreground whitespace-nowrap">
                                +KES {a.price.toLocaleString()}
                              </span>
                              {s.checked && (
                                <QtyInput
                                  value={s.quantity}
                                  onChange={(q) =>
                                    setState((prev) => ({
                                      ...prev,
                                      [a.id]: { checked: true, quantity: q },
                                    }))
                                  }
                                />
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </section>
                );
              })
            ) : (
              <div className="rounded-2xl bg-background border border-border p-4 text-sm text-muted-foreground">
                No extras configured for this item.
              </div>
            )}
          </div>

          <footer className="border-t border-border p-4 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">This item</span>
              <span className="text-xl font-display text-primary">
                KES {lineTotal.toLocaleString()}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => commit("continue")}
                className="w-full py-3 rounded-full font-bold uppercase tracking-wide text-sm border-2 border-primary text-primary hover:bg-primary/10 transition-colors"
              >
                Continue Ordering
              </button>
              <button
                type="button"
                onClick={() => commit("checkout")}
                className="w-full py-3 rounded-full font-bold uppercase tracking-wide text-sm bg-primary text-primary-foreground hover:bg-secondary transition-colors"
              >
                Proceed to Checkout
              </button>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
