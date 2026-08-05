// Supabase Edge Function — send-order-confirmation
// Sends a full HTML receipt to the customer via Resend.
//
// Setup:
//   1. supabase functions deploy send-order-confirmation
//   2. supabase secrets set RESEND_API_KEY=re_xxx  MUNCHIZ_FROM_EMAIL="Munchiz <orders@yourdomain.com>"
//      (MUNCHIZ_FROM_EMAIL defaults to Resend's shared sandbox address
//       "onboarding@resend.dev" if unset — good for testing only.)
//
// Invoked from the browser via supabase.functions.invoke("send-order-confirmation", { body: OrderPayload }).
// Runs with the caller's Supabase JWT so RLS still protects the orders table.

// deno-lint-ignore-file no-explicit-any
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface DrinkAddOn {
  name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface OrderLine {
  name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  tomato_sachets?: number;
  tomato_subtotal?: number;
  drink_add_ons?: DrinkAddOn[];
  drinks_subtotal?: number;
}

interface OrderPayload {
  order_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  order_type: "delivery" | "pickup";
  delivery_address?: string | null;
  delivery_notes?: string | null;
  payment_method: string;
  items: OrderLine[];
  subtotal: number;
  tomato_total: number;
  drinks_total: number;
  delivery_fee: number;
  discount: number;
  total_amount: number;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function money(n: number): string {
  return `KES ${Number(n || 0).toLocaleString()}`;
}

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderReceipt(p: OrderPayload): { html: string; text: string } {
  const ref = p.order_id.slice(0, 8).toUpperCase();

  const linesHtml = p.items.map((i) => {
    const addOnRows: string[] = [];
    if ((i.tomato_sachets || 0) > 0) {
      addOnRows.push(
        `<tr><td style="padding:2px 0 2px 24px;color:#666;font-size:12px;">+ 🍅 ${i.tomato_sachets} tomato sachet${i.tomato_sachets === 1 ? "" : "s"}</td>` +
        `<td style="padding:2px 0;color:#666;font-size:12px;text-align:right;">${escapeHtml(money(i.tomato_subtotal || 0))}</td></tr>`
      );
    }
    (i.drink_add_ons || []).forEach((d) => {
      addOnRows.push(
        `<tr><td style="padding:2px 0 2px 24px;color:#666;font-size:12px;">+ 🥤 ${d.quantity}× ${escapeHtml(d.name)}</td>` +
        `<td style="padding:2px 0;color:#666;font-size:12px;text-align:right;">${escapeHtml(money(d.subtotal))}</td></tr>`
      );
    });
    return `
      <tr>
        <td style="padding:8px 0;border-top:1px solid #eee;">${i.quantity}× ${escapeHtml(i.name)}</td>
        <td style="padding:8px 0;border-top:1px solid #eee;text-align:right;">${escapeHtml(money(i.subtotal))}</td>
      </tr>
      ${addOnRows.join("")}
    `;
  }).join("");

  const feeRow = p.delivery_fee > 0
    ? `<tr><td style="padding:4px 0;color:#666;">Delivery fee</td><td style="padding:4px 0;text-align:right;color:#666;">${escapeHtml(money(p.delivery_fee))}</td></tr>`
    : "";
  const discountRow = p.discount > 0
    ? `<tr><td style="padding:4px 0;color:#16a34a;">Promo discount</td><td style="padding:4px 0;text-align:right;color:#16a34a;">-${escapeHtml(money(p.discount))}</td></tr>`
    : "";
  const tomatoRow = p.tomato_total > 0
    ? `<tr><td style="padding:4px 0;color:#666;">🍅 Tomato sachets</td><td style="padding:4px 0;text-align:right;color:#666;">${escapeHtml(money(p.tomato_total))}</td></tr>`
    : "";
  const drinksRow = p.drinks_total > 0
    ? `<tr><td style="padding:4px 0;color:#666;">🥤 Drink add-ons</td><td style="padding:4px 0;text-align:right;color:#666;">${escapeHtml(money(p.drinks_total))}</td></tr>`
    : "";

  const addressBlock = p.order_type === "delivery"
    ? `<p style="margin:4px 0;"><strong>Address:</strong> ${escapeHtml(p.delivery_address || "")}</p>${p.delivery_notes ? `<p style="margin:4px 0;color:#666;font-size:13px;"><strong>Notes:</strong> ${escapeHtml(p.delivery_notes)}</p>` : ""}`
    : `<p style="margin:4px 0;"><strong>Pickup:</strong> Kanisani Road, Nairobi — open 9am–9pm.</p>`;

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#faf7f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1714;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
      <div style="background:#c1121f;color:#fff;padding:24px;">
        <h1 style="margin:0;font-size:28px;">Munchiz 🍔</h1>
        <p style="margin:6px 0 0;opacity:0.9;">Bites of happiness</p>
      </div>
      <div style="padding:24px;">
        <h2 style="margin:0 0 4px;font-size:22px;">Thanks, ${escapeHtml(p.customer_name)}!</h2>
        <p style="margin:0 0 20px;color:#666;">Your order has been received.</p>

        <div style="background:#faf7f2;border-radius:12px;padding:16px;margin-bottom:20px;">
          <p style="margin:0;font-size:13px;color:#666;">Order reference</p>
          <p style="margin:2px 0 12px;font-size:22px;font-weight:700;color:#c1121f;letter-spacing:0.05em;">#${ref}</p>
          <p style="margin:4px 0;"><strong>Order type:</strong> ${p.order_type === "delivery" ? "Delivery" : "Pickup"}</p>
          <p style="margin:4px 0;"><strong>Payment:</strong> ${escapeHtml(p.payment_method === "mpesa" ? "M-Pesa" : "Cash on Delivery")}</p>
          <p style="margin:4px 0;"><strong>Phone:</strong> ${escapeHtml(p.customer_phone)}</p>
          ${addressBlock}
        </div>

        <h3 style="margin:0 0 8px;font-size:16px;">Your order</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          ${linesHtml}
        </table>

        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:16px;border-top:2px solid #1a1714;padding-top:8px;">
          <tr><td style="padding:8px 0 4px;color:#666;">Subtotal</td><td style="padding:8px 0 4px;text-align:right;color:#666;">${escapeHtml(money(p.subtotal))}</td></tr>
          ${tomatoRow}
          ${drinksRow}
          ${feeRow}
          ${discountRow}
          <tr><td style="padding:10px 0;border-top:1px solid #eee;font-size:18px;font-weight:700;">Total paid</td><td style="padding:10px 0;border-top:1px solid #eee;text-align:right;font-size:18px;font-weight:700;color:#c1121f;">${escapeHtml(money(p.total_amount))}</td></tr>
        </table>

        <p style="margin:24px 0 4px;color:#666;font-size:13px;">Questions? Call us on 0728 466 665.</p>
        <p style="margin:0;color:#999;font-size:12px;">Munchiz · Kanisani Road, Nairobi · Open 9am–9pm daily.</p>
      </div>
    </div>
  </body>
</html>`;

  const textLines: string[] = [];
  textLines.push(`Munchiz — order #${ref}`);
  textLines.push(`Thanks, ${p.customer_name}! Your order has been received.`);
  textLines.push("");
  textLines.push(`Order type : ${p.order_type}`);
  textLines.push(`Payment    : ${p.payment_method}`);
  textLines.push(`Phone      : ${p.customer_phone}`);
  if (p.order_type === "delivery") {
    textLines.push(`Address    : ${p.delivery_address || ""}`);
    if (p.delivery_notes) textLines.push(`Notes      : ${p.delivery_notes}`);
  }
  textLines.push("");
  textLines.push("Items:");
  p.items.forEach((i) => {
    textLines.push(`  ${i.quantity}x ${i.name}  —  ${money(i.subtotal)}`);
    if ((i.tomato_sachets || 0) > 0) {
      textLines.push(`    + ${i.tomato_sachets} tomato sachet(s)  —  ${money(i.tomato_subtotal || 0)}`);
    }
    (i.drink_add_ons || []).forEach((d) => {
      textLines.push(`    + ${d.quantity}x ${d.name}  —  ${money(d.subtotal)}`);
    });
  });
  textLines.push("");
  textLines.push(`Subtotal      : ${money(p.subtotal)}`);
  if (p.tomato_total > 0) textLines.push(`Tomato sachets: ${money(p.tomato_total)}`);
  if (p.drinks_total > 0) textLines.push(`Drink add-ons : ${money(p.drinks_total)}`);
  if (p.delivery_fee > 0) textLines.push(`Delivery fee  : ${money(p.delivery_fee)}`);
  if (p.discount > 0) textLines.push(`Discount      : -${money(p.discount)}`);
  textLines.push(`TOTAL         : ${money(p.total_amount)}`);
  textLines.push("");
  textLines.push("Munchiz · Kanisani Road, Nairobi · Open 9am–9pm daily · 0728 466 665");

  return { html, text: textLines.join("\n") };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY is not configured" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const from = Deno.env.get("MUNCHIZ_FROM_EMAIL") || "Munchiz <onboarding@resend.dev>";

  let payload: OrderPayload;
  try {
    payload = await req.json() as OrderPayload;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  if (!payload?.customer_email || !payload?.order_id) {
    return new Response(JSON.stringify({ error: "customer_email and order_id are required" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const { html, text } = renderReceipt(payload);
  const ref = payload.order_id.slice(0, 8).toUpperCase();

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [payload.customer_email],
      subject: `Munchiz order confirmed — #${ref}`,
      html,
      text,
    }),
  });

  const body = await resp.json().catch(() => ({} as any));
  if (!resp.ok) {
    return new Response(JSON.stringify({ error: "Resend rejected the request", details: body }), {
      status: 502,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, resend_id: body?.id ?? null }), {
    status: 200,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
});
