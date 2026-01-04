// =============================================================================
// Security utilities for input sanitization and validation
// Lightweight - no external dependencies
// =============================================================================

// -----------------------------------------------------------------------------
// URL Validation
// -----------------------------------------------------------------------------

/**
 * Basic URL sanitization - validates protocol and structure
 * Returns cleaned URL or null if invalid
 */
export function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  // Allow common safe protocols
  const allowedProtocols = ["http:", "https:", "mailto:", "tel:"];

  try {
    const parsed = new URL(trimmed);
    if (!allowedProtocols.includes(parsed.protocol)) {
      return null;
    }
    return parsed.href;
  } catch {
    // Could be a relative URL - only allow if starts with /
    if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
      return trimmed;
    }
    return null;
  }
}

/**
 * Validate URL format without sanitizing
 * Returns true if URL is valid
 */
export function isValidUrl(url: string | null | undefined): boolean {
  return sanitizeUrl(url) !== null;
}

/**
 * Check if URL is external (not relative)
 */
export function isExternalUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

// -----------------------------------------------------------------------------
// Text Sanitization
// -----------------------------------------------------------------------------

/**
 * Safe text processing - trims and limits length
 * Prevents excessively long inputs
 */
export function safeText(
  text: string | null | undefined,
  maxLength: number = 10000
): string {
  if (!text || typeof text !== "string") return "";

  // Trim whitespace
  let result = text.trim();

  // Limit length
  if (result.length > maxLength) {
    result = result.slice(0, maxLength);
  }

  return result;
}

/**
 * Safe slug - lowercase, alphanumeric and hyphens only
 */
export function safeSlug(text: string | null | undefined, maxLength: number = 100): string {
  if (!text || typeof text !== "string") return "";

  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, maxLength);
}

/**
 * Safe email validation
 */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== "string") return false;
  // Basic email regex - not exhaustive but catches most issues
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

// -----------------------------------------------------------------------------
// Input Length Constants
// -----------------------------------------------------------------------------

export const INPUT_LIMITS = {
  // Short text fields
  title: 200,
  slug: 100,
  label: 100,
  name: 100,

  // Medium text fields
  summary: 500,
  description: 1000,

  // Long text fields
  content: 50000,
  markdown: 100000,

  // URLs
  url: 2048,

  // Lists
  tags: 20, // max number of tags
  tagLength: 50, // max length per tag

  // Media
  caption: 500,
} as const;

// -----------------------------------------------------------------------------
// Validation Helpers
// -----------------------------------------------------------------------------

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate required field
 */
export function validateRequired(
  value: string | null | undefined,
  fieldName: string
): ValidationError | null {
  if (!value || !value.trim()) {
    return { field: fieldName, message: `${fieldName} is required` };
  }
  return null;
}

/**
 * Validate max length
 */
export function validateMaxLength(
  value: string | null | undefined,
  fieldName: string,
  maxLength: number
): ValidationError | null {
  if (value && value.length > maxLength) {
    return {
      field: fieldName,
      message: `${fieldName} must be ${maxLength} characters or less`,
    };
  }
  return null;
}

/**
 * Validate URL format
 */
export function validateUrl(
  value: string | null | undefined,
  fieldName: string,
  required: boolean = false
): ValidationError | null {
  if (!value || !value.trim()) {
    if (required) {
      return { field: fieldName, message: `${fieldName} is required` };
    }
    return null;
  }

  if (!isValidUrl(value)) {
    return { field: fieldName, message: `${fieldName} must be a valid URL` };
  }

  return null;
}

// -----------------------------------------------------------------------------
// Error Sanitization
// -----------------------------------------------------------------------------

/**
 * Sanitize error messages to prevent leaking sensitive info
 * Removes potential secrets, stack traces, and internal details
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (!error) return "An error occurred";

  let message = "";

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  } else {
    return "An error occurred";
  }

  // Remove potential sensitive patterns
  const sensitivePatterns = [
    /key[=:]\s*[a-zA-Z0-9_-]{20,}/gi, // API keys
    /token[=:]\s*[a-zA-Z0-9_.-]{20,}/gi, // Tokens
    /password[=:]\s*\S+/gi, // Passwords
    /secret[=:]\s*\S+/gi, // Secrets
    /Bearer\s+[a-zA-Z0-9_.-]+/gi, // Bearer tokens
    /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+/g, // JWTs
  ];

  let sanitized = message;
  for (const pattern of sensitivePatterns) {
    sanitized = sanitized.replace(pattern, "[REDACTED]");
  }

  // Truncate long messages
  if (sanitized.length > 500) {
    sanitized = sanitized.slice(0, 500) + "...";
  }

  return sanitized || "An error occurred";
}
