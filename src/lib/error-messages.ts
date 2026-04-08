/**
 * Sanitizes database/API errors to prevent leaking internal details.
 * Maps known Postgres error codes to user-friendly messages.
 */
export function getSafeErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") return "Operation failed. Please try again.";

  const err = error as { code?: string; message?: string };

  // Map known Postgres error codes
  switch (err.code) {
    case "42501":
      return "Permission denied.";
    case "23505":
      return "This item already exists.";
    case "23503":
      return "Cannot delete — item is still in use.";
    case "23502":
      return "A required field is missing.";
    case "23514":
      return "A value is out of the allowed range.";
    case "PGRST301":
      return "Session expired. Please log in again.";
  }

  // Auth-specific safe messages
  const msg = err.message?.toLowerCase() ?? "";
  if (msg.includes("invalid login")) return "Invalid email or password.";
  if (msg.includes("email not confirmed")) return "Please confirm your email first.";
  if (msg.includes("user already registered")) return "An account with this email already exists.";
  if (msg.includes("rate limit")) return "Too many attempts. Please wait and try again.";

  // Default — never expose raw message
  console.error("[DB Error]", err);
  return "Operation failed. Please try again.";
}
