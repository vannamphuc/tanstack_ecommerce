/**
 * Parse error message from Zod validation errors or generic errors
 * Zod validation errors come as JSON stringified array of error objects
 */
export function formatErrorMessage(error: Error | null | undefined): string {
  if (!error?.message) {
    return "An error occurred";
  }

  try {
    // Try to parse as Zod validation error array
    const parsed = JSON.parse(error.message);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const firstError = parsed[0];
      const path = firstError.path?.join(".") || "form";
      return `${path}: ${firstError.message}`;
    }
  } catch {
    // If not JSON, use error message as-is
    return error.message;
  }

  return "An error occurred";
}
