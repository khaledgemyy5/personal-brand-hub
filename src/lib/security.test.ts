import { describe, it, expect } from 'vitest';
import {
  sanitizeUrl,
  isValidUrl,
  isExternalUrl,
  safeText,
  safeSlug,
  isValidEmail,
  sanitizeErrorMessage,
  validateRequired,
  validateMaxLength,
  validateUrl,
} from './security';

// =============================================================================
// URL Validation Tests
// =============================================================================

describe('sanitizeUrl', () => {
  it('returns null for empty/null/undefined inputs', () => {
    expect(sanitizeUrl(null)).toBeNull();
    expect(sanitizeUrl(undefined)).toBeNull();
    expect(sanitizeUrl('')).toBeNull();
    expect(sanitizeUrl('   ')).toBeNull();
  });

  it('accepts valid http/https URLs', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com/');
    expect(sanitizeUrl('http://example.com/path')).toBe('http://example.com/path');
    expect(sanitizeUrl('https://example.com/path?query=1')).toBe('https://example.com/path?query=1');
  });

  it('accepts mailto and tel protocols', () => {
    expect(sanitizeUrl('mailto:test@example.com')).toBe('mailto:test@example.com');
    expect(sanitizeUrl('tel:+1234567890')).toBe('tel:+1234567890');
  });

  it('rejects dangerous protocols', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(sanitizeUrl('file:///etc/passwd')).toBeNull();
  });

  it('accepts relative URLs starting with /', () => {
    expect(sanitizeUrl('/about')).toBe('/about');
    expect(sanitizeUrl('/projects/my-project')).toBe('/projects/my-project');
  });

  it('rejects protocol-relative URLs', () => {
    expect(sanitizeUrl('//evil.com')).toBeNull();
  });

  it('trims whitespace', () => {
    expect(sanitizeUrl('  https://example.com  ')).toBe('https://example.com/');
  });
});

describe('isValidUrl', () => {
  it('returns true for valid URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('/about')).toBe(true);
  });

  it('returns false for invalid URLs', () => {
    expect(isValidUrl('javascript:alert(1)')).toBe(false);
    expect(isValidUrl('')).toBe(false);
    expect(isValidUrl(null)).toBe(false);
  });
});

describe('isExternalUrl', () => {
  it('returns true for http/https URLs', () => {
    expect(isExternalUrl('https://example.com')).toBe(true);
    expect(isExternalUrl('http://example.com')).toBe(true);
  });

  it('returns false for relative URLs', () => {
    expect(isExternalUrl('/about')).toBe(false);
    expect(isExternalUrl('about')).toBe(false);
  });
});

// =============================================================================
// Text Sanitization Tests
// =============================================================================

describe('safeText', () => {
  it('returns empty string for null/undefined', () => {
    expect(safeText(null)).toBe('');
    expect(safeText(undefined)).toBe('');
  });

  it('trims whitespace', () => {
    expect(safeText('  hello world  ')).toBe('hello world');
  });

  it('limits length with default max', () => {
    const longText = 'a'.repeat(20000);
    expect(safeText(longText).length).toBe(10000);
  });

  it('limits length with custom max', () => {
    expect(safeText('hello world', 5)).toBe('hello');
  });

  it('preserves text under limit', () => {
    expect(safeText('hello', 100)).toBe('hello');
  });
});

describe('safeSlug', () => {
  it('returns empty string for null/undefined', () => {
    expect(safeSlug(null)).toBe('');
    expect(safeSlug(undefined)).toBe('');
  });

  it('converts to lowercase', () => {
    expect(safeSlug('Hello World')).toBe('hello-world');
  });

  it('replaces special characters with hyphens', () => {
    expect(safeSlug('Hello! World?')).toBe('hello-world');
  });

  it('removes consecutive hyphens', () => {
    expect(safeSlug('hello---world')).toBe('hello-world');
  });

  it('removes leading/trailing hyphens', () => {
    expect(safeSlug('-hello-world-')).toBe('hello-world');
  });

  it('limits length', () => {
    const longSlug = 'a'.repeat(200);
    expect(safeSlug(longSlug).length).toBe(100);
  });
});

