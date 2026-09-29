// Run with: deno test supabase/functions/_shared/__tests__/pricing.test.ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { priceLine, calculateTotals } from "../pricing.ts";

const BURGER = { id: "1", name: "Cheesy Chicken Burger", price: 350, is_available: true };

Deno.test("priceLine - quantity x database price, never customer-supplied price", () => {
  const line = priceLine(BURGER, 2);
  assertEquals(line, {
    menu_item_id: "1",
    item_name: "Cheesy Chicken Burger",
    quantity: 2,
    unit_price: 350,
    subtotal: 700,
  });
});

Deno.test("priceLine - floors fractional/rounds down and floors below 1", () => {
  assertEquals(priceLine(BURGER, 0).quantity, 1);
  assertEquals(priceLine(BURGER, -5).quantity, 1);
  assertEquals(priceLine(BURGER, 2.9).quantity, 2);
});

Deno.test("calculateTotals - subtotal + delivery fee", () => {
  const lines = [priceLine(BURGER, 2), priceLine({ ...BURGER, id: "2", price: 1150 }, 1)];
  const totals = calculateTotals(lines, 150);
  assertEquals(totals, { subtotal: 1850, delivery_fee: 150, total_amount: 2000 });
});

Deno.test("calculateTotals - pickup has no delivery fee", () => {
  const lines = [priceLine(BURGER, 1)];
  const totals = calculateTotals(lines, 0);
  assertEquals(totals.total_amount, 350);
});

Deno.test("calculateTotals - negative delivery fee is clamped to zero", () => {
  const totals = calculateTotals([priceLine(BURGER, 1)], -50);
  assertEquals(totals.delivery_fee, 0);
});
