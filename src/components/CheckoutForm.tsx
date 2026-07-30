import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle, Tag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import type { Zone, Promo } from "@/lib/database.types";

function sanitize(input: string): string {
  return input.replace(/<[^>]*>/g, "").trim();
}

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
  const { items, totalAmount, clearCart, setIsOpen } = useCart();
  const { user, profile } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [orderType, setOrderType] = useState<"delivery" | "pickup">("delivery");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mpesa">("cash");
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<Promo | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderRef, setOrderRef] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: zones } = useQuery({
    queryKey: ["zones"],
    queryFn: async () => {
      const { data } = await supabase.from("zones").select("*").eq("is_active", true).order("delivery_fee");
      return (data || []) as Zone[];
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

  const selectedZone = zones?.find((z) => z.id === selectedZoneId);
  const deliveryFee = orderType === "delivery" ? (selectedZone?.delivery_fee || 0) : 0;

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
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle size={64} className="text-whatsapp mb-4" />
        <h3 className="text-3xl font-display text-secondary mb-2">Order Placed!</h3>
        <p className="text-muted-foreground mb-1">Your order reference is:</p>
        <p className="text-2xl font-bold text-primary mb-4">
          #{orderRef.slice(0, 8).toUpperCase()}
        </p>
        <p className="text-muted-foreground text-sm mb-6">
          We'll confirm your order shortly. Track it in My Orders.
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
          href={`/sign-in?returnTo=/`}
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
    if (items.length === 0) { setError("Your cart is empty."); return; }

    setSubmitting(true);
    try {
      const itemsSummary = items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unit_price: i.price,
        subtotal: i.price * i.quantity,
      }));

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user!.id,
          customer_name: cleanName,
          customer_phone: formatPhone(cleanPhone),
          order_type: orderType,
          delivery_address: orderType === "delivery" ? cleanAddress : null,
          delivery_notes: orderType === "delivery" ? cleanNotes || null : null,
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

      const orderItems = items.map((i) => ({
        order_id: order.id,
        menu_item_id: i.id,
        item_name: i.name,
        quantity: i.quantity,
        unit_price: i.price,
        subtotal: i.price * i.quantity,
      }));

      await supabase.from("order_items").insert(orderItems);

      if (appliedPromo) {
        await supabase
          .from("promos")
          .update({ times_used: appliedPromo.times_used + 1 })
          .eq("id", appliedPromo.id);
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

      <div className="bg-background rounded-2xl p-4 border border-border space-y-3">
        <h3 className="font-display text-xl text-secondary">Order Summary</h3>
        {items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{item.quantity}x {item.name}</span>
            <span className="font-semibold">KES {(item.price * item.quantity).toLocaleString()}</span>
          </div>
        ))}
        <div className="border-t border-border pt-2 space-y-1">
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

      <div>
        <label className="block text-sm font-semibold text-secondary mb-2">Order Type *</label>
        <div className="grid grid-cols-2 gap-3">
          {(["delivery", "pickup"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setOrderType(type)}
              className={`py-3 rounded-xl font-bold uppercase text-sm border-2 transition-all ${
                orderType === type
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-secondary hover:border-primary"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {orderType === "delivery" && (
        <>
          {zones && zones.length > 0 && (
            <div>
              <label htmlFor="checkout-zone" className="block text-sm font-semibold text-secondary mb-1">Delivery Zone *</label>
              <select
                id="checkout-zone"
                value={selectedZoneId}
                onChange={(e) => setSelectedZoneId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select zone</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} — KES {zone.delivery_fee.toLocaleString()} (~{zone.estimated_time_minutes} min)
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="checkout-address" className="block text-sm font-semibold text-secondary mb-1">Delivery Address *</label>
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
            <label htmlFor="checkout-notes" className="block text-sm font-semibold text-secondary mb-1">Delivery Notes (optional)</label>
            <textarea
              id="checkout-notes"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="e.g. Blue gate, 2nd floor"
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
        </>
      )}

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
              {method === "cash" ? "Cash on Delivery" : "M-Pesa"}
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
        {submitting ? "Placing order..." : `Place Order — KES ${grandTotal.toLocaleString()}`}
      </button>
    </form>
  );
}
