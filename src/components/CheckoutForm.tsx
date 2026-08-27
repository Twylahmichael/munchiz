import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle, Tag, Truck, Store, MapPin, Clock, Phone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useCart, itemAddonsSubtotal } from "@/lib/cart";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import type { Zone, Branch, Promo } from "@/lib/database.types";
import { sanitize } from "@/lib/sanitize";

function isValidKenyanPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s-]/g, "");
  return /^(?:0[17]\d{8}|\+?254[17]\d{8})$/.test(cleaned);
}

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/[\s-]/g, "");
  if (cleaned.startsWith("+254")) return cleaned.slice(1);
  if (cleaned.startsWith("254")) return cleaned;
  if (cleaned.startsWith("0")) return "254" + cleaned.slice(1);
  return cleaned;
}

export function CheckoutForm({ onBack }: { onBack: () => void }) {
  const { items, totalAmount, addonsTotal, clearCart, setIsOpen } = useCart();
  const { user, profile } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [orderType, setOrderType] = useState<"delivery" | "pickup">("delivery");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState<string>("");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mpesa">("cash");
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<Promo | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderRef, setOrderRef] = useState<string | null>(null);
  const [mpesaPromptSent, setMpesaPromptSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: zones } = useQuery({
    queryKey: ["zones"],
    queryFn: async () => {
      const { data } = await supabase.from("zones").select("*").eq("is_active", true).order("delivery_fee");
      return (data || []) as Zone[];
    },
  });

  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const { data } = await supabase.from("branches").select("*").eq("is_active", true).order("name");
      return (data || []) as Branch[];
    },
  });

  useEffect(() => {
    if (profile) {
      if (!name) setName(profile.full_name || "");
      if (!phone) setPhone(profile.phone || "");
      if (!deliveryAddress) setDeliveryAddress(profile.default_delivery_address || "");
      if (!deliveryNotes) setDeliveryNotes(profile.delivery_notes || "");
    }
  }, [profile]);

  // Auto-select first branch if only one exists
  useEffect(() => {
    if (branches && branches.length === 1 && !selectedBranchId) {
      setSelectedBranchId(branches[0].id);
    }
  }, [branches, selectedBranchId]);

  const selectedZone = zones?.find((z) => z.id === selectedZoneId);
  const selectedBranch = branches?.find((b) => b.id === selectedBranchId);
  const deliveryFee = orderType === "delivery" ? (selectedZone?.delivery_fee || 0) : 0;
  const estimatedTime = orderType === "delivery"
    ? selectedZone?.estimated_time_minutes
    : selectedBranch?.estimated_pickup_minutes;

  let discount = 0;
  if (appliedPromo) {
    if (appliedPromo.discount_type === "percentage") {
      discount = Math.round((totalAmount * appliedPromo.discount_value) / 100);
    } else {
      discount = appliedPromo.discount_value;
    }
  }

  const grandTotal = totalAmount + deliveryFee - discount;

  async function applyPromo() {
    setPromoError(null);
    setAppliedPromo(null);
    const code = sanitize(promoCode).toUpperCase();
    if (!code) return;

    const { data, error: fetchError } = await supabase
      .from("promos")
      .select("*")
      .eq("code", code)
      .eq("is_active", true)
      .lte("start_date", new Date().toISOString())
      .gte("end_date", new Date().toISOString())
      .single();

    if (fetchError || !data) {
      setPromoError("Invalid or expired promo code.");
      return;
    }
    if (data.max_uses && data.times_used >= data.max_uses) {
      setPromoError("This promo code has been fully used.");
      return;
    }
    if (totalAmount < data.min_order_amount) {
      setPromoError(`Minimum order KES ${data.min_order_amount.toLocaleString()} required.`);
      return;
    }
    setAppliedPromo(data as Promo);
  }

  if (orderRef) {
    const smsPhone = phone ? formatPhone(sanitize(phone)) : "";
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle size={64} className="text-whatsapp mb-4" />
        <h3 className="text-3xl font-display text-secondary mb-2">Order Placed!</h3>
        <p className="text-muted-foreground mb-1">Your order reference is:</p>
        <p className="text-2xl font-bold text-primary mb-4">
          #{orderRef.slice(0, 8).toUpperCase()}
        </p>

        {/* Order type confirmation */}
        <div className="bg-muted/50 rounded-2xl p-4 mb-4 text-sm w-full max-w-xs">
          {orderType === "pickup" ? (
            <div className="flex items-start gap-3 text-left">
              <Store size={20} className="text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-secondary">Pickup Order</p>
                {selectedBranch && (
                  <>
                    <p className="text-muted-foreground">{selectedBranch.name}</p>
                    <p className="text-muted-foreground text-xs">{selectedBranch.address}</p>
                    {estimatedTime && (
                      <p className="text-primary text-xs mt-1 font-medium">
                        Ready in ~{estimatedTime} min
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 text-left">
              <Truck size={20} className="text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-secondary">Delivery Order</p>
                {selectedZone && (
                  <p className="text-muted-foreground">{selectedZone.name} zone</p>
                )}
                {estimatedTime && (
                  <p className="text-primary text-xs mt-1 font-medium">
                    Arriving in ~{estimatedTime} min
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {paymentMethod === "mpesa" && mpesaPromptSent && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 mb-4 text-sm text-green-700">
            <p className="font-semibold mb-1">📱 M-Pesa prompt sent</p>
            <p>
              Check <span className="font-semibold">{smsPhone || "your phone"}</span> for the Safaricom PIN
              prompt and enter your M-Pesa PIN to pay KES {grandTotal.toLocaleString()}.
            </p>
          </div>
        )}
        <p className="text-muted-foreground text-sm mb-6">
          {smsPhone
            ? <>A confirmation SMS is on its way to <span className="font-semibold text-secondary">{smsPhone}</span>. Track your order in My Orders.</>
            : <>We'll confirm your order shortly. Track it in My Orders.</>}
        </p>
        <button
          onClick={() => { clearCart(); setIsOpen(false); }}
          className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-bold uppercase tracking-wide hover:bg-secondary transition-colors"
        >
          Done
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h3 className="text-2xl font-display text-secondary mb-4">Sign in to checkout</h3>
        <p className="text-muted-foreground text-sm mb-6">
          Create an account or sign in to place your order.
        </p>

        <a
          href={"/sign-in?returnTo=/"}
          className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-bold uppercase tracking-wide hover:bg-secondary transition-colors"
        >
          Sign In
        </a>
        <button
          onClick={onBack}
          className="mt-3 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          Back to cart
        </button>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanName = sanitize(name);
    const cleanPhone = sanitize(phone);
    const cleanAddress = sanitize(deliveryAddress);
    const cleanNotes = sanitize(deliveryNotes);

    if (!cleanName) { setError("Please enter your name."); return; }
    if (!isValidKenyanPhone(cleanPhone)) {
      setError("Please enter a valid Kenyan phone number (07xx or 01xx).");
      return;
    }
    if (orderType === "delivery" && !cleanAddress) {
      setError("Please enter your delivery address.");
      return;
    }
    if (orderType === "delivery" && zones && zones.length > 0 && !selectedZoneId) {
      setError("Please select your delivery zone.");
      return;
    }
    if (orderType === "pickup" && branches && branches.length > 1 && !selectedBranchId) {
      setError("Please select a pickup location.");
      return;
    }
    if (items.length === 0) { setError("Your cart is empty."); return; }

    setSubmitting(true);
    try {
      const itemsSummary = items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unit_price: i.price,
        subtotal: i.price * i.quantity,
        addons: i.addons.map((a) => ({
          id: a.id,
          name: a.name,
          category: a.category ?? null,
          quantity: a.quantity,
          unit_price: a.price,
          subtotal: a.price * a.quantity,
        })),
        addons_subtotal: itemAddonsSubtotal(i),
      }));

      const pickupBranch = orderType === "pickup" ? (selectedBranch || branches?.[0]) : null;

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user!.id,
          customer_name: cleanName,
          customer_phone: formatPhone(cleanPhone),
          order_type: orderType,
          delivery_address: orderType === "delivery" ? cleanAddress : null,
          delivery_notes: orderType === "delivery" ? cleanNotes || null : null,
          pickup_branch_id: pickupBranch?.id || null,
          pickup_branch_name: pickupBranch?.name || null,
          zone_id: orderType === "delivery" ? selectedZone?.id || null : null,
          zone_name: orderType === "delivery" ? selectedZone?.name || null : null,
          estimated_time_minutes: estimatedTime || null,
          items_summary: itemsSummary,
          subtotal: totalAmount,
          delivery_fee: deliveryFee,
          total_amount: grandTotal,
          payment_method: paymentMethod,
          payment_status: "pending",
          status: "pending",
        })
        .select("id")
        .single();

      if (orderError) throw orderError;

      const orderItems = items.flatMap((i) => {
        const mealRow = {
          order_id: order.id,
          menu_item_id: i.id,
          item_name: i.name,
          quantity: i.quantity,
          unit_price: i.price,
          subtotal: i.price * i.quantity,
        };
        const addonRows = i.addons.map((a) => ({
          order_id: order.id,
          menu_item_id: i.id,
          item_name: `${a.name} (with ${i.name})`,
          quantity: a.quantity,
          unit_price: a.price,
          subtotal: a.price * a.quantity,
        }));
        return [mealRow, ...addonRows];
      });

      await supabase.from("order_items").insert(orderItems);

      if (appliedPromo) {
        await supabase
          .from("promos")
          .update({ times_used: appliedPromo.times_used + 1 })
          .eq("id", appliedPromo.id);
      }

      try {
        await supabase.functions.invoke("send-order-sms", {
          body: {
            order_id: order.id,
            customer_name: cleanName,
            customer_phone: formatPhone(cleanPhone),
            order_type: orderType,
            pickup_branch: pickupBranch?.name || null,
            items: itemsSummary,
            total_amount: grandTotal,
          },
        });
      } catch (smsErr) {
        console.warn("Order confirmation SMS failed:", smsErr);
      }

      if (paymentMethod === "mpesa") {
        try {
          const { data: stkData, error: stkError } = await supabase.functions.invoke(
            "initiate-mpesa-stk-push",
            {
              body: {
                order_id: order.id,
                phone: formatPhone(cleanPhone),
                amount: grandTotal,
              },
            }
          );
          if (stkError) throw stkError;
          if (stkData?.ok) setMpesaPromptSent(true);
        } catch (mpesaErr) {
          console.warn("M-Pesa STK push failed:", mpesaErr);
        }
      }

      setOrderRef(order.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-muted-foreground hover:text-secondary text-sm mb-2 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to cart
      </button>

      {/* Order Summary */}
      <div className="bg-background rounded-2xl p-4 border border-border space-y-3">
        <h3 className="font-display text-xl text-secondary">Order Summary</h3>
        {items.map((item) => (
          <div key={item.id} className="text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{item.quantity}x {item.name}</span>
              <span className="font-semibold">KES {(item.price * item.quantity).toLocaleString()}</span>
            </div>
            {item.addons.map((a) => (
              <div key={a.id} className="flex justify-between text-xs text-muted-foreground pl-4">
                <span>+ {a.quantity}× {a.name}</span>
                <span>KES {(a.price * a.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
        ))}
        <div className="border-t border-border pt-2 space-y-1">
          {addonsTotal > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Add-ons</span>
              <span>KES {addonsTotal.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>KES {totalAmount.toLocaleString()}</span>
          </div>
          {deliveryFee > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery ({selectedZone?.name})</span>
              <span>KES {deliveryFee.toLocaleString()}</span>
            </div>
          )}
          {orderType === "pickup" && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Pickup — no delivery fee</span>
              <span>FREE</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Promo discount</span>
              <span>-KES {discount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-1">
            <span>Total</span>
            <span className="text-primary">KES {grandTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Name */}
      <div>
        <label htmlFor="checkout-name" className="block text-sm font-semibold text-secondary mb-1">Your Name *</label>
        <input
          id="checkout-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. John Kamau"
          className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="checkout-phone" className="block text-sm font-semibold text-secondary mb-1">Phone Number *</label>
        <input
          id="checkout-phone"
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0728 466 665"
          className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* ── Order Type: Delivery or Pickup ── */}
      <div>
        <label className="block text-sm font-semibold text-secondary mb-2">How do you want your order? *</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setOrderType("delivery")}
            className={`relative py-4 px-3 rounded-2xl border-2 transition-all text-left ${
              orderType === "delivery"
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border bg-background hover:border-primary/40"
            }`}
          >
            <div className="flex flex-col items-center text-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                orderType === "delivery" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                <Truck size={20} />
              </div>
              <span className={`font-bold text-sm uppercase ${
                orderType === "delivery" ? "text-primary" : "text-secondary"
              }`}>
                Delivery
              </span>
              <span className="text-[11px] text-muted-foreground leading-tight">
                We bring it to your door
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setOrderType("pickup")}
            className={`relative py-4 px-3 rounded-2xl border-2 transition-all text-left ${
              orderType === "pickup"
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border bg-background hover:border-primary/40"
            }`}
          >
            <div className="flex flex-col items-center text-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                orderType === "pickup" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                <Store size={20} />
              </div>
              <span className={`font-bold text-sm uppercase ${
                orderType === "pickup" ? "text-primary" : "text-secondary"
              }`}>
                Pickup
              </span>
              <span className="text-[11px] text-muted-foreground leading-tight">
                Collect from our branch
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* ── Delivery Details ── */}
      {orderType === "delivery" && (
        <div className="space-y-4 bg-primary/[0.03] rounded-2xl p-4 border border-primary/10">
          <div className="flex items-center gap-2 text-primary">
            <Truck size={16} />
            <span className="text-sm font-semibold">Delivery Details</span>
          </div>

          {zones && zones.length > 0 && (
            <div>
              <label htmlFor="checkout-zone" className="block text-sm font-semibold text-secondary mb-1">
                Delivery Zone *
              </label>
              <select
                id="checkout-zone"
                value={selectedZoneId}
                onChange={(e) => setSelectedZoneId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select your area</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} — KES {zone.delivery_fee.toLocaleString()} (~{zone.estimated_time_minutes} min)
                  </option>
                ))}
              </select>

              {/* Show zone areas/neighborhoods when selected */}
              {selectedZone && selectedZone.areas && selectedZone.areas.length > 0 && (
                <div className="mt-2 px-3 py-2 bg-muted/50 rounded-xl">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Areas covered:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedZone.areas.map((area, i) => (
                      <span
                        key={i}
                        className="inline-block bg-background text-secondary text-[11px] px-2 py-0.5 rounded-full border border-border"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedZone?.description && (
                <p className="text-xs text-muted-foreground mt-1 px-1">{selectedZone.description}</p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="checkout-address" className="block text-sm font-semibold text-secondary mb-1">
              Delivery Address *
            </label>
            <input
              id="checkout-address"
              type="text"
              required
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="e.g. Kamulu Phase 5, near the petrol station"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="checkout-notes" className="block text-sm font-semibold text-secondary mb-1">
              Delivery Notes (optional)
            </label>
            <textarea
              id="checkout-notes"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="e.g. Blue gate, 2nd floor"
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {selectedZone && (
            <div className="flex items-center gap-2 text-sm text-primary">
              <Clock size={14} />
              <span>Estimated delivery: ~{selectedZone.estimated_time_minutes} minutes</span>
            </div>
          )}
        </div>
      )}

      {/* ── Pickup Details ── */}
      {orderType === "pickup" && (
        <div className="space-y-4 bg-primary/[0.03] rounded-2xl p-4 border border-primary/10">
          <div className="flex items-center gap-2 text-primary">
            <Store size={16} />
            <span className="text-sm font-semibold">Pickup Details</span>
          </div>

          {branches && branches.length > 1 ? (
            <div>
              <label htmlFor="checkout-branch" className="block text-sm font-semibold text-secondary mb-1">
                Pickup Location *
              </label>
              <select
                id="checkout-branch"
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select pickup branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} — {branch.address}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {/* Show selected branch details */}
          {selectedBranch ? (
            <div className="bg-background rounded-xl p-4 border border-border space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin size={16} className="text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-secondary text-sm">{selectedBranch.name}</p>
                  <p className="text-muted-foreground text-xs">{selectedBranch.address}</p>
                </div>
              </div>
              {selectedBranch.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone size={16} className="text-primary" />
                  </div>
                  <a href={`tel:${selectedBranch.phone}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {selectedBranch.phone}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock size={16} className="text-primary" />
                </div>
                <p className="text-sm text-primary font-medium">
                  Ready in ~{selectedBranch.estimated_pickup_minutes || 15} minutes
                </p>
              </div>
            </div>
          ) : branches && branches.length === 0 ? (
            <div className="bg-background rounded-xl p-4 border border-border">
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-secondary text-sm">Munchiz — Kanisani Road</p>
                  <p className="text-muted-foreground text-xs">Nairobi 63665, Kenya</p>
                  <p className="text-primary text-xs mt-1 font-medium">Ready in ~15 minutes</p>
                </div>
              </div>
            </div>
          ) : null}

          <p className="text-xs text-muted-foreground">
            💡 Save on delivery fees — your order will be ready for collection!
          </p>
        </div>
      )}

      {/* Promo Code */}
      <div>
        <label className="block text-sm font-semibold text-secondary mb-1">Promo Code</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={promoCode}
            onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(null); setAppliedPromo(null); }}
            placeholder="Enter code"
            className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            onClick={applyPromo}
            className="px-4 py-3 rounded-xl bg-secondary text-primary-foreground font-bold text-sm hover:bg-primary transition-colors flex items-center gap-1"
          >
            <Tag size={14} />
            Apply
          </button>
        </div>
        {promoError && <p className="text-destructive text-xs mt-1">{promoError}</p>}
        {appliedPromo && (
          <p className="text-green-600 text-xs mt-1">
            {appliedPromo.discount_type === "percentage"
              ? `${appliedPromo.discount_value}% off applied!`
              : `KES ${appliedPromo.discount_value.toLocaleString()} off applied!`}
          </p>
        )}
      </div>

      {/* Payment Method */}
      <div>
        <label className="block text-sm font-semibold text-secondary mb-2">Payment Method *</label>
        <div className="grid grid-cols-2 gap-3">
          {(["cash", "mpesa"] as const).map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setPaymentMethod(method)}
              className={`py-3 rounded-xl font-bold uppercase text-sm border-2 transition-all ${
                paymentMethod === method
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-secondary hover:border-primary"
              }`}
            >
              {method === "cash"
                ? orderType === "delivery" ? "Cash on Delivery" : "Cash on Pickup"
                : "M-Pesa"}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-xl">{error}</div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-primary text-primary-foreground py-4 rounded-full font-bold uppercase tracking-wide text-base hover:scale-[1.02] transition-transform shadow-card-warm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting
          ? "Placing order..."
          : `Place ${orderType === "pickup" ? "Pickup" : "Delivery"} Order — KES ${grandTotal.toLocaleString()}`}
      </button>
    </form>
  );
}