describe('isValidEmail', () => {
  it('returns true for valid emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
  });

  it('returns false for invalid emails', () => {
    expect(isValidEmail('notanemail')).toBe(false);
    expect(isValidEmail('missing@domain')).toBe(false);
    expect(isValidEmail('@nodomain.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail(null)).toBe(false);
  });

  it('trims whitespace', () => {
    expect(isValidEmail('  test@example.com  ')).toBe(true);
  });
});

// =============================================================================
// Error Sanitization Tests
// =============================================================================

describe('sanitizeErrorMessage', () => {
  it('returns default message for null/undefined', () => {
    expect(sanitizeErrorMessage(null)).toBe('An error occurred');
    expect(sanitizeErrorMessage(undefined)).toBe('An error occurred');
  });

  it('handles Error objects', () => {
    expect(sanitizeErrorMessage(new Error('Something went wrong'))).toBe('Something went wrong');
  });

  it('handles string errors', () => {
    expect(sanitizeErrorMessage('Something went wrong')).toBe('Something went wrong');
  });

  it('redacts API keys', () => {
    const message = 'Error with key=sk_live_1234567890abcdefghij';
    expect(sanitizeErrorMessage(message)).toContain('[REDACTED]');
    expect(sanitizeErrorMessage(message)).not.toContain('sk_live');
  });

  it('redacts Bearer tokens', () => {
    const message = 'Error with Bearer eyJhbGciOiJIUzI1NiJ9.test';
    expect(sanitizeErrorMessage(message)).toContain('[REDACTED]');
    expect(sanitizeErrorMessage(message)).not.toContain('eyJ');
  });

  it('redacts JWTs', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0';
    expect(sanitizeErrorMessage(`Token: ${jwt}`)).toContain('[REDACTED]');
  });

  it('truncates long messages', () => {
    const longMessage = 'a'.repeat(1000);
    const result = sanitizeErrorMessage(longMessage);
    expect(result.length).toBeLessThanOrEqual(503); // 500 + '...'
  });

  it('handles unknown error types', () => {
    expect(sanitizeErrorMessage({ foo: 'bar' })).toBe('An error occurred');
    expect(sanitizeErrorMessage(123)).toBe('An error occurred');
  });
});

// =============================================================================
// Validation Helpers Tests
// =============================================================================

describe('validateRequired', () => {
  it('returns error for empty values', () => {
    expect(validateRequired('', 'name')).toEqual({ field: 'name', message: 'name is required' });
    expect(validateRequired(null, 'name')).toEqual({ field: 'name', message: 'name is required' });
    expect(validateRequired('   ', 'name')).toEqual({ field: 'name', message: 'name is required' });
  });

  it('returns null for valid values', () => {
    expect(validateRequired('John', 'name')).toBeNull();
  });
});

describe('validateMaxLength', () => {
  it('returns error when exceeds limit', () => {
    expect(validateMaxLength('hello world', 'title', 5)).toEqual({
      field: 'title',
      message: 'title must be 5 characters or less',
    });
  });

  it('returns null when within limit', () => {
    expect(validateMaxLength('hello', 'title', 10)).toBeNull();
    expect(validateMaxLength(null, 'title', 10)).toBeNull();
  });
});

describe('validateUrl', () => {
  it('returns error for invalid URLs', () => {
    expect(validateUrl('notaurl', 'website')).toEqual({
      field: 'website',
      message: 'website must be a valid URL',
    });
  });

  it('returns null for valid URLs', () => {
    expect(validateUrl('https://example.com', 'website')).toBeNull();
    expect(validateUrl('/about', 'website')).toBeNull();
  });

  it('handles required option', () => {
    expect(validateUrl('', 'website', true)).toEqual({
      field: 'website',
      message: 'website is required',
    });
    expect(validateUrl('', 'website', false)).toBeNull();
  });
});
