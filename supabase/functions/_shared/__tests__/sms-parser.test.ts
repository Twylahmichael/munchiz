// Run with: deno test supabase/functions/_shared/__tests__/sms-parser.test.ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { parseCommand, parseChoiceReply, matchMenuItem } from "../sms-parser.ts";

Deno.test("parseCommand - ORDER single item", () => {
  const cmd = parseCommand("ORDER Burger 2");
  assertEquals(cmd.type, "order");
  if (cmd.type === "order") {
    assertEquals(cmd.result.lines, [{ rawName: "Burger", quantity: 2 }]);
    assertEquals(cmd.result.errors, []);
  }
});

Deno.test("parseCommand - order is case-insensitive", () => {
  const cmd = parseCommand("order Burger 2");
  assertEquals(cmd.type, "order");
});

Deno.test("parseCommand - ORDER multiple items comma separated", () => {
  const cmd = parseCommand("ORDER Cheesy Chicken Burger 2, Chicken Combo 1");
  assertEquals(cmd.type, "order");
  if (cmd.type === "order") {
    assertEquals(cmd.result.lines, [
      { rawName: "Cheesy Chicken Burger", quantity: 2 },
      { rawName: "Chicken Combo", quantity: 1 },
    ]);
  }
});

Deno.test("parseCommand - ORDER tolerates extra whitespace", () => {
  const cmd = parseCommand("ORDER    Burger    2  ,   Fries   1");
  assertEquals(cmd.type, "order");
  if (cmd.type === "order") {
    assertEquals(cmd.result.lines, [
      { rawName: "Burger", quantity: 2 },
      { rawName: "Fries", quantity: 1 },
    ]);
  }
});

Deno.test("parseCommand - ORDER zero quantity is invalid", () => {
  const cmd = parseCommand("ORDER Burger 0");
  assertEquals(cmd.type, "order");
  if (cmd.type === "order") {
    assertEquals(cmd.result.lines, []);
    assertEquals(cmd.result.errors, [{ rawName: "Burger", reason: "invalid_quantity" }]);
  }
});

Deno.test("parseCommand - ORDER negative quantity is invalid", () => {
  const cmd = parseCommand("ORDER Burger -2");
  assertEquals(cmd.type, "order");
  if (cmd.type === "order") {
    assertEquals(cmd.result.errors, [{ rawName: "Burger", reason: "invalid_quantity" }]);
  }
});

Deno.test("parseCommand - ORDER missing quantity", () => {
  const cmd = parseCommand("ORDER Burger");
  assertEquals(cmd.type, "order");
  if (cmd.type === "order") {
    assertEquals(cmd.result.errors, [{ rawName: "Burger", reason: "missing_quantity" }]);
  }
});

Deno.test("parseCommand - ORDER with no body at all", () => {
  const cmd = parseCommand("ORDER");
  assertEquals(cmd.type, "order");
  if (cmd.type === "order") {
    assertEquals(cmd.result.lines, []);
    assertEquals(cmd.result.errors, []);
  }
});

Deno.test("parseCommand - injected trailing price never becomes the price", () => {
  // "ORDER Burger 2 100" must NOT be read as unit price 100 anywhere in this
  // module — it only ever produces a (possibly unmatched) product name and a
  // quantity, capped at a sane max (50). Actual pricing always comes from
  // the DB in the caller, never from anything typed in the SMS.
  const cmd = parseCommand("ORDER Burger 2 100");
  assertEquals(cmd.type, "order");
  if (cmd.type === "order") {
    assertEquals(cmd.result.lines, []);
    assertEquals(cmd.result.errors, [{ rawName: "Burger 2", reason: "invalid_quantity" }]);
    // "Burger 2" (with the trailing 100 read as an absurd quantity, not a
    // price) is rejected outright — it never silently becomes "Burger"
    // priced at 100.
  }
});

