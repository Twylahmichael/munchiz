import { useEffect, useMemo, useState } from "react";
import { X, ChevronDown, Plus } from "lucide-react";
import type { MenuItem } from "@/lib/database.types";
import { useCart, type CartAddon } from "@/lib/cart";
import { useMenuItemAddonsGrouped, useDrinksAddons } from "@/hooks/use-addons";
import { QuantityStepper } from "./QuantityStepper";

interface AddToCartModalProps {
  item: MenuItem;
  onClose: () => void;
  /** Called when the user clicks "Proceed to Checkout". */
  onCheckout: () => void;
}

const MAIN_QTY_MIN = 1;
const MAIN_QTY_MAX = 20;

export function AddToCartModal({ item, onClose, onCheckout }: AddToCartModalProps) {
  const { addItem } = useCart();
  const { data: groups, isLoading } = useMenuItemAddonsGrouped(item.id);
  const { data: drinksList } = useDrinksAddons();

  // Main item quantity (how many of this menu item to add).
  const [mainQty, setMainQty] = useState(1);

  // Combos with two selectable variants (e.g. "burger" OR "nuggets") — only
  // one may be picked at a time. Defaults to the first option.
  const comboOptions = item.combo_options ?? [];
  const hasComboOptions = comboOptions.length === 2;
  const [selectedOptionIdx, setSelectedOptionIdx] = useState(0);

  // Drinks included free with the combo (0 = no picker). Each slot defaults
  // to the first available drink so the selection is always valid.
  const drinkCount = item.drink_choice_count ?? 0;
  const [selectedDrinkIds, setSelectedDrinkIds] = useState<string[]>([]);

  useEffect(() => {
    if (drinkCount <= 0 || drinksList.length === 0) return;
    setSelectedDrinkIds((prev) => {
      const next = prev.slice(0, drinkCount);
      while (next.length < drinkCount) next.push(drinksList[0].id);
      return next;
    });
  }, [drinkCount, drinksList]);

  // Track per-addon-id { checked, quantity }. quantity 0 (or checked=false)
  // means the add-on is not selected.
  const [state, setState] = useState<Record<string, { checked: boolean; quantity: number }>>({});

  // Which add-on groups are collapsed, keyed by category id. Independent
  // per group — collapsing one never affects another. Selections inside a
  // group persist even while it's collapsed since this only controls
  // visibility, not the `state` map above.
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  function toggleGroup(categoryId: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  }

  function setAddonQuantity(addonId: string, quantity: number) {
    setState((prev) => {
      if (quantity <= 0) {
        return { ...prev, [addonId]: { checked: false, quantity: 0 } };
      }
      return { ...prev, [addonId]: { checked: true, quantity } };
    });
  }

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
  const lineTotal = item.price * mainQty + addonsSubtotal;

  function commit(nextAction: "continue" | "checkout") {
    // Combo option + included drink choices ride along as $0 add-ons so the
    // kitchen, cart, and order summary all see them via the same pipeline
    // that already renders add-ons — without changing the combo's fixed price.
    const comboExtras: CartAddon[] = [];
    if (hasComboOptions) {
      const opt = comboOptions[selectedOptionIdx];
      comboExtras.push({
        id: `combo-option-${item.id}-${selectedOptionIdx}`,
        name: `${opt.label}: ${opt.items.join(", ")}`,
        price: 0,
        quantity: 1,
        category: "Combo Option",
      });
    }
    selectedDrinkIds.forEach((drinkId, i) => {
      const drink = drinksList.find((d) => d.id === drinkId);
      if (!drink) return;
      comboExtras.push({
        id: `combo-drink-${item.id}-${i}-${drink.id}`,
        name: drink.name,
        price: 0,
        quantity: 1,
        category: "Drink Choice",
      });
    });

    addItem(item, [...pickedAddons, ...comboExtras], mainQty);
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
            {item.description && !hasComboOptions && (
              <p className="text-sm text-muted-foreground">{item.description}</p>
            )}

            <div className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3">
              <span className="text-sm font-semibold text-secondary">Quantity</span>
              <QuantityStepper
                value={mainQty}
                onChange={setMainQty}
                min={MAIN_QTY_MIN}
                max={MAIN_QTY_MAX}
                ariaLabel={`${item.name} quantity`}
              />
            </div>

            {hasComboOptions && (
              <div>
                <p className="text-sm font-semibold text-secondary mb-2">Choose your combo *</p>
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                  role="radiogroup"
                  aria-label="Combo option"
                >
                  {comboOptions.map((opt, i) => {
                    const selected = selectedOptionIdx === i;
                    return (
                      <button
                        key={i}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setSelectedOptionIdx(i)}
                        className={`text-left rounded-2xl border-2 p-4 transition-all ${
                          selected
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-border bg-background hover:border-primary/40"
                        }`}
                      >
                        <p
                          className={`text-xs font-bold uppercase tracking-wide mb-2 ${selected ? "text-primary" : "text-secondary"}`}
                        >
                          {opt.label}
                        </p>
                        <ul className="space-y-1">
                          {opt.items.map((line, j) => (
                            <li key={j} className="text-sm text-muted-foreground leading-snug">
                              • {line}
                            </li>
                          ))}
                        </ul>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {drinkCount > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-secondary">
                  {drinkCount > 1 ? `Choose your ${drinkCount} drinks *` : "Choose your drink *"}
                </p>
                {drinksList.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No drinks configured yet.</p>
                ) : (
                  Array.from({ length: drinkCount }).map((_, i) => (
                    <select
                      key={i}
                      value={selectedDrinkIds[i] || ""}
                      onChange={(e) =>
                        setSelectedDrinkIds((prev) => {
                          const next = [...prev];
                          next[i] = e.target.value;
                          return next;
                        })
                      }
                      aria-label={drinkCount > 1 ? `Drink ${i + 1}` : "Drink"}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {drinksList.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  ))
                )}
                <p className="text-xs text-muted-foreground">
                  Included with this combo — no extra charge.
                </p>
              </div>
            )}

            {isLoading ? (
              <div className="py-6 text-center text-muted-foreground text-sm">Loading options…</div>
            ) : hasAddons ? (
              groups.map((g) => {
                const isCollapsed = collapsedGroups.has(g.category.id);
                return (
                  <section
                    key={g.category.id}
                    className="border border-border rounded-2xl overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => toggleGroup(g.category.id)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-background hover:bg-muted transition-colors text-left"
                      aria-expanded={!isCollapsed}
                    >
                      <span className="font-semibold text-secondary">{g.category.name}</span>
                      <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-primary">
                        {isCollapsed ? "Show" : "Hide"}
                        <ChevronDown
                          size={14}
                          className={`transition-transform ${isCollapsed ? "" : "rotate-180"}`}
                        />
                      </span>
                    </button>
                    {!isCollapsed && (
                      <ul className="divide-y divide-border">
                        {g.addons.map((a) => {
                          const s = state[a.id] ?? { checked: false, quantity: 0 };
                          const selected = s.checked && s.quantity > 0;
                          return (
                            <li key={a.id} className="flex items-center gap-3 px-4 py-3 bg-card">
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
                              {selected && s.quantity > 1 ? (
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                  {s.quantity}× KES {a.price.toLocaleString()} ={" "}
                                  <span className="font-semibold text-secondary">
                                    KES {(a.price * s.quantity).toLocaleString()}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                  +KES {a.price.toLocaleString()}
                                </span>
                              )}
                              {selected ? (
                                <QuantityStepper
                                  value={s.quantity}
                                  onChange={(q) => setAddonQuantity(a.id, q)}
                                  min={0}
                                  max={99}
                                  ariaLabel={`${a.name} quantity`}
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setAddonQuantity(a.id, 1)}
                                  className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors flex-shrink-0"
                                  aria-label={`Add ${a.name}`}
                                >
                                  <Plus size={14} />
                                </button>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </section>
                );
              })
            ) : !hasComboOptions && drinkCount === 0 ? (
              <div className="rounded-2xl bg-background border border-border p-4 text-sm text-muted-foreground">
                No extras configured for this item.
              </div>
            ) : null}
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
