/**
 * Shared input sanitization utilities for XSS prevention.
 *
 * All user-supplied text that will be persisted or rendered should pass
 * through `sanitize()` before use. React already escapes interpolated
 * values in JSX, but stripping tags at input time provides defense-in-depth
 * (the data is clean even when consumed outside React, e.g. in emails or
 * SMS via edge functions).
 */

/** Strip HTML tags and trim whitespace. */
export function sanitize(input: string): string {
  return input.replace(/<[^>]*>/g, "").trim();
}

/**
 * Validate that a redirect target is a safe relative path.
 * Prevents open-redirect attacks via `returnTo` query params.
 * Returns "/" if the path is not a safe same-origin relative URL.
 */
export function safeRedirect(to: string | null | undefined, fallback = "/"): string {
  if (!to) return fallback;
  // Must start with "/" and must NOT start with "//" (protocol-relative URL)
  // Must not contain backslashes (some browsers normalize \ to /)
  if (to.startsWith("/") && !to.startsWith("//") && !to.includes("\\")) {
    return to;
  }
  return fallback;
}