Deno.test("parseCommand - MENU", () => {
  assertEquals(parseCommand("MENU"), { type: "menu", page: 1 });
  assertEquals(parseCommand("menu"), { type: "menu", page: 1 });
  assertEquals(parseCommand("MENU 2"), { type: "menu", page: 2 });
});

Deno.test("parseCommand - HELP", () => {
  assertEquals(parseCommand("HELP"), { type: "help" });
  assertEquals(parseCommand("Munchiz Help"), { type: "unknown", raw: "Munchiz Help" });
});

Deno.test("parseCommand - STATUS with ref", () => {
  assertEquals(parseCommand("STATUS MZ1234"), { type: "status", ref: "MZ1234" });
  assertEquals(parseCommand("status mz1234"), { type: "status", ref: "MZ1234" });
});

Deno.test("parseCommand - STATUS without ref", () => {
  assertEquals(parseCommand("STATUS"), { type: "status", ref: null });
});

Deno.test("parseCommand - CANCEL with and without ref", () => {
  assertEquals(parseCommand("CANCEL MZ1234"), { type: "cancel", ref: "MZ1234" });
  assertEquals(parseCommand("CANCEL"), { type: "cancel", ref: null });
});

Deno.test("parseCommand - unrecognized commands", () => {
  assertEquals(parseCommand("hello there"), { type: "unknown", raw: "hello there" });
  assertEquals(parseCommand("yes"), { type: "unknown", raw: "yes" });
  assertEquals(parseCommand(""), { type: "unknown", raw: "" });
});

Deno.test("parseCommand - unsupported characters don't crash the parser", () => {
  const cmd = parseCommand("ORDER 🍔🍔 Burger 2 ??? \0");
  assertEquals(cmd.type, "order");
});

Deno.test("parseCommand - very long messages are truncated, not rejected outright", () => {
  const longName = "A".repeat(2000);
  const cmd = parseCommand(`ORDER ${longName} 2`);
  assertEquals(cmd.type, "order");
});

Deno.test("parseChoiceReply - explicit confirm/cancel only", () => {
  assertEquals(parseChoiceReply("1"), 1);
  assertEquals(parseChoiceReply("CONFIRM"), 1);
  assertEquals(parseChoiceReply("2"), 2);
  assertEquals(parseChoiceReply("CANCEL"), 2);
});

Deno.test("parseChoiceReply - casual affirmatives are NOT accepted", () => {
  assertEquals(parseChoiceReply("yes"), null);
  assertEquals(parseChoiceReply("okay"), null);
  assertEquals(parseChoiceReply("sure"), null);
  assertEquals(parseChoiceReply("yeah go ahead"), null);
});

const MENU = [
  { id: "1", name: "Cheesy Chicken Burger" },
  { id: "2", name: "Chicken Combo" },
  { id: "3", name: "Extra Chicken" },
  { id: "4", name: "Extra Cheese" },
];

Deno.test("matchMenuItem - exact match", () => {
  const r = matchMenuItem("Chicken Combo", MENU);
  assertEquals(r.matched?.id, "2");
});

Deno.test("matchMenuItem - case-insensitive exact match", () => {
  const r = matchMenuItem("chicken combo", MENU);
  assertEquals(r.matched?.id, "2");
});

Deno.test("matchMenuItem - unique prefix match", () => {
  const r = matchMenuItem("Cheesy Chicken", MENU);
  assertEquals(r.matched?.id, "1");
});

Deno.test("matchMenuItem - ambiguous query is never auto-resolved", () => {
  // "Chicken" alone is a substring of 3 different items — must NOT guess.
  const r = matchMenuItem("Chicken", MENU);
  assertEquals(r.matched, null);
  assertEquals(r.ambiguous.length > 1, true);
});

Deno.test("matchMenuItem - unknown product", () => {
  const r = matchMenuItem("UnknownProduct", MENU);
  assertEquals(r.matched, null);
  assertEquals(r.ambiguous, []);
});

Deno.test("matchMenuItem - empty query never matches", () => {
  const r = matchMenuItem("   ", MENU);
  assertEquals(r.matched, null);
});
