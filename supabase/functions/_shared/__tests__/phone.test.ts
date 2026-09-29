// Run with: deno test supabase/functions/_shared/__tests__/phone.test.ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { normalizeKenyanPhone, toE164, isValidKenyanPhone } from "../phone.ts";

Deno.test("normalizeKenyanPhone - 07... local format", () => {
  assertEquals(normalizeKenyanPhone("0712345678"), "254712345678");
});

Deno.test("normalizeKenyanPhone - 01... local format", () => {
  assertEquals(normalizeKenyanPhone("0112345678"), "254112345678");
});

Deno.test("normalizeKenyanPhone - +254... E.164", () => {
  assertEquals(normalizeKenyanPhone("+254712345678"), "254712345678");
});

Deno.test("normalizeKenyanPhone - bare 254...", () => {
  assertEquals(normalizeKenyanPhone("254712345678"), "254712345678");
});

Deno.test("normalizeKenyanPhone - 00254... international prefix", () => {
  assertEquals(normalizeKenyanPhone("00254712345678"), "254712345678");
});

Deno.test("normalizeKenyanPhone - bare 9-digit MSISDN", () => {
  assertEquals(normalizeKenyanPhone("712345678"), "254712345678");
});

Deno.test("normalizeKenyanPhone - does not double-prefix 254", () => {
  assertEquals(normalizeKenyanPhone("+254712345678"), "254712345678");
  assertEquals(normalizeKenyanPhone("254712345678")?.startsWith("254254"), false);
});

Deno.test("normalizeKenyanPhone - tolerates spaces and dashes", () => {
  assertEquals(normalizeKenyanPhone("0712 345 678"), "254712345678");
  assertEquals(normalizeKenyanPhone("+254-712-345-678"), "254712345678");
});

Deno.test("normalizeKenyanPhone - rejects invalid numbers", () => {
  assertEquals(normalizeKenyanPhone("12345"), null);
  assertEquals(normalizeKenyanPhone("0212345678"), null); // landline-shaped, not 07/01
  assertEquals(normalizeKenyanPhone("2547123456789"), null); // too long
  assertEquals(normalizeKenyanPhone(""), null);
  assertEquals(normalizeKenyanPhone("not a phone"), null);
});

Deno.test("toE164 adds a plus to a valid number", () => {
  assertEquals(toE164("0712345678"), "+254712345678");
});

Deno.test("toE164 returns null for invalid input", () => {
  assertEquals(toE164("abc"), null);
});

Deno.test("isValidKenyanPhone", () => {
  assertEquals(isValidKenyanPhone("0712345678"), true);
  assertEquals(isValidKenyanPhone("0212345678"), false);
});
