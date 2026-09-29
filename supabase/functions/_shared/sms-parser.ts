// Pure SMS command parsing + menu-item matching for the Munchiz SMS
// ordering channel. No I/O, no Deno-specific APIs — kept deliberately
// framework-agnostic so it's testable with either `deno test` or a plain
// JS test runner.
//
// Command grammar (case-insensitive, extra whitespace tolerant):
//   ORDER <item> <qty>[, <item> <qty>]*     e.g. "ORDER Cheesy Chicken Burger 2, Chicken Combo 1"
//   MENU [page]
//   STATUS <ref>
//   CANCEL [ref]                             (no ref = cancel in-progress SMS order draft)
//   HELP
// Anything else -> unknown, so we never guess our way into an order.

export interface OrderLineRequest {
  rawName: string;
  quantity: number;
}

export interface OrderLineError {
  rawName: string;
  reason: "missing_quantity" | "invalid_quantity";
}

export interface ParsedOrderLines {
  lines: OrderLineRequest[];
  errors: OrderLineError[];
}

export type ParsedCommand =
  | { type: "order"; result: ParsedOrderLines }
  | { type: "menu"; page: number }
  | { type: "help" }
  | { type: "status"; ref: string | null }
  | { type: "cancel"; ref: string | null }
  | { type: "unknown"; raw: string };

const MAX_MESSAGE_LENGTH = 1000; // guard against absurdly long inbound payloads

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Parses one "<name> <qty>" segment. Quantity must be the trailing token. */
function parseOrderSegment(segment: string): OrderLineRequest | OrderLineError {
  const trimmed = normalizeWhitespace(segment);
  const match = /^(.*\S)\s+(-?\d+)$/.exec(trimmed);
  if (!match) {
    return { rawName: trimmed, reason: "missing_quantity" };
  }
  const rawName = match[1].trim();
  const quantity = parseInt(match[2], 10);
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 50) {
    return { rawName, reason: "invalid_quantity" };
  }
  return { rawName, quantity };
}

function parseOrderLines(afterKeyword: string): ParsedOrderLines {
  const segments = afterKeyword
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const lines: OrderLineRequest[] = [];
  const errors: OrderLineError[] = [];
  for (const segment of segments) {
    const parsed = parseOrderSegment(segment);
    if ("quantity" in parsed) lines.push(parsed);
    else errors.push(parsed);
  }
  return { lines, errors };
}

/** Parses one inbound SMS body into a structured command. Never throws. */
export function parseCommand(rawText: string): ParsedCommand {
  const text = normalizeWhitespace(String(rawText ?? "")).slice(0, MAX_MESSAGE_LENGTH);
  if (!text) return { type: "unknown", raw: "" };

  const spaceIdx = text.indexOf(" ");
  const firstWord = (spaceIdx === -1 ? text : text.slice(0, spaceIdx)).toUpperCase();
  const rest = (spaceIdx === -1 ? "" : text.slice(spaceIdx + 1)).trim();

  switch (firstWord) {
    case "ORDER":
      if (!rest) return { type: "order", result: { lines: [], errors: [] } };
      return { type: "order", result: parseOrderLines(rest) };

    case "MENU": {
      const page = /^\d+$/.test(rest) ? Math.max(1, parseInt(rest, 10)) : 1;
      return { type: "menu", page };
    }

    case "HELP":
      return { type: "help" };

    case "STATUS":
      return { type: "status", ref: rest ? rest.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() : null };

    case "CANCEL":
      return { type: "cancel", ref: rest ? rest.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() : null };

    default:
      return { type: "unknown", raw: text };
  }
}

/** Contextual yes/no reply for confirmation-style prompts. Explicit only. */
export function parseChoiceReply(rawText: string): 1 | 2 | null {
  const text = normalizeWhitespace(String(rawText ?? "")).toUpperCase();
  if (text === "1" || text === "CONFIRM" || text === "1 CONFIRM" || text === "YES CONFIRM") return 1;
  if (text === "2" || text === "CANCEL" || text === "2 CANCEL") return 2;
  return null;
}

export interface MenuItemForMatch {
  id: string;
  name: string;
}

export interface MatchResult {
  matched: MenuItemForMatch | null;
  ambiguous: MenuItemForMatch[];
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Deterministic (never fuzzy/typo-correcting) product match: exact name,
 * then unique prefix, then "all words present" — never guesses between
 * multiple plausible products, since an ambiguous match risks creating the
 * wrong order.
 */
export function matchMenuItem(query: string, items: MenuItemForMatch[]): MatchResult {
  const q = normalizeName(query);
  if (!q) return { matched: null, ambiguous: [] };

  const exact = items.filter((i) => normalizeName(i.name) === q);
  if (exact.length === 1) return { matched: exact[0], ambiguous: [] };
  if (exact.length > 1) return { matched: null, ambiguous: exact };

  // Prefix and "all tokens present" candidates are pooled together before
  // checking uniqueness. Checking each tier in isolation was a real bug: a
  // generic query like "Chicken" uniquely prefix-matched "Chicken Combo"
  // even though "Extra Chicken" and "Cheesy Chicken Burger" are just as
  // plausible — it would have silently ordered the wrong item.
  const tokens = q.split(" ").filter(Boolean);
  const candidates = new Map<string, MenuItemForMatch>();
  for (const item of items) {
    const name = normalizeName(item.name);
    const isPrefix = name.startsWith(q);
    const hasAllTokens = tokens.every((t) => name.includes(t));
    if (isPrefix || hasAllTokens) candidates.set(item.id, item);
  }
  const pool = [...candidates.values()];
  if (pool.length === 1) return { matched: pool[0], ambiguous: [] };
  if (pool.length > 1) return { matched: null, ambiguous: pool };

  return { matched: null, ambiguous: [] };
}
